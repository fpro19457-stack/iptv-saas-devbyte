import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, RefreshCw, CheckCircle, XCircle, Zap, TrendingUp, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface ChannelStatus {
  id: string;
  number: number;
  name: string;
  logoUrl?: string;
  isDown: boolean;
  failCount: number;
  lastCheck?: string;
  quality: string;
  latestCheck?: {
    status: string;
    responseCode?: number;
    responseTimeMs?: number;
    errorMessage?: string;
    checkedAt: string;
  };
  activeIncident?: {
    startedAt: string;
    failCount: number;
  };
}

interface MonitorStatus {
  channels: ChannelStatus[];
  stats: {
    active: number;
    down: number;
    avgResponseTime: number;
  };
}

const PAGE_SIZE = 25;

function getResponseColor(ms: number | undefined, error: string | undefined): string {
  if (!ms && error) return 'text-red-400';
  if (!ms) return 'text-red-400';
  if (ms < 500) return 'text-green-400';
  if (ms <= 1500) return 'text-yellow-400';
  return 'text-red-400';
}

export function Monitor() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'unstable'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [verifyingChannel, setVerifyingChannel] = useState<string | null>(null);
  const [configData, setConfigData] = useState({
    intervalMinutes: 5,
    failThreshold: 3,
    emailAlerts: [] as string[],
    telegramToken: '',
    telegramChatId: '',
  });

  const { data: monitorData, isLoading } = useQuery<MonitorStatus>({
    queryKey: ['monitor-status'],
    queryFn: async () => {
      const response = await api.get('/admin/monitor/status');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: config } = useQuery({
    queryKey: ['monitor-config'],
    queryFn: async () => {
      const response = await api.get('/admin/monitor/config');
      return response.data.data;
    },
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['monitor-incidents'],
    queryFn: async () => {
      const response = await api.get('/admin/monitor/incidents');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  const checkNowMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/monitor/check-now');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Verificación completada: ${data.data.upCount} up, ${data.data.downCount} down`);
      queryClient.invalidateQueries({ queryKey: ['monitor-status'] });
    },
    onError: () => {
      toast.error('Error al verificar canales');
    },
  });

  const verifyChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await api.post('/admin/monitor/check-channel', { channelId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor-status'] });
      toast.success('Canal verificado');
    },
    onError: () => {
      toast.error('Error al verificar canal');
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/admin/monitor/config', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configuración guardada');
      setConfigModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['monitor-config'] });
    },
    onError: () => {
      toast.error('Error al guardar configuración');
    },
  });

  const handleConfigSave = () => {
    updateConfigMutation.mutate(configData);
  };

  const filteredChannels = monitorData?.channels || [];
  const searchedChannels = searchQuery
    ? filteredChannels.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.number.toString().includes(searchQuery)
      )
    : filteredChannels;
  const displayChannels = statusFilter === 'all'
    ? searchedChannels
    : statusFilter === 'down'
    ? searchedChannels.filter(c => c.isDown)
    : statusFilter === 'up'
    ? searchedChannels.filter(c => !c.isDown)
    : searchedChannels.filter(c => c.failCount > 0 && !c.isDown);

  const totalPages = Math.ceil(displayChannels.length / PAGE_SIZE);
  const paginatedChannels = displayChannels.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = monitorData?.stats || { active: 0, down: 0, avgResponseTime: 0 };

  const lastCheckTime = monitorData?.channels
    ? (() => {
        const times = monitorData.channels
          .filter(c => c.lastCheck)
          .map(c => new Date(c.lastCheck!).getTime());
        return times.length > 0 ? new Date(Math.max(...times)) : null;
      })()
    : null;

  return (
    <div className="space-y-6">
      <div className="monitor-header">
        <div>
          <h1 className="monitor-title">
            <Activity className="w-7 h-7 text-accent-blue" />
            Monitor de Canales
          </h1>
          <p className="monitor-subtitle">
            Último chequeo: {lastCheckTime
              ? lastCheckTime.toLocaleString()
              : 'Nunca'}
          </p>
        </div>
        <div className="monitor-header-actions">
          <Button
            icon={<RefreshCw size={18} />}
            onClick={() => checkNowMutation.mutate()}
            loading={checkNowMutation.isPending}
          >
            Verificar ahora
          </Button>
          <Button icon={<Activity size={18} />} variant="ghost" onClick={() => setConfigModalOpen(true)}>
            Configuración
          </Button>
        </div>
      </div>

      {stats.down > 0 && (
        <div className="down-badge">
          <XCircle className="w-5 h-5" />
          <span>{stats.down} canal(es) caídos</span>
        </div>
      )}

      <div className="monitor-metrics">
        <Card className="metric-card">
          <div className="metric-icon-box bg-green-500/20">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <p className="metric-label">Canales activos</p>
          <p className="metric-value">{stats.active}</p>
        </Card>

        <Card className="metric-card">
          <div className={`metric-icon-box ${stats.down > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            <XCircle className={`w-6 h-6 ${stats.down > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <p className="metric-label">Canales caídos</p>
          <p className="metric-value">{stats.down}</p>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon-box bg-cyan-500/20">
            <Zap className="w-6 h-6 text-cyan-500" />
          </div>
          <p className="metric-label">ms promedio</p>
          <p className="metric-value">{stats.avgResponseTime}</p>
        </Card>

        <Card className="metric-card">
          <div className="metric-icon-box bg-accent-blue/20">
            <TrendingUp className="w-6 h-6 text-accent-blue" />
          </div>
          <p className="metric-label">Uptime</p>
          <p className="metric-value">
            {filteredChannels.length > 0 ? Math.round((stats.active / filteredChannels.length) * 100) : 0}%
          </p>
        </Card>
      </div>

      <Card>
        <div className="table-section">
          <h3 className="table-title">Estado de Canales ({displayChannels.length})</h3>
          <div className="table-toolbar">
            <div className="input-with-icon" style={{ width: 220 }}>
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar canal..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="input-field"
              />
            </div>
            <div className="filter-buttons">
              {(['all', 'up', 'down', 'unstable'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => { setStatusFilter(filter); setCurrentPage(1); }}
                  className={`filter-btn ${statusFilter === filter ? 'active' : ''}`}
                >
                  {filter === 'all' ? 'Todos' : filter === 'up' ? 'En línea' : filter === 'down' ? 'Caídos' : 'Inestables'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Última respuesta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedChannels.map((c) => (
                <tr key={c.id}>
                  <td className="col-number">{c.number}</td>
                  <td>
                    <div className="channel-cell">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="channel-logo" />
                      ) : (
                        <div className="channel-logo-placeholder">
                          <Activity className="w-5 h-5 text-text-muted" />
                        </div>
                      )}
                      <div>
                        <p className="channel-name">{c.name}</p>
                        <p className="channel-quality">{c.quality}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.isDown ? (
                      <span className="status-badge down">Caído</span>
                    ) : c.failCount > 0 ? (
                      <span className="status-badge unstable">Inestable ({c.failCount})</span>
                    ) : (
                      <span className="status-badge online">En línea</span>
                    )}
                  </td>
                  <td>
                    {c.latestCheck ? (
                      <span className={`response-time ${getResponseColor(c.latestCheck.responseTimeMs, c.latestCheck.errorMessage)}`}>
                        {c.latestCheck.status === 'UP'
                          ? `${c.latestCheck.responseTimeMs}ms`
                          : c.latestCheck.errorMessage || 'Error'}
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => { setVerifyingChannel(c.id); verifyChannelMutation.mutate(c.id); }}
                      disabled={verifyingChannel === c.id}
                      className="refresh-btn"
                      title="Verificar canal"
                    >
                      {verifyingChannel === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-text-secondary" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <p className="pagination-info">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, displayChannels.length)} de {displayChannels.length}
            </p>
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="pagination-pages">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="incidents-card">
      <Card>
        <div className="incidents-section">
          <h3 className="table-title" style={{ marginBottom: 20 }}>Historial de Incidentes</h3>
        </div>
        <div className="incidents-body">
          {incidentsData?.incidents && incidentsData.incidents.length === 0 ? (
            <div className="incidents-empty">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p>Todo funcionando correctamente</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Canal</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Duración</th>
                  <th>Fallos</th>
                </tr>
              </thead>
              <tbody>
                {incidentsData?.incidents?.map((i: any) => (
                  <tr key={i.id}>
                    <td><span className="font-medium text-text-primary">{i.channel?.name || '-'}</span></td>
                    <td><span className="text-text-secondary">{new Date(i.startedAt).toLocaleString()}</span></td>
                    <td>
                      {i.resolvedAt ? (
                        <span className="text-text-secondary">{new Date(i.resolvedAt).toLocaleString()}</span>
                      ) : (
                        <span className="text-red-500 font-medium animate-pulse">En curso</span>
                      )}
                    </td>
                    <td>{i.duration ? <span className="text-text-secondary">{i.duration} min</span> : '-'}</td>
                    <td><span className="text-text-secondary">{i.failCount}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      </div>

      <Modal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} title="Configuración del Monitor" size="md">
        <div className="space-y-6 p-1">
          <div className="form-group">
            <label className="form-label text-sm font-medium text-text-primary mb-2 block">Intervalo de chequeo</label>
            <select
              className="select-field w-full"
              value={configData.intervalMinutes}
              onChange={(e) => setConfigData({ ...configData, intervalMinutes: parseFloat(e.target.value) })}
            >
              <option value={0.5}>30 segundos</option>
              <option value={1}>1 minuto</option>
              <option value={3}>3 minutos</option>
              <option value={5}>5 minutos</option>
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label text-sm font-medium text-text-primary mb-2 block">Umbral de fallos para marcar caído</label>
            <input
              type="number"
              className="input-field w-full"
              min="1"
              max="10"
              value={configData.failThreshold}
              onChange={(e) => setConfigData({ ...configData, failThreshold: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label text-sm font-medium text-text-primary mb-2 block">Emails para alertas</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="email1@test.com, email2@test.com"
              value={configData.emailAlerts.join(', ')}
              onChange={(e) => setConfigData({ ...configData, emailAlerts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label text-sm font-medium text-text-primary mb-2 block">Token Telegram</label>
            <input
              type="password"
              className="input-field w-full"
              placeholder="123456:ABC-DEF..."
              value={configData.telegramToken}
              onChange={(e) => setConfigData({ ...configData, telegramToken: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label text-sm font-medium text-text-primary mb-2 block">Chat ID Telegram</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="123456789"
              value={configData.telegramChatId}
              onChange={(e) => setConfigData({ ...configData, telegramChatId: e.target.value })}
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <Button onClick={handleConfigSave} loading={updateConfigMutation.isPending} className="btn btn-primary flex-1">
              Guardar
            </Button>
            <Button onClick={() => setConfigModalOpen(false)} className="btn btn-secondary flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
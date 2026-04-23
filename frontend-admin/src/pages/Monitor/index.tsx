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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Activity className="w-7 h-7 text-accent-blue" />
            Monitor de Canales
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Último chequeo: {monitorData?.channels[0]?.latestCheck?.checkedAt
              ? new Date(monitorData.channels[0].latestCheck.checkedAt).toLocaleString()
              : 'Nunca'}
          </p>
        </div>
        <div className="flex items-center gap-4">
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
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-4">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <span className="text-red-400 font-semibold text-lg">{stats.down} canal(es) caídos</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="!p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">{stats.active}</p>
              <p className="text-sm text-text-secondary mt-1">Canales activos</p>
            </div>
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.down > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              <XCircle className={`w-6 h-6 ${stats.down > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">{stats.down}</p>
              <p className="text-sm text-text-secondary mt-1">Canales caídos</p>
            </div>
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">{stats.avgResponseTime}</p>
              <p className="text-sm text-text-secondary mt-1">ms promedio</p>
            </div>
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-blue/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary">
                {filteredChannels.length > 0 ? Math.round((stats.active / filteredChannels.length) * 100) : 0}%
              </p>
              <p className="text-sm text-text-secondary mt-1">Uptime</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-text-primary">Estado de Canales ({displayChannels.length})</h3>
            <div className="flex flex-wrap items-center gap-3">
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
              <div className="flex gap-2">
                {(['all', 'up', 'down', 'unstable'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setStatusFilter(filter); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === filter
                        ? 'bg-accent-blue text-white'
                        : 'bg-bg-input text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'up' ? 'En línea' : filter === 'down' ? 'Caídos' : 'Inestables'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <Table
            columns={[
              { key: 'number', header: '#', render: (c: ChannelStatus) => (
                <span className="font-mono text-text-secondary">{c.number}</span>
              )},
              { key: 'name', header: 'Canal', render: (c: ChannelStatus) => (
                <div className="flex items-center gap-4">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-bg-input flex items-center justify-center">
                      <Activity className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-secondary">{c.quality}</p>
                  </div>
                </div>
              )},
              { key: 'status', header: 'Estado', render: (c: ChannelStatus) => (
                c.isDown ? (
                  <Badge variant="danger">Caído</Badge>
                ) : c.failCount > 0 ? (
                  <Badge variant="warning">Inestable ({c.failCount})</Badge>
                ) : (
                  <Badge variant="active">En línea</Badge>
                )
              )},
              { key: 'lastCheck', header: 'Última respuesta', render: (c: ChannelStatus) => {
                if (!c.latestCheck) return '-';
                if (c.latestCheck.status === 'UP') {
                  return <span className="text-green-400">{c.latestCheck.responseTimeMs}ms</span>;
                }
                return <span className="text-red-400 text-sm">{c.latestCheck.errorMessage || 'Error'}</span>;
              }},
              { key: 'actions', header: '', render: (c: ChannelStatus) => (
                <button
                  onClick={() => { setVerifyingChannel(c.id); verifyChannelMutation.mutate(c.id); }}
                  disabled={verifyingChannel === c.id}
                  className="p-2 rounded-lg bg-bg-input hover:bg-bg-input/80 transition-colors disabled:opacity-50"
                  title="Verificar canal"
                >
                  {verifyingChannel === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              )},
            ]}
            data={paginatedChannels}
            loading={isLoading}
            emptyMessage="No hay canales"
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-text-secondary">
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, displayChannels.length)} de {displayChannels.length}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-bg-input hover:bg-bg-input/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-bg-input rounded-lg text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-bg-input hover:bg-bg-input/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Historial de Incidentes</h3>
        </div>
        <div className="p-5">
          <Table
            columns={[
              { key: 'channel', header: 'Canal', render: (i: any) => (
                <span className="font-medium text-text-primary">{i.channel?.name || '-'}</span>
              )},
              { key: 'startedAt', header: 'Inicio', render: (i: any) => (
                <span className="text-text-secondary">{new Date(i.startedAt).toLocaleString()}</span>
              )},
              { key: 'resolvedAt', header: 'Fin', render: (i: any) => (
                i.resolvedAt ? (
                  <span className="text-text-secondary">{new Date(i.resolvedAt).toLocaleString()}</span>
                ) : (
                  <span className="text-red-500 font-medium animate-pulse">En curso</span>
                )
              )},
              { key: 'duration', header: 'Duración', render: (i: any) => (
                i.duration ? <span className="text-text-secondary">{i.duration} min</span> : '-'
              )},
              { key: 'failCount', header: 'Fallos', render: (i: any) => (
                <span className="text-text-secondary">{i.failCount}</span>
              )},
            ]}
            data={incidentsData?.incidents || []}
            loading={false}
            emptyMessage="No hay incidentes"
          />
        </div>
      </Card>

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
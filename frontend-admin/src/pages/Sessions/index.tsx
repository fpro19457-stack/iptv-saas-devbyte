import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, RefreshCw, LogOut, Tv } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useState } from 'react';
import api from '../../lib/axios';
import { Session } from '../../types';
import toast from 'react-hot-toast';

export function Sessions() {
  const queryClient = useQueryClient();
  const [closeId, setCloseId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['liveSessions'],
    queryFn: async () => {
      const response = await api.get('/admin/sessions/live');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSessions'] });
      toast.success('Sesión cerrada');
      setCloseId(null);
    },
  });

  const formatDuration = (createdAt: string) => {
    const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'TV': return '📺';
      case 'MOBILE': return '📱';
      case 'BROWSER': return '💻';
      default: return '❓';
    }
  };

  const sessions = data || [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="card-header">
          <div className="flex items-center gap-3">
            <h3 className="card-title">Sesiones en Vivo</h3>
            <span className="badge badge-active">
              {sessions.length} online
            </span>
          </div>
          <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={() => refetch()}>
            Refrescar
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center">
            <Monitor className="w-12 h-12 mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-text-secondary">No hay usuarios conectados</p>
          </div>
        ) : (
          <Table
            columns={[
              { key: 'user', header: 'Usuario', render: (s: Session) => (
                <div className="flex items-center gap-3">
                  <div className="table-avatar" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                    {s.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{s.user.fullName || s.user.username}</p>
                    <p className="text-xs text-text-secondary">@{s.user.username}</p>
                  </div>
                </div>
              )},
              { key: 'channel', header: 'Viendo', render: (s: Session) => (
                <div className="flex items-center gap-2">
                  {s.channel ? (
                    <>
                      <Tv className="w-4 h-4 text-accent-blue" />
                      <span className="text-text-primary">{s.channel.name}</span>
                    </>
                  ) : (
                    <span className="text-text-secondary">En menú</span>
                  )}
                </div>
              )},
              { key: 'device', header: 'Dispositivo', render: (s: Session) => (
                <span>{getDeviceIcon(s.deviceType)} {s.deviceName || s.deviceType}</span>
              )},
              { key: 'ip', header: 'IP', render: (s: Session) => <span className="text-text-secondary font-mono text-xs">{s.ipAddress}</span> },
              { key: 'duration', header: 'Duración', render: (s: Session) => (
                <span className="text-text-secondary">{formatDuration(s.createdAt)}</span>
              )},
              { key: 'actions', header: 'Acciones', render: (s: Session) => (
                <button
                  onClick={() => setCloseId(s.id)}
                  className="p-2 text-text-secondary hover:text-accent-red transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              )},
            ]}
            data={sessions}
            loading={isLoading}
            emptyMessage="No hay sesiones activas"
          />
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!closeId}
        onClose={() => setCloseId(null)}
        onConfirm={() => closeId && closeMutation.mutate(closeId)}
        title="Cerrar Sesión"
        message="¿Estás seguro de cerrar esta sesión forzosamente?"
      />
    </div>
  );
}
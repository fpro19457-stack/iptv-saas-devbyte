import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bell } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/axios';
import { Notification } from '../../types';
import toast from 'react-hot-toast';

export function Notifications() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['notificationHistory'],
    queryFn: async () => {
      const response = await api.get('/admin/notifications/history');
      return response.data.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: { userId?: string; title: string; message: string; type: string }) => {
      await api.post('/admin/notifications/send', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
      toast.success('Notificación enviada');
      setModalOpen(false);
    },
    onError: () => {
      toast.error('Error al enviar notificación');
    },
  });

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'info' | 'warning' | 'danger'> = {
      INFO: 'info',
      WARNING: 'warning',
      DANGER: 'danger',
    };
    return variants[type] || 'info';
  };

  const history = historyData || [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="card-header">
          <h3 className="card-title">Historial de Notificaciones</h3>
          <Button icon={<Send size={18} />} onClick={() => setModalOpen(true)}>
            Enviar Notificación
          </Button>
        </div>

        <Table
          columns={[
            { key: 'user', header: 'Destinatario', render: (n: Notification) => (
              <span className="text-text-primary">{n.user ? `${n.user.fullName || n.user.username}` : 'Todos'}</span>
            )},
            { key: 'type', header: 'Tipo', render: (n: Notification) => <Badge variant={getTypeBadge(n.type)}>{n.type}</Badge> },
            { key: 'title', header: 'Título', render: (n: Notification) => <span className="text-text-primary">{n.title}</span> },
            { key: 'message', header: 'Mensaje', render: (n: Notification) => (
              <span className="text-text-secondary truncate max-w-xs block">{n.message}</span>
            )},
            { key: 'createdAt', header: 'Fecha', render: (n: Notification) => (
              <span className="text-text-secondary text-sm">{new Date(n.createdAt).toLocaleString('es-AR')}</span>
            )},
          ]}
          data={history}
          loading={historyLoading}
          emptyMessage="No hay notificaciones enviadas"
        />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Enviar Notificación" size="md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const title = (form.elements.namedItem('title') as HTMLInputElement).value;
            const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
            const type = (form.elements.namedItem('type') as HTMLSelectElement).value;
            sendMutation.mutate({ title, message, type });
          }}
        >
          <div className="form-group">
            <label className="form-label">Destinatario</label>
            <select
              name="userId"
              className="select-field"
            >
              <option value="">Todos los usuarios</option>
              <option value="specific">Usuario específico</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select name="type" className="select-field">
              <option value="INFO">Info (Azul)</option>
              <option value="WARNING">Advertencia (Amarillo)</option>
              <option value="DANGER">Peligro (Rojo)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input type="text" name="title" required className="input-field" />
          </div>
          <div className="form-group">
            <label className="form-label">Mensaje</label>
            <textarea name="message" required rows={4} className="input-field" style={{ resize: 'none' }} />
          </div>
          <Button type="submit" className="btn btn-primary w-full" loading={sendMutation.isPending}>
            Enviar Notificación
          </Button>
        </form>
      </Modal>
    </div>
  );
}
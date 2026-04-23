import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import api from '../../lib/axios';
import { Pack } from '../../types';
import toast from 'react-hot-toast';

export function Packs() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['packs'],
    queryFn: async () => {
      const response = await api.get('/admin/packs');
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/packs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      toast.success('Pack eliminado');
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No se puede eliminar');
    },
  });

  const packs = data || [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="card-header">
          <h3 className="card-title">Packs</h3>
          <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>
            Nuevo Pack
          </Button>
        </div>

        <Table
          columns={[
            { key: 'name', header: 'Pack', render: (p: Pack) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.color + '30' }}>
                  <span className="text-lg" style={{ color: p.color }}>●</span>
                </div>
                <div>
                  <p className="font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-secondary">{p.description || '-'}</p>
                </div>
              </div>
            )},
            { key: 'channels', header: 'Canales', render: (p: Pack) => <span className="text-text-secondary">{p.channels?.length || 0}</span> },
            { key: 'userCount', header: 'Usuarios', render: (p: Pack) => <span className="text-text-secondary">{p.userCount || 0}</span> },
            { key: 'isActive', header: 'Estado', render: (p: Pack) => (
              <span className={`px-2 py-1 text-xs rounded ${p.isActive ? 'bg-accent-green/20 text-accent-green' : 'bg-text-secondary/20 text-text-secondary'}`}>
                {p.isActive ? 'Activo' : 'Inactivo'}
              </span>
            )},
            { key: 'actions', header: 'Acciones', render: (p: Pack) => (
              <div className="flex items-center gap-2">
                <button className="p-2 text-text-secondary hover:text-accent-blue transition-colors"><Edit size={16} /></button>
                <button onClick={() => setDeleteId(p.id)} className="p-2 text-text-secondary hover:text-accent-red transition-colors"><Trash2 size={16} /></button>
              </div>
            )},
          ]}
          data={packs}
          loading={isLoading}
          emptyMessage="No hay packs"
        />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Pack" size="md">
        <form className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="text" className="input-field" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="input-field" rows={3} style={{ resize: 'none' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Color (hex)</label>
            <div className="flex gap-2">
              <input type="color" defaultValue="#3b82f6" style={{ width: 48, height: 38, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)' }} />
              <input type="text" defaultValue="#3b82f6" className="input-field" style={{ flex: 1 }} />
            </div>
          </div>
          <Button type="button" onClick={() => setModalOpen(false)} className="btn btn-primary w-full">Crear Pack</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar Pack"
        message="¿Estás seguro de eliminar este pack?"
      />
    </div>
  );
}
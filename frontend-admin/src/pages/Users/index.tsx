import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye, X, Check, Tv } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import api from '../../lib/axios';
import { User, Pack } from '../../types';
import toast from 'react-hot-toast';

interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  status: string;
  expiresAt: string;
  maxDevices: number;
  packIds: string[];
}

const defaultFormData: UserFormData = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  status: 'TRIAL',
  expiresAt: '',
  maxDevices: 2,
  packIds: [],
};

export function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingUserSearch, setPairingUserSearch] = useState('');
  const [pairingUserId, setPairingUserId] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', search, statusFilter],
    queryFn: async () => {
      const response = await api.get('/admin/users', {
        params: { limit: 50, search, status: statusFilter || undefined },
      });
      return response.data.data;
    },
  });

  const { data: pendingPairings, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-pairings'],
    queryFn: async () => {
      const response = await api.get('/admin/pairing/pending');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: packsData } = useQuery({
    queryKey: ['admin-packs'],
    queryFn: async () => {
      const response = await api.get('/admin/packs');
      return response.data.data;
    },
  });

  const packs: Pack[] = packsData || [];

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await api.post('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado correctamente');
      setCreateModalOpen(false);
      setFormData(defaultFormData);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al crear usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado correctamente');
      setEditModalOpen(false);
      setEditingUser(null);
      setFormData(defaultFormData);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  const assignPacksMutation = useMutation({
    mutationFn: async ({ userId, packIds }: { userId: string; packIds: string[] }) => {
      await api.put(`/admin/users/${userId}/packs`, { packIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Packs asignados correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al asignar packs');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado');
      setDeleteId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/users/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado actualizado');
    },
  });

  const approvePairingMutation = useMutation({
    mutationFn: async ({ code, userId }: { code: string; userId: string }) => {
      const response = await api.post('/admin/pairing/approve', { code, userId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('TV autorizado. El cliente ya puede ver.');
      setPairingModalOpen(false);
      setPairingCode('');
      setPairingUserId('');
      refetchPending();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al aprobar código');
    },
  });

  const handleApprovePairing = () => {
    if (!pairingCode || !pairingUserId) {
      toast.error('Código y usuario son requeridos');
      return;
    }
    approvePairingMutation.mutate({ code: pairingCode, userId: pairingUserId });
  };

  const filteredUsersForPairing = ((usersData?.users || []) as User[]).filter((u: User) =>
    (u.status === 'ACTIVE' || u.status === 'TRIAL') &&
    (u.username.toLowerCase().includes(pairingUserSearch.toLowerCase()) ||
     (u.fullName && u.fullName.toLowerCase().includes(pairingUserSearch.toLowerCase())))
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Username y contraseña son requeridos');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data: formData });
    assignPacksMutation.mutate({ userId: editingUser.id, packIds: formData.packIds });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName || '',
      email: user.email || '',
      status: user.status,
      expiresAt: user.expiresAt ? user.expiresAt.split('T')[0] : '',
      maxDevices: user.maxDevices || 2,
      packIds: user.packs?.map(p => p.id) || [],
    });
    setEditModalOpen(true);
  };

  const togglePack = (packId: string) => {
    const newPackIds = formData.packIds.includes(packId)
      ? formData.packIds.filter(id => id !== packId)
      : [...formData.packIds, packId];
    setFormData({ ...formData, packIds: newPackIds });
  };

  const users = usersData?.users || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'active' | 'suspended' | 'trial' | 'expired'> = {
      ACTIVE: 'active',
      SUSPENDED: 'suspended',
      TRIAL: 'trial',
      EXPIRED: 'expired',
    };
    return variants[status] || 'expired';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      SUSPENDED: 'Suspendido',
      TRIAL: 'Trial',
      EXPIRED: 'Vencido',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="card-header">
          <h3 className="card-title">Usuarios</h3>
          <div className="flex items-center gap-3">
            <Button icon={<Tv size={18} />} onClick={() => setPairingModalOpen(true)}>
              Emparejar TV
            </Button>
            <Button icon={<Plus size={18} />} onClick={() => setCreateModalOpen(true)}>
              Nuevo Usuario
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 400 }}>
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
            <option value="TRIAL">Trial</option>
            <option value="EXPIRED">Vencidos</option>
          </select>
        </div>

        <Table
          columns={[
            { key: 'username', header: 'Usuario', render: (u: User) => (
              <div className="flex items-center gap-3">
                <div className="table-avatar" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{u.username}</p>
                  <p className="text-xs text-text-secondary">{u.fullName || '-'}</p>
                </div>
              </div>
            )},
            { key: 'status', header: 'Estado', render: (u: User) => <Badge variant={getStatusBadge(u.status)}>{getStatusLabel(u.status)}</Badge> },
            { key: 'packs', header: 'Packs', render: (u: User) => (
              <div className="flex gap-1 flex-wrap">
                {u.packs?.slice(0, 2).map((p) => (
                  <span key={p.id} className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: p.color + '30', color: p.color }}>
                    {p.name}
                  </span>
                ))}
                {(u.packs?.length || 0) > 2 && <span className="text-text-secondary text-xs">+{u.packs!.length - 2}</span>}
              </div>
            )},
            { key: 'sessions', header: 'Sesiones', hideOnMobile: true, render: (u: User) => (
              <span className="text-text-secondary">{u.activeSessions}/{u.maxDevices}</span>
            )},
            { key: 'expiresAt', header: 'Vencimiento', hideOnMobile: true, render: (u: User) => (
              <span className="text-text-secondary">{u.expiresAt ? new Date(u.expiresAt).toLocaleDateString('es-AR') : '-'}</span>
            )},
            { key: 'actions', header: 'Acciones', render: (u: User) => (
              <div className="flex items-center gap-2">
                <button onClick={() => setViewUser(u)} className="p-2 text-text-secondary hover:text-accent-blue transition-colors" title="Ver"><Eye size={16} /></button>
                <button onClick={() => openEditModal(u)} className="p-2 text-text-secondary hover:text-accent-blue transition-colors" title="Editar"><Edit size={16} /></button>
                <button onClick={() => statusMutation.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })} className="p-2 text-text-secondary hover:text-accent-yellow transition-colors" title={u.status === 'ACTIVE' ? 'Suspender' : 'Activar'}>
                  {u.status === 'ACTIVE' ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>
            )},
          ]}
          data={users}
          loading={usersLoading}
          emptyMessage="No hay usuarios"
        />
      </Card>

      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title={viewUser?.username || 'Usuario'} size="md">
        {viewUser && (
          <div className="space-y-4">
            <div className="grid-2">
              <div>
                <p className="text-xs text-text-secondary">Nombre</p>
                <p className="text-text-primary">{viewUser.fullName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Email</p>
                <p className="text-text-primary">{viewUser.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Estado</p>
                <Badge variant={getStatusBadge(viewUser.status)}>{getStatusLabel(viewUser.status)}</Badge>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Vencimiento</p>
                <p className="text-text-primary">{viewUser.expiresAt ? new Date(viewUser.expiresAt).toLocaleDateString('es-AR') : '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-2">Packs</p>
              <div className="flex flex-wrap gap-2">
                {viewUser.packs?.map((p) => (
                  <span key={p.id} className="px-3 py-1 text-sm rounded" style={{ backgroundColor: p.color + '30', color: p.color }}>
                    {p.name}
                  </span>
                )) || <span className="text-text-secondary">Sin packs asignados</span>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); setFormData(defaultFormData); }} title="Nuevo Usuario" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input type="text" className="input-field" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input type="text" className="input-field" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="select-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Activo</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="EXPIRED">Vencido</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vencimiento</label>
              <input type="date" className="input-field" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dispositivos máximos</label>
            <input type="number" className="input-field" min="1" max="10" value={formData.maxDevices} onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 2 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Packs</label>
            <div className="packs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: 'var(--bg-input)', borderRadius: '8px' }}>
              {packs.map(pack => (
                <label key={pack.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '6px', background: formData.packIds.includes(pack.id) ? pack.color + '20' : 'transparent', border: `1px solid ${formData.packIds.includes(pack.id) ? pack.color : 'var(--border)'}` }}>
                  <input type="checkbox" checked={formData.packIds.includes(pack.id)} onChange={() => togglePack(pack.id)} style={{ display: 'none' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: formData.packIds.includes(pack.id) ? pack.color : 'transparent', border: `2px solid ${pack.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.packIds.includes(pack.id) && <Check size={8} color="white" />}
                  </div>
                  <span style={{ fontSize: '13px', color: formData.packIds.includes(pack.id) ? pack.color : 'var(--text-secondary)' }}>{pack.name}</span>
                </label>
              ))}
              {packs.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: '1 / -1', textAlign: 'center' }}>No hay packs creados</span>}
            </div>
          </div>
          <Button type="submit" className="btn btn-primary w-full" loading={createMutation.isPending}>
            Crear Usuario
          </Button>
        </form>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingUser(null); setFormData(defaultFormData); }} title={`Editar: ${editingUser?.username}`} size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="input-field" value={formData.username} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input type="text" className="input-field" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nueva contraseña (dejar vacío para no cambiar)</label>
              <input type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="select-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="ACTIVE">Activo</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspendido</option>
                <option value="EXPIRED">Vencido</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vencimiento</label>
              <input type="date" className="input-field" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dispositivos máximos</label>
            <input type="number" className="input-field" min="1" max="10" value={formData.maxDevices} onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 2 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Packs</label>
            <div className="packs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: 'var(--bg-input)', borderRadius: '8px' }}>
              {packs.map(pack => (
                <label key={pack.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '6px', background: formData.packIds.includes(pack.id) ? pack.color + '20' : 'transparent', border: `1px solid ${formData.packIds.includes(pack.id) ? pack.color : 'var(--border)'}` }}>
                  <input type="checkbox" checked={formData.packIds.includes(pack.id)} onChange={() => togglePack(pack.id)} style={{ display: 'none' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: formData.packIds.includes(pack.id) ? pack.color : 'transparent', border: `2px solid ${pack.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.packIds.includes(pack.id) && <Check size={8} color="white" />}
                  </div>
                  <span style={{ fontSize: '13px', color: formData.packIds.includes(pack.id) ? pack.color : 'var(--text-secondary)' }}>{pack.name}</span>
                </label>
              ))}
              {packs.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: '1 / -1', textAlign: 'center' }}>No hay packs creados</span>}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="btn btn-primary flex-1" loading={updateMutation.isPending || assignPacksMutation.isPending}>
              Guardar Cambios
            </Button>
            <Button type="button" className="btn btn-secondary flex-1" onClick={() => { setEditModalOpen(false); setEditingUser(null); }}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar Usuario"
        message="¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
      />

      <Modal isOpen={pairingModalOpen} onClose={() => setPairingModalOpen(false)} title="Emparejar TV" size="md">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Código del cliente</label>
            <input
              type="text"
              className="input-field"
              placeholder="264-716"
              value={pairingCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9-]/g, '').toUpperCase();
                setPairingCode(val);
              }}
              style={{ fontSize: '20px', textAlign: 'center', letterSpacing: '4px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Asignar a usuario</label>
            <input
              type="text"
              className="input-field"
              placeholder="Buscar usuario..."
              value={pairingUserSearch}
              onChange={(e) => setPairingUserSearch(e.target.value)}
            />
            <div className="user-list" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px', background: 'var(--bg-input)', borderRadius: '8px' }}>
              {filteredUsersForPairing.slice(0, 10).map(u => (
                <div
                  key={u.id}
                  onClick={() => { setPairingUserId(u.id); setPairingUserSearch(u.username); }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    background: pairingUserId === u.id ? 'var(--accent-blue)' + '20' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="table-avatar" style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', width: '28px', height: '28px', fontSize: '11px' }}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{u.username}</p>
                      <p className="text-xs text-text-secondary">{u.fullName || '-'}</p>
                    </div>
                    <Badge variant={u.status === 'ACTIVE' ? 'active' : 'trial'}>{u.status}</Badge>
                  </div>
                </div>
              ))}
              {filteredUsersForPairing.length === 0 && (
                <p className="text-text-muted text-sm" style={{ padding: '16px', textAlign: 'center' }}>No hay usuarios activos</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleApprovePairing}
            loading={approvePairingMutation.isPending}
            disabled={!pairingCode || !pairingUserId}
            className="btn btn-primary w-full"
          >
            Autorizar TV
          </Button>
        </div>
      </Modal>
    </div>
  );
}
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Tv, Upload, FileText, AlertCircle, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import api from '../../lib/axios';
import { Channel } from '../../types';
import toast from 'react-hot-toast';

interface M3UImportModalProps {
  onImport: (content: string) => void;
  loading: boolean;
}

function M3UImportModal({ onImport, loading }: M3UImportModalProps) {
  const [content, setContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError('');
    if (!file.name.endsWith('.m3u') && !file.name.endsWith('.m3u8')) {
      setError('El archivo debe ser .m3u o .m3u8');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      setError('Pegá el contenido M3U o subí un archivo');
      return;
    }
    onImport(content);
  };

  return (
    <div>
      <div
        style={{
          border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '16px',
          background: dragActive ? 'var(--accent-glow)' : 'transparent',
          transition: 'all 0.15s',
        }}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".m3u,.m3u8"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Arrastrá tu archivo .m3u aquí o
        </p>
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
          Buscar archivo
        </Button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={"#EXTM3U\n#EXTINF:-1 group-title=\"Deportes\",Canal 1\nhttps://stream...m3u8"}
        style={{
          width: '100%',
          height: '200px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: '9px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontFamily: 'monospace',
          padding: '12px',
          resize: 'vertical',
          outline: 'none',
          marginBottom: '12px',
        }}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <Button onClick={handleSubmit} loading={loading} className="btn btn-primary w-full">
        <Upload size={14} />
        Importar Canales
      </Button>
    </div>
  );
}

export function Channels() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    logoUrl: '',
    streamUrl: '',
    category: 'Noticias',
    quality: 'HD',
    packIds: [] as string[],
  });

  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['channels', search, page],
    queryFn: async () => {
      const response = await api.get('/admin/channels', {
        params: { limit: 50, page, search },
      });
      return response.data.data;
    },
  });

  const { data: packsData } = useQuery({
    queryKey: ['packs'],
    queryFn: async () => {
      const response = await api.get('/admin/packs');
      return response.data.data;
    },
  });

  const packs = packsData || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal eliminado');
      setDeleteId(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post('/admin/channels/bulk-delete', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success(`${selectedIds.size} canales eliminados`);
      setSelectedIds(new Set());
      setShowBulkActions(false);
      setConfirmBulkDelete(false);
    },
    onError: () => {
      toast.error('Error al eliminar canales');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/channels/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Estado actualizado');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post('/admin/channels/import-m3u', { content });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success(`${data.data.imported} canales importados`);
      setImportModalOpen(false);
    },
    onError: () => {
      toast.error('Error al importar');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/admin/channels', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal creado');
      setModalOpen(false);
      setFormData({ number: '', name: '', logoUrl: '', streamUrl: '', category: 'Noticias', quality: 'HD', packIds: [] });
    },
    onError: () => {
      toast.error('Error al crear canal');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await api.put(`/admin/channels/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal actualizado');
      setModalOpen(false);
      setEditId(null);
      setFormData({ number: '', name: '', logoUrl: '', streamUrl: '', category: 'Noticias', quality: 'HD', packIds: [] });
    },
    onError: () => {
      toast.error('Error al actualizar canal');
    },
  });

  const channels = data?.channels || [];

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setShowBulkActions(newSet.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === channels.length) {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIds(new Set(channels.map((c: Channel) => c.id)));
      setShowBulkActions(true);
    }
  };

  const openEditModal = (channel: Channel) => {
    setEditId(channel.id);
    setFormData({
      number: String(channel.number),
      name: channel.name,
      logoUrl: channel.logoUrl || '',
      streamUrl: channel.streamUrl || '',
      category: channel.category || 'Noticias',
      quality: channel.quality || 'HD',
      packIds: channel.packChannels?.map((pc: any) => pc.packId) || [],
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editId) {
      updateMutation.mutate({ id: editId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div>
      <Card>
        <div className="card-header">
          <h3 className="card-title">Canales</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<Upload size={18} />} variant="secondary" onClick={() => setImportModalOpen(true)}>
              Importar M3U
            </Button>
            <Button icon={<Plus size={18} />} onClick={() => setModalOpen(true)}>
              Nuevo Canal
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          {showBulkActions && (
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 16px',
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {selectedIds.size} seleccionados
              </span>
              <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirmBulkDelete(true)}
              >
                Eliminar
              </Button>
              <button
                onClick={() => { setSelectedIds(new Set()); setShowBulkActions(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <Table
          columns={[
            {
              key: 'select',
              header: (
                <input
                  type="checkbox"
                  checked={selectedIds.size === channels.length && channels.length > 0}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              ),
              render: (c: Channel) => (
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              ),
            },
            { key: 'number', header: '#', render: (c: Channel) => <span style={{ fontWeight: 500 }}>{c.number}</span> },
            { key: 'name', header: 'Canal', render: (c: Channel) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {c.logoUrl ? <img src={c.logoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} /> : <Tv size={20} color="var(--text-muted)" />}
                </div>
                <div>
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.category}</p>
                </div>
              </div>
            )},
            { key: 'quality', header: 'Calidad', render: (c: Channel) => <Badge variant={c.quality}>{c.quality}</Badge> },
            { key: 'isAdult', header: 'Adultos', render: (c: Channel) => c.isAdult ? <span style={{ color: 'var(--danger)' }}>Si</span> : <span style={{ color: 'var(--text-muted)' }}>-</span> },
            { key: 'isActive', header: 'Estado', render: (c: Channel) => (
              <button
                onClick={() => toggleMutation.mutate(c.id)}
                style={{
                  width: '40px',
                  height: '20px',
                  borderRadius: '10px',
                  background: c.isActive ? 'var(--success)' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: c.isActive ? '22px' : '2px',
                  transition: 'left 0.15s',
                }} />
              </button>
            )},
            { key: 'actions', header: 'Acciones', render: (c: Channel) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEditModal(c)} style={{ padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                <button onClick={() => setDeleteId(c.id)} style={{ padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
              </div>
            )},
          ]}
          data={channels}
          loading={isLoading}
          emptyMessage="No hay canales"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Mostrando {channels.length} canales
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '0 8px' }}>
              Página {page}{data?.totalPages ? ` de ${data.totalPages}` : ''}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.totalPages || page >= data.totalPages}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: (!data?.totalPages || page >= data.totalPages) ? 'not-allowed' : 'pointer',
                color: (!data?.totalPages || page >= data.totalPages) ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: (!data?.totalPages || page >= data.totalPages) ? 0.5 : 1,
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setFormData({ number: '', name: '', logoUrl: '', streamUrl: '', category: 'Noticias', quality: 'HD', packIds: [] }); }} title={editId ? 'Editar Canal' : 'Nuevo Canal'} size="md">
        <div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Número</label>
              <input
                type="number"
                className="input-field"
                value={formData.number}
                onChange={e => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">URL Logo</label>
            <input
              type="text"
              placeholder="https://..."
              className="input-field"
              value={formData.logoUrl}
              onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL Stream</label>
            <input
              type="text"
              placeholder="https://..."
              className="input-field"
              value={formData.streamUrl}
              onChange={e => setFormData({ ...formData, streamUrl: e.target.value })}
            />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="select-field"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Noticias">Noticias</option>
                <option value="Deportes">Deportes</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Infantil">Infantil</option>
                <option value="Argentina">Argentina</option>
                <option value="Adultos">Adultos</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Calidad</label>
              <select
                className="select-field"
                value={formData.quality}
                onChange={e => setFormData({ ...formData, quality: e.target.value })}
              >
                <option value="SD">SD</option>
                <option value="HD">HD</option>
                <option value="FHD">FHD</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Packs</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {packs.map((pack: any) => (
                <label key={pack.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={formData.packIds.includes(pack.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, packIds: [...formData.packIds, pack.id] });
                      } else {
                        setFormData({ ...formData, packIds: formData.packIds.filter((id: string) => id !== pack.id) });
                      }
                    }}
                  />
                  {pack.name}
                </label>
              ))}
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
            className="btn btn-primary w-full"
            style={{ width: '100%', marginTop: '16px' }}
          >
            {editId ? 'Actualizar Canal' : 'Crear Canal'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Canales desde M3U" size="lg">
        <M3UImportModal onImport={(content) => importMutation.mutate(content)} loading={importMutation.isPending} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar Canal"
        message="¿Estás seguro de eliminar este canal?"
      />

      <ConfirmDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        title="Eliminar Canales"
        message={`¿Estás seguro de eliminar ${selectedIds.size} canales seleccionados?`}
      />
    </div>
  );
}
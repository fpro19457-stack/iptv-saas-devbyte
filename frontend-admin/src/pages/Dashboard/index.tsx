import { useQuery } from '@tanstack/react-query';
import { UserCheck, UserX, Gift, Monitor, Tv, Activity, Star, PieChart, UserPlus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import api from '../../lib/axios';
import { Metrics } from '../../types';

function MetricCard({
  label,
  value,
  icon: Icon,
  accentColor,
  footer,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  footer: string;
}) {
  return (
    <div className="metric-card" style={{ '--card-accent-color': accentColor } as React.CSSProperties}>
      <div className="metric-icon-box" style={{ background: accentColor }}>
        <Icon size={18} color="white" />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-footer">{footer}</div>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await api.get('/admin/metrics');
      return response.data.data;
    },
  });

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64vh' }}>
        <Activity size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen del sistema · Actualizado hace 30s</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={14} />
          Nuevo usuario
        </button>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Usuarios Activos" value={data.totalUsers.active} icon={UserCheck} accentColor="rgba(59,130,246,0.15)" footer="↑ 3 este mes" />
        <MetricCard label="En Trial" value={data.totalUsers.trial} icon={Gift} accentColor="rgba(245,158,11,0.15)" footer="Vencen en 7 días" />
        <MetricCard label="Suspendidos" value={data.totalUsers.suspended} icon={UserX} accentColor="rgba(239,68,68,0.15)" footer="Sin acceso" />
        <MetricCard label="Sesiones ahora" value={data.activeSessions} icon={Monitor} accentColor="rgba(16,185,129,0.15)" footer="● En vivo" />
      </div>

      <div className="grid-2">
        <Card header={{ title: 'Sesiones en vivo', icon: <Monitor size={16} color="var(--accent)" />, action: <span className="card-action">Ver todas →</span> }}>
          <Table
            columns={[
              { key: 'user', header: 'Usuario', render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="table-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                    {item.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{item.user?.username || '-'}</span>
                </div>
              )},
              { key: 'channel', header: 'Canal', render: (item: any) => <Badge variant="info">{item.channel?.name || '-'}</Badge> },
              { key: 'duration', header: 'Duración', render: (item: any) => <span style={{ color: 'var(--success)' }}>{item.duration || '0m'}</span> },
            ]}
            data={[]}
            emptyMessage="Sin sesiones activas"
          />
        </Card>

        <Card header={{ title: 'Canales más vistos hoy', icon: <Star size={16} color="var(--warning)" /> }}>
          {data.popularChannels.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Sin datos aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.popularChannels.slice(0, 4).map((item, idx) => (
                <div key={item.channel.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', width: '16px' }}>{idx + 1}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {item.channel.logoUrl ? (
                      <img src={item.channel.logoUrl} alt={item.channel.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Tv size={14} color="var(--text-muted)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: 500 }}>{item.channel.name}</div></div>
                  <Badge variant={item.channel.quality as 'SD' | 'HD' | 'FHD'}>{item.channel.quality}</Badge>
                  <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{item.viewCount}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid-3-2">
        <Card header={{ title: 'Actividad reciente', icon: <Activity size={16} color="var(--purple)" />, action: <span className="card-action">Ver log completo →</span> }}>
          {data.recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Sin actividad reciente</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recentActivity.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)' }} />
                  <span style={{ fontSize: '12px' }}>{item.user.fullName || item.user.username}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card header={{ title: 'Distribución', icon: <PieChart size={16} color="var(--cyan)" /> }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Activos', value: data.distributionByStatus.active, color: 'var(--success)' },
              { label: 'Suspendidos', value: data.distributionByStatus.suspended, color: 'var(--danger)' },
              { label: 'Trial', value: data.distributionByStatus.trial, color: 'var(--warning)' },
              { label: 'Vencidos', value: data.distributionByStatus.expired, color: 'var(--text-muted)' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '70px' }}>{item.label}</span>
                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-input)' }}>
                  <div style={{ width: `${item.value}%`, height: '100%', borderRadius: '3px', background: item.color }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
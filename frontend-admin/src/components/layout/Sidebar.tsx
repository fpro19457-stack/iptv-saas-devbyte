import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Tv,
  Package,
  Monitor,
  Bell,
  LogOut,
  X,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Usuarios' },
  { to: '/channels', icon: Tv, label: 'Canales' },
  { to: '/packs', icon: Package, label: 'Packs' },
  { to: '/sessions', icon: Monitor, label: 'Sesiones' },
  { to: '/monitor', icon: Activity, label: 'Monitor' },
  { to: '/notifications', icon: Bell, label: 'Notificaciones' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { admin, logout } = useAuth();

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon-box">
              <Tv size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="logo-title">IPTV Admin</div>
              <div className="logo-subtitle">DevByte Panel</div>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav style={{ padding: '12px 0', flex: 1 }}>
          <div className="nav-section-label">Principal</div>
          <div>
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
                onClick={onClose}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-section-label" style={{ marginTop: '8px' }}>Monitoreo</div>
          <div>
            {navItems.slice(4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
                onClick={onClose}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-card">
            <div className="admin-avatar">
              {admin?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div className="admin-name">{admin?.username || 'Admin'}</div>
              <div className="admin-role">
                {admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
            <button onClick={logout} className="logout-icon" title="Cerrar sesión">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
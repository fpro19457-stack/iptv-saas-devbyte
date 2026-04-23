import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Usuarios',
  '/channels': 'Canales',
  '/packs': 'Packs',
  '/sessions': 'Sesiones en Vivo',
  '/notifications': 'Notificaciones',
};

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="topbar">
      <button className="hamburger-btn" onClick={onToggleSidebar}>
        <Menu size={20} />
      </button>

      <div className="topbar-breadcrumb">
        <span className="breadcrumb-parent">Panel</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{title}</span>
      </div>

      <div className="topbar-right">
        <div className="online-pill">
          <div className="online-dot" />
          <span className="online-label">{onlineCount} online</span>
        </div>
        <div className="topbar-clock">
          {currentTime.toLocaleTimeString('es-AR')}
        </div>
        <button className="topbar-icon-btn">
          <Bell size={15} />
        </button>
      </div>
    </header>
  );
}
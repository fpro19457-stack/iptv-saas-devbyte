import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Channels } from './pages/Channels';
import { Users } from './pages/Users';
import { Packs } from './pages/Packs';
import { Sessions } from './pages/Sessions';
import { Notifications } from './pages/Notifications';
import { Monitor } from './pages/Monitor';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/channels" element={<PrivateRoute><Channels /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/packs" element={<PrivateRoute><Packs /></PrivateRoute>} />
      <Route path="/sessions" element={<PrivateRoute><Sessions /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/monitor" element={<PrivateRoute><Monitor /></PrivateRoute>} />
    </Routes>
  );
}

export default App;
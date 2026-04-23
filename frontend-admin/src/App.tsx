import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Channels } from './pages/Channels';
import { Users } from './pages/Users';
import { Packs } from './pages/Packs';
import { Sessions } from './pages/Sessions';
import { Notifications } from './pages/Notifications';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout><Navigate to="/dashboard" /></Layout>} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/channels" element={<Layout><Channels /></Layout>} />
      <Route path="/users" element={<Layout><Users /></Layout>} />
      <Route path="/packs" element={<Layout><Packs /></Layout>} />
      <Route path="/sessions" element={<Layout><Sessions /></Layout>} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
    </Routes>
  );
}

export default App;
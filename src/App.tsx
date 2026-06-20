import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Evaluate } from './pages/Evaluate';
import { Leaderboard } from './pages/Leaderboard';
import { Loader2 } from 'lucide-react';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { committeeNumber, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }
  
  if (!committeeNumber) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/evaluate/:projectId" element={<ProtectedRoute><Evaluate /></ProtectedRoute>} />
    </Routes>
  );
};

export default App;

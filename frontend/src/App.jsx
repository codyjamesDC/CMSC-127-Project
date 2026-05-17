import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Registrations from './pages/Registrations';
import Violations from './pages/Violations';
import Reports from './pages/Reports';

function AppShell({ onLogout }) {
  const location = useLocation();
  return (
    <div className="app-shell">
      <Sidebar onLogout={onLogout} />
      <div className="main-area">
        <Topbar pathname={location.pathname} onLogout={onLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/reports" element={<Reports />} />
          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  // Check sessionStorage so refresh keeps you logged in during the session.
  // Swap to localStorage if you want login to persist across browser closes.
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('lto_auth') === 'true'
  );

  const handleLogin = () => {
    sessionStorage.setItem('lto_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lto_auth');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <AppShell onLogout={handleLogout} />
      ) : (
        <Routes>
          <Route path="*" element={<AuthPage onLogin={handleLogin} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
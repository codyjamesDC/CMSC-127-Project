import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Registrations from './pages/Registrations';
import Violations from './pages/Violations';
import Reports from './pages/Reports';

function AppShell() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar pathname={location.pathname} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

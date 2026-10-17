import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import AddFirewallPage from './pages/AddFirewallPage';
import EditFirewallPage from './pages/EditFirewallPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="firewalls" element={<InventoryPage />} />
        <Route path="firewalls/new" element={<AddFirewallPage />} />
        <Route path="firewalls/:id/edit" element={<EditFirewallPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

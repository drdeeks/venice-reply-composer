import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CreatorPage } from './pages/CreatorPage';
import { DashboardPage } from './pages/DashboardPage';
import { TipsPage } from './pages/TipsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useNetworkStatus } from './hooks/useNetworkStatus';

function App() {
  const isOnline = useNetworkStatus();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/creator/:id" element={<CreatorPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tips" element={<TipsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
      {!isOnline && <OfflineIndicator />}
    </BrowserRouter>
  );
}

export default App;
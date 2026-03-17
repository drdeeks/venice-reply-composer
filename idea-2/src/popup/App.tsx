import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../shared/storage';

interface Settings {
  veniceApiKey: string;
  bankrEnabled: boolean;
}

export function App() {
  const [settings, setSettings] = useState<Settings>({ veniceApiKey: '', bankrEnabled: true });
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const saved = await getSettings();
      if (saved) setSettings(saved);
    } catch (err) {
      setError('Failed to load settings. Check console.');
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setLoading(true);
      setError(null);
      await saveSettings(settings);
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setError('Failed to save settings. Check API key.');
      console.error('Settings save error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 w-80 min-h-[400px]">
      <h1 className="text-lg font-bold mb-4">Venice Reply Composer</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
          {error}
          <button className="ml-2 text-red-600 hover:text-red-800" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Venice API Key</label>
            <input
              type="password"
              className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.veniceApiKey}
              onChange={e => setSettings({ ...settings, veniceApiKey: e.target.value })}
              placeholder="Enter API key"
              disabled={loading}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.bankrEnabled}
              onChange={e => setSettings({ ...settings, bankrEnabled: e.target.checked })}
              disabled={loading}
            />
            <span className="ml-2 text-sm">Enable Bankr integration</span>
          </div>
          <button
            className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={loading || !settings.veniceApiKey.trim()}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          {status && <p className="text-green-600 text-sm mt-2 italic">{status}</p>}
        </div>
      )}

      {!settings.veniceApiKey.trim() && !loading && (
        <div className="mt-6 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-1">
            ⚠️ Enter your Venice API key to enable AI reply suggestions.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Get your key from the Venice AI dashboard.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
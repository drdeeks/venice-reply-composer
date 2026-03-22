import { useState, useEffect } from 'react';
import { getSettings, saveSettings, type Settings as SettingsType, RESPONSE_TYPE_LABELS, type ResponseType, DEFAULT_RESPONSE_TYPES } from '../../shared/storage';
import { getModelsByProvider } from '../../shared/models';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>({
    veniceApiKey: '',
    bankrUsername: '',
    bankrEnabled: true,
    bankrApiKey: '',
    githubToken: '',
    responseTypes: DEFAULT_RESPONSE_TYPES,
    veniceModel: 'venice-uncensored',
    bankrModel: 'gemini-2.5-flash',
    githubModel: 'gpt-4o-mini'
  });
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const saved = await getSettings();
      if (saved) {
        setSettings(saved);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setLoading(true);
      await saveSettings(settings);
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus('Failed to save settings');
      console.error('Settings save error:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateResponseType(type: ResponseType, enabled: boolean) {
    setSettings({
      ...settings,
      responseTypes: {
        ...settings.responseTypes,
        [type]: enabled
      }
    });
  }

  const veniceModels = getModelsByProvider('venice');
  const bankrModels = getModelsByProvider('bankr');
  const githubModels = getModelsByProvider('github');

  return (
    <div className="settings">
      <div className="setting-section">
        <label htmlFor="venice-api-key">Venice API Key</label>
        <div className="input-group">
          <input
            type="password"
            id="venice-api-key"
            value={settings.veniceApiKey}
            onChange={(e) => setSettings({ ...settings, veniceApiKey: e.target.value })}
            placeholder="Enter your Venice API key"
            disabled={loading}
          />
        </div>
        <p className="help-text">
          Get your API key from{' '}
          <a href="https://venice.ai/settings/api" target="_blank" rel="noopener noreferrer">
            venice.ai/settings/api
          </a>
        </p>
      </div>

      {settings.veniceApiKey.trim() && (
        <div className="setting-section">
          <label htmlFor="venice-model">Venice Model</label>
          <select
            id="venice-model"
            value={settings.veniceModel || 'venice-uncensored'}
            onChange={(e) => setSettings({ ...settings, veniceModel: e.target.value })}
            disabled={loading}
          >
            {veniceModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} — {model.description}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="setting-section">
        <label htmlFor="bankr-api-key">Bankr API Key (Fallback AI + Trading)</label>
        <div className="input-group">
          <input
            type="password"
            id="bankr-api-key"
            value={settings.bankrApiKey}
            onChange={(e) => setSettings({ ...settings, bankrApiKey: e.target.value })}
            placeholder="Bankr API key for LLM Gateway + trading"
            disabled={loading}
          />
        </div>
        <p className="help-text">
          Powers Bankr LLM Gateway (AI fallback) and direct trade execution.
        </p>
      </div>

      {settings.bankrApiKey.trim() && (
        <div className="setting-section">
          <label htmlFor="bankr-model">Bankr Model</label>
          <select
            id="bankr-model"
            value={settings.bankrModel || 'gemini-2.5-flash'}
            onChange={(e) => setSettings({ ...settings, bankrModel: e.target.value })}
            disabled={loading}
          >
            {bankrModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} — {model.description}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="setting-section">
        <label htmlFor="github-token">GitHub Token (Free AI Fallback)</label>
        <div className="input-group">
          <input
            type="password"
            id="github-token"
            value={settings.githubToken}
            onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
            placeholder="GitHub personal access token"
            disabled={loading}
          />
        </div>
        <p className="help-text">
          Uses GitHub Models (gpt-4o-mini) as free third fallback.
        </p>
      </div>

      {settings.githubToken.trim() && (
        <div className="setting-section">
          <label htmlFor="github-model">GitHub Model</label>
          <select
            id="github-model"
            value={settings.githubModel || 'gpt-4o-mini'}
            onChange={(e) => setSettings({ ...settings, githubModel: e.target.value })}
            disabled={loading}
          >
            {githubModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} — {model.description}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="setting-section">
        <label htmlFor="bankr-username">Bankr Username (Optional)</label>
        <input
          type="text"
          id="bankr-username"
          value={settings.bankrUsername}
          onChange={(e) => setSettings({ ...settings, bankrUsername: e.target.value })}
          placeholder="e.g. @yourbankrhandle"
          disabled={loading}
        />
      </div>

      <div className="setting-section">
        <label>
          <input
            type="checkbox"
            checked={settings.bankrEnabled}
            onChange={(e) => setSettings({ ...settings, bankrEnabled: e.target.checked })}
            disabled={loading}
          />
          Enable Bankr integration
        </label>
      </div>

      <div className="setting-section">
        <h3>Response Types</h3>
        <p className="help-text">Choose which types of reply suggestions to generate</p>
        <div className="response-types-grid">
          {(Object.keys(RESPONSE_TYPE_LABELS) as ResponseType[]).map(type => (
            <label key={type} className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.responseTypes[type]}
                onChange={(e) => updateResponseType(type, e.target.checked)}
                disabled={loading}
              />
              <span>{RESPONSE_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        className="save-btn"
        onClick={handleSave}
        disabled={loading || !settings.veniceApiKey.trim()}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

      {status && <p className="status-message">{status}</p>}

      <div className="setting-section">
        <h3>About</h3>
        <div className="about-info">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Partners:</strong> Venice AI, Bankr</p>
          <p className="help-text">
            This extension uses Venice's private inference API to generate reply
            suggestions and integrates Bankr for inline token trading.
          </p>
        </div>
      </div>
    </div>
  );
}

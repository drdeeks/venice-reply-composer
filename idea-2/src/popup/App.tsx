import { useState, useEffect } from 'react';
import { getSettings, saveSettings, AIProvider, Settings } from '../shared/storage';

function getExtensionVersion(): string {
  const chromeApi = (globalThis as { chrome?: { runtime?: { getManifest?: () => { version?: string } } } }).chrome;
  return chromeApi?.runtime?.getManifest?.()?.version || 'dev';
}

interface KeyValidationResult {
  valid: boolean;
  normalizedKey: string;
  message?: string;
}

function normalizeApiKeyInput(rawValue: string): string {
  let normalized = rawValue.trim();
  if (!normalized) return '';

  const assignmentMatch = normalized.match(/(?:VENICE_INFERENCE_KEY|VENICE_API_KEY)\s*=\s*(.+)$/i);
  if (assignmentMatch) {
    normalized = assignmentMatch[1].trim();
  }

  normalized = normalized.replace(/^Bearer\s+/i, '').trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'")) ||
    (normalized.startsWith('`') && normalized.endsWith('`'))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

async function getResponseSnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 180);
  } catch {
    return '';
  }
}

async function validateVeniceApiKey(rawValue: string): Promise<KeyValidationResult> {
  const normalizedKey = normalizeApiKeyInput(rawValue);

  if (!normalizedKey) {
    return {
      valid: false,
      normalizedKey: '',
      message: 'Please enter a Venice API key.'
    };
  }

  try {
    const modelsResponse = await fetch('https://api.venice.ai/api/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${normalizedKey}`
      }
    });

    if (modelsResponse.ok) {
      return { valid: true, normalizedKey };
    }

    if (modelsResponse.status === 404) {
      const chatProbe = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalizedKey}`
        },
        body: JSON.stringify({
          model: 'venice-uncensored',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
          temperature: 0
        })
      });

      if (chatProbe.ok) {
        return { valid: true, normalizedKey };
      }

      const snippet = await getResponseSnippet(chatProbe);
      if (chatProbe.status === 401 || chatProbe.status === 403) {
        return {
          valid: false,
          normalizedKey,
          message: 'Venice rejected this key. Accepted examples include `vapi_...` or `VENICE_INFERENCE_KEY_...`.'
        };
      }

      return {
        valid: false,
        normalizedKey,
        message: `Unable to validate key (${chatProbe.status}). ${snippet || 'Please verify key format and try again.'}`
      };
    }

    const modelsSnippet = await getResponseSnippet(modelsResponse);
    if (modelsResponse.status === 401 || modelsResponse.status === 403) {
      return {
        valid: false,
        normalizedKey,
        message: 'Venice rejected this key. Try pasting only the key value, without `Bearer` unless needed.'
      };
    }

    return {
      valid: false,
      normalizedKey,
      message: `Unable to validate key (${modelsResponse.status}). ${modelsSnippet || 'Please try again.'}`
    };
  } catch (error) {
    console.error('Venice API validation error:', error);
    return {
      valid: false,
      normalizedKey,
      message: 'Could not reach Venice API to validate the key. Check network and try again.'
    };
  }
}

type SettingsSection = 'ai' | 'bankr' | 'neynar';

const defaultSettings: Settings = {
  veniceApiKey: '',
  githubToken: '',
  aiProvider: 'auto',
  bankrApiKey: '',
  bankrUsername: '',
  bankrEnabled: true,
  neynarApiKey: '',
  neynarEnabled: true
};

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSetup, setShowSetup] = useState(true);
  const [expandedSection, setExpandedSection] = useState<SettingsSection | null>('ai');
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
      if (saved) {
        setSettings(saved);
        if (saved.veniceApiKey.trim() || saved.githubToken.trim()) {
          setShowSetup(false);
        }
      }
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

      // Must have at least one AI provider configured
      if (!settings.veniceApiKey.trim() && !settings.githubToken.trim()) {
        setError('Please configure at least one AI provider (Venice API key or GitHub token).');
        return;
      }

      // Validate Venice key if provided
      let normalizedVeniceKey = '';
      if (settings.veniceApiKey.trim()) {
        const validation = await validateVeniceApiKey(settings.veniceApiKey);
        if (!validation.valid) {
          if (settings.githubToken.trim() && settings.aiProvider === 'auto') {
            console.warn('Venice key validation failed, but GitHub token is set as fallback');
            normalizedVeniceKey = '';
          } else if (settings.aiProvider === 'venice') {
            setError(validation.message || 'Invalid Venice API key.');
            return;
          }
        } else {
          normalizedVeniceKey = validation.normalizedKey;
        }
      }

      const normalizedSettings: Settings = {
        ...settings,
        veniceApiKey: normalizedVeniceKey,
        githubToken: normalizeApiKeyInput(settings.githubToken),
        bankrApiKey: normalizeApiKeyInput(settings.bankrApiKey),
        neynarApiKey: normalizeApiKeyInput(settings.neynarApiKey)
      };

      await saveSettings(normalizedSettings);
      setSettings(normalizedSettings);
      setStatus('Settings saved successfully!');
      setShowSetup(false);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setError('Failed to save settings. Check API key.');
      console.error('Settings save error:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(section: SettingsSection) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  const maskedKey = (key: string) => key.trim() ? `••••${key.trim().slice(-4)}` : 'Not set';
  
  const activeProvider = settings.aiProvider === 'auto' 
    ? (settings.veniceApiKey.trim() ? 'Venice (primary)' : settings.githubToken.trim() ? 'GitHub Models' : 'None')
    : settings.aiProvider === 'venice' ? 'Venice AI' : 'GitHub Models';
  
  const extensionVersion = getExtensionVersion();
  const manifestStatus = extensionVersion === 'dev'
    ? 'Manifest unavailable (non-extension context)'
    : `v${extensionVersion}`;

  const bankrStatus = settings.bankrEnabled && settings.bankrApiKey.trim() 
    ? 'API Connected' 
    : settings.bankrEnabled 
      ? 'Link-only mode' 
      : 'Disabled';

  const neynarStatus = settings.neynarEnabled && settings.neynarApiKey.trim()
    ? 'Connected'
    : settings.neynarEnabled
      ? 'No API key'
      : 'Disabled';

  return (
    <div className="popup-shell">
      <header className="popup-hero">
        <p className="hero-eyebrow">Venice + Bankr + Neynar</p>
        <h1>Venice Reply Composer</h1>
        <p className="hero-subtitle">AI replies for social posts, with trading & trending context.</p>
      </header>

      <main className="popup-content">
        {error && (
          <div className="status-card status-error">
            <span>{error}</span>
            <button className="status-dismiss" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-wrap">
            <div className="loading-spinner"></div>
            <p>Loading your settings…</p>
          </div>
        ) : !showSetup ? (
          <section className="panel-stack">
            <div className="status-card status-success">
              <p className="status-title">Configuration Saved</p>
              <p className="status-copy">Extension active on Farcaster, X/Twitter, and Reddit.</p>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <p className="info-label">AI Provider</p>
                <p className="info-value">{activeProvider}</p>
              </div>
              <div className="info-card">
                <p className="info-label">Bankr</p>
                <p className="info-value">{bankrStatus}</p>
              </div>
              <div className="info-card">
                <p className="info-label">Neynar</p>
                <p className="info-value">{neynarStatus}</p>
              </div>
            </div>

            <button
              className="action-btn secondary-btn"
              onClick={() => setShowSetup(true)}
              disabled={loading}
            >
              Edit Settings
            </button>

            {status && <p className="inline-status">{status}</p>}
          </section>
        ) : (
          <section className="panel-stack">
            {/* AI Provider Section */}
            <div className="settings-section">
              <button 
                className={`section-header ${expandedSection === 'ai' ? 'expanded' : ''}`}
                onClick={() => toggleSection('ai')}
              >
                <span className="section-title">🤖 AI Provider</span>
                <span className="section-status">{activeProvider}</span>
                <span className="section-chevron">{expandedSection === 'ai' ? '▼' : '▶'}</span>
              </button>
              
              {expandedSection === 'ai' && (
                <div className="section-content">
                  <div className="field-wrap">
                    <label className="field-label">Provider Mode</label>
                    <select
                      className="field-input"
                      value={settings.aiProvider}
                      onChange={e => setSettings({ ...settings, aiProvider: e.target.value as AIProvider })}
                      disabled={loading}
                    >
                      <option value="auto">Auto (Venice → GitHub fallback)</option>
                      <option value="venice">Venice AI only</option>
                      <option value="github">GitHub Models only</option>
                    </select>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Venice API Key</label>
                    <input
                      type="password"
                      className="field-input"
                      value={settings.veniceApiKey}
                      onChange={e => setSettings({ ...settings, veniceApiKey: e.target.value })}
                      placeholder="vapi_... or leave empty"
                      disabled={loading}
                    />
                    <p className="field-help">Get from venice.ai/settings/api</p>
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">GitHub Token (Free)</label>
                    <input
                      type="password"
                      className="field-input"
                      value={settings.githubToken}
                      onChange={e => setSettings({ ...settings, githubToken: e.target.value })}
                      placeholder="ghp_... or leave empty"
                      disabled={loading}
                    />
                    <p className="field-help">Free via GitHub Models (gpt-4o-mini)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bankr Section */}
            <div className="settings-section">
              <button 
                className={`section-header ${expandedSection === 'bankr' ? 'expanded' : ''}`}
                onClick={() => toggleSection('bankr')}
              >
                <span className="section-title">💱 Bankr Trading</span>
                <span className="section-status">{bankrStatus}</span>
                <span className="section-chevron">{expandedSection === 'bankr' ? '▼' : '▶'}</span>
              </button>
              
              {expandedSection === 'bankr' && (
                <div className="section-content">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.bankrEnabled}
                      onChange={e => setSettings({ ...settings, bankrEnabled: e.target.checked })}
                      disabled={loading}
                    />
                    <span>Enable Bankr integration</span>
                  </label>

                  {settings.bankrEnabled && (
                    <>
                      <div className="field-wrap">
                        <label className="field-label">Bankr API Key</label>
                        <input
                          type="password"
                          className="field-input"
                          value={settings.bankrApiKey}
                          onChange={e => setSettings({ ...settings, bankrApiKey: e.target.value })}
                          placeholder="Enter API key for direct trading"
                          disabled={loading}
                        />
                        <p className="field-help">
                          Get from bankr.bot/api · Without key, uses link-only mode
                        </p>
                      </div>

                      <div className="field-wrap">
                        <label className="field-label">Bankr Username (Optional)</label>
                        <input
                          type="text"
                          className="field-input"
                          value={settings.bankrUsername}
                          onChange={e => setSettings({ ...settings, bankrUsername: e.target.value })}
                          placeholder="@yourbankrhandle"
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Neynar Section */}
            <div className="settings-section">
              <button 
                className={`section-header ${expandedSection === 'neynar' ? 'expanded' : ''}`}
                onClick={() => toggleSection('neynar')}
              >
                <span className="section-title">📈 Neynar Trending</span>
                <span className="section-status">{neynarStatus}</span>
                <span className="section-chevron">{expandedSection === 'neynar' ? '▼' : '▶'}</span>
              </button>
              
              {expandedSection === 'neynar' && (
                <div className="section-content">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.neynarEnabled}
                      onChange={e => setSettings({ ...settings, neynarEnabled: e.target.checked })}
                      disabled={loading}
                    />
                    <span>Enable trending context in replies</span>
                  </label>

                  {settings.neynarEnabled && (
                    <div className="field-wrap">
                      <label className="field-label">Neynar API Key</label>
                      <input
                        type="password"
                        className="field-input"
                        value={settings.neynarApiKey}
                        onChange={e => setSettings({ ...settings, neynarApiKey: e.target.value })}
                        placeholder="Enter Neynar API key"
                        disabled={loading}
                      />
                      <p className="field-help">
                        Get from neynar.com · Adds trending topics to AI context
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="action-btn primary-btn"
              onClick={handleSave}
              disabled={loading || (!settings.veniceApiKey.trim() && !settings.githubToken.trim())}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>

            {status && <p className="inline-status">{status}</p>}
          </section>
        )}
      </main>

      <footer className="popup-footer">
        <p>{manifestStatus}</p>
      </footer>
    </div>
  );
}

export default App;

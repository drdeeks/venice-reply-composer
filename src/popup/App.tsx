import { useState, useEffect } from 'react';
import Settings from './components/Settings';
import ReplyComposer from './components/ReplyComposer';
import ChatTab from './components/ChatTab';

type Tab = 'settings' | 'reply' | 'chat';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('reply');
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    // Check wallet connection status on mount
    chrome.storage.local.get(['connectedWalletAddress'], (result) => {
      setWalletConnected(!!result.connectedWalletAddress);
    });

    // Listen for storage changes (wallet connect/disconnect)
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.connectedWalletAddress) {
        setWalletConnected(!!changes.connectedWalletAddress.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return (
    <div className="popup-shell">
      <header className="popup-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="hero-eyebrow">Venice + Bankr</p>
            <h1>Venice Reply Composer</h1>
            <p className="hero-subtitle">AI replies for social posts, with quick Bankr trade links.</p>
          </div>
          <div
            title={walletConnected ? 'Wallet connected' : 'Wallet not connected'}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: walletConnected ? '#4ade80' : '#64748b',
              marginLeft: '12px',
              flexShrink: 0
            }}
          />
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
        <button
          className={`tab-btn ${activeTab === 'reply' ? 'active' : ''}`}
          onClick={() => setActiveTab('reply')}
        >
          💬 Reply
        </button>
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          🗨️ Chat
        </button>
      </nav>

      <main className="popup-content">
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'reply' && <ReplyComposer />}
        {activeTab === 'chat' && <ChatTab />}
      </main>

      <footer className="popup-footer">
        <p>Venice AI Reply Composer v1.0.0</p>
      </footer>
    </div>
  );
}

export default App;

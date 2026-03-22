import { useState } from 'react';
import Settings from './components/Settings';
import ReplyComposer from './components/ReplyComposer';
import ChatTab from './components/ChatTab';

type Tab = 'settings' | 'reply' | 'chat';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('reply');

  return (
    <div className="popup-shell">
      <header className="popup-hero">
        <p className="hero-eyebrow">Venice + Bankr</p>
        <h1>Venice Reply Composer</h1>
        <p className="hero-subtitle">AI replies for social posts, with quick Bankr trade links.</p>
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

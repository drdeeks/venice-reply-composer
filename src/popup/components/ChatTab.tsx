import { useState, useEffect, useRef } from 'react';
import { getSettings } from '../../shared/storage';
import { getModelById } from '../../shared/models';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatHistory {
  messages: ChatMessage[];
  model?: string;
}

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadChatHistory() {
    try {
      const result = await chrome.storage.local.get(['chatHistory']);
      if (result.chatHistory) {
        const history: ChatHistory = result.chatHistory;
        setMessages(history.messages || []);
        setCurrentModel(history.model || '');
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }

  async function saveChatHistory() {
    try {
      await chrome.storage.local.set({
        chatHistory: {
          messages,
          model: currentModel
        }
      });
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const settings = await getSettings();
      if (!settings) {
        throw new Error('No settings found');
      }

      // Try providers in order: Venice -> Bankr -> GitHub
      let response: string | null = null;
      let usedModel = '';

      if (settings.veniceApiKey?.trim()) {
        try {
          const model = settings.veniceModel || 'venice-uncensored';
          response = await callVenice(settings.veniceApiKey, model, newMessages);
          usedModel = model;
        } catch (err) {
          console.warn('Venice failed, trying Bankr...', err);
        }
      }

      if (!response && settings.bankrApiKey?.trim()) {
        try {
          const model = settings.bankrModel || 'gemini-2.5-flash';
          response = await callBankr(settings.bankrApiKey, model, newMessages);
          usedModel = model;
        } catch (err) {
          console.warn('Bankr failed, trying GitHub...', err);
        }
      }

      if (!response && settings.githubToken?.trim()) {
        try {
          const model = settings.githubModel || 'gpt-4o-mini';
          response = await callGitHub(settings.githubToken, model, newMessages);
          usedModel = model;
        } catch (err) {
          console.warn('GitHub failed', err);
        }
      }

      if (!response) {
        throw new Error('All AI providers failed');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      setCurrentModel(usedModel);

      // Save after successful response
      await chrome.storage.local.set({
        chatHistory: {
          messages: updatedMessages,
          model: usedModel
        }
      });

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Failed to get response. Please check your API keys in Settings.',
        timestamp: Date.now()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function callVenice(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Venice API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  async function callBankr(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://llm.bankr.bot/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Bankr API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  async function callGitHub(token: string, model: string, messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  async function clearConversation() {
    if (confirm('Clear entire conversation history?')) {
      setMessages([]);
      setCurrentModel('');
      await chrome.storage.local.remove('chatHistory');
    }
  }

  const modelInfo = currentModel ? getModelById(currentModel) : null;

  return (
    <div className="chat-tab">
      <div className="chat-header">
        <div className="chat-info">
          {modelInfo ? (
            <span className="model-indicator">
              {modelInfo.name} ({modelInfo.provider})
            </span>
          ) : (
            <span className="model-indicator">No active model</span>
          )}
        </div>
        <button
          className="clear-btn"
          onClick={clearConversation}
          disabled={messages.length === 0}
        >
          Clear
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>👋 Start a conversation</p>
            <p className="help-text">Ask anything — replies use your configured AI models</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

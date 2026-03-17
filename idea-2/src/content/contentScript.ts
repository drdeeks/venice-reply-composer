import { getCurrentTab } from '../shared/tab';
import { getSettings } from '../shared/storage';

interface Post {
  author: string;
  content: string;
  element: HTMLElement;
}

interface ReplySuggestion {
  text: string;
  confidence: number;
}

export async function contentScript() {
  // Wait for page to load
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve));
  }

  // Get user settings
  const settings = await getSettings();
  if (!settings || !settings.veniceApiKey) {
    console.log('Venice Reply Composer: No API key configured');
    return;
  }

  // Detect platform
  const platform = detectPlatform();
  if (!platform) {
    console.log('Venice Reply Composer: Unsupported platform');
    return;
  }

  // Observe posts
  observePosts(platform);
}

function detectPlatform(): 'farcaster' | 'twitter' | 'reddit' | null {
  if (window.location.hostname.includes('farcaster')) return 'farcaster';
  if (window.location.hostname.includes('twitter')) return 'twitter';
  if (window.location.hostname.includes('reddit')) return 'reddit';
  return null;
}

function observePosts(platform: 'farcaster' | 'twitter' | 'reddit') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const posts = extractPosts(node as HTMLElement, platform);
          posts.forEach(post => addReplyButtons(post));
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function extractPosts(container: HTMLElement, platform: 'farcaster' | 'twitter' | 'reddit'): Post[] {
  const posts: Post[] = [];
  
  if (platform === 'farcaster') {
    // Farcaster post extraction logic
    container.querySelectorAll('[data-post-id]').forEach(el => {
      const element = el as HTMLElement;
      const author = element.querySelector('[data-username]')?.textContent || '';
      const content = element.querySelector('.post-content')?.textContent || '';
      if (author && content) {
        posts.push({ author, content, element: element });
      }
    });
  } else if (platform === 'twitter') {
    // Twitter post extraction logic
    container.querySelectorAll('[data-testid="tweet"]').forEach(el => {
      const element = el as HTMLElement;
      const author = element.querySelector('[data-testid="user-handle"]')?.textContent || '';
      const content = element.querySelector('[data-testid="tweetText"]')?.textContent || '';
      if (author && content) {
        posts.push({ author, content, element: element });
      }
    });
  } else if (platform === 'reddit') {
    // Reddit post extraction logic
    container.querySelectorAll('[data-test-id="post-content"]').forEach(el => {
      const element = el as HTMLElement;
      const author = element.querySelector('[data-test-id="author"]')?.textContent || '';
      const content = element.querySelector('[data-test-id="post-text"]')?.textContent || '';
      if (author && content) {
        posts.push({ author, content, element: element });
      }
    });
  }

  return posts;
}

async function addReplyButtons(post: Post) {
  // Skip if already processed
  if (post.element.querySelector('.venice-reply')) return;

  // Create reply container
  const container = document.createElement('div');
  container.className = 'venice-reply';
  container.style.cssText = 'margin-top: 8px; display: flex; gap: 8px;';

  // Add reply button
  const replyButton = document.createElement('button');
  replyButton.textContent = 'Suggest Reply';
  replyButton.className = 'btn-primary';
  replyButton.onclick = async () => {
    await showReplySuggestions(post);
  };

  // Add Bankr button if enabled
  const bankrButton = document.createElement('button');
  bankrButton.textContent = '🔐 Trade';
  bankrButton.className = 'btn-secondary';
  bankrButton.onclick = async () => {
    await executeBankrTrade(post);
  };

  container.appendChild(replyButton);
  container.appendChild(bankrButton);
  post.element.appendChild(container);
}

async function showReplySuggestions(post: Post) {
  try {
    const settings = await getSettings();
    if (!settings || !settings.veniceApiKey) {
      alert('Please configure Venice API key in extension settings');
      return;
    }

    // Get suggestions from Venice
    const suggestions = await getReplySuggestions(post.content);
    
    // Show suggestions
    const suggestionElements = suggestions.map(s => {
      const div = document.createElement('div');
      div.textContent = s.text;
      div.style.cssText = 'margin: 4px 0; padding: 4px; background: #f0f0f0; border-radius: 4px; cursor: pointer;';
      div.onclick = () => insertReply(s.text);
      return div;
    });

    // Create container
    const container = document.createElement('div');
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: white; border: 1px solid #ccc; padding: 12px; max-width: 300px; z-index: 10000;';
    
    const title = document.createElement('h3');
    title.textContent = 'Reply Suggestions';
    title.style.cssText = 'margin-bottom: 8px;';
    
    suggestionElements.forEach(el => container.appendChild(el));
    
    document.body.appendChild(container);

    // Close after click
    const close = () => container.remove();
    suggestionElements.forEach(el => el.onclick = () => { insertReply(el.textContent || ''); close(); });

  } catch (error) {
    console.error('Error getting suggestions:', error);
    alert('Error getting reply suggestions');
  }
}

async function getReplySuggestions(content: string): Promise<ReplySuggestion[]> {
  const response = await fetch('https://api.venice.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getSettings().then(s => s?.veniceApiKey || '')}`
    },
    body: JSON.stringify({
      model: 'venice-7b',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful social media assistant. Given a post, provide 3-5 relevant, engaging reply suggestions.'
        },
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices[0].message.content
    .split('\n\n')
    .filter((s: string) => s.trim())
    .slice(0, 5)
    .map((text: string, i: number) => ({ text, confidence: 0.8 - (i * 0.1) }));
}

function insertReply(text: string) {
  // This would integrate with the platform's reply interface
  console.log('Inserting reply:', text);
  // Implementation depends on platform
}

async function executeBankrTrade(post: Post) {
  // Extract tokens from post content
  const tokens = extractTokens(post.content);
  if (!tokens.length) {
    alert('No tokens found in post');
    return;
  }

  // Open Bankr trade interface
  const url = new URL('https://bankr.bot/swap');
  url.searchParams.set('tokens', tokens.join(','));
  url.searchParams.set('amount', '10'); // default amount
  
  const win = window.open(url.toString(), '_blank');
  if (win) win.focus();
}

function extractTokens(content: string): string[] {
  const tokenRegex = /[$#]?([A-Z]{2,5}\d?)/g;
  const matches = content.match(tokenRegex);
  return matches ? [...new Set(matches)] : [];
}

// Export for background script access
(window as any).veniceReplyContentScript = {
  contentScript,
  detectPlatform,
  extractPosts,
  addReplyButtons
};
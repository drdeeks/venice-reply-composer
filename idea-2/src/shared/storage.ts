export type AIProvider = 'venice' | 'github' | 'auto';

export interface Settings {
  // AI Providers
  veniceApiKey: string;
  githubToken: string;
  aiProvider: AIProvider;
  
  // Bankr
  bankrApiKey: string;
  bankrUsername: string;
  bankrEnabled: boolean;
  
  // Neynar
  neynarApiKey: string;
  neynarEnabled: boolean;
}

export const AI_PROVIDERS = {
  venice: {
    name: 'Venice AI',
    baseURL: 'https://api.venice.ai/api/v1',
    model: 'venice-uncensored'
  },
  github: {
    name: 'GitHub Models',
    baseURL: 'https://models.inference.ai.azure.com',
    model: 'gpt-4o-mini'
  }
} as const;

export const BANKR_API = {
  baseURL: 'https://api.bankr.bot',
  endpoints: {
    prompt: '/agent/prompt',
    job: '/agent/job',
    balances: '/agent/balances',
    userInfo: '/agent/user'
  }
} as const;

export const NEYNAR_API = {
  baseURL: 'https://api.neynar.com',
  endpoints: {
    trending: '/v2/farcaster/feed/trending/'
  }
} as const;

function normalizeApiKey(value: unknown): string {
  if (typeof value !== 'string') return '';

  let normalized = value.trim();
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

const SETTINGS_KEYS = [
  'veniceApiKey',
  'githubToken',
  'aiProvider',
  'bankrApiKey',
  'bankrUsername',
  'bankrEnabled',
  'neynarApiKey',
  'neynarEnabled'
] as const;

export async function getSettings(): Promise<Settings | null> {
  try {
    const settings = await chrome.storage.local.get([...SETTINGS_KEYS]);
    
    // Check if any settings exist
    const hasAnySettings = SETTINGS_KEYS.some(key => settings[key] !== undefined);
    if (!hasAnySettings) {
      return null;
    }
    
    return {
      veniceApiKey: normalizeApiKey(settings.veniceApiKey),
      githubToken: normalizeApiKey(settings.githubToken),
      aiProvider: (settings.aiProvider as AIProvider) || 'auto',
      bankrApiKey: normalizeApiKey(settings.bankrApiKey),
      bankrUsername: settings.bankrUsername || '',
      bankrEnabled: settings.bankrEnabled !== undefined ? settings.bankrEnabled : true,
      neynarApiKey: normalizeApiKey(settings.neynarApiKey),
      neynarEnabled: settings.neynarEnabled !== undefined ? settings.neynarEnabled : true
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await chrome.storage.local.set({
      veniceApiKey: normalizeApiKey(settings.veniceApiKey),
      githubToken: normalizeApiKey(settings.githubToken),
      aiProvider: settings.aiProvider,
      bankrApiKey: normalizeApiKey(settings.bankrApiKey),
      bankrUsername: settings.bankrUsername,
      bankrEnabled: settings.bankrEnabled,
      neynarApiKey: normalizeApiKey(settings.neynarApiKey),
      neynarEnabled: settings.neynarEnabled
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  provider: 'venice' | 'github';
}

export function getAIConfig(settings: Settings, preferredProvider?: 'venice' | 'github'): AIConfig | null {
  const provider = preferredProvider || (settings.aiProvider === 'auto' ? null : settings.aiProvider);
  
  if (provider === 'venice' && settings.veniceApiKey) {
    return {
      baseURL: AI_PROVIDERS.venice.baseURL,
      apiKey: settings.veniceApiKey,
      model: AI_PROVIDERS.venice.model,
      provider: 'venice'
    };
  }
  
  if (provider === 'github' && settings.githubToken) {
    return {
      baseURL: AI_PROVIDERS.github.baseURL,
      apiKey: settings.githubToken,
      model: AI_PROVIDERS.github.model,
      provider: 'github'
    };
  }
  
  // Auto mode: try Venice first, then GitHub
  if (settings.aiProvider === 'auto' || !provider) {
    if (settings.veniceApiKey) {
      return {
        baseURL: AI_PROVIDERS.venice.baseURL,
        apiKey: settings.veniceApiKey,
        model: AI_PROVIDERS.venice.model,
        provider: 'venice'
      };
    }
    if (settings.githubToken) {
      return {
        baseURL: AI_PROVIDERS.github.baseURL,
        apiKey: settings.githubToken,
        model: AI_PROVIDERS.github.model,
        provider: 'github'
      };
    }
  }
  
  return null;
}

export function getFallbackConfig(settings: Settings, failedProvider: 'venice' | 'github'): AIConfig | null {
  if (settings.aiProvider !== 'auto') return null;
  
  if (failedProvider === 'venice' && settings.githubToken) {
    return {
      baseURL: AI_PROVIDERS.github.baseURL,
      apiKey: settings.githubToken,
      model: AI_PROVIDERS.github.model,
      provider: 'github'
    };
  }
  
  if (failedProvider === 'github' && settings.veniceApiKey) {
    return {
      baseURL: AI_PROVIDERS.venice.baseURL,
      apiKey: settings.veniceApiKey,
      model: AI_PROVIDERS.venice.model,
      provider: 'venice'
    };
  }
  
  return null;
}

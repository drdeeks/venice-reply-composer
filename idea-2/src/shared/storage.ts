export type AIProvider = 'venice' | 'github' | 'auto';

export interface Settings {
  veniceApiKey: string;
  githubToken: string;
  aiProvider: AIProvider;
  bankrUsername: string;
  bankrEnabled: boolean;
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

export async function getSettings(): Promise<Settings | null> {
  try {
    const settings = await chrome.storage.local.get(['veniceApiKey', 'githubToken', 'aiProvider', 'bankrUsername', 'bankrEnabled']);
    if (settings.veniceApiKey !== undefined || settings.githubToken !== undefined || settings.bankrUsername !== undefined || settings.bankrEnabled !== undefined) {
      return {
        veniceApiKey: normalizeApiKey(settings.veniceApiKey),
        githubToken: normalizeApiKey(settings.githubToken),
        aiProvider: (settings.aiProvider as AIProvider) || 'auto',
        bankrUsername: settings.bankrUsername || '',
        bankrEnabled: settings.bankrEnabled !== undefined ? settings.bankrEnabled : true
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get settings:', error);
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await chrome.storage.local.set({
      ...settings,
      veniceApiKey: normalizeApiKey(settings.veniceApiKey),
      githubToken: normalizeApiKey(settings.githubToken)
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
  
  // If specific provider requested or set
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

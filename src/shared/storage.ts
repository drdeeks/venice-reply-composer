export type ResponseType = 'agreeReply' | 'againstReply' | 'forQuote' | 'againstQuote';

export interface ResponseTypeSettings {
  agreeReply: boolean;
  againstReply: boolean;
  forQuote: boolean;
  againstQuote: boolean;
}

export const DEFAULT_RESPONSE_TYPES: ResponseTypeSettings = {
  agreeReply: true,
  againstReply: true,
  forQuote: false,
  againstQuote: false
};

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  agreeReply: 'Agree (Reply)',
  againstReply: 'Against (Reply)',
  forQuote: 'For (Quote)',
  againstQuote: 'Against (Quote)'
};

export interface Settings {
  veniceApiKey: string;
  bankrUsername: string;
  bankrEnabled: boolean;
  bankrApiKey: string;
  githubToken: string;
  responseTypes: ResponseTypeSettings;
  veniceModel?: string;
  bankrModel?: string;
  githubModel?: string;
}

function normalizeApiKey(value: unknown): string {
  if (typeof value !== 'string') return '';

  let normalized = value.trim();
  if (!normalized) return '';

  // Handle VENICE_INFERENCE_KEY=value (env var assignment)
  const assignmentMatch = normalized.match(/(?:VENICE_INFERENCE_KEY|VENICE_API_KEY)\s*=\s*(.+)$/i);
  if (assignmentMatch) {
    normalized = assignmentMatch[1].trim();
  }

  // Keys starting with VENICE_INFERENCE_KEY_ are valid as-is
  if (/^VENICE_INFERENCE_KEY_/i.test(normalized)) {
    return normalized;
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
    const settings = await chrome.storage.local.get([
      'veniceApiKey',
      'bankrUsername',
      'bankrEnabled',
      'bankrApiKey',
      'githubToken',
      'responseTypes',
      'veniceModel',
      'bankrModel',
      'githubModel'
    ]);
    if (settings.veniceApiKey !== undefined || settings.bankrUsername !== undefined || settings.bankrEnabled !== undefined) {
      return {
        veniceApiKey: normalizeApiKey(settings.veniceApiKey),
        bankrUsername: settings.bankrUsername || '',
        bankrEnabled: settings.bankrEnabled !== undefined ? settings.bankrEnabled : true,
        bankrApiKey: normalizeApiKey(settings.bankrApiKey),
        githubToken: normalizeApiKey(settings.githubToken),
        responseTypes: settings.responseTypes || DEFAULT_RESPONSE_TYPES,
        veniceModel: settings.veniceModel,
        bankrModel: settings.bankrModel,
        githubModel: settings.githubModel
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
      bankrApiKey: normalizeApiKey(settings.bankrApiKey),
      githubToken: normalizeApiKey(settings.githubToken),
      responseTypes: settings.responseTypes || DEFAULT_RESPONSE_TYPES
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

interface Settings {
  veniceApiKey: string;
  bankrEnabled: boolean;
}

export async function getSettings(): Promise<Settings | null> {
  try {
    const settings = await chrome.storage.local.get(['veniceApiKey', 'bankrEnabled']);
    if (settings.veniceApiKey !== undefined || settings.bankrEnabled !== undefined) {
      return {
        veniceApiKey: settings.veniceApiKey || '',
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
    await chrome.storage.local.set(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}
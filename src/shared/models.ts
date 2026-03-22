export interface AIModel {
  id: string;
  name: string;
  provider: 'venice' | 'github' | 'bankr';
  description: string;
  contextWindow: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'good' | 'excellent' | 'best';
  censored: boolean;
}

export const VENICE_MODELS: AIModel[] = [
  {
    id: 'venice-uncensored',
    name: 'Venice Uncensored',
    provider: 'venice',
    description: 'Fastest, uncensored responses',
    contextWindow: 16384,
    speed: 'fast',
    quality: 'excellent',
    censored: false
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'venice',
    description: 'Large context, high quality',
    contextWindow: 131072,
    speed: 'medium',
    quality: 'excellent',
    censored: false
  },
  {
    id: 'mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'venice',
    description: 'Compact and efficient',
    contextWindow: 128000,
    speed: 'fast',
    quality: 'good',
    censored: false
  },
  {
    id: 'deepseek-r1-llama-70b',
    name: 'DeepSeek R1 Llama 70B',
    provider: 'venice',
    description: 'Advanced reasoning',
    contextWindow: 32768,
    speed: 'medium',
    quality: 'best',
    censored: false
  },
  {
    id: 'qwen-2.5-coder',
    name: 'Qwen 2.5 Coder',
    provider: 'venice',
    description: 'Code-optimized model',
    contextWindow: 32768,
    speed: 'fast',
    quality: 'excellent',
    censored: false
  }
];

export const GITHUB_MODELS: AIModel[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'github',
    description: 'Fast and cost-effective',
    contextWindow: 128000,
    speed: 'fast',
    quality: 'good',
    censored: true
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'github',
    description: 'High intelligence',
    contextWindow: 128000,
    speed: 'medium',
    quality: 'best',
    censored: true
  },
  {
    id: 'Phi-4',
    name: 'Phi-4',
    provider: 'github',
    description: 'Microsoft compact model',
    contextWindow: 16384,
    speed: 'fast',
    quality: 'good',
    censored: true
  },
  {
    id: 'Meta-Llama-3.1-70B-Instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: 'github',
    description: 'Meta flagship model',
    contextWindow: 128000,
    speed: 'medium',
    quality: 'excellent',
    censored: true
  },
  {
    id: 'Mistral-Large-2',
    name: 'Mistral Large 2',
    provider: 'github',
    description: 'Mistral flagship',
    contextWindow: 128000,
    speed: 'medium',
    quality: 'best',
    censored: true
  }
];

export const BANKR_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'bankr',
    description: 'Google lightning fast',
    contextWindow: 1048576,
    speed: 'fast',
    quality: 'excellent',
    censored: true
  },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'bankr',
    description: 'Anthropic balanced model',
    contextWindow: 200000,
    speed: 'medium',
    quality: 'best',
    censored: true
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'bankr',
    description: 'OpenAI flagship',
    contextWindow: 128000,
    speed: 'medium',
    quality: 'best',
    censored: true
  }
];

export const ALL_MODELS: AIModel[] = [
  ...VENICE_MODELS,
  ...GITHUB_MODELS,
  ...BANKR_MODELS
];

export function getModelsByProvider(provider: 'venice' | 'github' | 'bankr'): AIModel[] {
  switch (provider) {
    case 'venice':
      return VENICE_MODELS;
    case 'github':
      return GITHUB_MODELS;
    case 'bankr':
      return BANKR_MODELS;
  }
}

export function getModelById(id: string): AIModel | undefined {
  return ALL_MODELS.find(m => m.id === id);
}

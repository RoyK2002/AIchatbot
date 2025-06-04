import OpenAI from 'openai';

const validateApiKey = (apiKey: string): boolean => {
  // Basic validation: must start with 'sk-' and be reasonably long
  return apiKey.startsWith('sk-') && apiKey.length > 20;
};

const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
  }

  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid OpenAI API key format. API keys should start with "sk-". Please check your API key at https://platform.openai.com/account/api-keys');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

// Rate limiting configuration
const RATE_LIMIT = 10; // messages per minute
const MESSAGE_HISTORY: number[] = [];

const isRateLimited = () => {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  // Remove messages older than 1 minute
  while (MESSAGE_HISTORY.length > 0 && MESSAGE_HISTORY[0] < oneMinuteAgo) {
    MESSAGE_HISTORY.shift();
  }
  
  return MESSAGE_HISTORY.length >= RATE_LIMIT;
};

// Replace OpenAI direct call with backend call
export const getChatResponse = async (message: string): Promise<string> => {
  if (isRateLimited()) {
    throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
  }
  MESSAGE_HISTORY.push(Date.now());
  // Call backend instead of OpenAI directly
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Backend error');
    }
    const data = await res.json();
    if (!data.reply) throw new Error('No reply from backend');
    return data.reply;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to contact backend');
  }
};



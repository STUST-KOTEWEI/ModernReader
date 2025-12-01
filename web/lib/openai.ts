import OpenAI from 'openai';

// Initialize OpenAI client
// Set OPENAI_API_KEY in your .env.local file
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key',
});

// Check if API key is configured
export const isOpenAIConfigured = () => {
    return process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-mock-key';
};

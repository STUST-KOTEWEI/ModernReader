// Hugging Face Inference API Client (Free Tier)
// Get your free API key from: https://huggingface.co/settings/tokens

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://api-inference.huggingface.co/models';

export function isHuggingFaceConfigured(): boolean {
    return !!HF_API_KEY && HF_API_KEY !== 'hf_your_key_here';
}

// Text Generation (Chat)
export async function generateText(prompt: string, systemPrompt?: string) {
    if (!isHuggingFaceConfigured()) {
        return {
            text: "This is a mock response. Add HUGGINGFACE_API_KEY to enable real AI chat.",
            isMock: true
        };
    }

    try {
        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`
            : prompt;

        const response = await fetch(`${HF_API_URL}/meta-llama/Llama-2-7b-chat-hf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: fullPrompt,
                parameters: {
                    max_new_tokens: 150,
                    temperature: 0.7,
                    top_p: 0.9,
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('HuggingFace API error:', data.error);
            return { text: "API error. Please check your key.", isMock: false };
        }

        return {
            text: data[0]?.generated_text || "No response",
            isMock: false
        };
    } catch (error) {
        console.error('HuggingFace error:', error);
        return { text: "Failed to generate response", isMock: false };
    }
}

// Translation (Facebook NLLB - 200 languages)
export async function translateText(text: string, targetLang: string) {
    if (!isHuggingFaceConfigured()) {
        return {
            translatedText: `[Mock translation to ${targetLang}] ${text}`,
            isMock: true
        };
    }

    try {
        const response = await fetch(`${HF_API_URL}/facebook/nllb-200-distilled-600M`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: text,
                parameters: {
                    src_lang: 'eng_Latn',
                    tgt_lang: targetLang
                }
            })
        });

        const data = await response.json();

        return {
            translatedText: data[0]?.translation_text || text,
            isMock: false
        };
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: text, isMock: false };
    }
}

// Emotion Detection (DistilBERT)
export async function detectEmotion(text: string) {
    if (!isHuggingFaceConfigured()) {
        return {
            emotion: 'neutral',
            confidence: 0.5,
            isMock: true
        };
    }

    try {
        const response = await fetch(`${HF_API_URL}/j-hartmann/emotion-english-distilroberta-base`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: text })
        });

        const data = await response.json();

        if (Array.isArray(data) && data[0]) {
            const topEmotion = data[0][0];
            return {
                emotion: topEmotion.label.toLowerCase(),
                confidence: topEmotion.score,
                isMock: false
            };
        }

        return { emotion: 'neutral', confidence: 0.5, isMock: false };
    } catch (error) {
        console.error('Emotion detection error:', error);
        return { emotion: 'neutral', confidence: 0.5, isMock: false };
    }
}

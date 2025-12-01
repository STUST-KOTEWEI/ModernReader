import { GoogleGenAI, Type, Modality } from "@google/genai";
import { buildEmotionImagePrompt } from './emotionPromptService';
import { AnalysisResult, AdvancedNlpResult, BookRecommendation } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log('Gemini API Key:', API_KEY);
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
  console.log('✅ Gemini API initialized');
} else {
  console.warn('⚠️ Gemini API Key not set. AI features will use mock data.');
}

const createMockAnalysis = (text: string): AnalysisResult => ({
  summary: `這是一段關於「${text.substring(0, 30)}...」的內容分析。由於未設定 Gemini API Key，這是模擬資料。`,
  concepts: [
    { concept: '概念 1', explanation: '這是第一個關鍵概念的說明' },
    { concept: '概念 2', explanation: '這是第二個關鍵概念的說明' },
    { concept: '概念 3', explanation: '這是第三個關鍵概念的說明' }
  ],
  qa: [
    { question: '這段內容的主要論點是什麼？', answer: '主要論點是關於文本的核心思想。' },
    { question: '有哪些重要的細節值得注意？', answer: '重要細節包括文本中提到的關鍵資訊。' }
  ]
});

export async function generateAnalysis(text: string): Promise<AnalysisResult> {
  if (!ai) {
    console.warn('⚠️ Using mock analysis data');
    return createMockAnalysis(text);
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Analyze the following text. Provide a concise summary, identify up to 5 key concepts with brief explanations, and generate 3 relevant questions and answers. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A concise summary of the text.'
            },
            concepts: {
              type: Type.ARRAY,
              description: 'An array of key concepts from the text.',
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: 'The key concept.' },
                  explanation: { type: Type.STRING, description: 'A brief explanation of the concept.' }
                },
                required: ['concept', 'explanation']
              }
            },
            qa: {
              type: Type.ARRAY,
              description: 'An array of questions and answers based on the text.',
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'A relevant question.' },
                  answer: { type: Type.STRING, description: 'The answer to the question.' }
                },
                required: ['question', 'answer']
              }
            }
          },
          required: ['summary', 'concepts', 'qa']
        },
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result as AnalysisResult;

  } catch (error) {
    console.error("Error in generateAnalysis:", error);
    throw new Error("Failed to analyze text. The model may not have returned valid JSON.");
  }
}

export async function generateAdvancedNlpAnalysis(text: string): Promise<AdvancedNlpResult> {
  if (!ai) {
    console.warn('⚠️ Using mock NLP data');
    return {
      sentiment: { score: 'Neutral', explanation: '未設定 API Key，無法分析情感' },
      entities: { people: [], organizations: [], locations: [] }
    };
  }
  
  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: `Perform an advanced NLP analysis on the following text. Determine the overall sentiment (Positive, Negative, or Neutral) and provide a brief explanation. Also, extract named entities, categorizing them into people, organizations, and locations. Text: "${text}"`,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      sentiment: {
                          type: Type.OBJECT,
                          properties: {
                              score: { type: Type.STRING, description: 'The sentiment score: Positive, Negative, or Neutral.' },
                              explanation: { type: Type.STRING, description: 'A brief explanation for the sentiment.' }
                          },
                          required: ['score', 'explanation']
                      },
                      entities: {
                          type: Type.OBJECT,
                          properties: {
                              people: { type: Type.ARRAY, items: { type: Type.STRING } },
                              organizations: { type: Type.ARRAY, items: { type: Type.STRING } },
                              locations: { type: Type.ARRAY, items: { type: Type.STRING } }
                          },
                          required: ['people', 'organizations', 'locations']
                      }
                  },
                  required: ['sentiment', 'entities']
              },
          },
      });
      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);
      return result as AdvancedNlpResult;
  } catch (error) {
      console.error("Error in generateAdvancedNlpAnalysis:", error);
      throw new Error("Failed to perform advanced NLP analysis.");
  }
}

export async function generateBookRecommendations(text: string, age: number): Promise<BookRecommendation[]> {
    if (!ai) {
      console.warn('⚠️ Using mock book recommendations');
      return [
        { title: '示例書籍', author: '示例作者', summary: '未設定 API Key，這是模擬資料', reason: '需要 Gemini API Key 才能生成真實推薦' }
      ];
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Act as a sophisticated, LSTM-powered book recommendation engine. Analyze the themes, writing style, genre, and complexity of the following text. Based on this analysis, recommend 3 books that would be suitable and enjoyable for a ${age}-year-old reader. For each book, provide the title, author, a brief summary, and a clear reason why it's a good recommendation based on the source text. Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            author: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ['title', 'author', 'summary', 'reason']
                    }
                },
            },
        });
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result as BookRecommendation[];
    } catch (error) {
        console.error("Error in generateBookRecommendations:", error);
        throw new Error("Failed to generate book recommendations.");
    }
}


export async function generateImage(prompt: string): Promise<string> {
    if (!ai) {
      console.warn('⚠️ Image generation requires API Key');
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23181c20" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%2300c6ff" font-size="20">需要 Gemini API Key</text></svg>';
    }
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Create a vibrant, abstract, digital art piece that captures the essence of: "${prompt}"`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
}

// 使用情緒提示詞庫強化圖片生成
export async function generateImageWithEmotion(basePrompt: string, emotion: string | number): Promise<string> {
  const merged = buildEmotionImagePrompt(basePrompt, emotion);
  return await generateImage(merged || basePrompt);
}

export async function textToSpeech(text: string): Promise<string> {
  // 雲端優先；若未配置或失敗，fallback 到本地 TTS
  if (!ai) {
    console.warn('⚠️ Text-to-speech requires API Key, trying local TTS fallback');
    const { textToSpeechLocal } = await import('./localTtsService');
    const localAudio = await textToSpeechLocal(text);
    if (localAudio) return localAudio; // 回傳 base64
    throw new Error('本地 TTS 不可用，請啟動本地 TTS 服務或使用瀏覽器語音。');
  }
    
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `"${text}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
        
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    return base64Audio;

  } catch (error) {
    console.error("Error in textToSpeech (cloud). Fallback to local.", error);
    try {
      const { textToSpeechLocal } = await import('./localTtsService');
      const localAudio = await textToSpeechLocal(text);
      if (localAudio) return localAudio;
    } catch (e) {
      console.error('Local TTS fallback failed:', e);
    }
    throw new Error("Failed to generate audio.");
  }
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
    if (!ai) {
      console.warn('⚠️ Image OCR requires API Key');
      throw new Error('需要 Gemini API Key 才能使用 OCR 功能');
    }
    
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
            },
        };
        const textPart = {
            text: 'Extract the text from this image.'
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw new Error("Failed to extract text from the image.");
    }
}
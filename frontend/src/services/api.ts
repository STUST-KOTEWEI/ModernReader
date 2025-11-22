import axios from "axios";

// Use relative baseURL so it works on custom domains (e.g., https://modernreader.com)
const client = axios.create({ baseURL: "/api/v1" });

// Core AI API
export const aiClient = {
  async analyzeEmotion(payload: { text: string }) {
    const response = await client.post("/ai/emotion/analyze", payload);
    return response.data as { top_emotion: string; emotions: Record<string, number> };
  },
};

export const authClient = {
  async login(payload: { email: string; password: string }) {
    const response = await client.post("/auth/login", payload);
    return response.data;
  },
  async signup(payload: { email: string; password: string; role?: string; language_goal?: string }) {
    const response = await client.post("/auth/signup", payload);
    return response.data;
  }
};

export const recommendationClient = {
  async getRecommendations(payload: { user_id: string; context_book_id?: string; emotion_state?: string; limit?: number }) {
    const response = await client.post("/recommend/books", payload);
    return response.data;
  }
};

export const sessionClient = {
  async listEvents(sessionId: string) {
    // Placeholder until telemetry endpoint is implemented
    return Promise.resolve({
      events: [
        { timestamp: new Date().toISOString(), event_type: "session_start", emotion: "curious" },
        { timestamp: new Date().toISOString(), event_type: "question_asked", emotion: "confused" }
      ]
    });
  }
};

export const sensesClient = {
  async sendCommand(payload: { session_id: string; modality: string; payload: Record<string, string | number> }) {
    const response = await client.post("/senses/command", payload);
    return response.data;
  }
};

export const catalogClient = {
  async search(payload: { q?: string; language?: string; source?: string }) {
    const response = await client.get("/catalog/search", { params: payload });
    return response.data;
  },
  async importSample() {
    const response = await client.post("/catalog/import-sample");
    return response.data as { status: string; inserted?: number; existing?: number };
  }
};

export const epaperClient = {
  async format(payload: { title: string; text: string; max_chars_per_card?: number }) {
    const response = await client.post("/epaper/format", payload);
    return response.data;
  },
  async publish(payload: { title: string; device_group: string; cards: Array<{ heading: string; body: string; highlights: string[]; metadata?: Record<string, unknown> }>; valid_until?: string }) {
    const response = await client.post("/epaper/publish", payload);
    return response.data;
  },
  async queue(deviceId: string) {
    const response = await client.get("/epaper/queue", { params: { device_id: deviceId } });
    return response.data;
  }
};

// RAG System API
export const ragClient = {
  async ingest(payload: { content: string; metadata?: Record<string, unknown>; collection_name?: string }) {
    const response = await client.post("/rag/ingest", payload);
    return response.data;
  },
  async ingestCatalog() {
    // Extended endpoint to ingest sample/DB catalog into vector store or knowledge base
    const response = await client.post("/rag/ingest-catalog");
    return response.data;
  },
  async query(payload: { query: string; collection_name?: string; top_k?: number; language?: string }) {
    const response = await client.post("/rag/query", payload);
    return response.data;
  },
  async search(payload: { query: string; collection_name?: string; top_k?: number }) {
    const response = await client.post("/rag/search", payload);
    return response.data;
  },
  async stats(collectionName?: string) {
    const response = await client.get("/rag/stats", { params: { collection_name: collectionName } });
    return response.data;
  }
};

// Recommender System API (Advanced Multi-objective)
export const advancedRecommenderClient = {
  async recommend(payload: { 
    user_id: string; 
    context?: Record<string, unknown>; 
    objectives?: Array<{ name: string; weight: number }>; 
    limit?: number 
  }) {
    const response = await client.post("/recommender/recommend", payload);
    return response.data;
  },
  async getObjectives() {
    const response = await client.get("/recommender/objectives");
    return response.data;
  },
  async explain(payload: { user_id: string; item_id: string }) {
    const response = await client.post("/recommender/explain", payload);
    return response.data;
  }
};

// Cognitive Optimizer API
export const cognitiveClient = {
  async assessLoad(payload: {
    user_id: string;
    reading_speed?: number;
    error_rate?: number;
    pause_frequency?: number;
    heart_rate_variability?: number;
  }) {
    const response = await client.post("/cognitive/assess-load", payload);
    return response.data;
  },
  async adaptContent(payload: {
    content: string;
    current_load: number;
    target_load?: number;
    user_profile?: Record<string, unknown>;
  }) {
    const response = await client.post("/cognitive/adapt-content", payload);
    return response.data;
  },
  async scheduleReview(payload: {
    content_id: string;
    user_id: string;
    quality: number;
    content_difficulty?: number;
  }) {
    const response = await client.post("/cognitive/schedule-review", payload);
    return response.data;
  },
  async adaptiveScaffold(payload: {
    user_id: string;
    content_id: string;
    current_load: number;
  }) {
    const response = await client.post("/cognitive/adaptive-scaffold", payload);
    return response.data;
  }
};

// Audio API (STT/TTS)
export const audioClient = {
  async transcribe(formData: FormData) {
    const response = await client.post("/audio/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  async synthesize(payload: { text: string; language?: string; voice?: string }) {
    const response = await client.post("/audio/synthesize", payload, {
      responseType: "blob"
    });
    return response.data;
  }
};

// User Settings API
export const userClient = {
  async getSettings(token?: string) {
    const auth = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('mr_jwt') || '' : '');
    const response = await client.get('/users/me/settings', {
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });
    return response.data as {
      default_language?: string | null;
      tts_voice?: string | null;
      romanization_scheme?: string | null;
      autoplay_tts: boolean;
      learning_opt_in: boolean;
      preferences?: Record<string, any> | null;
    };
  },
  async updateSettings(payload: Partial<{
    default_language: string | null;
    tts_voice: string | null;
    romanization_scheme: string | null;
    autoplay_tts: boolean;
    learning_opt_in: boolean;
    preferences: Record<string, any> | null;
  }>, token?: string) {
    const auth = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('mr_jwt') || '' : '');
    const response = await client.put('/users/me/settings', payload, {
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });
    return response.data;
  }
};

// Indigenous Language API (Handwriting + Pronunciation Training)
export const indigenousClient = {
  async recognizeHandwriting(formData: FormData) {
    const response = await client.post("/indigenous/handwriting/recognize", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  async trainPronunciation(payload: {
    audio_url: string;
    transcript: string;
    language: string;
    speaker_id: string;
    dialect?: string;
  }) {
    const response = await client.post("/indigenous/pronunciation/train", payload);
    return response.data;
  },
  async assessPronunciation(formData: FormData) {
    const response = await client.post("/indigenous/pronunciation/assess", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  async getLanguageInfo(languageCode: string) {
    const response = await client.get(`/indigenous/language/${languageCode}/info`);
    return response.data;
  },
  async listLanguages() {
    const response = await client.get("/indigenous/languages");
    return response.data;
  },
  async createLanguage(payload: {
    code: string;
    name: string;
    region?: string;
    family?: string;
    script?: string;
    aliases?: string[];
    metadata?: Record<string, unknown>;
  }) {
    const response = await client.post("/indigenous/languages", payload);
    return response.data as { status: string; language: { code: string; name: string } };
  }
};

// Indigenous Chat API (AI Chatbot + LLM Fine-tuning)
export const indigenousChatClient = {
  async chat(payload: {
    message: string;
    language_code: string;
    session_id?: string;
    include_translation?: boolean;
    include_cultural_notes?: boolean;
    include_pronunciation?: boolean;
  }) {
    const response = await client.post("/indigenous-chat/chat", payload);
    return response.data;
  },
  async listLanguages() {
    const response = await client.get("/indigenous-chat/languages");
    return response.data;
  },
  async getLanguageDetails(languageCode: string) {
    const response = await client.get(`/indigenous-chat/languages/${languageCode}`);
    return response.data;
  },
  async getStatistics() {
    const response = await client.get("/indigenous-chat/statistics");
    return response.data;
  },
  async startFineTuning(payload: {
    language_code: string;
    base_model?: string;
    training_epochs?: number;
    learning_rate?: number;
    batch_size?: number;
    use_lora?: boolean;
  }) {
    const response = await client.post("/indigenous-chat/fine-tune/start", payload);
    return response.data;
  },
  async getFineTuningStatus(jobId: string) {
    const response = await client.get(`/indigenous-chat/fine-tune/status/${jobId}`);
    return response.data;
  },
  async contributeTrainingData(formData: FormData) {
    const response = await client.post("/indigenous-chat/training-data/contribute", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  }
};

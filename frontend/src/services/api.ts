import axios from "axios";
import type {
  PrototypeInterestPayload,
  PrototypeInterestResponse,
  PrototypeOverview,
} from "../types/prototype";

// Online/offline detection with graceful offline fallback (no hardcoded demo unless offline or file://)
const IS_DEMO = (() => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const forced = (() => { try { return localStorage.getItem('mr_demo_forced') === '1'; } catch { return false; } })();
  const isFile = window.location.protocol === 'file:';
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isFile) {
    // If running from file:// but an explicit API base is configured and online, treat as online
    try {
      const saved = localStorage.getItem('mr_api_base');
      if (online && saved && /^https?:\/\//i.test(saved)) {
        try { localStorage.removeItem('mr_demo'); } catch {}
        return false;
      }
    } catch {}
    // Otherwise fallback to offline mode
    try { localStorage.setItem('mr_demo', '1'); } catch {}
    return true;
  }
  if (!online) {
    try { localStorage.setItem('mr_demo', '1'); } catch {}
    return true;
  }
  // allow ?demo and local override for development
  if (params.has('demo') || forced) {
    try { localStorage.setItem('mr_demo', '1'); } catch {}
    return true;
  }
  try { return localStorage.getItem('mr_demo') === '1' && !online ? true : false; } catch { return false; }
})();

// Allow overriding API base via localStorage 'mr_api_base' (useful when opening file://)
const API_BASE = (() => {
  if (typeof window === 'undefined') return "/api/v1";
  try {
    const saved = localStorage.getItem('mr_api_base');
    if (saved && /^https?:\/\//i.test(saved)) return saved;
  } catch {}
  return "/api/v1";
})();
const client = axios.create({ baseURL: API_BASE });

// Graceful fallback: if auth endpoints fail due to backend being down, auto-switch to demo
function enableDemoMode() {
  try { localStorage.setItem('mr_demo', '1'); } catch {}
}

client.interceptors.response.use(
  (res) => res,
  (error) => {
    // Do not auto-switch to demo on auth failures anymore; just propagate error
    return Promise.reject(error);
  }
);

// ---------------- Demo data & helpers ----------------
type DemoBook = { id: string; title: string; summary?: string; language?: string; author?: string; year?: number; isbn?: string; publisher?: string; library_location?: string };
const DEMO_BOOKS: DemoBook[] = [
  // 中文書籍
  { id: 'demo_zh_001', title: '原子習慣（精選）', summary: '細微改變帶來巨大成就的法則。', language: 'zh', author: '詹姆斯·克利爾', year: 2019, isbn: '978-986-179-584-2', publisher: '方智出版社', library_location: '國立臺灣圖書館 3F-A12' },
  { id: 'demo_zh_002', title: '設計模式導讀', summary: '提升程式碼品質與可維護性。', language: 'zh', author: 'Erich Gamma 等', year: 1995, isbn: '978-0-201-63361-0', publisher: 'Addison-Wesley', library_location: '清華大學圖書館 5F-CS215' },
  { id: 'demo_zh_003', title: '深度工作力', summary: '在紛擾世界中專注的力量。', language: 'zh', author: '卡爾·紐波特', year: 2016, isbn: '978-986-477-142-9', publisher: '時報出版', library_location: '臺北市立圖書館總館 7F-112' },
  { id: 'demo_zh_004', title: '快思慢想', summary: '行為經濟學與決策心理學經典。', language: 'zh', author: '丹尼爾·康納曼', year: 2011, isbn: '978-986-320-125-3', publisher: '天下文化', library_location: '政治大學圖書館 2F-PSY42' },
  { id: 'demo_zh_005', title: '人類大歷史', summary: '從石器時代到 AI 時代的人類演化。', language: 'zh', author: '哈拉瑞', year: 2014, isbn: '978-986-320-133-8', publisher: '天下文化', library_location: '臺灣大學總圖 4F-901.1' },
  { id: 'demo_zh_006', title: '被討厭的勇氣', summary: '阿德勒心理學的實踐智慧。', language: 'zh', author: '岸見一郎', year: 2014, isbn: '978-986-248-516-8', publisher: '究竟出版社', library_location: '誠品信義店 3F-心理類' },
  { id: 'demo_zh_007', title: '刻意練習', summary: '精通任何技能的科學方法。', language: 'zh', author: '安德斯·艾瑞克森', year: 2017, isbn: '978-986-477-262-4', publisher: '方智出版', library_location: '國家圖書館 8F-528.9' },
  { id: 'demo_zh_008', title: '零秒反應力', summary: '麥肯錫顧問的思考術。', language: 'zh', author: '赤羽雄二', year: 2013, isbn: '978-986-321-189-4', publisher: '悅知文化', library_location: '成功大學圖書館 3F-494.1' },
  
  // English Books
  { id: 'demo_en_001', title: 'Introduction to AI', summary: 'Core concepts and history of artificial intelligence.', language: 'en', author: 'Stuart Russell & Peter Norvig', year: 2020, isbn: '978-0-13-461099-3', publisher: 'Pearson', library_location: 'MIT Libraries - Hayden 4F-Q335' },
  { id: 'demo_en_002', title: 'Quantum Computing Basics', summary: 'A gentle intro to quantum information.', language: 'en', author: 'Michael A. Nielsen', year: 2010, isbn: '978-1-107-00217-3', publisher: 'Cambridge University Press', library_location: 'Stanford Libraries - Engineering QA76.889' },
  { id: 'demo_en_003', title: 'Clean Code', summary: 'A handbook of agile software craftsmanship.', language: 'en', author: 'Robert C. Martin', year: 2008, isbn: '978-0-13-235088-4', publisher: 'Prentice Hall', library_location: 'UC Berkeley - Moffitt QA76.76.D47' },
  { id: 'demo_en_004', title: 'Thinking, Fast and Slow', summary: 'Behavioral economics and decision-making psychology.', language: 'en', author: 'Daniel Kahneman', year: 2011, isbn: '978-0-374-27563-1', publisher: 'Farrar, Straus and Giroux', library_location: 'Harvard Libraries - Widener BF441' },
  { id: 'demo_en_005', title: 'The Pragmatic Programmer', summary: 'From journeyman to master in software development.', language: 'en', author: 'Andrew Hunt & David Thomas', year: 2019, isbn: '978-0-13-595705-9', publisher: 'Addison-Wesley', library_location: 'Princeton Library - Lewis QA76.6' },
  { id: 'demo_en_006', title: 'Sapiens: A Brief History', summary: 'From animals into gods: the history of humankind.', language: 'en', author: 'Yuval Noah Harari', year: 2015, isbn: '978-0-062-31609-0', publisher: 'Harper', library_location: 'Yale Library - Sterling CB151' },
  { id: 'demo_en_007', title: 'Deep Work', summary: 'Rules for focused success in a distracted world.', language: 'en', author: 'Cal Newport', year: 2016, isbn: '978-1-455-58669-4', publisher: 'Grand Central Publishing', library_location: 'Oxford Bodleian - Radcliffe BF637.S8' },
  
  // 日本語書籍
  { id: 'demo_ja_001', title: '小説入門', summary: '物語の構造とテクニック。', language: 'ja', author: '三島由紀夫', year: 1988, isbn: '978-4-12-204561-3', publisher: '中央公論新社', library_location: '東京大学図書館 本郷 810.2' },
  { id: 'demo_ja_002', title: '日本文化の基礎', summary: '文化・歴史の概観。', language: 'ja', author: '梅棹忠夫', year: 1976, isbn: '978-4-06-158948-5', publisher: '講談社', library_location: '京都大学附属図書館 210.1' },
  { id: 'demo_ja_003', title: 'ゼロ秒思考', summary: '頭がよくなる世界一シンプルなトレーニング。', language: 'ja', author: '赤羽雄二', year: 2013, isbn: '978-4-478-02258-5', publisher: 'ダイヤモンド社', library_location: '早稲田大学中央図書館 336.2' },
  { id: 'demo_ja_004', title: '人を動かす', summary: 'カーネギーの名著、人間関係の原則。', language: 'ja', author: 'D・カーネギー', year: 1936, isbn: '978-4-422-10055-5', publisher: '創元社', library_location: '慶應義塾大学三田 361.4' },
  { id: 'demo_ja_005', title: '幸せになる勇気', summary: 'アドラー心理学の続編。', language: 'ja', author: '岸見一郎', year: 2016, isbn: '978-4-478-06656-5', publisher: 'ダイヤモンド社', library_location: '国立国会図書館 146.1' },
  { id: 'demo_ja_006', title: 'イシューからはじめよ', summary: '知的生産の「シンプルな本質」', language: 'ja', author: '安宅和人', year: 2010, isbn: '978-4-86276-116-8', publisher: '英治出版', library_location: '大阪大学附属図書館 336.2' },
  
  // 原住民語書籍 (Indigenous Language Books)
  { id: 'demo_ami_001', title: 'Misafeliyay to Pangcah', summary: '阿美族口述歷史與文化傳承。', language: 'ami', author: '馬耀·比吼', year: 2018, isbn: '978-986-05-7123-4', publisher: '原住民族委員會', library_location: '原住民族圖書資訊中心 A-01' },
  { id: 'demo_ami_002', title: "O mihecaan no Pangcah", summary: '阿美族的歲時祭儀與文化。', language: 'ami', author: '林志興', year: 2020, isbn: '978-986-05-9234-1', publisher: '行政院原住民族委員會', library_location: '花蓮縣文化局 原住民專區' },
  { id: 'demo_pwn_001', title: 'Qemaljup a ku sinsi', summary: '排灣族傳統智慧與生活哲學。', language: 'pwn', author: '撒古流·巴瓦瓦隆', year: 2019, isbn: '978-986-05-8456-7', publisher: '山海文化雜誌社', library_location: '屏東縣立圖書館 原民文化區' },
  { id: 'demo_tay_001', title: 'Qwas Bnkis Tayal', summary: '泰雅族織布技藝與文化意涵。', language: 'tay', author: '尤瑪·達陸', year: 2017, isbn: '978-986-05-6234-8', publisher: '原住民族委員會', library_location: '新竹縣政府文化局 2F' },
  { id: 'demo_bnn_001', title: 'Hanvang tu Bunun', summary: '布農族八部合音與音樂文化。', language: 'bnn', author: '胡健驊', year: 2016, isbn: '978-986-04-8765-3', publisher: '國立臺灣史前文化博物館', library_location: '南投縣文化局 3F-原民專區' },
  
  // 科技與程式設計
  { id: 'demo_zh_009', title: 'Python 機器學習實戰', summary: '從零開始的深度學習之旅。', language: 'zh', author: '陳昭明', year: 2021, isbn: '978-986-502-756-4', publisher: '博碩文化', library_location: '資訊科學圖書館 006.31' },
  { id: 'demo_en_008', title: 'Designing Data-Intensive Applications', summary: 'The big ideas behind reliable, scalable systems.', language: 'en', author: 'Martin Kleppmann', year: 2017, isbn: '978-1-449-37332-0', publisher: "O'Reilly Media", library_location: 'CMU Libraries - Hunt QA76.9.D3' },
  { id: 'demo_en_009', title: 'The DevOps Handbook', summary: 'How to create world-class agility and reliability.', language: 'en', author: 'Gene Kim et al.', year: 2016, isbn: '978-1-942788-00-3', publisher: 'IT Revolution Press', library_location: 'Google Library - MTV QA76.76.D47' },
  
  // 哲學與人文
  { id: 'demo_zh_010', title: '存在與時間導讀', summary: '海德格爾哲學思想精要。', language: 'zh', author: '陳嘉映', year: 2015, isbn: '978-986-320-289-2', publisher: '商周出版', library_location: '中央大學圖書館 142.8' },
  { id: 'demo_en_010', title: 'Meditations', summary: 'Marcus Aurelius on Stoic philosophy.', language: 'en', author: 'Marcus Aurelius', year: 180, isbn: '978-0-14-044933-1', publisher: 'Penguin Classics', library_location: 'British Library - Reading Room B187' },
  { id: 'demo_ja_007', title: '禅とオートバイ修理技術', summary: '質を求める思索的な旅。', language: 'ja', author: 'R・M・パーシグ', year: 1974, isbn: '978-4-00-603001-4', publisher: '岩波書店', library_location: '東京都立中央図書館 104' },
];

// tiny silent WAV data URL (plays quickly; placeholder for demo)
const DEMO_SILENCE_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

// Helpers: ISBN -> Open Library cover URL with fallback, simple shuffle with emotion bias
const normalizeIsbn = (isbn?: string) => {
  if (!isbn) return undefined;
  // Remove hyphens, spaces, and keep only digits and X
  const clean = isbn.replace(/[-\s]/g, '').replace(/[^0-9Xx]/g, '');
  // ISBN-10 or ISBN-13
  if (clean.length === 10 || clean.length === 13) {
    return clean.toUpperCase();
  }
  return undefined;
};

const coverUrlFromIsbn = (isbn?: string, size: 'S' | 'M' | 'L' = 'M') => {
  const norm = normalizeIsbn(isbn);
  if (!norm) return undefined;
  return `https://covers.openlibrary.org/b/isbn/${norm}-${size}.jpg`;
};

// Generate a placeholder cover with book info
const placeholderCover = (title: string, author?: string) => {
  const colors = ['4F46E5', '7C3AED', 'EC4899', 'F59E0B', '10B981', '3B82F6'];
  const bgColor = colors[Math.abs(title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];
  const initials = title.slice(0, 2).toUpperCase();
  
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'>
      <rect width='200' height='300' fill='%23${bgColor}'/>
      <text x='50%' y='45%' font-size='48' fill='white' text-anchor='middle' font-family='Arial, sans-serif' font-weight='bold'>${initials}</text>
      <text x='50%' y='60%' font-size='14' fill='white' text-anchor='middle' font-family='Arial, sans-serif' opacity='0.9'>${title.slice(0, 20)}${title.length > 20 ? '...' : ''}</text>
      ${author ? `<text x='50%' y='70%' font-size='12' fill='white' text-anchor='middle' font-family='Arial, sans-serif' opacity='0.7'>${author.slice(0, 15)}</text>` : ''}
    </svg>
  `.trim();
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const EMOTION_KEYWORDS: Record<string, string[]> = {
  happy: ['happy', 'joy', 'fun', 'inspire', '快樂', '幸福'],
  curious: ['learn', 'guide', 'introduction', '入門', '導讀', '深度', 'AI', '設計', 'Quantum'],
  stressed: ['calm', 'slow', '禪', 'meditations', 'stoic', '勇氣', '反應力'],
  tired: ['deep', 'focus', 'work', '專注', '習慣'],
  neutral: []
};
function scoreByEmotion(title: string, summary: string | undefined, emotion?: string) {
  if (!emotion) return 0;
  const keys = EMOTION_KEYWORDS[emotion] || [];
  const hay = `${title} ${(summary || '')}`.toLowerCase();
  return keys.some(k => hay.includes(k.toLowerCase())) ? 0.25 : 0;
}
function shuffleWithEmotionBias(items: DemoBook[], emotion?: string) {
  // Score = random + small bias if matches emotion keywords
  return [...items]
    .map(b => ({
      b,
      s: Math.random() + scoreByEmotion(b.title, b.summary, emotion)
    }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.b);
}

// Core AI API
export const aiClient = {
  async analyzeEmotion(payload: { text: string }) {
    if (IS_DEMO) {
      return Promise.resolve({ top_emotion: 'curious', emotions: { happy: 0.2, curious: 0.6, stressed: 0.1, tired: 0.1 } });
    }
    const response = await client.post("/ai/emotion/analyze", payload);
    return response.data as { top_emotion: string; emotions: Record<string, number> };
  },
  async understand(payload: {
    text?: string;
    image_url?: string;
    context?: Record<string, unknown>;
    provider?: string;
    provider_priority?: string[];
  }) {
    if (IS_DEMO) {
      return Promise.resolve({ content: `Demo summary: ${(payload.text || '').slice(0, 80)}...`, provider: payload.provider || 'demo', tokens_used: 42 });
    }
    const response = await client.post("/ai/understand", payload);
    return response.data as { content: string; provider: string; tokens_used: number };
  },
  async generate(payload: {
    prompt: string;
    cognitive_load: number;
    cultural_context?: Record<string, unknown>;
    provider?: string;
    provider_priority?: string[];
  }) {
    if (IS_DEMO) {
      return Promise.resolve({ content: `Demo generation for: ${payload.prompt}` });
    }
    const response = await client.post("/ai/generate", payload);
    return response.data as { content: string };
  },
  async listProviders() {
    if (IS_DEMO) {
      return Promise.resolve([
        { id: 'openai', label: 'OpenAI (demo)', available: true, default_model: 'gpt-4o', supports_vision: true, supports_transcription: true },
        { id: 'gpt_oss', label: 'GPT-OSS (demo)', available: true, default_model: 'llama3.1', supports_vision: false, supports_transcription: false }
      ]);
    }
    const response = await client.get("/ai/providers");
    return response.data as Array<{
      id: string;
      label: string;
      available: boolean;
      default_model?: string | null;
      supports_vision: boolean;
      supports_transcription: boolean;
    }>;
  },
  async transcribeAudio(payload: { audio_base64: string; mime_type?: string; prompt?: string }) {
    if (IS_DEMO) {
      return Promise.resolve({ text: 'Demo transcription of voice message.' });
    }
    const response = await client.post("/ai/transcribe", payload);
    return response.data as { text: string };
  },
  async ragIngest(payload: { document_id: string; title: string; language: string; content: string }) {
    if (IS_DEMO) return Promise.resolve({ job_id: 'demo', status: 'queued' });
    const response = await client.post("/ai/rag/ingest", payload);
    return response.data as { job_id: string; status: string };
  },
  async ragQuery(payload: { query: string; language?: string; top_k?: number }) {
    if (IS_DEMO) {
      return Promise.resolve({
        answer: 'Demo answer (offline).',
        snippets: [],
        generated_at: new Date().toISOString()
      });
    }
    const response = await client.post("/ai/rag/query", payload);
    return response.data as { answer: string; snippets: Array<{ text: string; source: string; score: number }>; generated_at: string };
  }
};

export const authClient = {
  async login(payload: { email: string; password: string; captcha_token?: string }) {
    if (IS_DEMO) {
      const token = `demo.${btoa(payload.email)}.${Date.now()}`;
      try {
        localStorage.setItem('mr_jwt', token);
        localStorage.setItem('mr_email', payload.email);
      } catch {}
      return Promise.resolve({ access_token: token, token_type: 'bearer', expires_at: new Date().toISOString() } as any);
    }
    const response = await client.post("/auth/login", payload);
    return response.data;
  },
  async signup(payload: { email: string; password: string; role?: string; language_goal?: string; captcha_token?: string }) {
    if (IS_DEMO) {
      // No-op signup in demo; behave as success
      return Promise.resolve({ status: 'ok' } as any);
    }
    const response = await client.post("/auth/signup", payload);
    return response.data;
  },
  async sendVerificationEmail(email: string) {
    const response = await client.post("/auth/email/send-verification", { email });
    return response.data as { status: string };
  },
  async verifyEmailToken(token: string) {
    const response = await client.get("/auth/email/verify", { params: { token } });
    return response.data as { status: string; email: string };
  }
};

export const recommendationClient = {
  async getRecommendations(payload: { user_id: string; context_book_id?: string; emotion_state?: string; limit?: number }) {
    if (IS_DEMO) {
      const limit = payload.limit ?? 5;
      // Shuffle candidates with slight emotion bias for variety
      const shuffled = shuffleWithEmotionBias(DEMO_BOOKS, payload.emotion_state);
      const picks = shuffled.slice(0, limit).map((b, i) => ({
        content_id: b.id,
        overall_score: Math.max(0.1, 0.9 - i * 0.06 + (Math.random() * 0.06 - 0.03)),
        objective_scores: { relevance: 0.7 + scoreByEmotion(b.title, b.summary, payload.emotion_state) * 0.5, novelty: 0.6 + Math.random() * 0.1 },
        confidence: 0.72 + Math.random() * 0.1,
      }));
      return Promise.resolve({ recommendations: picks, total: picks.length });
    }
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
    if (IS_DEMO) {
      const q = (payload.q || '').toLowerCase();
      const lang = payload.language?.toLowerCase();
      
      let filtered = DEMO_BOOKS;
      
      // 語言過濾
      if (lang) {
        filtered = filtered.filter(b => b.language?.toLowerCase() === lang);
      }
      
      // 關鍵字搜尋
      if (q) {
        filtered = filtered.filter(b => 
          b.title.toLowerCase().includes(q) || 
          (b.summary || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q)
        );
      }
      
      const items = filtered.map(b => ({
        id: b.id,
        title: b.title,
        authors: b.author ? [b.author] : [],
        language: b.language || 'unknown',
        topics: [],
        summary: b.summary || '',
        source: b.library_location ? 'Library' : 'Demo',
        metadata: {
          isbn: b.isbn,
          year: b.year,
          publisher: b.publisher,
          library_location: b.library_location,
          cover_url: coverUrlFromIsbn(b.isbn) || undefined,
        }
      }));
      
      return Promise.resolve({ results: items, total: items.length });
    }
    const response = await client.get("/catalog/search", { params: payload });
    return response.data;
  },
  async importSample() {
    if (IS_DEMO) return Promise.resolve({ status: 'ok', inserted: 0 });
    const response = await client.post("/catalog/import-sample");
    return response.data as { status: string; inserted?: number; existing?: number };
  },
  async uploadContent(payload: { book_id: string; text: string; format?: string }) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok', content_id: `demo-content-${payload.book_id}` });
    const response = await client.post("/catalog/upload-content", payload);
    return response.data as { status: string; content_id?: string };
  },
  async listChapters(bookId: string) {
    if (IS_DEMO) {
      // one preview chapter per book
      return Promise.resolve({
        chapters: [
          {
            id: `demo-ch-${bookId}`,
            chapter_number: 1,
            title: 'Introduction',
            is_preview: true,
            podcast_url: undefined,
          }
        ]
      });
    }
    const response = await client.get(`/catalog/books/${bookId}/chapters`);
    return response.data as { chapters: Array<{ id: string; chapter_number: number; title: string; is_preview: boolean; podcast_url?: string | null }> };
  },
  async generateChapterPodcast(chapterId: string) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok', audio_url: DEMO_SILENCE_WAV });
    const response = await client.post(`/catalog/chapters/${chapterId}/generate-podcast`);
    return response.data as { status: string; audio_url: string };
  }
};

export const epaperClient = {
  async format(payload: { title: string; text: string; max_chars_per_card?: number }) {
    if (IS_DEMO) return Promise.resolve({ cards: [] });
    const response = await client.post("/epaper/format", payload);
    return response.data;
  },
  async publish(payload: { title: string; device_group: string; cards: Array<{ heading: string; body: string; highlights: string[]; metadata?: Record<string, unknown> }>; valid_until?: string }) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const response = await client.post("/epaper/publish", payload);
    return response.data;
  },
  async queue(deviceId: string) {
    if (IS_DEMO) return Promise.resolve({ items: [] });
    const response = await client.get("/epaper/queue", { params: { device_id: deviceId } });
    return response.data;
  }
};

// Catalog helpers (demo-friendly)
export async function catalogLookup(bookId: string) {
  if (IS_DEMO) {
    const found = DEMO_BOOKS.find(b => b.id === bookId);
    if (!found) return { id: bookId, title: bookId, authors: [], language: 'und', topics: [], summary: '', source: 'Demo', metadata: {} } as any;
    return {
      id: found.id,
      title: found.title,
      authors: found.author ? [found.author] : [],
      language: found.language || 'und',
      topics: [],
      summary: found.summary || '',
      source: found.library_location ? 'Library' : 'Demo',
      metadata: {
        isbn: found.isbn,
        year: found.year,
        publisher: found.publisher,
        library_location: found.library_location,
        cover_url: coverUrlFromIsbn(found.isbn) || undefined,
      }
    } as any;
  }
  const response = await client.get(`/catalog/lookup`, { params: { id: bookId } });
  return response.data;
}

// RAG System API
export const ragClient = {
  async ingest(payload: { content: string; metadata?: Record<string, unknown>; collection_name?: string }) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const response = await client.post("/rag/ingest", payload);
    return response.data;
  },
  async ingestCatalog() {
    // Extended endpoint to ingest sample/DB catalog into vector store or knowledge base
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const response = await client.post("/rag/ingest-catalog");
    return response.data;
  },
  async query(payload: { query: string; collection_name?: string; top_k?: number; language?: string }) {
    if (IS_DEMO) {
      // Generate contextual demo answer based on query
      const demoAnswers: Record<string, string> = {
        '原子習慣': '《原子習慣》由詹姆斯·克利爾撰寫，探討如何透過微小的改變來建立長久的好習慣。核心概念包括：1) 讓習慣顯而易見；2) 讓習慣有吸引力；3) 讓習慣簡便易行；4) 讓習慣令人滿足。',
        'AI': '人工智慧（AI）是電腦科學的一個分支，旨在創造能夠模擬人類智能的系統。包括機器學習、深度學習、自然語言處理等技術。現代 AI 在影像識別、語音辨識、推薦系統等領域有廣泛應用。',
        'quantum': 'Quantum computing leverages quantum mechanical phenomena like superposition and entanglement to perform computations. Unlike classical bits, quantum bits (qubits) can exist in multiple states simultaneously, enabling parallel processing of information.',
        '小説': '小説は物語を文学的に表現する形式です。登場人物の心理描写、プロット構成、文体などが重要な要素となります。読者に感動や思索を促す芸術形式として発展してきました。'
      };
      
      const query = payload.query.toLowerCase();
      let answer = demoAnswers['AI']; // default
      
      for (const [key, value] of Object.entries(demoAnswers)) {
        if (query.includes(key.toLowerCase())) {
          answer = value;
          break;
        }
      }
      
      // If no match, generate a generic contextual response (offline/local mode wording)
      if (!Object.keys(demoAnswers).some(k => query.includes(k.toLowerCase()))) {
        answer = `關於「${payload.query}」的資訊：這是離線模式下的回應。上線後，系統會從您的書庫檢索內容並生成更精確的答案。`;
      }
      
      return Promise.resolve({
        answer,
        snippets: [
          { text: '試用模式片段示例', source: DEMO_BOOKS[0]?.title || '示例書籍', score: 0.85 },
          { text: '相關內容片段', source: DEMO_BOOKS[1]?.title || '參考資料', score: 0.72 }
        ]
      });
    }
    const response = await client.post("/rag/query", payload);
    return response.data;
  },
  async search(payload: { query: string; collection_name?: string; top_k?: number }) {
    if (IS_DEMO) return Promise.resolve({ results: [] });
    const response = await client.post("/rag/search", payload);
    return response.data;
  },
  async stats(collectionName?: string) {
    if (IS_DEMO) return Promise.resolve({ total: 0 });
    const response = await client.get("/rag/stats", { params: { collection_name: collectionName } });
    return response.data;
  }
};

// Recommender System API (Advanced Multi-objective)
export const advancedRecommenderClient = {
  async recommend(payload: {
    user_id: string;
    user_context: Record<string, unknown>;
    candidate_ids: string[];
    top_k?: number;
  }) {
    if (IS_DEMO) {
      const k = payload.top_k ?? 5;
      const emotion = (payload.user_context?.['emotion'] as string | undefined) || 'neutral';
      // Respect candidate_ids to avoid cross-language leakage
      const candidateSet = new Set(payload.candidate_ids || []);
      const pool = DEMO_BOOKS.filter(b => candidateSet.has(b.id));
      const base = pool.length > 0 ? pool : DEMO_BOOKS;
      const shuffled = shuffleWithEmotionBias(base, emotion);
      const picks = shuffled.slice(0, Math.min(k, shuffled.length)).map((b, i) => ({
        content_id: b.id,
        overall_score: Math.max(0.1, 0.95 - i * 0.06 + (Math.random() * 0.05 - 0.02)),
        objective_scores: { relevance: 0.7 + scoreByEmotion(b.title, b.summary, emotion) * 0.6, novelty: 0.55 + Math.random() * 0.2 },
        explanation: { reason: 'demo', emotion, bias: scoreByEmotion(b.title, b.summary, emotion) > 0 ? 'emotion-match' : 'random' },
        confidence: 0.7 + Math.random() * 0.15,
      }));
      return Promise.resolve({ recommendations: picks, total: picks.length });
    }
    const response = await client.post("/recommend/advanced", payload);
    return response.data as {
      recommendations: Array<{
        content_id: string;
        overall_score: number;
        objective_scores: Record<string, number>;
        explanation?: Record<string, unknown>;
        confidence: number;
      }>;
      total: number;
    };
  },
  async counterfactual(payload: { content_id: string; user_id: string; user_context: Record<string, unknown> }) {
    const response = await client.post("/recommend/counterfactual", payload);
    return response.data as {
      content_id: string;
      current_score: number;
      weak_objectives: Record<string, number>;
      suggestions: string[];
      potential_score_improvement: number;
    };
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
    if (IS_DEMO) {
      // Generate realistic cognitive load based on input metrics
      const speed = payload.reading_speed || 180;
      const errorRate = payload.error_rate || 0.05;
      const pauseFreq = payload.pause_frequency || 3.0;
      
      // Simple heuristic: higher error and pause = higher load; lower speed = higher load
      const speedFactor = Math.max(0, (250 - speed) / 250); // slower = higher load
      const errorFactor = errorRate * 2; // directly maps error to load
      const pauseFactor = Math.min(pauseFreq / 10, 1); // more pauses = higher load
      
      const cognitiveLoad = Math.min(
        (speedFactor * 0.4 + errorFactor * 0.3 + pauseFactor * 0.3),
        1.0
      );
      
      let state = 'optimal';
      let recommendations = ['保持當前學習節奏'];
      
      if (cognitiveLoad < 0.4) {
        state = 'underload';
        recommendations = ['增加內容複雜度', '引入挑戰性問題', '減少提示與支架'];
      } else if (cognitiveLoad > 0.7) {
        state = 'overload';
        recommendations = ['簡化內容呈現', '增加視覺輔助', '分段學習', '提供更多範例'];
      }
      
      return Promise.resolve({
        cognitive_load: parseFloat(cognitiveLoad.toFixed(2)),
        state,
        recommendations,
        timestamp: new Date().toISOString()
      });
    }
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
    if (IS_DEMO) return Promise.resolve({ text: '(demo transcript)' });
    // Backend expects field name 'audio' at /audio/stt
    if (!formData.has('audio') && formData.has('file')) {
      const f = formData.get('file') as Blob | File | null;
      if (f) {
        formData.delete('file');
        formData.append('audio', f, (f as any).name || 'audio.webm');
      }
    }
    const response = await client.post("/audio/stt", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  async synthesize(payload: { text: string; language?: string; voice?: string }) {
    if (IS_DEMO) return Promise.resolve({ job_id: 'demo', audio_url: DEMO_SILENCE_WAV, estimated_duration: 1 });
    // Backend returns JSON with audio_url at /audio/tts (mock). We return it as-is.
    const response = await client.post("/audio/tts", payload);
    return response.data as { job_id: string; audio_url: string; estimated_duration: number };
  }
};

// Purchase & Unlock API
export const purchaseClient = {
  async create(payload: { user_id: string; book_id: string; amount: number; currency?: string }) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok', unlock_code: 'DEMO-UNLOCK' });
    const response = await client.post("/purchase", payload);
    return response.data as { status: string; unlock_code?: string };
  },
  async unlock(book_id: string, code: string, user_id?: string) {
    if (IS_DEMO) {
      let expected = 'DEMO-UNLOCK';
      try {
        const saved = localStorage.getItem('mr_unlock_code');
        if (saved) expected = saved;
      } catch {}
      const ok = (code || '').trim().toUpperCase() === expected.toUpperCase();
      return Promise.resolve({ status: ok ? 'ok' : 'invalid', book_id, unlocked: ok });
    }
    const response = await client.get("/unlock", { params: { book_id, code, user_id } });
    return response.data as { status: string; book_id?: string; unlocked: boolean };
  }
};

// User Settings API
export const userClient = {
  async getSettings(token?: string) {
    if (IS_DEMO) return Promise.resolve({ autoplay_tts: true });
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
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const auth = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('mr_jwt') || '' : '');
    const response = await client.put('/users/me/settings', payload, {
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });
    return response.data;
  },
  async getProfile(token?: string) {
    if (IS_DEMO) return Promise.resolve({ id: 'demo-user', email: 'demo@example.com', role: 'user', created_at: new Date().toISOString() });
    const auth = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('mr_jwt') || '' : '');
    const response = await client.get('/users/me', {
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });
    return response.data as {
      id: string;
      email: string;
      username?: string | null;
      avatar_url?: string | null;
      role: string;
      language_goal?: string | null;
      created_at: string;
    };
  },
  async updateProfile(payload: Partial<{
    username: string | null;
    avatar_url: string | null;
    language_goal: string | null;
  }>, token?: string) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const auth = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('mr_jwt') || '' : '');
    const response = await client.put('/users/me', payload, {
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    });
    return response.data;
  }
};

// Indigenous Language API (Handwriting + Pronunciation Training)
export const indigenousClient = {
  async recognizeHandwriting(formData: FormData) {
    if (IS_DEMO) {
      // Return a realistic demo payload matching RecognitionResult shape
      return Promise.resolve({
        recognized_text: "Nga'ay ho",
        romanized_text: "Nga'ay ho",
        confidence: 0.92,
        alternative_readings: [
          { text: "Nga'ay ho", confidence: 0.92 },
          { text: "Ngahay ho", confidence: 0.81 }
        ],
        processing_time_ms: 123
      });
    }
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
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const response = await client.post("/indigenous/pronunciation/train", payload);
    return response.data;
  },
  async assessPronunciation(formData: FormData) {
    if (IS_DEMO) {
      // Return a realistic demo payload matching PronunciationResult shape
      return Promise.resolve({
        overall_score: 0.83,
        fluency: 0.8,
        pronunciation: 0.85,
        completeness: 0.86,
        phoneme_scores: [
          { phoneme: "nga", score: 0.9, feedback: "Good nasal onset" },
          { phoneme: "'ay", score: 0.78, feedback: "Mind the glottal stop before the diphthong" },
          { phoneme: "ho", score: 0.82, feedback: "Sustain the vowel a bit longer" }
        ],
        suggestions: [
          "Slow down slightly to improve clarity",
          "Practice the rising tone on the final syllable"
        ]
      });
    }
    const response = await client.post("/indigenous/pronunciation/assess", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  async getLanguageInfo(languageCode: string) {
    if (IS_DEMO) return Promise.resolve({ code: languageCode, name: 'Demo', region: 'Offline' });
    const response = await client.get(`/indigenous/language/${languageCode}/info`);
    return response.data;
  },
  async listLanguages() {
    if (IS_DEMO) {
      // Provide a broader demo list to align with IndigenousLanguagePage expectations
      const taiwan: Array<{ code: string; name: string }> = [
        { code: 'ami', name: 'Amis' },
        { code: 'pwn', name: 'Paiwan' },
        { code: 'trv', name: 'Seediq/Truku' },
        { code: 'tay', name: 'Atayal' },
        { code: 'bnn', name: 'Bunun' },
        { code: 'pyu', name: 'Puyuma' },
        { code: 'dru', name: 'Rukai' },
        { code: 'tsu', name: 'Tsou' },
        { code: 'xsy', name: 'Saisiyat' },
        { code: 'tao', name: 'Tao (Yami)' },
        { code: 'ssf', name: 'Thao' },
        { code: 'ckv', name: 'Kavalan' },
        { code: 'szy', name: 'Sakizaya' }
      ];
      const extras: Array<{ code: string; name: string }> = [
        { code: 'mi', name: 'Maori (Māori)' },
        { code: 'haw', name: 'Hawaiian (ʻŌlelo Hawaiʻi)' },
        { code: 'nv', name: 'Navajo (Diné bizaad)' },
        { code: 'qu', name: 'Quechua (Runa Simi)' },
        { code: 'gn', name: "Guarani (Avañe'ẽ)" },
        { code: 'ay', name: 'Aymara' },
        { code: 'iu', name: 'Inuktitut (ᐃᓄᒃᑎᑐᑦ)' },
        { code: 'se', name: 'Northern Sami (Davvisámegiella)' },
        { code: 'sw', name: 'Swahili (Kiswahili)' },
        { code: 'zu', name: 'Zulu (isiZulu)' },
        { code: 'eu', name: 'Basque (Euskara)' },
        { code: 'cy', name: 'Welsh (Cymraeg)' },
        { code: 'hmn', name: 'Hmong (Hmoob)' },
        { code: 'bo', name: 'Tibetan (བོད་སྐད་)' },
        { code: 'ug', name: 'Uyghur (ئۇيغۇرچە)' },
        // Add widely learned global languages for pronunciation practice
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish (Español)' },
        { code: 'fr', name: 'French (Français)' },
        { code: 'de', name: 'German (Deutsch)' },
        { code: 'ja', name: 'Japanese (日本語)' },
        { code: 'ko', name: 'Korean (한국어)' }
      ];
      return Promise.resolve([...taiwan, ...extras]);
    }
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
    if (IS_DEMO) return Promise.resolve({ status: 'ok', language: { code: payload.code, name: payload.name } });
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
    image_base64?: string;
    image_mime_type?: string;
    audio_base64?: string;
    audio_mime_type?: string;
    provider?: string;
  }) {
    if (IS_DEMO) {
      const now = new Date().toISOString();
      // Return a payload matching IndigenousChatbotPage expectations
      const media_context: Record<string, string> = {};
      if (payload.image_base64) {
        media_context.image_summary = 'Demo image insight: 一個代表文化的場景。';
      }
      if (payload.audio_base64) {
        media_context.audio_transcript = payload.message || 'Demo voice message';
      }
      if (payload.provider) {
        media_context.preferred_provider = payload.provider;
      }
      return Promise.resolve({
        message: `[demo ${payload.language_code}] ${payload.message}`,
        translation: payload.include_translation ? `${payload.message} (translated)` : undefined,
        pronunciation_guide: payload.include_pronunciation ? "Nga'ay ho (IPA: ŋaʔaj ho)" : undefined,
        cultural_context: payload.include_cultural_notes ? "Common greeting in several Austronesian languages." : undefined,
        related_phrases: ["Good morning", "Thank you"],
        timestamp: now,
        session_id: 'demo-session-1',
        media_context,
      });
    }
    const response = await client.post("/indigenous-chat/chat", payload);
    return response.data;
  },
  async listLanguages() {
    if (IS_DEMO) {
      // Provide enriched language metadata aligned with IndigenousLanguagePage demo
      const languages = [
        { code: 'ami', name: 'Amis', nativeName: 'Amis', region: 'Taiwan', speakers: 138000, endangerment: 'vulnerable' },
        { code: 'pwn', name: 'Paiwan', nativeName: 'Paiwan', region: 'Taiwan', speakers: 66000, endangerment: 'vulnerable' },
        { code: 'trv', name: 'Seediq/Truku', nativeName: 'Truku', region: 'Taiwan', speakers: 20000, endangerment: 'endangered' },
        { code: 'tay', name: 'Atayal', nativeName: 'Atayal', region: 'Taiwan', speakers: 85000, endangerment: 'vulnerable' },
        { code: 'bnn', name: 'Bunun', nativeName: 'Bunun', region: 'Taiwan', speakers: 55000, endangerment: 'vulnerable' },
        { code: 'pyu', name: 'Puyuma', nativeName: 'Puyuma', region: 'Taiwan', speakers: 10000, endangerment: 'endangered' },
        { code: 'dru', name: 'Rukai', nativeName: 'Rukai', region: 'Taiwan', speakers: 13000, endangerment: 'endangered' },
        { code: 'tsu', name: 'Tsou', nativeName: 'Tsou', region: 'Taiwan', speakers: 6000, endangerment: 'endangered' },
        { code: 'xsy', name: 'Saisiyat', nativeName: 'Saisiyat', region: 'Taiwan', speakers: 3000, endangerment: 'critically endangered' },
        { code: 'tao', name: 'Tao (Yami)', nativeName: 'Tao', region: 'Orchid Island, Taiwan', speakers: 4000, endangerment: 'endangered' },
        { code: 'ssf', name: 'Thao', nativeName: 'Thao', region: 'Taiwan', speakers: 500, endangerment: 'critically endangered' },
        { code: 'ckv', name: 'Kavalan', nativeName: 'Kavalan', region: 'Taiwan', speakers: 200, endangerment: 'critically endangered' },
        { code: 'szy', name: 'Sakizaya', nativeName: 'Sakizaya', region: 'Taiwan', speakers: 5000, endangerment: 'endangered' },
        // Global set
        { code: 'mi', name: 'Maori (Māori)', nativeName: 'Māori', region: 'New Zealand', speakers: 185000, endangerment: 'vulnerable' },
        { code: 'haw', name: 'Hawaiian (ʻŌlelo Hawaiʻi)', nativeName: 'ʻŌlelo Hawaiʻi', region: 'Hawaii, USA', speakers: 24000, endangerment: 'endangered' },
        { code: 'nv', name: 'Navajo (Diné bizaad)', nativeName: 'Diné bizaad', region: 'USA', speakers: 170000, endangerment: 'vulnerable' },
        { code: 'qu', name: 'Quechua (Runa Simi)', nativeName: 'Runa Simi', region: 'Peru/Bolivia/Ecuador', speakers: 8000000, endangerment: 'vulnerable' },
        { code: 'gn', name: "Guarani (Avañe'ẽ)", nativeName: "Avañe'ẽ", region: 'Paraguay', speakers: 4600000, endangerment: 'safe' },
        { code: 'ay', name: 'Aymara', nativeName: 'Aymara', region: 'Bolivia/Peru/Chile', speakers: 1700000, endangerment: 'vulnerable' },
        { code: 'iu', name: 'Inuktitut (ᐃᓄᒃᑎᑐᑦ)', nativeName: 'ᐃᓄᒃᑎᑐᑦ', region: 'Canada', speakers: 40000, endangerment: 'vulnerable' },
        { code: 'se', name: 'Northern Sami (Davvisámegiella)', nativeName: 'Davvisámegiella', region: 'Norway/Sweden/Finland', speakers: 20000, endangerment: 'vulnerable' },
        { code: 'sw', name: 'Swahili (Kiswahili)', nativeName: 'Kiswahili', region: 'East Africa', speakers: 160000000, endangerment: 'safe' },
        { code: 'zu', name: 'Zulu (isiZulu)', nativeName: 'isiZulu', region: 'South Africa', speakers: 12000000, endangerment: 'safe' },
        { code: 'eu', name: 'Basque (Euskara)', nativeName: 'Euskara', region: 'Spain/France', speakers: 750000, endangerment: 'vulnerable' },
        { code: 'cy', name: 'Welsh (Cymraeg)', nativeName: 'Cymraeg', region: 'Wales, UK', speakers: 562000, endangerment: 'vulnerable' },
        { code: 'hmn', name: 'Hmong (Hmoob)', nativeName: 'Hmoob', region: 'China/SEA/USA', speakers: 3000000, endangerment: 'vulnerable' },
        { code: 'bo', name: 'Tibetan (བོད་སྐད་)', nativeName: 'བོད་སྐད་', region: 'Tibet/China/India/Nepal', speakers: 1200000, endangerment: 'vulnerable' },
        { code: 'ug', name: 'Uyghur (ئۇيغۇرچە)', nativeName: 'ئۇيغۇرچە', region: 'China', speakers: 10000000, endangerment: 'vulnerable' }
      ];
      return Promise.resolve({ languages });
    }
    const response = await client.get("/indigenous-chat/languages");
    return response.data;
  },
  async getLanguageDetails(languageCode: string) {
    if (IS_DEMO) return Promise.resolve({ code: languageCode, details: 'Demo details' });
    const response = await client.get(`/indigenous-chat/languages/${languageCode}`);
    return response.data;
  },
  async getStatistics() {
    if (IS_DEMO) {
      // Rough statistics for demo UI
      return Promise.resolve({ total_languages: 28, total_speakers: 200_000_000, sessions: 1 });
    }
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
    if (IS_DEMO) return Promise.resolve({ job_id: 'demo', status: 'queued' });
    const response = await client.post("/indigenous-chat/fine-tune/start", payload);
    return response.data;
  },
  async getFineTuningStatus(jobId: string) {
    if (IS_DEMO) return Promise.resolve({ job_id: jobId, status: 'running' });
    const response = await client.get(`/indigenous-chat/fine-tune/status/${jobId}`);
    return response.data;
  },
  async contributeTrainingData(formData: FormData) {
    if (IS_DEMO) return Promise.resolve({ status: 'ok' });
    const response = await client.post("/indigenous-chat/training-data/contribute", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  }
};

const DEMO_PROTOTYPE_OVERVIEW: PrototypeOverview = {
  hero: {
    headline: "ModernReader",
    subheading: "柔性電子紙 × AI 族語守護 × 多模態觸覺",
    promise: "把台灣 16 族語、Podcast、自訂觸覺與 hyRead DRM 集成於同一個平台。",
    location: "南臺科技大學 · 台南 · 2025 Q4",
    hero_stats: [
      { label: "16", value: "原民語", context: "語料 + Podcast" },
      { label: "134 週", value: "研發期", context: "Sweet 四階段" },
      { label: "59%", value: "硬體投入", context: "E Ink + 觸覺模組" }
    ]
  },
  features: [
    { id: "flex-paper", title: "柔性電子紙控制塔", summary: "25.3\" E Ink Spectra 6，支援 3D 形變與觸覺筆觸。", icon: "📖", pillar: "See / Experience", metric_label: "解析度", metric_value: "300 PPI" },
    { id: "podcast-engine", title: "Podcast 自動生成", summary: "8 聲線 × 200 語言，一鍵把章節轉成 Podcast。", icon: "🎙️", pillar: "Enjoy", metric_label: "產出速度", metric_value: "10 萬字 / 10 分" },
    { id: "drm", title: "hyRead 級 DRM", summary: "帳密＋生物辨識＋裝置綁定＋浮水印＋離線授權。", icon: "🛡️", pillar: "Rights", metric_label: "保護層級", metric_value: "4 層" },
    { id: "ai-companion", title: "可變人格 AI 伴侶", summary: "族語導師、文化講者、科技助理等人格一鍵切換。", icon: "🤖", pillar: "Watch / Experience", metric_label: "人格模式", metric_value: "10+" },
    { id: "indigenous-suite", title: "族語守護工具鏈", summary: "手寫、發音、語料審查一次整合。", icon: "🏔️", pillar: "Culture", metric_label: "語料", metric_value: "10k 句/族" },
    { id: "device-cloud", title: "裝置雲 × 觸覺管線", summary: "Ultraleap / Tanvas / HaptX / bHaptics API 管理。", icon: "🌐", pillar: "Infra", metric_label: "觸覺節點", metric_value: "190+" }
  ],
  flows: [
    {
      id: "sweet",
      title: "Sweet 流程",
      bullets: ["See：彩色電子紙展示族語圖騰", "Watch：手勢 + 語音命令", "Experience：溫度/振動/紋理", "Enjoy：遊戲化 + Podcast", "Tell：社群分享 + QR"],
      highlight: "五階段流程成為 HCI 教學範式"
    },
    {
      id: "podcast",
      title: "Auto Podcast",
      bullets: ["NLLB-200 多語翻譯", "GPT-4 情緒標註 → TTS-1-HD", "背景音樂智慧混音", "MP3 + DRM"],
      highlight: "10 萬字內容 < 10 分鐘"
    },
    {
      id: "drm-flow",
      title: "DRM 金字塔",
      bullets: ["帳密 + CAPTCHA + 借閱證", "Face/Touch ID、聲紋、Windows Hello", "最多 3 台裝置 + 異地警示", "AES-256 + 浮水印 + 借閱到期"],
      highlight: "與 hyRead / 博客來 / UDN 等合作"
    },
    {
      id: "ai-companion-flow",
      title: "AI 伴侶",
      bullets: ["人格自動切換", "情境觸發 + 觸覺同步", "LLM + Whisper + TTS", "文化審查流程"],
      highlight: "情境觸覺 + 語音守護"
    }
  ],
  preview_modes: [
    { id: "device", title: "柔性電子紙預覽", caption: "折疊式顯示器展示部落繪本與寫作共編。", illustration: "flex-epaper", actions: ["套用族語主題", "推送裝置群組", "啟用觸覺波形"] },
    { id: "podcast", title: "Podcast 合成機", caption: "挑選耆老、親子、冒險等 8 種聲線與配樂。", illustration: "podcast", actions: ["選擇章節", "調整語速", "下載 MP3"] },
    { id: "drm", title: "DRM 指揮室", caption: "即時看到授權狀態、異地登入、浮水印追蹤。", illustration: "drm", actions: ["核准新裝置", "查詢水印", "匯出審計紀錄"] },
    { id: "ai", title: "AI 伴侶面板", caption: "切換人格、查看情緒遙測與觸覺腳本。", illustration: "ai", actions: ["切換人格", "推播觸覺劇本", "產出練習任務"] }
  ],
  timeline: [
    { phase: "Phase 1 · 基礎技術", weeks: "1-26 週", focus: ["語料庫", "DRM 架構", "觸覺模組 Beta"], outcome: "完成軟硬體原型" },
    { phase: "Phase 2 · 核心整合", weeks: "27-61 週", focus: ["3D 變形顯示", "AI Chatbot + Podcast", "DRM 正式上線"], outcome: "Sweet 流程 + AI 伴侶整合" },
    { phase: "Phase 3 · 場域驗證", weeks: "62-96 週", focus: ["部落教室", "圖書館/視障", "技術標準"], outcome: "Alpha → Beta" },
    { phase: "Phase 4 · 產業化", weeks: "97-134 週", focus: ["量產規劃", "技轉合作", "國際推廣"], outcome: "正式產品 + 生產線" }
  ],
  tech_stack: [
    { layer: "顯示/觸覺", tools: ["E Ink Spectra 6", "友達 TFT", "Ultraleap", "Tanvas", "HaptX", "bHaptics"] },
    { layer: "AI 語言/語音", tools: ["OpenAI GPT-4/TTS/Whisper", "Meta NLLB-200", "NVIDIA / 聯發科 AI", "科大訊飛", "雅婷逐字稿"] },
    { layer: "DRM / 內容", tools: ["hyRead", "博客來 / UDN / Readmoo / Pubu", "Kobo / Google Play / Springer", "AES-256 + 水印 + 借閱到期"] },
    { layer: "場域 / 文化", tools: ["南臺科大 / 國圖 / 台大成大聯盟", "中研院語言所 / ALCD", "MI2S 實驗室 / 部落耆老"] }
  ],
  call_to_action: {
    headline: "一起把 ModernReader 推向教育與文化現場",
    subtitle: "開放徵求：AI / HCI / 族語、內容、硬體、無障礙、營運夥伴。",
    contact_email: "hello@modernreader.com",
    discord: "https://discord.gg/modernreader",
    deck_url: "https://modernreader.com/deck"
  }
};

export const prototypeClient = {
  async getOverview(): Promise<PrototypeOverview> {
    if (IS_DEMO) return Promise.resolve(DEMO_PROTOTYPE_OVERVIEW);
    const response = await client.get("/prototype/overview");
    return response.data as PrototypeOverview;
  },
  async submitInterest(payload: PrototypeInterestPayload): Promise<PrototypeInterestResponse> {
    if (IS_DEMO) {
      return Promise.resolve({
        ...payload,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    const response = await client.post("/prototype/interests", payload);
    return response.data as PrototypeInterestResponse;
  }
};

/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SD_URL?: string;        // e.g., http://localhost:7860/sdapi
  readonly VITE_TTS_API_URL?: string;   // e.g., http://localhost:5002/api
  readonly VITE_STT_API_URL?: string;   // e.g., http://localhost:5003/api
  // 其他 VITE_ 開頭的環境變數可在此擴充
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

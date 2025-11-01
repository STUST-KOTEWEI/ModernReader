export const translations = {
  en: {
    // Navigation
    home: "Home",
    catalog: "Catalog",
    reader: "Reader",
    recommendations: "Recommendations",
    aiAssistant: "AI Assistant",
    dashboard: "Dashboard",
    
    // Auth
    login: "Login",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    logout: "Logout",
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    
    // RAG System
    askQuestion: "Ask a question",
    searchKnowledge: "Search Knowledge Base",
    queryPlaceholder: "What would you like to know?",
    ragAnswer: "Answer",
    
    // Recommender
    recommendedForYou: "Recommended for You",
    viewDetails: "View Details",
    confidence: "Confidence",
    
    // Cognitive
    cognitiveLoad: "Cognitive Load",
    optimalLoad: "Optimal",
    overload: "Overload",
    underload: "Underload",
    
    // Audio
    recordAudio: "Record Audio",
    uploadAudio: "Upload Audio",
    textToSpeech: "Text to Speech",
    playAudio: "Play Audio"
  },
  
  zh: {
    // 導航
    home: "首頁",
    catalog: "書籍目錄",
    reader: "閱讀器",
    recommendations: "推薦內容",
    aiAssistant: "AI 助理",
    dashboard: "儀表板",
    
    // 認證
    login: "登入",
    signup: "註冊",
    email: "電子郵件",
    password: "密碼",
    logout: "登出",
    welcomeBack: "歡迎回來",
    createAccount: "建立帳號",
    alreadyHaveAccount: "已有帳號？",
    dontHaveAccount: "還沒有帳號？",
    
    // 通用
    loading: "載入中...",
    error: "錯誤",
    success: "成功",
    submit: "提交",
    cancel: "取消",
    save: "儲存",
    delete: "刪除",
    
    // RAG 系統
    askQuestion: "提出問題",
    searchKnowledge: "搜尋知識庫",
    queryPlaceholder: "您想了解什麼？",
    ragAnswer: "答案",
    
    // 推薦系統
    recommendedForYou: "為您推薦",
    viewDetails: "查看詳情",
    confidence: "信心度",
    
    // 認知優化
    cognitiveLoad: "認知負荷",
    optimalLoad: "最佳",
    overload: "超載",
    underload: "不足",
    
    // 音訊
    recordAudio: "錄音",
    uploadAudio: "上傳音訊",
    textToSpeech: "文字轉語音",
    playAudio: "播放音訊"
  },
  
  ja: {
    // ナビゲーション
    home: "ホーム",
    catalog: "カタログ",
    reader: "リーダー",
    recommendations: "おすすめ",
    aiAssistant: "AIアシスタント",
    dashboard: "ダッシュボード",
    
    // 認証
    login: "ログイン",
    signup: "新規登録",
    email: "メールアドレス",
    password: "パスワード",
    logout: "ログアウト",
    welcomeBack: "お帰りなさい",
    createAccount: "アカウント作成",
    alreadyHaveAccount: "アカウントをお持ちですか？",
    dontHaveAccount: "アカウントをお持ちでないですか？",
    
    // 共通
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
    submit: "送信",
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    
    // RAGシステム
    askQuestion: "質問する",
    searchKnowledge: "知識ベース検索",
    queryPlaceholder: "何を知りたいですか？",
    ragAnswer: "回答",
    
    // レコメンダー
    recommendedForYou: "あなたへのおすすめ",
    viewDetails: "詳細を見る",
    confidence: "信頼度",
    
    // 認知最適化
    cognitiveLoad: "認知負荷",
    optimalLoad: "最適",
    overload: "過負荷",
    underload: "不足",
    
    // オーディオ
    recordAudio: "録音",
    uploadAudio: "音声アップロード",
    textToSpeech: "テキスト読み上げ",
    playAudio: "再生"
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';
import { useSessionStore } from '../state/session';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();
  const { token, user, clear } = useSessionStore();
  const [q, setQ] = useState('');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const features = [
    { title: t('aiAssistant'), desc: 'RAG Q&A + Cognitive Load Assessment', path: '/app/ai-demo', icon: '🤖' },
    { title: t('recommendations'), desc: 'Multi-objective smart recommendations', path: '/app/recommendations', icon: '📚' },
    { title: 'Audio (STT/TTS)', desc: 'Speech recognition and synthesis', path: '/app/audio', icon: '🎧' },
    { title: t('catalog'), desc: 'Browse book catalog', path: '/app/catalog', icon: '📖' },
    { title: 'E-Paper', desc: 'Format and publish to e-ink devices', path: '/app/epaper', icon: '📰' },
    { title: 'Podcast', desc: 'Generate and play episodes with TTS', path: '/app/podcast', icon: '🎙️' }
  ];

  // Auto-advance demo steps
  useEffect(() => {
    if (!token) {
      const timer = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 3);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [token]);

  // Show signup modal after 8 seconds
  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => setShowSignupModal(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Language Switcher (only show on public view) */}
      {!token && (
        <div className="absolute top-4 right-4 z-10">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            aria-label="Language"
            className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 border shadow-sm hover:shadow transition"
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        {!token ? (
          <div>
            {/* Hero Title */}
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient">
                ModernReader
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                {language === 'zh' ? '探索智能閱讀的未來 - AI 驅動的多模態學習平台' : language === 'ja' ? 'インテリジェント読書の未来を探る - AI駆動のマルチモーダル学習プラットフォーム' : 'Explore the Future of Intelligent Reading - AI-Powered Multimodal Learning Platform'}
              </p>
            </div>

            {/* Interactive Demo Carousel */}
            <div className="max-w-5xl mx-auto mb-16">
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden demo-carousel">
                {/* Demo Step 1: AI Assistant */}
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    demoStep === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'
                  }`}
                >
                  <div className="p-12 flex flex-col items-center justify-center h-full">
                    <div className="text-6xl mb-6">🤖</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                      {language === 'zh' ? 'AI 閱讀助理' : language === 'ja' ? 'AI読書アシスタント' : 'AI Reading Assistant'}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mb-8">
                      {language === 'zh' ? '針對任何書籍提問，即時獲得 RAG 技術支持的答案。我們的 AI 追蹤您的認知負荷以優化學習效果。' : language === 'ja' ? '任意の書籍について質問し、RAG技術によるインスタント回答を得る。AIが認知負荷を追跡して学習を最適化。' : 'Ask questions about any book, get instant answers with RAG technology. Our AI tracks your cognitive load to optimize learning.'}
                    </p>
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-2xl p-6 w-full max-w-2xl">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
                        "{language === 'zh' ? '《1984》的主要主題是什麼？' : language === 'ja' ? '『1984年』の主なテーマは何ですか？' : 'What is the main theme of 1984?'}"
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {language === 'zh' ? '→ AI 分析 15 章內容並回應：「核心主題探討極權主義和監控國家機制...」' : language === 'ja' ? '→ AIが15章を分析して回答：「中心的テーマは全体主義と監視国家メカニズムを探求...」' : '→ AI analyzes context from 15 chapters and responds: "The central theme explores totalitarianism and surveillance state mechanisms..."'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Step 2: Smart Recommendations */}
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    demoStep === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                  }`}
                >
                  <div className="p-12 flex flex-col items-center justify-center h-full">
                    <div className="text-6xl mb-6">📚</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                      {language === 'zh' ? '個性化書籍推薦' : language === 'ja' ? 'パーソナライズされた書籍推薦' : 'Personalized Book Recommendations'}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mb-8">
                      {language === 'zh' ? '多目標 AI 演算法分析您的閱讀歷史、文化偏好和學習目標，推薦完美的下一本書。' : language === 'ja' ? '多目的AIアルゴリズムが読書履歴、文化的嗜好、学習目標を分析し、完璧な次の本を提案。' : 'Multi-objective AI algorithms analyze your reading history, cultural preferences, and learning goals to suggest the perfect next book.'}
                    </p>
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                      {[language === 'zh' ? '科幻' : language === 'ja' ? 'SF' : 'Science Fiction', language === 'zh' ? '哲學' : language === 'ja' ? '哲学' : 'Philosophy', language === 'zh' ? '歷史' : language === 'ja' ? '歴史' : 'History'].map((genre, i) => (
                        <div
                          key={genre}
                          className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-xl p-4 text-center transform hover:scale-105 transition cursor-pointer"
                          onClick={() => setShowSignupModal(true)}
                        >
                          <div className="text-3xl mb-2">📖</div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{genre}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {95 - i * 3}% {language === 'zh' ? '匹配' : language === 'ja' ? 'マッチ' : 'match'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Demo Step 3: Multi-Sensory Reading */}
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    demoStep === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                  }`}
                >
                  <div className="p-12 flex flex-col items-center justify-center h-full">
                    <div className="text-6xl mb-6">🎧</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                      {language === 'zh' ? '多感官閱讀體驗' : language === 'ja' ? 'マルチ感覚読書体験' : 'Multi-Sensory Experience'}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-2xl mb-8">
                      {language === 'zh' ? '高品質 TTS 聆聽、電子墨水螢幕顯示、從任何文字生成 Podcast。為現代世界重新定義閱讀。' : language === 'ja' ? '高品質TTSで聴く、電子ペーパーで見る、任意のテキストからポッドキャストを生成。現代世界のための読書再定義。' : 'Listen with high-quality TTS, view on e-ink devices, generate podcasts from any text. Reading reimagined for the modern world.'}
                    </p>
                    <div className="flex gap-6 items-center justify-center flex-wrap">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔊</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{language === 'zh' ? '神經 TTS' : language === 'ja' ? 'ニューラルTTS' : 'Neural TTS'}</p>
                      </div>
                      <div className="text-4xl text-gray-400">→</div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">📰</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{language === 'zh' ? '電子紙' : language === 'ja' ? '電子ペーパー' : 'E-Paper'}</p>
                      </div>
                      <div className="text-4xl text-gray-400">→</div>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎙️</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Podcast</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Step Indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => setDemoStep(i)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        demoStep === i
                          ? 'bg-indigo-600 w-8'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to demo step ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
              {features.map((f, i) => (
                <Card
                  key={f.title}
                  className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer bg-white dark:bg-gray-800"
                  onClick={() => setShowSignupModal(true)}
                >
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {f.desc}
                  </p>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    {language === 'zh' ? '探索更多 →' : language === 'ja' ? 'もっと見る →' : 'Explore →'}
                  </span>
                </Card>
              ))}
            </div>

            {/* Tech Stack */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {language === 'zh' ? '強大的技術棧' : language === 'ja' ? '強力な技術スタック' : 'Powered by Modern Tech'}
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {['React', 'TypeScript', 'FastAPI', 'RAG', 'LLM', 'Cognitive AI', 'Vector DB', 'TTS/STT'].map((tech) => (
                  <span key={tech} className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            {/* Top-right user/Logout（語言切換已隱藏，避免重疊） */}
            <div className="absolute top-4 left-4 text-sm text-gray-600 dark:text-gray-300">{user?.email}</div>
            <div className="absolute top-4 right-4">
              <Button variant="secondary" onClick={() => { clear(); navigate('/'); }}>{t('logout')}</Button>
            </div>

            <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">ModernReader</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {language === 'zh' ? '搜尋目錄或詢問 AI 助理' : language === 'ja' ? 'カタログ検索またはAIに質問' : 'Search catalog or ask the AI assistant'}
            </p>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full shadow p-2">
              <input
                className="flex-1 px-4 py-2 bg-transparent outline-none"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={language === 'zh' ? '輸入關鍵字或問題...' : language === 'ja' ? 'キーワードや質問を入力...' : 'Type a keyword or question...'}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/app/catalog?q=${encodeURIComponent(q)}`); }}
              />
              <Button onClick={() => navigate(`/app/catalog?q=${encodeURIComponent(q)}`)}>{t('search')}</Button>
              <Button variant="secondary" onClick={() => navigate(`/app/ai-demo?q=${encodeURIComponent(q)}`)}>{t('aiAssistant')}</Button>
            </div>

            {/* Quick links */}
            <div className="flex justify-center gap-3 mt-6 text-sm text-gray-600 dark:text-gray-400">
              <button className="underline" onClick={() => navigate('/app/recommendations')}>{t('recommendations')}</button>
              <span>•</span>
              <button className="underline" onClick={() => navigate('/app/catalog')}>{t('catalog')}</button>
              <span>•</span>
              <button className="underline" onClick={() => navigate('/app/audio')}>Audio</button>
            </div>
          </div>
        )}
      </div>

      {/* Signup Modal */}
      {!token && showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSignupModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
              aria-label="Close modal"
            >
              ×
            </button>
            
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'zh' ? '準備好開始了嗎？' : language === 'ja' ? '始める準備はできましたか？' : 'Ready to Get Started?'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'zh' ? '加入成千上萬的讀者，體驗 AI 驅動的智能閱讀' : language === 'ja' ? '何千もの読者に加わり、AI駆動のインテリジェント読書を体験' : 'Join thousands of readers experiencing AI-powered intelligent reading'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✨</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? '免費開始' : language === 'ja' ? '無料でスタート' : 'Free to Start'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-11">
                  {language === 'zh' ? '無需信用卡，立即訪問所有核心功能' : language === 'ja' ? 'クレジットカード不要、すべてのコア機能に即アクセス' : 'No credit card required, instant access to all core features'}
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎯</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? '個性化學習' : language === 'ja' ? 'パーソナライズされた学習' : 'Personalized Learning'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-11">
                  {language === 'zh' ? 'AI 根據您的目標和偏好量身定制建議' : language === 'ja' ? 'AIがあなたの目標と好みに合わせて推薦をカスタマイズ' : 'AI tailors recommendations to your goals and preferences'}
                </p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/30 dark:to-orange-900/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🌍</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? '多語言支持' : language === 'ja' ? '多言語サポート' : 'Multilingual Support'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-11">
                  {language === 'zh' ? '包括原住民語言和低資源語言' : language === 'ja' ? '先住民言語や低リソース言語を含む' : 'Including indigenous and low-resource languages'}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                onClick={() => navigate('/signup')}
                variant="primary"
                className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {language === 'zh' ? '立即註冊' : language === 'ja' ? '今すぐ登録' : 'Sign Up Now'}
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="secondary"
                className="w-full py-3 text-lg"
              >
                {language === 'zh' ? '已有帳號？登入' : language === 'ja' ? 'アカウントをお持ちですか？ログイン' : 'Already have an account? Log In'}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
              {language === 'zh' ? '註冊即表示您同意我們的服務條款和隱私政策' : language === 'ja' ? '登録することで、利用規約とプライバシーポリシーに同意したことになります' : 'By signing up, you agree to our Terms of Service and Privacy Policy'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

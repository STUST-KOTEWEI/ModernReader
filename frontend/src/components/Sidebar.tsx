import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";

interface SidebarProps {
  user: { email: string } | null;
}

export const Sidebar = ({ user }: SidebarProps) => {
  const { t, language, setLanguage } = useI18n();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ModernReader</h2>
        {user && <span className="sidebar-user">{user.email}</span>}
      </div>

      {/* Language Switcher */}
      <div className="px-4 py-2 flex gap-1">
        <button 
          onClick={() => setLanguage('en')} 
          className={`px-2 py-1 rounded text-xs ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLanguage('zh')} 
          className={`px-2 py-1 rounded text-xs ${language === 'zh' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          中文
        </button>
        <button 
          onClick={() => setLanguage('ja')} 
          className={`px-2 py-1 rounded text-xs ${language === 'ja' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          日
        </button>
      </div>

      <nav className="sidebar-nav">
        <Link to="/app">{t('dashboard')}</Link>
        <Link to="/app/ai-demo">🧠 {t('aiAssistant')}</Link>
        <Link to="/app/recommendations">🎯 {t('recommendations')}</Link>
        <Link to="/app/audio">🎤 Audio (STT/TTS)</Link>
        <Link to="/app/indigenous">🏔️ Indigenous Languages</Link>
        <Link to="/app/indigenous-chat">💬 Indigenous Chatbot</Link>
        <Link to="/app/catalog">📚 {t('catalog')}</Link>
        <Link to="/app/epaper">📱 E-Paper</Link>
      </nav>

      <div className="px-4 py-2 mt-auto">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('home')}
        </Link>
      </div>
    </aside>
  );
};

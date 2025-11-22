import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { LanguageSelect } from "./LanguageSelect";

interface SidebarProps {
  user: { email: string } | null;
}

export const Sidebar = ({ user }: SidebarProps) => {
  const { t, language } = useI18n();

  return (
    <aside className="sidebar bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="sidebar-header bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
        <h2 className="text-xl font-bold">ModernReader</h2>
        {user && <span className="text-sm text-indigo-100 mt-1 block truncate">{user.email}</span>}
      </div>

      {/* Language Switcher */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <LanguageSelect />
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto py-2">
        <Link to="/app" className="sidebar-link">
          <span className="sidebar-icon">📊</span>
          <span>{t('dashboard')}</span>
        </Link>
        <Link to="/app/emotion" className="sidebar-link">
          <span className="sidebar-icon">😊</span>
          <span>{t('emotionAI')}</span>
        </Link>
        <Link to="/app/ai-demo" className="sidebar-link">
          <span className="sidebar-icon">🧠</span>
          <span>{t('aiAssistant')}</span>
        </Link>
        <Link to="/app/recommendations" className="sidebar-link">
          <span className="sidebar-icon">🎯</span>
          <span>{t('recommendations')}</span>
        </Link>
        {/* 移除獨立的音訊頁，音訊功能整合在章節/Podcast 頁面中 */}
        <Link to="/app/indigenous" className="sidebar-link">
          <span className="sidebar-icon">🏔️</span>
          <span>{t('indigenousLanguagesNav')}</span>
        </Link>
        <Link to="/app/indigenous-chat" className="sidebar-link">
          <span className="sidebar-icon">💬</span>
          <span>{t('indigenousChatNav')}</span>
        </Link>
        <Link to="/app/pronunciation" className="sidebar-link">
          <span className="sidebar-icon">🎤</span>
          <span>{language === 'zh' ? '發音練習' : language === 'ja' ? '発音練習' : 'Pronunciation'}</span>
        </Link>
        <Link to="/app/progress" className="sidebar-link">
          <span className="sidebar-icon">📈</span>
          <span>{language === 'zh' ? '學習進度' : language === 'ja' ? '学習進捗' : 'Progress'}</span>
        </Link>
        <Link to="/app/catalog" className="sidebar-link">
          <span className="sidebar-icon">📚</span>
          <span>{t('catalog')}</span>
        </Link>
        <Link to="/app/epaper" className="sidebar-link">
          <span className="sidebar-icon">📱</span>
          <span>{t('epaperNav')}</span>
        </Link>

        <Link to="/app/devices" className="sidebar-link">
          <span className="sidebar-icon">🧩</span>
          <span>{language === 'zh' ? '裝置串接' : language === 'ja' ? 'デバイス連携' : 'Device Integration'}</span>
        </Link>
        <Link to="/app/ar" className="sidebar-link">
          <span className="sidebar-icon">🕶️</span>
          <span>{language === 'zh' ? 'AR 模擬' : language === 'ja' ? 'ARシミュレーション' : 'AR Simulation'}</span>
        </Link>
        
        <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
        
        <Link to="/app/tour" className="sidebar-link bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <span className="sidebar-icon">🚀</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{language === 'zh' ? '功能導覽' : language === 'ja' ? '機能ガイド' : 'Tour'}</span>
        </Link>
        <Link to="/prototype" className="sidebar-link">
          <span className="sidebar-icon">🧪</span>
          <span>{language === 'zh' ? '原型展示' : language === 'ja' ? 'プロトタイプ' : 'Prototype'}</span>
        </Link>
        
        <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
        
        <Link to="/app/profile" className="sidebar-link">
          <span className="sidebar-icon">👤</span>
          <span>{t('profile')}</span>
        </Link>
        <Link to="/app/settings" className="sidebar-link">
          <span className="sidebar-icon">⚙️</span>
          <span>{t('settings')}</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link to="/" className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2">
          <span>←</span>
          <span>{t('home')}</span>
        </Link>
      </div>
    </aside>
  );
};

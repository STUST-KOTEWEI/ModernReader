import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { LanguageSelect } from "./LanguageSelect";

interface SidebarProps {
  user: { email: string } | null;
}

export const Sidebar = ({ user }: SidebarProps) => {
  const { t } = useI18n();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ModernReader</h2>
        {user && <span className="sidebar-user">{user.email}</span>}
      </div>

      {/* Language Switcher */}
      <div className="px-4 py-2">
        <LanguageSelect />
      </div>

      <nav className="sidebar-nav">
        <Link to="/app">{t('dashboard')}</Link>
        <Link to="/app/ai-demo">🧠 {t('aiAssistant')}</Link>
        <Link to="/app/recommendations">🎯 {t('recommendations')}</Link>
        <Link to="/app/audio">🎤 {t('audioNav')}</Link>
        <Link to="/app/indigenous">🏔️ {t('indigenousLanguagesNav')}</Link>
        <Link to="/app/indigenous-chat">💬 {t('indigenousChatNav')}</Link>
        <Link to="/app/catalog">📚 {t('catalog')}</Link>
        <Link to="/app/epaper">📱 {t('epaperNav')}</Link>
        <Link to="/app/settings">⚙️ {t('settings')}</Link>
      </nav>

      <div className="px-4 py-2 mt-auto">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('home')}
        </Link>
      </div>
    </aside>
  );
};

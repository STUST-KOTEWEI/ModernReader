import React from 'react';
import { Link } from 'react-router-dom';
import { RecommendationPanel } from "../components/RecommendationPanel";
import { SessionTelemetryPanel } from "../components/SessionTelemetryPanel";
import { useI18n } from '../i18n/useI18n';

export const DashboardPage = () => {
  const { t } = useI18n();
  
  const quickActions = [
    { icon: '🧠', title: t('aiAssistant'), subtitle: t('qaQueryYourBooks'), path: '/app/ai-demo', color: 'from-blue-500 to-cyan-500' },
    { icon: '🎯', title: t('recommendations'), subtitle: t('qaPersonalizedPicks'), path: '/app/recommendations', color: 'from-purple-500 to-pink-500' },
    { icon: '🎤', title: t('audioNav'), subtitle: t('sttTtsShort'), path: '/app/audio', color: 'from-green-500 to-emerald-500' },
    { icon: '📚', title: t('catalog'), subtitle: t('qaBrowseBooks'), path: '/app/catalog', color: 'from-orange-500 to-red-500' },
    { icon: '🏔️', title: t('indigenousLanguagesNav'), subtitle: t('qaLanguageTools'), path: '/app/indigenous', color: 'from-teal-500 to-cyan-500' },
    { icon: '💬', title: t('indigenousChatNav'), subtitle: t('qaAIChatbot'), path: '/app/indigenous-chat', color: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{t('welcomeTitle')} 👋</h1>
        <p className="text-indigo-100">{t('welcomeSubtitle')}</p>
      </div>

      {/* Quick Actions Grid */}
      <div>
  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              to={action.path}
              className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <div className="relative">
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationPanel />
        <SessionTelemetryPanel />
      </div>
    </div>
  );
};

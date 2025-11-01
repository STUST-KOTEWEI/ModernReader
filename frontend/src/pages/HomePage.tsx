import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();

  const features = [
    { title: t('aiAssistant'), desc: 'RAG Q&A + Cognitive Load Assessment', path: '/ai-demo' },
    { title: t('recommendations'), desc: 'Multi-objective smart recommendations', path: '/recommendations' },
    { title: 'Audio (STT/TTS)', desc: 'Speech recognition and synthesis', path: '/audio' },
    { title: t('catalog'), desc: 'Browse book catalog', path: '/catalog' },
    { title: 'E-Paper', desc: 'Format and publish to e-ink devices', path: '/epaper' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button 
          onClick={() => setLanguage('en')} 
          className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLanguage('zh')} 
          className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'zh' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          中文
        </button>
        <button 
          onClick={() => setLanguage('ja')} 
          className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'ja' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          日本語
        </button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            ModernReader
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {language === 'zh' ? '世界級 AI 多模態閱讀平台' : language === 'ja' ? '世界クラスのAIマルチモーダル読書プラットフォーム' : 'World-Class AI-Powered Multimodal Reading Platform'}
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/signup')} variant="primary">
              {t('signup')}
            </Button>
            <Button onClick={() => navigate('/login')} variant="secondary">
              {t('login')}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, idx) => (
            <Card key={idx} className="hover:shadow-lg transition cursor-pointer" onClick={() => navigate(feature.path)}>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{feature.desc}</p>
              <Button variant="secondary" className="text-sm">
                {t('viewDetails')}
              </Button>
            </Card>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">
            {language === 'zh' ? '技術棧' : language === 'ja' ? '技術スタック' : 'Technology Stack'}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'FastAPI', 'RAG', 'LLM', 'Cognitive AI'].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

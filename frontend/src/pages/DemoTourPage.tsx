import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Mic, Brain, Sparkles, Languages, Headphones,
  Trophy, Smartphone, Glasses, TrendingUp, MessageSquare, Camera,
  ChevronRight, Star
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  category: 'core' | 'learning' | 'immersive' | 'social';
  badge?: string;
}

export const DemoTourPage: React.FC = () => {
  const navigate = useNavigate();

  const features: Feature[] = [
    // Core Reading Features
    {
      id: 'catalog',
      title: '智能書庫',
      description: '瀏覽 30+ 本精選書籍，支援多語言搜尋與篩選',
      icon: <BookOpen className="w-6 h-6" />,
      route: '/app/catalog',
      category: 'core',
      badge: '30+ 書籍'
    },
    {
      id: 'ai-assistant',
      title: 'AI 閱讀助手',
      description: '智能問答、內容摘要、知識圖譜，RAG 技術支援',
      icon: <Brain className="w-6 h-6" />,
      route: '/app/ai-demo',
      category: 'core',
      badge: 'RAG'
    },
    {
      id: 'recommendations',
      title: '情緒感知推薦',
      description: '基於情緒狀態與閱讀偏好的個人化推薦系統',
      icon: <Sparkles className="w-6 h-6" />,
      route: '/app/recommendations',
      category: 'core',
      badge: '情緒 AI'
    },

    // Language Learning
    {
      id: 'indigenous-languages',
      title: '原住民語言學習',
      description: '手寫識別、發音練習、文化交流，支援 8+ 語言',
      icon: <Languages className="w-6 h-6" />,
      route: '/app/indigenous',
      category: 'learning',
      badge: '8 語言'
    },
    {
      id: 'pronunciation',
      title: '發音練習系統',
      description: 'AI 評分、即時回饋、學習追蹤，18 個練習短句',
      icon: <Mic className="w-6 h-6" />,
      route: '/app/pronunciation',
      category: 'learning',
      badge: '即時評分'
    },
    {
      id: 'indigenous-chat',
      title: '語言 AI 對話',
      description: '與 AI 用原住民語言對話，學習文化與語言',
      icon: <MessageSquare className="w-6 h-6" />,
      route: '/app/indigenous-chat',
      category: 'learning'
    },
    {
      id: 'progress',
      title: '學習進度追蹤',
      description: '完整的學習歷程記錄、成就系統、書籤管理',
      icon: <TrendingUp className="w-6 h-6" />,
      route: '/app/progress',
      category: 'learning',
      badge: '成就系統'
    },

    // Immersive Experience
    {
      id: 'emotion',
      title: '情緒感知分析',
      description: '相機與文字情緒偵測，調整閱讀體驗',
      icon: <Camera className="w-6 h-6" />,
      route: '/app/emotion',
      category: 'immersive',
      badge: '相機 AI'
    },
    {
      id: 'audio',
      title: '有聲書體驗',
      description: '60秒預覽限制、解鎖流程、進度追蹤',
      icon: <Headphones className="w-6 h-6" />,
      route: '/app/audio',
      category: 'immersive',
      badge: '預覽限制'
    },
    {
      id: 'devices',
      title: '裝置整合',
      description: '電子紙、觸覺手環、香氛器、智能耳機連接',
      icon: <Smartphone className="w-6 h-6" />,
      route: '/app/devices',
      category: 'immersive',
      badge: '多感官'
    },
    {
      id: 'ar',
      title: 'AR 閱讀模擬',
      description: '擴增實境閱讀場景、3D 互動體驗',
      icon: <Glasses className="w-6 h-6" />,
      route: '/app/ar',
      category: 'immersive',
      badge: 'AR/VR'
    },
  ];

  const categoryNames = {
    core: { title: '核心閱讀', color: 'blue' },
    learning: { title: '語言學習', color: 'purple' },
    immersive: { title: '沉浸體驗', color: 'pink' },
    social: { title: '社群互動', color: 'green' }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const stats = [
    { label: '功能模組', value: features.length, icon: '🎯' },
    { label: '支援語言', value: '8+', icon: '🌍' },
    { label: '書籍數量', value: '30+', icon: '📚' },
    { label: 'AI 模型', value: '5', icon: '🤖' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            🚀 完整功能展示
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ModernReader 全功能導覽
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            探索智能閱讀、語言學習、多感官體驗的未來
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 text-center transform hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features by Category */}
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
            const categoryInfo = categoryNames[category as keyof typeof categoryNames];
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600',
              purple: 'from-purple-500 to-purple-600',
              pink: 'from-pink-500 to-pink-600',
              green: 'from-green-500 to-green-600'
            };

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-1 w-12 bg-gradient-to-r ${colorClasses[categoryInfo.color as keyof typeof colorClasses]} rounded-full`} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {categoryInfo.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => navigate(feature.route)}
                      className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-xl transform hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[categoryInfo.color as keyof typeof colorClasses]} text-white`}>
                          {feature.icon}
                        </div>
                        {feature.badge && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            {feature.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4">
                        {feature.description}
                      </p>

                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        立即體驗
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <Star className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              開始你的智能閱讀之旅
            </h2>
            <p className="text-lg text-white/90 mb-6">
              所有功能都已就緒，點擊上方任一模組開始探索！
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/app')}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                前往儀表板
              </button>
              <button
                onClick={() => navigate('/app/catalog')}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                瀏覽書庫
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="font-semibold text-gray-900 mb-2">深度學習</h3>
            <p className="text-sm text-gray-600">
              結合 AI 技術與認知科學，提供個人化學習路徑
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-3">🌐</div>
            <h3 className="font-semibold text-gray-900 mb-2">多元文化</h3>
            <p className="text-sm text-gray-600">
              支援台灣原住民語言及全球原住民文化保存
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-semibold text-gray-900 mb-2">創新體驗</h3>
            <p className="text-sm text-gray-600">
              多感官整合、AR/VR、情緒感知等前沿技術
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

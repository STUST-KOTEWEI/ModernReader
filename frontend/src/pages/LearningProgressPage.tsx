import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionClient } from '../services/api';
import { 
  BookOpen, Trophy, TrendingUp, Clock, Bookmark, 
  Target, Award, ChevronLeft, Star, Calendar 
} from 'lucide-react';

interface LearningProgress {
  totalBooksRead: number;
  totalTimeSpent: number; // minutes
  currentStreak: number; // days
  longestStreak: number;
  achievements: Achievement[];
  bookmarks: BookmarkEntry[];
  recentActivity: ActivityEntry[];
  weeklyGoal: number; // minutes per week
  weeklyProgress: number; // minutes this week
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: number;
  category: 'reading' | 'practice' | 'streak' | 'milestone';
}

interface BookmarkEntry {
  id: string;
  bookId: string;
  bookTitle: string;
  page: number;
  note?: string;
  createdAt: number;
}

interface ActivityEntry {
  id: string;
  type: 'read' | 'practice' | 'bookmark' | 'achievement';
  title: string;
  description: string;
  timestamp: number;
  duration?: number; // minutes
}

export const LearningProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LearningProgress>({
    totalBooksRead: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: [],
    bookmarks: [],
    recentActivity: [],
    weeklyGoal: 300, // 5 hours per week
    weeklyProgress: 0,
  });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = () => {
    try {
      // Load from localStorage
      const stored = localStorage.getItem('learningProgress');
      if (stored) {
        setProgress(JSON.parse(stored));
      } else {
        // Initialize with demo data
        initializeDemoProgress();
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      initializeDemoProgress();
    }
  };

  const initializeDemoProgress = () => {
    const demoProgress: LearningProgress = {
      totalBooksRead: 5,
      totalTimeSpent: 1250, // ~20 hours
      currentStreak: 7,
      longestStreak: 14,
      achievements: [
        {
          id: 'ach_001',
          title: '初次閱讀',
          description: '完成第一本書的閱讀',
          icon: '📖',
          earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          category: 'reading'
        },
        {
          id: 'ach_002',
          title: '連續七日',
          description: '連續 7 天使用平台學習',
          icon: '🔥',
          earnedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
          category: 'streak'
        },
        {
          id: 'ach_003',
          title: '發音達人',
          description: '完成 10 次發音練習',
          icon: '🎤',
          earnedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          category: 'practice'
        },
        {
          id: 'ach_004',
          title: '知識探索者',
          description: '閱讀超過 5 本書',
          icon: '🌟',
          earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          category: 'milestone'
        },
      ],
      bookmarks: [
        {
          id: 'bm_001',
          bookId: 'demo_zh_001',
          bookTitle: '原子習慣（精選）',
          page: 42,
          note: '習慣堆疊的概念很實用',
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
        },
        {
          id: 'bm_002',
          bookId: 'demo_en_001',
          bookTitle: 'Introduction to AI',
          page: 156,
          note: 'Neural network architecture',
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
        },
        {
          id: 'bm_003',
          bookId: 'demo_zh_003',
          bookTitle: '深度工作力',
          page: 89,
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000
        },
      ],
      recentActivity: [
        {
          id: 'act_001',
          type: 'read',
          title: '閱讀：原子習慣',
          description: '閱讀第3章：習慣的複利效應',
          timestamp: Date.now() - 1 * 60 * 60 * 1000,
          duration: 25
        },
        {
          id: 'act_002',
          type: 'practice',
          title: '發音練習',
          description: '練習阿美語短句',
          timestamp: Date.now() - 3 * 60 * 60 * 1000,
          duration: 15
        },
        {
          id: 'act_003',
          type: 'achievement',
          title: '獲得成就：連續七日',
          description: '恭喜！你已連續 7 天使用平台',
          timestamp: Date.now() - 5 * 60 * 60 * 1000
        },
        {
          id: 'act_004',
          type: 'bookmark',
          title: '新增書籤',
          description: '在《深度工作力》第89頁新增書籤',
          timestamp: Date.now() - 24 * 60 * 60 * 1000
        },
      ],
      weeklyGoal: 300,
      weeklyProgress: 185,
    };

    setProgress(demoProgress);
    localStorage.setItem('learningProgress', JSON.stringify(demoProgress));
  };

  // Compute current streak (consecutive days with any activity)
  const computeStreak = (activities: ActivityEntry[]): { current: number; longest: number } => {
    if (activities.length === 0) return { current: 0, longest: 0 };
    const days = new Map<string, number>();
    activities.forEach(a => {
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.set(key, (days.get(key) || 0) + 1);
    });
    // Build sorted unique day list (desc)
    const uniqueDays = Array.from(days.keys()).map(k => {
      const [y,m,d] = k.split('-').map(Number);
      return new Date(y, m, d).getTime();
    }).sort((a,b) => b - a);
    const oneDay = 24*60*60*1000;
    const todayKey = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    let current = 0, longest = 0, expected = todayKey;
    for (const dayTs of uniqueDays) {
      if (current === 0 && dayTs < todayKey) {
        // if no activity today, start from the most recent day
        expected = dayTs;
      }
      if (dayTs === expected) {
        current += 1;
        expected -= oneDay;
        longest = Math.max(longest, current);
      } else if (dayTs === expected + oneDay) {
        // gap of more than 1 day resets current; but keep longest
        current = 1;
        expected = dayTs - oneDay;
        longest = Math.max(longest, current);
      } else {
        // Non-consecutive day; reset current and set expected accordingly
        current = 1;
        expected = dayTs - oneDay;
        longest = Math.max(longest, current);
      }
    }
    longest = Math.max(longest, current);
    return { current, longest };
  };

  const syncFromSession = async () => {
    try {
      const resp = await sessionClient.listEvents('demo-session');
      const newActs: ActivityEntry[] = (resp.events || []).map((e: any, idx: number) => ({
        id: `sess_${e.timestamp}_${e.event_type}_${idx}`,
        type: e.event_type === 'session_start' ? 'read' : e.event_type === 'question_asked' ? 'practice' : 'read',
        title: e.event_type === 'session_start' ? '開始學習' : 'AI 助理互動',
        description: e.emotion ? `情緒：${e.emotion}` : '來自會話事件',
        timestamp: new Date(e.timestamp).getTime(),
        duration: e.event_type === 'read' ? 20 : e.event_type === 'question_asked' ? 10 : 10
      }));
      // Merge with existing without duplicates
      const existingIds = new Set(progress.recentActivity.map(a => a.id));
      const mergedActs = [...newActs.filter(a => !existingIds.has(a.id)), ...progress.recentActivity]
        .sort((a,b) => b.timestamp - a.timestamp)
        .slice(0, 100);

      // Recompute totals
      const addedMinutes = newActs.reduce((sum, a) => sum + (a.duration || 0), 0);
      const totalTimeSpent = progress.totalTimeSpent + addedMinutes;
      const weeklyProgress = Math.min(progress.weeklyGoal, progress.weeklyProgress + addedMinutes);
      const { current, longest } = computeStreak(mergedActs);

      const next: LearningProgress = { ...progress, recentActivity: mergedActs, totalTimeSpent, weeklyProgress, currentStreak: current, longestStreak: Math.max(progress.longestStreak, longest) };
      setProgress(next);
      localStorage.setItem('learningProgress', JSON.stringify(next));
    } catch (e) {
      console.error('Failed to sync from session', e);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} 分鐘`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小時 ${mins} 分` : `${hours} 小時`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  };

  const weeklyProgressPercent = Math.min(100, (progress.weeklyProgress / progress.weeklyGoal) * 100);

  const achievementsByCategory = {
    reading: progress.achievements.filter(a => a.category === 'reading'),
    practice: progress.achievements.filter(a => a.category === 'practice'),
    streak: progress.achievements.filter(a => a.category === 'streak'),
    milestone: progress.achievements.filter(a => a.category === 'milestone'),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            返回
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            學習進度
          </h1>
          <p className="text-gray-600 mt-2">
            追蹤你的學習歷程與成就
          </p>
          <div className="mt-3">
            <button
              onClick={syncFromSession}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            >從會話同步</button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">已讀書籍</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{progress.totalBooksRead}</p>
            <p className="text-xs text-gray-500 mt-1">累計閱讀</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-green-500" />
              <span className="text-sm font-medium text-gray-600">學習時間</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.floor(progress.totalTimeSpent / 60)}
            </p>
            <p className="text-xs text-gray-500 mt-1">小時</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔥</span>
              <span className="text-sm font-medium text-gray-600">當前連勝</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{progress.currentStreak}</p>
            <p className="text-xs text-gray-500 mt-1">天（最高：{progress.longestStreak} 天）</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">成就徽章</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{progress.achievements.length}</p>
            <p className="text-xs text-gray-500 mt-1">已解鎖</p>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-6 h-6" />
                本週學習目標
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {formatDuration(progress.weeklyProgress)} / {formatDuration(progress.weeklyGoal)}
              </p>
            </div>
            <div className="text-4xl font-bold">
              {Math.round(weeklyProgressPercent)}%
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${weeklyProgressPercent}%` }}
            />
          </div>
          {weeklyProgressPercent >= 100 && (
            <p className="text-sm mt-2 flex items-center gap-1">
              <Star className="w-4 h-4" />
              太棒了！你已經完成本週目標 🎉
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              成就徽章
            </h2>

            <div className="space-y-4">
              {Object.entries(achievementsByCategory).map(([category, achievements]) => {
                if (achievements.length === 0) return null;
                
                const categoryNames = {
                  reading: '閱讀成就',
                  practice: '練習成就',
                  streak: '連勝成就',
                  milestone: '里程碑'
                };

                return (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3"
                        >
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(achievement.earnedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {progress.achievements.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                還沒有獲得成就，繼續學習吧！
              </p>
            )}
          </div>

          {/* Bookmarks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-blue-500" />
              我的書籤
            </h2>

            {progress.bookmarks.length > 0 ? (
              <div className="space-y-3">
                {progress.bookmarks.slice(0, 5).map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {bookmark.bookTitle}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          第 {bookmark.page} 頁
                        </p>
                        {bookmark.note && (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 mb-2">
                            💭 {bookmark.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDate(bookmark.createdAt)}
                        </p>
                      </div>
                      <Bookmark className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                還沒有書籤，在閱讀時新增書籤來標記重要內容！
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-500" />
            最近活動
          </h2>

          {progress.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {progress.recentActivity.map((activity) => {
                const icons = {
                  read: '📖',
                  practice: '🎤',
                  bookmark: '🔖',
                  achievement: '🏆'
                };

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-2xl flex-shrink-0">{icons[activity.type]}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.timestamp)}
                        </p>
                        {activity.duration && (
                          <p className="text-xs text-blue-600">
                            ⏱️ {activity.duration} 分鐘
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              還沒有活動記錄
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { PronunciationRecorder } from '../components/PronunciationRecorder';
import { Volume2, Trophy, TrendingUp, BookOpen, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PracticeSession {
  id: string;
  timestamp: number;
  language: string;
  targetText: string;
  score: number;
  feedback: string;
  duration: number;
}

interface PracticePhrase {
  language: string;
  languageName: string;
  text: string;
  translation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const PRACTICE_PHRASES: PracticePhrase[] = [
  // Amis (阿美語)
  { language: 'ami', languageName: '阿美語', text: 'Nga\'ay ho', translation: '你好', difficulty: 'beginner' },
  { language: 'ami', languageName: '阿美語', text: 'Midiput ako kiso', translation: '我想你', difficulty: 'intermediate' },
  { language: 'ami', languageName: '阿美語', text: 'O ngangan niyam kimaan', translation: '你的名字是什麼？', difficulty: 'intermediate' },
  
  // Paiwan (排灣語)
  { language: 'pwn', languageName: '排灣語', text: 'Masalu', translation: '你好', difficulty: 'beginner' },
  { language: 'pwn', languageName: '排灣語', text: 'Avan a ngadan su', translation: '你的名字是什麼？', difficulty: 'intermediate' },
  { language: 'pwn', languageName: '排灣語', text: 'Makatjunuay timadju', translation: '謝謝你', difficulty: 'beginner' },
  
  // Atayal (泰雅語)
  { language: 'tay', languageName: '泰雅語', text: 'Lokah su ga', translation: '你好嗎？', difficulty: 'beginner' },
  { language: 'tay', languageName: '泰雅語', text: 'Mhway su balay', translation: '非常感謝', difficulty: 'beginner' },
  { language: 'tay', languageName: '泰雅語', text: 'Nanu hngkwasan su', translation: '你叫什麼名字？', difficulty: 'intermediate' },
  
  // Bunun (布農語)
  { language: 'bnn', languageName: '布農語', text: 'Unaq minsaan', translation: '你好', difficulty: 'beginner' },
  { language: 'bnn', languageName: '布農語', text: 'Masilaing', translation: '再見', difficulty: 'beginner' },
  
  // Truku (太魯閣語)
  { language: 'trv', languageName: '太魯閣語', text: 'Embiyax su hug', translation: '你好', difficulty: 'beginner' },
  { language: 'trv', languageName: '太魯閣語', text: 'Yaku kingal Truku', translation: '我是太魯閣人', difficulty: 'intermediate' },
  
  // Maori (毛利語)
  { language: 'mi', languageName: '毛利語', text: 'Kia ora', translation: '你好', difficulty: 'beginner' },
  { language: 'mi', languageName: '毛利語', text: 'Ko wai tō ingoa', translation: '你叫什麼名字？', difficulty: 'intermediate' },
  
  // Hawaiian (夏威夷語)
  { language: 'haw', languageName: '夏威夷語', text: 'Aloha', translation: '你好/愛', difficulty: 'beginner' },
  { language: 'haw', languageName: '夏威夷語', text: 'Mahalo nui loa', translation: '非常感謝', difficulty: 'beginner' },
  
  // Navajo (納瓦荷語)
  { language: 'nv', languageName: '納瓦荷語', text: 'Yá\'át\'ééh', translation: '你好', difficulty: 'beginner' },
];

export const PronunciationPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ami');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentPhrase, setCurrentPhrase] = useState<PracticePhrase | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [languageQuery, setLanguageQuery] = useState("");
  const [trained, setTrained] = useState<Array<{ code: string; name: string }>>([]);
  const [newLangCode, setNewLangCode] = useState("");
  const [newLangName, setNewLangName] = useState("");

  useEffect(() => {
    // Load sessions from localStorage
    const stored = localStorage.getItem('pronunciationSessions');
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
    // Load trained languages
    try {
      const t = localStorage.getItem('trainedLanguages');
      if (t) setTrained(JSON.parse(t));
    } catch {}
  }, []);

  useEffect(() => {
    // Select first phrase when language or difficulty changes
    selectRandomPhrase();
  }, [selectedLanguage, selectedDifficulty]);

  const selectRandomPhrase = () => {
    let filtered = PRACTICE_PHRASES.filter(p => p.language === selectedLanguage);
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
    }
    
    if (filtered.length > 0) {
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      setCurrentPhrase(random);
      setCurrentScore(null);
      setCurrentFeedback('');
    } else {
      setCurrentPhrase(null);
    }
  };

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    console.log('Recording complete:', { size: audioBlob.size, duration });
  };

  const handleScore = (score: number, feedback: string) => {
    setCurrentScore(score);
    setCurrentFeedback(feedback);
    
    if (currentPhrase) {
      const session: PracticeSession = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        language: currentPhrase.language,
        targetText: currentPhrase.text,
        score,
        feedback,
        duration: 0,
      };
      
      const newSessions = [session, ...sessions].slice(0, 50); // Keep last 50
      setSessions(newSessions);
      localStorage.setItem('pronunciationSessions', JSON.stringify(newSessions));
    }
  };

  const playModelAudio = () => {
    if (!currentPhrase) return;
    
    // Use Web Speech API for TTS
    const utterance = new SpeechSynthesisUtterance(currentPhrase.text);
    
    // Try to find appropriate voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(currentPhrase.language) || 
      v.lang.startsWith('zh') // Fallback to Chinese for indigenous languages
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.8; // Slower for learning
    utterance.pitch = 1.0;
    
    speechSynthesis.speak(utterance);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const availableLanguages = Array.from(new Set(PRACTICE_PHRASES.map(p => p.language)));
  const languageNames = PRACTICE_PHRASES.reduce((acc, p) => {
    acc[p.language] = p.languageName;
    return acc;
  }, {} as Record<string, string>);

  // Merge trained languages into lists (avoid duplicates)
  const allLangOptions = Array.from(new Set([...availableLanguages, ...trained.map(t => t.code)]));
  const allLanguageNames: Record<string,string> = { ...languageNames };
  trained.forEach(t => { if (!allLanguageNames[t.code]) allLanguageNames[t.code] = t.name; });

  const filteredLangOptions = allLangOptions.filter(code =>
    !languageQuery.trim() || (allLanguageNames[code] || code).toLowerCase().includes(languageQuery.trim().toLowerCase())
  );

  const averageScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : 0;

  const recentSessions = sessions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
            <Volume2 className="w-8 h-8 text-blue-600" />
            發音練習
          </h1>
          <p className="text-gray-600 mt-2">
            練習原住民語言發音，獲得即時評分與回饋
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">平均分數</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{averageScore}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">練習次數</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">語言數</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(sessions.map(s => s.language)).size}
            </p>
          </div>
        </div>

        {/* Main Practice Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">選擇練習內容</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                語言
              </label>
              <input
                type="text"
                value={languageQuery}
                onChange={(e)=>setLanguageQuery(e.target.value)}
                placeholder="輸入關鍵字搜尋語言…"
                className="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg"
                aria-label="搜尋語言"
              />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="選擇語言"
              >
                {filteredLangOptions.map(lang => (
                  <option key={lang} value={lang}>
                    {allLanguageNames[lang]}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <input
                  value={newLangCode}
                  onChange={(e)=>setNewLangCode(e.target.value)}
                  placeholder="語言代碼"
                  className="px-2 py-1 border rounded"
                />
                <input
                  value={newLangName}
                  onChange={(e)=>setNewLangName(e.target.value)}
                  placeholder="語言名稱"
                  className="px-2 py-1 border rounded flex-1"
                />
                <button
                  className="px-3 py-1 bg-gray-100 rounded"
                  onClick={() => {
                    if (!newLangCode || !newLangName) return;
                    const merged = [...trained.filter(t=>t.code!==newLangCode), { code: newLangCode, name: newLangName }];
                    setTrained(merged);
                    try { localStorage.setItem('trainedLanguages', JSON.stringify(merged)); } catch {}
                    setNewLangCode(''); setNewLangName('');
                  }}
                >新增</button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                難度
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="選擇難度"
              >
                <option value="all">全部</option>
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">高級</option>
              </select>
            </div>
          </div>

          {currentPhrase && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentPhrase.text}
                    </h3>
                    <p className="text-lg text-gray-600 mb-1">
                      中文：{currentPhrase.translation}
                    </p>
                    <p className="text-sm text-gray-500">
                      難度：
                      <span className={
                        currentPhrase.difficulty === 'beginner' ? 'text-green-600' :
                        currentPhrase.difficulty === 'intermediate' ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {currentPhrase.difficulty === 'beginner' ? '初級' :
                         currentPhrase.difficulty === 'intermediate' ? '中級' : '高級'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={playModelAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    播放示範
                  </button>
                </div>
              </div>

              <PronunciationRecorder
                targetText={currentPhrase.text}
                language={currentPhrase.language}
                onRecordingComplete={handleRecordingComplete}
                onScore={handleScore}
              />

              {currentScore !== null && (
                <div className={`mt-6 rounded-lg border-2 p-6 ${getScoreBgColor(currentScore)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">評分結果</h3>
                    <div className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
                      {currentScore} 分
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {currentFeedback}
                    </pre>
                  </div>
                  <button
                    onClick={selectRandomPhrase}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    下一題
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Practice History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">最近練習記錄</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showHistory ? '隱藏' : '查看全部'}
            </button>
          </div>
          
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              還沒有練習記錄，開始你的第一次練習吧！
            </p>
          ) : (
            <div className="space-y-3">
              {(showHistory ? sessions : recentSessions).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{session.targetText}</p>
                    <p className="text-sm text-gray-500">
                      {languageNames[session.language]} • {new Date(session.timestamp).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(session.score)}`}>
                    {session.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

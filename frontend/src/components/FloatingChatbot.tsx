import React from 'react';
import { ragClient, aiClient } from '../services/api';
import { Sparkles, X, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  emotion?: string;
  confidence?: number;
  timestamp: number;
}

export const FloatingChatbot: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const detectEmotion = async (text: string): Promise<{ emotion: string; confidence: number } | null> => {
    try {
      const res = await aiClient.analyzeEmotion({ text });
      const topEmotion = res.top_emotion || 'neutral';
      const confidence = (res.emotions as any)?.[topEmotion] || 0;
      return { emotion: topEmotion, confidence };
    } catch {
      return null;
    }
  };

  const getEmotionEmoji = (emotion?: string) => {
    const map: Record<string, string> = {
      happy: '😊',
      curious: '🤔',
      excited: '🤩',
      stressed: '😰',
      tired: '😴',
      confused: '😕',
      satisfied: '😌'
    };
    return emotion ? map[emotion] || '💭' : '💭';
  };

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    
    const userMsg: Message = { role: 'user', text: q, timestamp: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Analyze emotion of user's question (like Microsoft Copilot emotional awareness)
      const emotionData = await detectEmotion(q);
      
      // Query RAG (emotion doesn't affect backend query but we show it in UI)
      const res = await ragClient.query({ query: q });
      
      // Build contextual answer with emotion awareness
      let answerText = res.answer || '目前無法取得回答。';
      
      // Add emotion-aware prefix (like Copilot's empathetic responses)
      if (emotionData?.emotion && emotionData.confidence > 0.3) {
        const prefix = {
          curious: '很好奇！讓我來解答：',
          stressed: '理解你可能有點焦慮，讓我幫你：',
          tired: '看起來有點累了，簡單說明一下：',
          excited: '感受到你的熱情！',
          confused: '讓我清楚解釋：'
        }[emotionData.emotion];
        if (prefix) {
          answerText = `${prefix}\n\n${answerText}`;
        }
      }
      
      const assistantMsg: Message = {
        role: 'assistant',
        text: answerText,
        emotion: emotionData?.emotion,
        confidence: emotionData?.confidence,
        timestamp: Date.now()
      };
      
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [...m, { 
        role: 'assistant', 
        text: '目前無法取得回答，請稍後再試。',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {open && (
        <div className="mb-3 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header - Microsoft Copilot style */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">ModernReader 助理</span>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="max-h-96 overflow-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">我是你的智慧閱讀助理</p>
                <p className="text-xs mt-1">隨時問我關於書籍、學習或平台功能的問題</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${m.role === 'user' ? 'order-2' : ''}`}>
                  {m.role === 'assistant' && m.emotion && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getEmotionEmoji(m.emotion)}</span>
                      <span className="capitalize">{m.emotion}</span>
                      {m.confidence && m.confidence > 0.5 && (
                        <span className="text-blue-600">• 高信心度</span>
                      )}
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 px-1">
                    {new Date(m.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>思考中...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <input 
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} 
                placeholder="輸入訊息..."
                disabled={loading}
              />
              <button 
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-md" 
                onClick={send} 
                disabled={loading || !input.trim()}
              >
                送出
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Button - Microsoft Copilot style */}
      <button 
        aria-label="開啟助理"
        className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200 relative group"
        onClick={() => setOpen(o => !o)}
      >
        <Sparkles className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
        
        {/* Tooltip */}
        {!open && (
          <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            點擊開啟助理
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-4 border-transparent border-l-gray-900" />
          </div>
        )}
      </button>
    </div>
  );
};

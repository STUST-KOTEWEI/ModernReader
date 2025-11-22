import React, { useRef, useState } from 'react';
import { Button, Card } from '../design-system';
import { audioClient } from '../services/api';

export const PodcastPage: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [script, setScript] = useState('本集內容：介紹 ModernReader 的最新功能，包含推薦系統、語音與電子紙整合…');
  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState<Array<{ id: string; title: string; description: string }>>([
    { id: 'e1', title: 'EP01 開場：現代閱讀的未來', description: '談閱讀體驗的多模態整合與 AI 助理' },
    { id: 'e2', title: 'EP02 語音：從 STT 到 TTS', description: '如何用語音與學習內容互動' }
  ]);

  const synthesize = async () => {
    if (!script.trim()) return;
    setLoading(true);
    try {
      const blob = await audioClient.synthesize({ text: script, language: 'zh' });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Podcast</h1>

      <Card title="我的節目">
        <ul className="list-disc pl-5 space-y-2">
          {episodes.map((e) => (
            <li key={e.id}>
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{e.description}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="以 TTS 產生新一集">
        <textarea
          className="w-full px-3 py-2 border rounded mb-3"
          rows={4}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          aria-label="Podcast script"
          placeholder="輸入本集腳本..."
        />
        <Button onClick={synthesize} disabled={loading}>{loading ? '生成中...' : '生成並播放'}</Button>
        <audio ref={audioRef} controls className="w-full mt-3"/>
      </Card>
    </div>
  );
};

export default PodcastPage;

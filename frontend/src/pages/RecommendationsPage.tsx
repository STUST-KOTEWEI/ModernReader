import React, { useState, useEffect } from 'react';
import { advancedRecommenderClient, catalogClient, purchaseClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { TranslationKey } from '../i18n/translations';
import { Button, Card } from '../design-system';
import { useEmotionStore, EmotionMood } from '../state/emotion';

interface Recommendation {
  item_id: string;
  title: string;
  score: number;
  explanation?: string;
  imageUrl?: string;
  description?: string;
}

export const RecommendationsPage: React.FC = () => {
  const { t, language } = useI18n();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [chapters, setChapters] = useState<Array<{ id: string; chapter_number: number; title: string; is_preview: boolean; podcast_url?: string }>>([]);
  const [unlockCode, setUnlockCode] = useState<string>("");
  const globalMood = useEmotionStore((s) => s.current);
  const moodSource = useEmotionStore((s) => s.source);
  const [emotion, setEmotion] = useState<string>(globalMood);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [candidatePool, setCandidatePool] = useState<Array<{ id: string; title: string; summary?: string; language?: string }>>([]);

  useEffect(() => {
    // Preload a candidate pool from catalog; if empty, try importing sample data.
    ensureCandidatePool();
  }, []);

  // Auto-refresh recommendations when emotion changes from camera/text detection
  useEffect(() => {
    if (moodSource !== 'manual' && globalMood !== emotion) {
      setEmotion(globalMood);
      if (recommendations.length > 0) {
        loadRecommendations();
      }
    }
  }, [globalMood, moodSource]);

  const ensureCandidatePool = async () => {
    try {
      const res = await catalogClient.search({});
      if (res?.results?.length > 0) {
        setCandidatePool(res.results.map((r: any) => ({ 
          id: r.id, 
          title: r.title, 
          summary: r.summary,
          language: r.language 
        })));
        return;
      }
      // Attempt to import sample catalog then search again
      await catalogClient.importSample();
      const res2 = await catalogClient.search({});
      const pool = (res2?.results || []).map((r: any) => ({ 
        id: r.id, 
        title: r.title, 
        summary: r.summary,
        language: r.language 
      }));
      setCandidatePool(pool);
      
      // If still empty, something's wrong - ensure we always have candidates
      if (pool.length === 0) {
        console.warn('Candidate pool is empty after import, using fallback');
      }
    } catch (err) {
      console.error('Failed to prepare candidate pool', err);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      if (candidatePool.length === 0) {
        await ensureCandidatePool();
      }

      // Filter candidates by selected language
      let filteredCandidates = candidatePool;
      if (languageFilter !== 'all') {
        filteredCandidates = candidatePool.filter(c => c.language === languageFilter);
      }

      const candidate_ids = filteredCandidates.map((c) => c.id);
      
      // If still no candidates after ensuring pool, use fallback immediately
      if (candidate_ids.length === 0) {
        console.warn('No candidates available, showing fallback recommendations');
        setRecommendations([
          { item_id: '1', title: 'Quantum Computing Basics', score: 0.85, explanation: JSON.stringify({ emotion, reason: 'fallback' }), imageUrl: 'emoji:📘', description: 'A gentle intro to quantum information.' },
          { item_id: '2', title: 'Introduction to AI', score: 0.78, explanation: JSON.stringify({ emotion, reason: 'fallback' }), imageUrl: 'emoji:🤖', description: 'Core concepts and history of AI.' },
          { item_id: '3', title: 'Culture and Language', score: 0.72, explanation: JSON.stringify({ emotion, reason: 'fallback' }), imageUrl: 'emoji:🌏', description: 'Exploring culture in multilingual settings.' }
        ]);
        return;
      }

      const response = await advancedRecommenderClient.recommend({
        user_id: 'demo-user',
        user_context: {
          // Pass emotion; backend may use it in future weighting
          emotion,
          language: languageFilter !== 'all' ? languageFilter : undefined,
          // lightweight context placeholders for future use
          history: [],
          cultural_preferences: [],
        },
        candidate_ids,
        top_k: 5,
      });

      const poolMap = new Map(filteredCandidates.map((c) => [c.id, c]));
      const recs: Recommendation[] = (response.recommendations || []).map((r: any) => {
        const meta = poolMap.get(r.content_id);
        const title = meta?.title || r.content_id;
        const description = meta?.summary || '';
        // prefer overall_score; if absent, fallback to confidence
        const score = typeof r.overall_score === 'number' ? r.overall_score : (r.confidence ?? 0.5);
        const explanation = r.explanation ? JSON.stringify(r.explanation) : '';
        return {
          item_id: r.content_id,
          title,
          score,
          explanation,
          description,
          imageUrl: undefined,
        };
      });
      // attach simple placeholders if no image
      const placeholders = [
        '📘','📙','📗','📕','📓'
      ];
      setRecommendations(
        recs.map((r, i) => ({
          ...r,
          imageUrl: r.imageUrl || `emoji:${placeholders[i % placeholders.length]}`
        }))
      );
    } catch (err) {
      console.error('Failed to load recommendations', err);
      // Fallback mock data with emotion
      setRecommendations([
        { item_id: '1', title: 'Quantum Computing Basics', score: 0.85, explanation: JSON.stringify({ emotion, reason: 'error-fallback' }), imageUrl: 'emoji:📘', description: 'A gentle intro to quantum information.' },
        { item_id: '2', title: 'Introduction to AI', score: 0.78, explanation: JSON.stringify({ emotion, reason: 'error-fallback' }), imageUrl: 'emoji:🤖', description: 'Core concepts and history of AI.' },
        { item_id: '3', title: 'Culture and Language', score: 0.72, explanation: JSON.stringify({ emotion, reason: 'error-fallback' }), imageUrl: 'emoji:🌏', description: 'Exploring culture in multilingual settings.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t('recommendedForYou')}</h1>
          {moodSource !== 'manual' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              ✨ {t('basedOnEmotionAI')} ({moodSource === 'camera' ? t('cameraDetection') : t('textEmotionAnalysis')})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            {t('emotion')}
          </label>
          <select
            value={emotion}
            onChange={(e) => { setEmotion(e.target.value); useEmotionStore.getState().setEmotion(e.target.value as any, 'manual'); }}
            className="px-3 py-2 border rounded"
            aria-label={t('emotion')}
          >
            <option value="happy">{t('moodHappy')}</option>
            <option value="curious">{t('moodCurious')}</option>
            <option value="stressed">{t('moodStressed')}</option>
            <option value="tired">{t('moodTired')}</option>
          </select>
          
          <label className="text-sm text-gray-600 dark:text-gray-300 ml-2">
            {t('languageLabel')}
          </label>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-3 py-2 border rounded"
            aria-label={t('languageLabel')}
          >
            <option value="all">{language === 'zh' ? '全部語言' : 'All Languages'}</option>
            <option value="zh">{language === 'zh' ? '中文' : 'Chinese'}</option>
            <option value="en">{language === 'zh' ? '英文' : 'English'}</option>
            <option value="ja">{language === 'zh' ? '日文' : 'Japanese'}</option>
          </select>
          
          <Button onClick={loadRecommendations} disabled={loading}>
          {loading ? t('loading') : t('refresh')}
          </Button>
        </div>
      </div>

      {/* Objectives display removed (endpoint not available). Could be reintroduced when backend exposes objectives. */}

      <div className="space-y-4">
        {recommendations.length === 0 && !loading && (
          <Card>
            <p className="text-gray-500">{t('clickRefreshToLoad')}</p>
          </Card>
        )}

        {recommendations.map((rec) => (
          <Card key={rec.item_id}>
            <div className="flex items-start">
              {/* Thumbnail */}
              <div className="w-16 h-20 mr-4 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-700 overflow-hidden">
                {rec.imageUrl?.startsWith('emoji:') ? (
                  <span className="text-2xl">{rec.imageUrl.replace('emoji:','')}</span>
                ) : (
                  <img src={rec.imageUrl} alt={rec.title} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{rec.title}</h3>
                {rec.explanation && (() => {
                  try {
                    const exp = JSON.parse(rec.explanation);
                    return (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 space-y-1">
                        {exp.emotion && (
                          <p>
                            <span className="font-medium">{language === 'zh' ? '情緒匹配' : 'Emotion'}:</span> {exp.emotion}
                            {exp.bias === 'emotion-match' && (
                              <span className="ml-2 text-emerald-600 dark:text-emerald-400 text-xs">
                                ✨ {language === 'zh' ? '符合您的心情' : 'Matches your mood'}
                              </span>
                            )}
                          </p>
                        )}
                        {exp.reason && exp.reason !== 'demo' && (
                          <p className="text-xs">{language === 'zh' ? '理由' : 'Reason'}: {exp.reason}</p>
                        )}
                      </div>
                    );
                  } catch {
                    return (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rec.explanation}
                      </p>
                    );
                  }
                })()}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {t('confidence')}: {(rec.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <Button variant="secondary" className="ml-4" onClick={() => setSelected(rec)}>
                {t('viewDetails')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-20 h-28 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-700 overflow-hidden">
                {selected.imageUrl?.startsWith('emoji:') ? (
                  <span className="text-3xl">{selected.imageUrl.replace('emoji:','')}</span>
                ) : (
                  <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{selected.title}</h3>
                {selected.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{selected.description}</p>
                )}
                {selected.explanation && (() => {
                  try {
                    const exp = JSON.parse(selected.explanation);
                    return (
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {exp.emotion && (
                          <p>
                            <span className="font-medium">{language === 'zh' ? '情緒匹配' : 'Emotion'}:</span> {exp.emotion}
                            {exp.bias === 'emotion-match' && (
                              <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                                ✨ {language === 'zh' ? '符合您的心情' : 'Matches your mood'}
                              </span>
                            )}
                          </p>
                        )}
                        {exp.reason && exp.reason !== 'demo' && (
                          <p>{language === 'zh' ? '理由' : 'Reason'}: {exp.reason}</p>
                        )}
                      </div>
                    );
                  } catch {
                    return (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selected.explanation}</p>
                    );
                  }
                })()}
                {/* Chapters */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{t('chapters') as any}</h4>
                    <button className="text-sm underline" onClick={async () => {
                      try {
                        const res = await catalogClient.listChapters(selected.item_id);
                        setChapters((res.chapters || []).map(ch => ({
                          ...ch,
                          podcast_url: ch.podcast_url ?? undefined
                        })));
                      } catch (e) { console.error(e); }
                    }}>{t('refresh')}</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-auto pr-1">
                    {chapters.length === 0 && (
                      <div className="text-sm text-gray-500">{t('noChapters') as any}</div>
                    )}
                    {chapters.map(ch => (
                      <div key={ch.id} className="border rounded p-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{ch.chapter_number}. {ch.title}</div>
                            {!ch.is_preview && (<div className="text-xs text-gray-500">{language === 'zh' ? '鎖定' : 'Locked'}</div>)}
                          </div>
                          <div className="flex items-center gap-2">
                            {ch.podcast_url ? (
                              <audio controls src={ch.podcast_url} className="w-48" />
                            ) : (
                              <button className="text-sm underline" onClick={async () => {
                                try {
                                  const res = await catalogClient.generateChapterPodcast(ch.id);
                                  // refresh list
                                  const res2 = await catalogClient.listChapters(selected.item_id);
                                  setChapters((res2.chapters || []).map(ch => ({
                                    ...ch,
                                    podcast_url: ch.podcast_url ?? undefined
                                  })));
                                } catch (e) { alert('TTS 未設定或生成失敗'); }
                              }}>{language === 'zh' ? '試聽' : 'Preview'}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Unlock UI */}
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="secondary" onClick={async () => {
                      try {
                        const res = await purchaseClient.create({ user_id: 'demo-user', book_id: selected.item_id, amount: 0, currency: 'USD' });
                        if (res.unlock_code) {
                          setUnlockCode(res.unlock_code);
                        } else {
                          alert('取得解鎖碼失敗');
                        }
                      } catch (e) {
                        alert('取得解鎖碼失敗');
                      }
                    }}>{t('getUnlockCode') as any}</Button>
                    <input className="border rounded px-2 py-1 flex-1" placeholder={t('enterUnlockCode') as any} value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} />
                    <Button onClick={async () => {
                      try {
                        const res = await purchaseClient.unlock(selected.item_id, unlockCode, 'demo-user');
                        if (res.unlocked) {
                          const res2 = await catalogClient.listChapters(selected.item_id);
                          setChapters((res2.chapters || []).map(ch => ({
                            ...ch,
                            podcast_url: ch.podcast_url ?? undefined
                          })));
                          setUnlockCode('');
                        } else {
                          alert('解鎖失敗: ' + res.status);
                        }
                      } catch (e) { alert('解鎖失敗'); }
                    }}>{t('unlock') as any}</Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Button variant="secondary" onClick={() => setSelected(null)}>{t('close')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Audiobook preview integrated above with subtle background; no separate sections */}
    </div>
  );
};

interface BookItem {
  id: string;
  title: string;
  authors?: string[];
  summary?: string;
  topics?: string[];
  language?: string;
  metadata?: {
    isbn?: string;
    reading_level?: string;
    [key: string]: any;
  };
}

function AudiobookList({ items, mood }: { items: Array<BookItem>, mood: EmotionMood }) {
  const { t } = useI18n();
  const uiLang = useI18n((s) => s.language);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const timerRef = React.useRef<number | null>(null);
  
  const speakOneMinute = (id: string, title: string, summary?: string) => {
    // Build a ~60s intro script (~700-900 chars, rough estimate)
    const base = summary && summary.length > 200 ? summary : `${title} — ${summary || ''}`.trim();
    const filler = '。';
    let script = base;
    while (script.length < 750) script += filler + base.slice(0, Math.max(20, Math.min(100, base.length)));
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(script);
    const voices = window.speechSynthesis.getVoices();
    const pickBy = (prefix: string) => voices.find(v => v.lang?.toLowerCase().startsWith(prefix));
    const lang = (useI18n as any)((s: any) => s.language) as string;
    const v = pickBy(lang) || pickBy(lang.slice(0,2)) || pickBy('zh') || pickBy('ja') || pickBy('en') || voices[0];
    if (lang === 'zh') u.lang = 'zh-TW'; else if (lang === 'ja') u.lang = 'ja-JP'; else u.lang = 'en-US';
    if (v) u.voice = v;
    
    // Optional soft companion music using WebAudio (no separate section)
    let audioCtx: AudioContext | null = null;
    let gain: GainNode | null = null;
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      gain = audioCtx.createGain();
  // Base frequency
  const base = 261.63;
      osc.type = 'sine';
      osc.frequency.value = base;
      // very low volume ambient
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      // gentle pitch drift every few seconds
      const interval = setInterval(() => {
        try { osc.frequency.value = base + Math.random() * 10 - 5; } catch {}
      }, 3000);
      // stop on finish
      u.onend = () => {
        try { if (interval) clearInterval(interval); } catch {}
        try { if (audioCtx && gain) { gain.disconnect(); audioCtx.close(); } } catch {}
        setSpeakingId(null);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } catch {
      // ignore WebAudio failures
      u.onend = () => {
        setSpeakingId(null);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    // Set up 60-second timer
    setTimeRemaining(60);
    setSpeakingId(id);
    
    let elapsed = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setTimeRemaining(60 - elapsed);
      if (elapsed >= 60) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);
    
    window.speechSynthesis.speak(u);
  };
  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  // Translate title and summary based on UI language
  const localizeBook = (book: BookItem) => {
    // Try to translate; if no translation exists, keep original
    const localTitle = (t as any)(book.title) || book.title;
    const localSummary = book.summary ? ((t as any)(book.summary) || book.summary) : '';
    return { ...book, title: localTitle, summary: localSummary };
  };

  // Filter books by search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(book => {
      const localized = localizeBook(book);
      return (
        localized.title.toLowerCase().includes(q) ||
        (localized.summary || '').toLowerCase().includes(q) ||
        (book.authors || []).some(a => a.toLowerCase().includes(q)) ||
        (book.topics || []).some(t => t.toLowerCase().includes(q)) ||
        (book.metadata?.keywords || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  const displayItems = filteredItems.slice(0, 6);

  const speak = (id: string, text: string) => {
    // Stop current
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    // Pick voice matching UI language; fallback chain
    const voices = window.speechSynthesis.getVoices();
    const pickBy = (prefix: string) => voices.find(v => v.lang?.toLowerCase().startsWith(prefix));
    const voice = pickBy(uiLang) || pickBy(uiLang.slice(0,2)) || pickBy('zh') || pickBy('ja') || pickBy('en') || voices[0];
    if (uiLang === 'zh') utter.lang = 'zh-TW';
    else if (uiLang === 'ja') utter.lang = 'ja-JP';
    else utter.lang = 'en-US';
    if (voice) utter.voice = voice;
    utter.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Book grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {displayItems.map((it) => {
          const localized = localizeBook(it);
          return (
            <Card key={`ab-${it.id}`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{localized.title}</div>
                    {it.authors && it.authors.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {t('authors')}: {it.authors.join(', ')}
                      </div>
                    )}
                    {it.metadata?.isbn && (
                      <div className="text-xs text-gray-500">
                        ISBN: {it.metadata.isbn}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {speakingId === it.id ? (
                      <Button variant="secondary" onClick={stop} className="text-xs px-2 py-1">{t('stop')}</Button>
                    ) : (
                      <Button onClick={() => speak(it.id, localized.summary || localized.title)} className="text-xs px-2 py-1">{t('playSample')}</Button>
                    )}
                    <Button variant="secondary" onClick={() => setSelectedBook(it)} className="text-xs px-2 py-1">{t('viewDetails')}</Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && searchQuery && (
        <div className="text-center text-gray-500 py-4">找不到符合的書籍</div>
      )}

      {/* Detail modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBook(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const localized = localizeBook(selectedBook);
              return (
                <>
                  <h3 className="text-xl font-bold mb-2">{localized.title}</h3>
                  {selectedBook.authors && selectedBook.authors.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {t('authors')}: {selectedBook.authors.join(', ')}
                    </div>
                  )}
                  {selectedBook.metadata?.isbn && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      ISBN: {selectedBook.metadata.isbn}
                    </div>
                  )}
                  {selectedBook.language && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {t('languageLabel')}: {selectedBook.language}
                    </div>
                  )}
                  {selectedBook.topics && selectedBook.topics.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      主題: {selectedBook.topics.join(', ')}
                    </div>
                  )}
                  {localized.summary && (
                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">{localized.summary}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => setSelectedBook(null)}>{t('close')}</Button>
                    {speakingId === selectedBook.id ? (
                      <Button onClick={stop}>{t('stop')}</Button>
                    ) : (
                      <Button onClick={() => speak(selectedBook.id, localized.summary || localized.title)}>{t('playSample')}</Button>
                    )}
                    {speakingId === `${selectedBook.id}-1min` ? (
                      <div className="flex items-center gap-2">
                        <Button onClick={stopSpeaking}>{t('stop')}</Button>
                        <span className="text-sm font-mono px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                          ⏱️ {timeRemaining}s
                        </span>
                      </div>
                    ) : (
                      <Button variant="secondary" onClick={() => speakOneMinute(`${selectedBook.id}-1min`, localized.title, localized.summary)}>
                        🎧 60 {uiLang === 'zh' ? '秒試聽' : 'sec preview'}
                      </Button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanionMusic({ mood }: { mood: EmotionMood }) {
  // Immersive ambient generator using Web Audio API (no external links)
  const { t } = useI18n();
  const ctxRef = React.useRef<AudioContext | null>(null);
  const stopRef = React.useRef<() => void>(() => {});
  const [playing, setPlaying] = useState<string | null>(null);

  const ensureCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctxRef.current!;
  };

  const makeNoiseNode = (ctx: AudioContext, kind: 'white'|'pink'|'brown') => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    if (kind === 'white') {
      for (let i=0;i<bufferSize;i++) output[i] = Math.random()*2-1;
    } else if (kind === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i=0;i<bufferSize;i++) {
        const white = Math.random()*2-1;
        b0 = 0.99886*b0 + white*0.0555179;
        b1 = 0.99332*b1 + white*0.0750759;
        b2 = 0.96900*b2 + white*0.1538520;
        b3 = 0.86650*b3 + white*0.3104856;
        b4 = 0.55000*b4 + white*0.5329522;
        b5 = -0.7616*b5 - white*0.0168980;
        output[i] = (b0+b1+b2+b3+b4+b5+b6 + white*0.5362)*0.11;
        b6 = white*0.115926;
      }
    } else { // brown
      let lastOut = 0;
      for (let i=0;i<bufferSize;i++) {
        const white = Math.random()*2-1;
        output[i] = (lastOut + (0.02*white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
    const node = ctx.createBufferSource();
    node.buffer = noiseBuffer;
    node.loop = true;
    return node;
  };

  const playPreset = (preset: string) => {
    try { stopRef.current(); } catch {}
    const ctx = ensureCtx();
    const master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);

    let src: AudioNode = master;
    const chain: AudioNode[] = [];

    const add = (n: AudioNode) => {
      const head = chain[chain.length-1] || null;
      if (head) head.connect(n);
      chain.push(n);
    };

    // Build by mood/preset
    const noiseType = preset.includes('rain') ? 'pink' : preset.includes('focus') ? 'brown' : 'white';
    const noise = makeNoiseNode(ctx, noiseType as any);
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = preset.includes('rain') ? 0.25 : 0.15;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = preset.includes('focus') ? 600 : 1200;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 50;

    noise.connect(noiseGain);
    noiseGain.connect(lp);
    lp.connect(hp);
    hp.connect(master);
    (src as any) = noise;

    noise.start();
    setPlaying(preset);
    stopRef.current = () => {
      try { noise.stop(); } catch {}
      try { master.disconnect(); } catch {}
      setPlaying(null);
    };
  };

  const presetsByMood: Record<EmotionMood, Array<{ key: string; labelKey: TranslationKey }>> = {
    happy: [
      { key: 'focus-lofi', labelKey: 'lofiFocus' },
      { key: 'soft-rain', labelKey: 'softRain' },
    ],
    curious: [
      { key: 'focus-lofi', labelKey: 'lofiFocus' },
      { key: 'soft-rain', labelKey: 'softRain' },
    ],
    stressed: [
      { key: 'soft-rain', labelKey: 'softRain' },
      { key: 'calm-noise', labelKey: 'calmNoise' },
    ],
    tired: [
      { key: 'soft-rain', labelKey: 'softRain' },
      { key: 'calm-noise', labelKey: 'calmNoise' },
    ],
  };

  const play = (k: string) => {
    if (playing === k) { stopRef.current(); return; }
    playPreset(k);
  };

  React.useEffect(() => () => { try { stopRef.current(); } catch {} }, []);

  const list = presetsByMood[mood];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {list.map((p, i) => (
        <Card key={`amb-${i}`}>
          <div className="flex items-center justify-between">
            <div className="font-medium">{t(p.labelKey)}</div>
            <Button onClick={() => play(p.key)} variant={playing===p.key? 'secondary': undefined}>
              {playing===p.key ? t('stop') : t('playSample')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { indigenousClient, audioClient, ragClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { HandwritingCanvas } from '../components/HandwritingCanvas';

interface Language {
  code: string;
  name: string;
}

interface RecognitionResult {
  recognized_text: string;
  romanized_text: string;
  confidence: number;
  alternative_readings: Array<{ text: string; confidence: number }>;
  processing_time_ms: number;
}

interface PronunciationResult {
  overall_score: number;
  fluency: number;
  pronunciation: number;
  completeness: number;
  phoneme_scores: Array<{ phoneme: string; score: number; feedback: string }>;
  suggestions: string[];
}

export default function IndigenousLanguagePage() {
  const { t } = useI18n();
  const uiLang = useI18n((s) => s.language);
  const localName = (code: string, fallback: string) => {
    const zh: Record<string,string> = {
      ami: '阿美語', pwn: '排灣語', trv: '太魯閣語', tay: '泰雅語', bnn: '布農語', pyu: '卑南語',
      dru: '魯凱語', tsu: '鄒語', xsy: '賽夏語', tao: '達悟語（雅美語）', ssf: '邵語', ckv: '噶瑪蘭語', szy: '撒奇萊雅語'
    };
    const ja: Record<string,string> = {
      ami: 'アミ語', pwn: 'パイワン語', trv: 'タロコ語', tay: 'タイヤル語', bnn: 'ブヌン語', pyu: 'プユマ語',
      dru: 'ルカイ語', tsu: 'ツォウ語', xsy: 'サイシャット語', tao: 'ヤミ（タオ）語', ssf: 'サオ語', ckv: 'カバラン語', szy: 'サキザヤ語'
    };
    const en: Record<string,string> = {
      ami: 'Amis', pwn: 'Paiwan', trv: 'Truku', tay: 'Atayal', bnn: 'Bunun', pyu: 'Puyuma',
      dru: 'Rukai', tsu: 'Tsou', xsy: 'Saisiyat', tao: 'Tao (Yami)', ssf: 'Thao', ckv: 'Kavalan', szy: 'Sakizaya'
    };
    if (uiLang === 'zh') return zh[code] || fallback;
    if (uiLang === 'ja') return ja[code] || fallback;
    if (uiLang === 'en') return en[code] || fallback;
    return fallback;
  };

  const displayName = (lang: Language) => {
    const base = localName(lang.code, lang.name);
    // Remove duplicated parenthetical like "Sakizaya (Sakizaya)"
    const m = base.match(/^(.*?)\s*\((.*?)\)\s*$/);
    if (m && m[1] && m[2] && m[1].trim().toLowerCase() === m[2].trim().toLowerCase()) {
      return m[1];
    }
    return base;
  };
  
  // State management
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('ami');
  const [activeTab, setActiveTab] = useState<'handwriting' | 'pronunciation'>('handwriting');
  
  // Handwriting recognition state
  const [handwritingMode, setHandwritingMode] = useState<'upload' | 'draw'>('upload');
  const [handwritingFile, setHandwritingFile] = useState<File | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [recognitionLoading, setRecognitionLoading] = useState(false);
  const [romanizationInput, setRomanizationInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  
  // Pronunciation training state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [speakerId, setSpeakerId] = useState('speaker-001');
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [pronunciationLoading, setPronunciationLoading] = useState(false);
  // Knowledge base upload state
  const [kbFile, setKbFile] = useState<File | null>(null);
  const [kbText, setKbText] = useState('');
  const [kbLoading, setKbLoading] = useState(false);
  const [kbDocs, setKbDocs] = useState<Array<{ name: string; size: number; type: string; language?: string; time: string }>>([]);

  // Load languages on mount
  useEffect(() => {
    indigenousClient
      .listLanguages()
  .then((list: Language[]) => {
        // If backend currently returns mostly Taiwan languages, enrich with a small global set for demo breadth
        const extras: Language[] = [
          { code: 'mi', name: 'Maori (Māori)' },
          { code: 'haw', name: 'Hawaiian (ʻŌlelo Hawaiʻi)' },
          { code: 'nv', name: 'Navajo (Diné bizaad)' },
          { code: 'qu', name: 'Quechua (Runa Simi)' },
          { code: 'gn', name: "Guarani (Avañe'ẽ)" },
          { code: 'ay', name: 'Aymara' },
          { code: 'iu', name: 'Inuktitut (ᐃᓄᒃᑎᑐᑦ)' },
          { code: 'se', name: 'Northern Sami (Davvisámegiella)' },
          { code: 'sw', name: 'Swahili (Kiswahili)' },
          { code: 'zu', name: 'Zulu (isiZulu)' },
          { code: 'eu', name: 'Basque (Euskara)' },
          { code: 'cy', name: 'Welsh (Cymraeg)' },
          { code: 'hmn', name: 'Hmong (Hmoob)' },
          { code: 'bo', name: 'Tibetan (བོད་སྐད་)' },
          { code: 'ug', name: 'Uyghur (ئۇيغۇرچە)' },
        ];
        let merged = list;
        if (list.length < 20) {
          const existing = new Set(list.map((l) => l.code));
          merged = list.concat(extras.filter((e) => !existing.has(e.code)));
        }
        // Localize names where possible
        const localized = merged.map((l) => {
          const code = (l.code || '').toLowerCase();
          return { code, name: localName(code, l.name) };
        });
        setLanguages(localized);
      })
      .catch(console.error);
    // load KB docs
    try {
      const raw = localStorage.getItem('mr_kb_docs');
      if (raw) setKbDocs(JSON.parse(raw));
    } catch {}
  }, []);

  // Add custom language state
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newFamily, setNewFamily] = useState("");
  const [newScript, setNewScript] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddLanguage = async () => {
    if (!newCode || !newName) return;
    try {
      setSaving(true);
      await indigenousClient.createLanguage({
        code: newCode.trim(),
        name: newName.trim(),
        region: newRegion || undefined,
        family: newFamily || undefined,
        script: newScript || undefined,
      });
      const list: Language[] = await indigenousClient.listLanguages();
      setLanguages(list);
      setSelectedLanguage(newCode.trim());
      // reset form
      setNewCode("");
      setNewName("");
      setNewRegion("");
      setNewFamily("");
      setNewScript("");
      setShowAdd(false);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add language");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAndSpeak = async () => {
    if (!recognitionResult) return;
    const text = romanizationInput.trim() || recognitionResult.romanized_text || recognitionResult.recognized_text;
    if (!text) return;
    try {
      setSpeaking(true);
      // 1) 合成語音並播放（讓學習者立即聽到）
      const result = await audioClient.synthesize({ text, language: selectedLanguage });
      const audio = new Audio(result.audio_url);
      await audio.play();

      // 2) 將結果送入 RAG 作為學習樣本（讓 LLM/RAG 知道並學習）
      const content = `handwriting_sample\nlanguage=${selectedLanguage}\nrecognized=${recognitionResult.recognized_text}\nromanization=${text}`;
      await ragClient.ingest({
        content,
        metadata: {
          source: "user_handwriting_training",
          language: selectedLanguage,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (e) {
      console.error(e);
      alert(t('error'));
    } finally {
      setSpeaking(false);
    }
  };

  const handleHandwritingRecognition = async () => {
    if (!handwritingFile) return;
    
    setRecognitionLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', handwritingFile);
      formData.append('language', selectedLanguage);
      formData.append('auto_romanize', 'true');
      
      const result = await indigenousClient.recognizeHandwriting(formData);
      setRecognitionResult(result);
    } catch (error) {
      console.error('Recognition failed:', error);
      alert('Recognition failed. Please try again.');
    } finally {
      setRecognitionLoading(false);
    }
  };

  const handlePronunciationAssessment = async () => {
    if (!audioFile || !transcript) return;
    
    setPronunciationLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('reference_text', transcript);
      formData.append('language', selectedLanguage);
      
      const result = await indigenousClient.assessPronunciation(formData);
      setPronunciationResult(result);
    } catch (error) {
      console.error('Assessment failed:', error);
      alert('Assessment failed. Please try again.');
    } finally {
      setPronunciationLoading(false);
    }
  };

  const handleKbIngest = async () => {
    if (!kbText.trim() && !kbFile) return;
    setKbLoading(true);
    try {
      if (kbText.trim()) {
        await ragClient.ingest({
          content: kbText,
          metadata: { source: 'indigenous_page_text', language: selectedLanguage },
          collection_name: 'user_kb'
        });
      }
      if (kbFile) {
        let content = '';
        if (kbFile.type.startsWith('text/')) {
          content = await kbFile.text();
        } else {
          content = `uploaded_file:${kbFile.name} (${kbFile.type || 'binary'}, ${kbFile.size} bytes)`;
        }
        await ragClient.ingest({
          content,
          metadata: { source: 'indigenous_page_file', filename: kbFile.name, size: kbFile.size, type: kbFile.type || 'file', language: selectedLanguage },
          collection_name: 'user_kb'
        });
        const entry = { name: kbFile.name, size: kbFile.size, type: kbFile.type || 'file', language: selectedLanguage, time: new Date().toISOString() };
        const next = [entry, ...kbDocs].slice(0, 50);
        setKbDocs(next);
        try { localStorage.setItem('mr_kb_docs', JSON.stringify(next)); } catch {}
        setKbFile(null);
      }
      setKbText('');
    } catch (e) {
      alert('加入知識庫失敗');
    } finally {
      setKbLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            🏔️ {t('indigenousTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t('indigenousSubtitle')}
          </p>
        </div>

        {/* Language Selector + Add Custom */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
          <label htmlFor="language-select" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t('selectLanguage')}
          </label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {languages.length > 0 ? (
              languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{displayName(lang)}</option>
              ))
            ) : (
              <>
                <option value="ami">Amis 阿美語</option>
                <option value="tay">Atayal 泰雅語</option>
                <option value="pwn">Paiwan 排灣語</option>
                <option value="bnn">Bunun 布農語</option>
                <option value="pyu">Puyuma 卑南語</option>
                <option value="dru">Rukai 魯凱語</option>
                <option value="tsu">Tsou 鄒語</option>
                <option value="xsy">Saisiyat 賽夏語</option>
                <option value="tao">Yami (Tao) 雅美語</option>
                <option value="ssf">Thao 邵語</option>
                <option value="ckv">Kavalan 噶瑪蘭語</option>
                <option value="trv">Truku 太魯閣語</option>
                <option value="szy">Sakizaya 撒奇萊雅語</option>
              </>
            )}
          </select>
          <div className="mt-4">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-sm text-amber-700 hover:text-amber-800 dark:text-amber-400"
            >
              {showAdd ? '－ 隱藏新增語言' : '＋ 新增自訂語言'}
            </button>
          </div>

          {showAdd && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">語言代碼 (必填)</label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="如: njo, yua, nav"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">語言名稱 (必填)</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="如: Ngawo, Yucatec Maya"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">地區</label>
                <input
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="如: Mexico, Pacific, East Asia"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">語系</label>
                <input
                  value={newFamily}
                  onChange={(e) => setNewFamily(e.target.value)}
                  placeholder="如: Austronesian, Mayan"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">文字</label>
                <input
                  value={newScript}
                  onChange={(e) => setNewScript(e.target.value)}
                  placeholder="如: Latin, Syllabary"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={handleAddLanguage}
                  disabled={!newCode || !newName || saving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50"
                >
                  {saving ? '儲存中…' : '新增語言'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('handwriting')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'handwriting'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-100'
            }`}
          >
            ✍️ {t('handwritingRecognition')}
          </button>
          <button
            onClick={() => setActiveTab('pronunciation')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'pronunciation'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-100'
            }`}
          >
            🎤 {t('pronunciationTraining')}
          </button>
        </div>

        {/* Handwriting Recognition Tab */}
        {activeTab === 'handwriting' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              {t('handwritingRecognition')}
            </h2>
            
            {/* Tab selector: Upload or Draw */}
            <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setHandwritingMode('upload')}
                className={`pb-2 px-4 font-semibold ${
                  handwritingMode === 'upload'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-500'
                }`}
              >
                📤 {uiLang === 'zh' ? '上傳圖片' : 'Upload Image'}
              </button>
              <button
                onClick={() => setHandwritingMode('draw')}
                className={`pb-2 px-4 font-semibold ${
                  handwritingMode === 'draw'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-500'
                }`}
              >
                ✍️ {uiLang === 'zh' ? '手寫繪製' : 'Draw'}
              </button>
            </div>

            {handwritingMode === 'upload' ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {uiLang === 'zh' ? '上傳手寫圖片' : 'Upload Handwritten Image'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHandwritingFile(e.target.files?.[0] || null)}
                  aria-label="Upload Handwritten Image"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {uiLang === 'zh' ? '在下方繪製手寫文字' : 'Draw handwritten text below'}
                </label>
                <HandwritingCanvas
                  onSubmit={(dataUrl) => {
                    // Convert data URL to File
                    fetch(dataUrl)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], 'handwriting.png', { type: 'image/png' });
                        setHandwritingFile(file);
                      });
                  }}
                />
              </div>
            )}

            <button
              onClick={handleHandwritingRecognition}
              disabled={!handwritingFile || recognitionLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recognitionLoading ? '🔄 Recognizing...' : '🔍 Recognize Handwriting'}
            </button>

            {recognitionResult && (
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    ✅ Recognized Text
                  </h3>
                  <p className="text-2xl font-mono text-gray-900 dark:text-white">
                    {recognitionResult.recognized_text}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    📝 Romanized Text
                  </h3>
                  <p className="text-xl font-mono text-gray-900 dark:text-white">
                    {recognitionResult.romanized_text}
                  </p>
                </div>

                {/* 使用者輸入拼音/羅馬字並完成＋發音 */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    ✍️ 輸入拼音/羅馬字（可修正）
                  </h3>
                  <div className="flex gap-3 items-center">
                    <input
                      value={romanizationInput}
                      onChange={(e) => setRomanizationInput(e.target.value)}
                      placeholder="例如: Nga'ay ho"
                      className="flex-1 p-2 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleConfirmAndSpeak}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50"
                      disabled={speaking}
                    >
                      {speaking ? '🔊 播放中…' : '✅ 完成並發音'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
                    完成後會：1) 朗讀此拼音，2) 將此筆記錄送入學習庫（RAG），幫助 AI 更了解此語言。
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(recognitionResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processing Time</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {recognitionResult.processing_time_ms.toFixed(0)}ms
                    </p>
                  </div>
                </div>

                {recognitionResult.alternative_readings.length > 1 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      🔄 Alternative Readings
                    </h3>
                    <ul className="space-y-2">
                      {recognitionResult.alternative_readings.slice(1).map((alt, idx) => (
                        <li key={idx} className="flex justify-between items-center">
                          <span className="font-mono text-gray-900 dark:text-white">{alt.text}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {(alt.confidence * 100).toFixed(1)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Knowledge Base Upload (Text/File) */}
            <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">📥 加入到知識庫（此語言）</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">可貼上文字或上傳 PDF/文字/圖片，作為 {localName(selectedLanguage, selectedLanguage)} 的學習素材。</p>
              <textarea
                value={kbText}
                onChange={(e) => setKbText(e.target.value)}
                placeholder="貼上段落、句子或筆記（可選）"
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
              />
              <input
                type="file"
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => setKbFile(e.target.files?.[0] || null)}
                aria-label="Upload file to indigenous KB"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              {kbFile && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">準備上傳：{kbFile.name}（{(kbFile.size/1024).toFixed(1)} KB）</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleKbIngest}
                  disabled={kbLoading || (!kbText.trim() && !kbFile)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50"
                >{kbLoading ? '處理中…' : '加入到知識庫'}</button>
                <button
                  onClick={() => { setKbText(''); setKbFile(null); }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                >清除</button>
              </div>

              {/* Local KB list (shared with AI Assistant via localStorage) */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">我的知識庫（最近）</h4>
                {kbDocs.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">目前尚無資料，請先加入內容。</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded border border-gray-200 dark:border-gray-700">
                    {kbDocs.slice(0,8).map((d, i) => (
                      <li key={i} className="p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{d.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{d.language ? `${localName(d.language, d.language)} · ` : ''}{d.type || 'file'} · {(d.size/1024).toFixed(1)} KB · {new Date(d.time).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pronunciation Training Tab */}
        {activeTab === 'pronunciation' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              {t('pronunciationTraining')}
            </h2>
            
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Upload Audio Recording
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  aria-label="Upload Audio Recording"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Reference Text (What you're pronouncing)
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Enter the text you're pronouncing..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Speaker ID (for training)
                </label>
                <input
                  type="text"
                  value={speakerId}
                  onChange={(e) => setSpeakerId(e.target.value)}
                  aria-label="Speaker ID"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handlePronunciationAssessment}
              disabled={!audioFile || !transcript || pronunciationLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pronunciationLoading ? '🔄 Assessing...' : '🎯 Assess Pronunciation'}
            </button>

            {pronunciationResult && (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800 dark:text-purple-300 mb-1">Overall Score</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(pronunciationResult.overall_score * 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">Fluency</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {(pronunciationResult.fluency * 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 dark:text-green-300 mb-1">Pronunciation</p>
                    <p className="text-3xl font-bold text-green-600">
                      {(pronunciationResult.pronunciation * 100).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800 dark:text-amber-300 mb-1">Completeness</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {(pronunciationResult.completeness * 100).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4 text-lg">
                    🎯 Phoneme-level Feedback
                  </h3>
                  <div className="space-y-3">
                    {pronunciationResult.phoneme_scores.map((phoneme, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0 w-16">
                          <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                            {phoneme.phoneme}
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {(phoneme.score * 100).toFixed(0)}%
                          </p>
                        </div>
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                          {phoneme.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-lg">
                    💡 Improvement Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {pronunciationResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
              {t('featureHandwritingTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('featureHandwritingDesc')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
              {t('featurePronunciationTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('featurePronunciationDesc')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
              {t('featureLLMDataTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('featureLLMDataDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

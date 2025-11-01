import { useState } from 'react';
import { indigenousClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';

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
  
  // State management
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('ami');
  const [activeTab, setActiveTab] = useState<'handwriting' | 'pronunciation'>('handwriting');
  
  // Handwriting recognition state
  const [handwritingFile, setHandwritingFile] = useState<File | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [recognitionLoading, setRecognitionLoading] = useState(false);
  
  // Pronunciation training state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [speakerId, setSpeakerId] = useState('speaker-001');
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [pronunciationLoading, setPronunciationLoading] = useState(false);

  // Load languages on mount
  useState(() => {
    indigenousClient.listLanguages().then(setLanguages).catch(console.error);
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            🏔️ Taiwan Indigenous Languages
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            16 Indigenous Languages • Handwriting Recognition • Pronunciation Training
          </p>
        </div>

        {/* Language Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Select Language / 選擇語言
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
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
          </select>
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
            ✍️ Handwriting Recognition
          </button>
          <button
            onClick={() => setActiveTab('pronunciation')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'pronunciation'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-100'
            }`}
          >
            🎤 Pronunciation Training
          </button>
        </div>

        {/* Handwriting Recognition Tab */}
        {activeTab === 'handwriting' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Handwritten Text Recognition
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Upload Handwritten Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setHandwritingFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

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
          </div>
        )}

        {/* Pronunciation Training Tab */}
        {activeTab === 'pronunciation' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Pronunciation Assessment
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
              Handwriting Recognition
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Convert handwritten indigenous text to digital format with automatic romanization
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
              Pronunciation Training
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get real-time feedback on your pronunciation with AI-powered assessment
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
              LLM Training Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your recordings help train better AI models for indigenous language preservation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

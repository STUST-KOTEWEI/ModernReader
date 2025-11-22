/**
 * Indigenous Language AI Chatbot
 * 
 * Features:
 * - Chat in 100+ indigenous languages
 * - Real-time translation and pronunciation
 * - Cultural context awareness
 * - LLM fine-tuning management
 * - Voice input/output
 */

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/useI18n';
import {
  Send,
  Mic,
  Volume2,
  Globe,
  Brain,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
  Image as ImageIcon,
  Square,
  XCircle,
} from 'lucide-react';
import { aiClient, indigenousChatClient } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  translation?: string;
  pronunciation?: string;
  culturalContext?: string;
  relatedPhrases?: string[];
  timestamp: string;
  attachments?: {
    imagePreview?: string;
    audioTranscript?: string;
  };
  mediaContext?: {
    imageSummary?: string;
    audioTranscript?: string;
    preferred_provider?: string;
  };
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  speakers: number;
  endangerment: string;
}

export default function IndigenousChatbotPage() {
  const { t } = useI18n();
  const uiLang = useI18n((s) => s.language);
  const localName = (code: string, fallback: string) => {
    const zh: Record<string,string> = {
      ami: '阿美語', pwn: '排灣語', trv: '太魯閣語', tay: '泰雅語', bnn: '布農語', pyu: '卑南語',
      dru: '魯凱語', tsu: '鄒語', xsy: '賽夏語', tao: '達悟語（雅美語）', ssf: '邵語', ckv: '噶瑪蘭語'
    };
    const ja: Record<string,string> = {
      ami: 'アミ語', pwn: 'パイワン語', trv: 'タロコ語', tay: 'タイヤル語', bnn: 'ブヌン語', pyu: 'プユマ語',
      dru: 'ルカイ語', tsu: 'ツォウ語', xsy: 'サイシャット語', tao: 'ヤミ（タオ）語', ssf: 'サオ語', ckv: 'カバラン語'
    };
    if (uiLang === 'zh') return zh[code] || fallback;
    if (uiLang === 'ja') return ja[code] || fallback;
    return fallback;
  };

  // State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('mi');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState(true);
  const [showCulturalNotes, setShowCulturalNotes] = useState(true);
  const [showPronunciation, setShowPronunciation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<{
    base64: string;
    dataUrl: string;
    mime: string;
  } | null>(null);
  const [audioAttachment, setAudioAttachment] = useState<{
    base64: string;
    mime: string;
    transcript?: string;
  } | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [llmProvider, setLlmProvider] = useState<string>('auto');
  const [availableProviders, setAvailableProviders] = useState<Array<{ id: string; label: string }>>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load languages on mount
  useEffect(() => {
    loadLanguages();
    loadStatistics();
    (async () => {
      try {
        const providers = await aiClient.listProviders();
        const usable = providers
          .filter((p) => p.available)
          .map((p) => ({ id: p.id, label: p.label }));
        setAvailableProviders(usable);
      } catch (error) {
        console.warn('Failed to load providers', error);
      }
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('mr_llm_provider');
          if (saved) {
            setLlmProvider(saved);
          }
        } catch {}
      }
    })();
    if (typeof window === 'undefined') {
      return () => {};
    }

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === 'mr_llm_provider' && event.newValue) {
        setLlmProvider(event.newValue);
      }
    };
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  // Auto-scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available languages
  const loadLanguages = async () => {
    try {
      const response = await indigenousChatClient.listLanguages();
      // response.languages may be string codes or objects; normalize and localize
      const list = (response.languages || []).map((it: any) => {
        if (typeof it === 'string') {
          const code = it.toLowerCase();
          return { code, name: localName(code, code.toUpperCase()), nativeName: code.toUpperCase(), region: '', speakers: 0, endangerment: 'unknown' };
        }
        const code = (it.code || '').toLowerCase();
        return { ...it, code, name: localName(code, it.name || code.toUpperCase()) };
      });
      setLanguages(list);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await indigenousChatClient.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (isLoading || audioUploading) return;

    const trimmed = inputMessage.trim();
    const audioText = audioAttachment?.transcript?.trim() || '';
    const voicePlaceholder = audioAttachment ? '[voice]' : '';
    const imagePlaceholder = imageAttachment ? '[image]' : '';
    const outgoingText = trimmed || audioText || imagePlaceholder || voicePlaceholder;

    if (!outgoingText) {
      setErrorText(t('typeMessagePlaceholder'));
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      message: outgoingText,
      timestamp: new Date().toISOString(),
      attachments: {
        imagePreview: imageAttachment?.dataUrl,
        audioTranscript: audioAttachment?.transcript,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      setErrorText('');
      const response = await indigenousChatClient.chat({
        message: outgoingText,
        language_code: selectedLanguage,
        session_id: sessionId || undefined,
        include_translation: showTranslation,
        include_cultural_notes: showCulturalNotes,
        include_pronunciation: showPronunciation,
        image_base64: imageAttachment?.base64,
        image_mime_type: imageAttachment?.mime,
        audio_base64: audioAttachment?.base64,
        audio_mime_type: audioAttachment?.mime,
        provider: llmProvider !== 'auto' ? llmProvider : undefined,
      });

      // Update session ID
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        message: response.message,
        translation: response.translation || undefined,
        pronunciation: response.pronunciation_guide || undefined,
        culturalContext: response.cultural_context || undefined,
        relatedPhrases: response.related_phrases || [],
        timestamp: response.timestamp,
        mediaContext: response.media_context || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setImageAttachment(null);
      setAudioAttachment(null);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Show inline, localized error instead of blocking alert
      const detail = error?.response?.data?.detail || '';
      setErrorText(`${t('failedToSendMessage')}${detail ? ` — ${detail}` : ''}`);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice recording & transcription
  const startRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorText('Voice recording is not supported in this browser.');
      return;
    }

    try {
      setErrorText('');
      setAudioAttachment(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        if (!blob.size) {
          setIsRecording(false);
          mediaRecorderRef.current = null;
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const result = reader.result as string | null;
          if (!result) {
            setIsRecording(false);
            return;
          }
          const [prefix, base64] = result.split(',', 2);
          const mimeMatch = prefix.match(/data:(.*?);base64/);
          const mime = mimeMatch?.[1] || recorder.mimeType || 'audio/webm';

          setAudioAttachment({ base64, mime });
          setAudioUploading(true);
          try {
            const response = await aiClient.transcribeAudio({
              audio_base64: base64,
              mime_type: mime,
              prompt: 'Transcribe user voice message for indigenous language learning.',
            });
            setAudioAttachment({ base64, mime, transcript: response.text });
            setInputMessage((prev) => prev || response.text);
          } catch (error) {
            console.error('Failed to transcribe audio', error);
            setErrorText(t('failedToSendMessage'));
          } finally {
            setAudioUploading(false);
          }
        };

        reader.readAsDataURL(blob);
        setIsRecording(false);
        mediaRecorderRef.current = null;
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Unable to access microphone', error);
      setErrorText('Unable to access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Text-to-speech (mock)
  const speakMessage = (message: string) => {
    // TODO: Implement actual TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
    }
  };

  const triggerImagePicker = () => {
    setErrorText('');
    fileInputRef.current?.click();
  };

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string | null;
      if (!result) return;
      const [prefix, base64] = result.split(',', 2);
      const mimeMatch = prefix.match(/data:(.*?);base64/);
      const mime = mimeMatch?.[1] || file.type || 'image/png';
      setImageAttachment({ base64, dataUrl: result, mime });
    };
    reader.readAsDataURL(file);

    // reset input value for subsequent selections of the same file
    event.target.value = '';
  };

  const removeImageAttachment = () => setImageAttachment(null);
  const removeAudioAttachment = () => setAudioAttachment(null);

  // Get endangerment badge color
  const getEndangermentColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800';
      case 'vulnerable':
        return 'bg-yellow-100 text-yellow-800';
      case 'endangered':
        return 'bg-orange-100 text-orange-800';
      case 'critically endangered':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Selected language info
  const selectedLangInfo = languages.find((l) => l.code === selectedLanguage);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('indigenousChatTitle')}
              </h1>
              <p className="text-sm text-gray-600">
                {statistics ? `${statistics.total_languages} languages • ${(statistics.total_speakers / 1000000).toFixed(1)}M speakers` : t('loading')}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-4">
            {/* Current language badge */}
            {selectedLangInfo && (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200" title={t('currentLanguage')}>
                {selectedLangInfo.name} ({selectedLanguage.toUpperCase()})
              </span>
            )}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label={t('selectLanguage')}
              title={t('selectLanguage')}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>

            {/* Settings Button */}
            <button
              className="p-2 hover:bg-gray-100 rounded-lg"
              title={t('settings')}
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Selected Language Info */}
        {selectedLangInfo && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedLangInfo.name} ({selectedLangInfo.nativeName})
                </p>
                <p className="text-xs text-gray-600">
                  {selectedLangInfo.region} • {(selectedLangInfo.speakers / 1000).toFixed(0)}K speakers
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getEndangermentColor(selectedLangInfo.endangerment)}`}
            >
              {selectedLangInfo.endangerment}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('startConversationTitle')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('startConversationHint')}
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <CheckCircle className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-gray-700">{t('translation')}</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <Volume2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-gray-700">{t('pronunciationLabel')}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <BookOpen className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-gray-700">{t('culturalContext')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                } rounded-lg p-4 shadow-sm`}
              >
                {/* Message */}
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${msg.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                    {msg.message}
                  </p>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakMessage(msg.message)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title={t('speak')}
                    >
                      <Volume2 className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {msg.attachments?.imagePreview && (
                  <img
                    src={msg.attachments.imagePreview}
                    alt="Attached context"
                    className="mt-3 rounded-lg max-h-56 object-cover border border-white/20"
                  />
                )}

                {msg.attachments?.audioTranscript && (
                  <div className="mt-2 text-xs italic text-blue-100">
                    {msg.attachments.audioTranscript}
                  </div>
                )}

                {/* Translation */}
                {msg.translation && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">{t('translation')}:</p>
                    <p className="text-sm text-gray-700">{msg.translation}</p>
                  </div>
                )}

                {/* Pronunciation */}
                {msg.pronunciation && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">{t('pronunciationLabel')}:</p>
                    <p className="text-sm font-mono text-gray-700">{msg.pronunciation}</p>
                  </div>
                )}

                {/* Cultural Context */}
                {msg.culturalContext && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('culturalContext')}:</p>
                        <p className="text-sm text-gray-700">{msg.culturalContext}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Phrases */}
                {msg.relatedPhrases && msg.relatedPhrases.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">{t('relatedPhrases')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.relatedPhrases.map((phrase, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {msg.mediaContext?.imageSummary && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Image insight:</p>
                    <p className="text-sm text-gray-700">{msg.mediaContext.imageSummary}</p>
                  </div>
                )}

                {msg.mediaContext?.audioTranscript && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Voice transcript:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.mediaContext.audioTranscript}</p>
                  </div>
                )}

                {msg.mediaContext?.preferred_provider && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">LLM Provider:</p>
                    <p className="text-sm text-gray-700">{msg.mediaContext.preferred_provider}</p>
                  </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        {/* Options */}
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showTranslation}
              onChange={(e) => setShowTranslation(e.target.checked)}
              className="rounded border-gray-300"
            />
            {t('showTranslation')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showPronunciation}
              onChange={(e) => setShowPronunciation(e.target.checked)}
              className="rounded border-gray-300"
            />
            {t('showPronunciation')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showCulturalNotes}
              onChange={(e) => setShowCulturalNotes(e.target.checked)}
              className="rounded border-gray-300"
            />
            {t('showCulturalNotes')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>LLM</span>
            <select
              value={llmProvider}
              onChange={(e) => {
                const value = e.target.value;
                setLlmProvider(value);
                try {
                  if (value === 'auto') {
                    localStorage.removeItem('mr_llm_provider');
                  } else {
                    localStorage.setItem('mr_llm_provider', value);
                  }
                } catch {}
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="auto">Auto</option>
              {availableProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Input Box */}
        <div className="flex items-center gap-2">
          {/* Voice Input */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={audioUploading || isLoading}
            className={`p-3 rounded-lg transition ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${audioUploading || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={isRecording ? 'Stop recording' : t('voiceInput')}
          >
            {isRecording ? (
              <Square className="w-5 h-5" />
            ) : (
              <Mic className={`w-5 h-5 ${audioUploading ? 'animate-pulse' : ''}`} />
            )}
          </button>

          {/* Image Attachment */}
          <button
            onClick={triggerImagePicker}
            disabled={isLoading}
            className={`p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            title="Attach image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessagePlaceholder')}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={
              isLoading ||
              audioUploading ||
              (!inputMessage.trim() && !audioAttachment && !imageAttachment)
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {t('send')}
          </button>
        </div>

        {(imageAttachment || audioAttachment) && (
          <div className="mt-3 flex flex-wrap gap-4">
            {imageAttachment && (
              <div className="relative">
                <img
                  src={imageAttachment.dataUrl}
                  alt="Image attachment preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={removeImageAttachment}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-red-50"
                  title="Remove image"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
            {audioAttachment && (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg">
                <Mic className="w-4 h-4" />
                <span className="text-sm">
                  {audioAttachment.transcript || 'Voice clip ready'}
                </span>
                {audioUploading && <Loader className="w-4 h-4 animate-spin" />}
                <button
                  onClick={removeAudioAttachment}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Remove audio"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {(isLoading || audioUploading || errorText) && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            {(isLoading || audioUploading) && <Loader className="w-4 h-4 animate-spin" />}
            {isLoading
              ? t('aiThinking')
              : audioUploading
                ? 'Transcribing audio...'
                : <span className="text-red-600">{errorText}</span>}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{t('settings')}</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" checked={showTranslation} onChange={(e)=>setShowTranslation(e.target.checked)} />
                {t('showTranslation')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" checked={showPronunciation} onChange={(e)=>setShowPronunciation(e.target.checked)} />
                {t('showPronunciation')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" checked={showCulturalNotes} onChange={(e)=>setShowCulturalNotes(e.target.checked)} />
                {t('showCulturalNotes')}
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-100 rounded" onClick={()=>setShowSettings(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';
import { indigenousChatClient } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  translation?: string;
  pronunciation?: string;
  culturalContext?: string;
  relatedPhrases?: string[];
  timestamp: string;
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
  const { t } = useTranslation();

  // State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('mi');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState(true);
  const [showCulturalNotes, setShowCulturalNotes] = useState(true);
  const [showPronunciation, setShowPronunciation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load languages on mount
  useEffect(() => {
    loadLanguages();
    loadStatistics();
  }, []);

  // Auto-scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available languages
  const loadLanguages = async () => {
    try {
      const response = await indigenousChatClient.listLanguages();
      setLanguages(response.languages);
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
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      message: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await indigenousChatClient.chat({
        message: inputMessage,
        language_code: selectedLanguage,
        session_id: sessionId || undefined,
        include_translation: showTranslation,
        include_cultural_notes: showCulturalNotes,
        include_pronunciation: showPronunciation,
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
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
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

  // Voice recording (mock)
  const startRecording = () => {
    setIsRecording(true);
    // TODO: Implement actual voice recording
    setTimeout(() => {
      setIsRecording(false);
      setInputMessage('Hello, how are you?');
    }, 2000);
  };

  // Text-to-speech (mock)
  const speakMessage = (message: string) => {
    // TODO: Implement actual TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
    }
  };

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
                {t('Indigenous Language AI Chatbot')}
              </h1>
              <p className="text-sm text-gray-600">
                {statistics ? `${statistics.total_languages} languages • ${(statistics.total_speakers / 1000000).toFixed(1)}M speakers` : 'Loading...'}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-4">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              title="Settings"
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
                Start a conversation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Chat with AI in {selectedLangInfo?.name || 'indigenous language'}. 
                Get translations, pronunciation, and cultural context.
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <CheckCircle className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-gray-700">Translation</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <Volume2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-gray-700">Pronunciation</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <BookOpen className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-gray-700">Cultural Context</p>
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
                      title="Speak"
                    >
                      <Volume2 className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Translation */}
                {msg.translation && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Translation:</p>
                    <p className="text-sm text-gray-700">{msg.translation}</p>
                  </div>
                )}

                {/* Pronunciation */}
                {msg.pronunciation && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Pronunciation:</p>
                    <p className="text-sm font-mono text-gray-700">{msg.pronunciation}</p>
                  </div>
                )}

                {/* Cultural Context */}
                {msg.culturalContext && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Cultural Context:</p>
                        <p className="text-sm text-gray-700">{msg.culturalContext}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Phrases */}
                {msg.relatedPhrases && msg.relatedPhrases.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Related phrases:</p>
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
            Translation
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showPronunciation}
              onChange={(e) => setShowPronunciation(e.target.checked)}
              className="rounded border-gray-300"
            />
            Pronunciation
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showCulturalNotes}
              onChange={(e) => setShowCulturalNotes(e.target.checked)}
              className="rounded border-gray-300"
            />
            Cultural Notes
          </label>
        </div>

        {/* Input Box */}
        <div className="flex items-center gap-2">
          {/* Voice Input */}
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`p-3 rounded-lg ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Voice input"
          >
            <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type a message in English or ${selectedLangInfo?.name}...`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send
          </button>
        </div>

        {/* Status */}
        {isLoading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            AI is thinking...
          </div>
        )}
      </div>
    </div>
  );
}

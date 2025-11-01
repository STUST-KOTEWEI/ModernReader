import React, { useState, useRef } from 'react';
import { audioClient } from '../services/api';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

export const AudioPage: React.FC = () => {
  const { t } = useI18n();
  const [transcription, setTranscription] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await audioClient.transcribe(formData);
      setTranscription(response.text || 'No transcription available');
    } catch (err) {
      setTranscription('Error: Unable to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (!ttsText.trim()) return;

    setLoading(true);
    try {
      const audioBlob = await audioClient.synthesize({ text: ttsText, language: 'zh' });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (err) {
      console.error('TTS failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Audio Features (STT/TTS)</h1>

      {/* Speech-to-Text */}
      <Card title={t('uploadAudio')}>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          
          {transcription && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold mb-2">Transcription:</h3>
              <p>{transcription}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Text-to-Speech */}
      <Card title={t('textToSpeech')}>
        <div className="space-y-4">
          <textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
          <Button onClick={handleTextToSpeech} disabled={loading || !ttsText.trim()}>
            {loading ? t('loading') : t('playAudio')}
          </Button>

          <audio ref={audioRef} controls className="w-full mt-4" />
        </div>
      </Card>
    </div>
  );
};

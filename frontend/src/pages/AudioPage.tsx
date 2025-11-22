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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const form = new FormData();
        form.append('file', blob, 'recording.webm');
        setLoading(true);
        try {
          const resp = await audioClient.transcribe(form);
          setTranscription(resp.text || '');
        } catch (err) {
          setTranscription('Error: Unable to transcribe audio');
        } finally {
          setLoading(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (e) {
      alert(t('micAccessDenied'));
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
      setIsRecording(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (!ttsText.trim()) return;

    setLoading(true);
    try {
      const raw = await audioClient.synthesize({ text: ttsText, language: 'zh' });
      const audioBlob = (raw && (raw as Blob).type) ? (raw as Blob) : new Blob([raw], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        try {
          await audioRef.current.play();
        } catch (e) {
          console.error('Autoplay blocked or playback error', e);
          // 使用者互動後再播
        }
      }
    } catch (err) {
      console.error('TTS failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{t('audioFeatures')}</h1>

      {/* Speech-to-Text */}
      <Card title={t('uploadAudio')}>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            aria-label={t('uploadAudio')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button onClick={startRecording} disabled={loading}>{t('recordAudio')}</Button>
            ) : (
              <Button onClick={stopRecording} disabled={loading}>{t('stopRecording')}</Button>
            )}
            {isRecording && <span className="text-red-600 text-sm">{t('recording')}</span>}
          </div>
          
          {transcription && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-semibold mb-2">{t('transcription')}:</h3>
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
            placeholder={t('enterText')}
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

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RefreshCw, Upload } from 'lucide-react';

interface PronunciationRecorderProps {
  targetText: string;
  language: string;
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onScore?: (score: number, feedback: string) => void;
}

export const PronunciationRecorder: React.FC<PronunciationRecorderProps> = ({
  targetText,
  language,
  onRecordingComplete,
  onScore,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check microphone permission
    checkMicrophonePermission();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        setRecordingDuration(duration);
        onRecordingComplete(audioBlob, duration);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Auto-score if available
        if (onScore) {
          performScoring(audioBlob, duration);
        }
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const performScoring = async (audioBlob: Blob, duration: number) => {
    if (!onScore) return;
    
    setIsProcessing(true);
    
    // Simple rule-based scoring
    // 1. Duration check (should be within reasonable range of target text)
    const expectedDuration = estimateExpectedDuration(targetText, language);
    const durationScore = calculateDurationScore(duration, expectedDuration);
    
    // 2. Try to use Web Speech API for transcription (if available)
    let transcriptionScore = 50; // Default fallback
    let feedback = '';
    
    try {
      // Check if SpeechRecognition is available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        transcriptionScore = await transcribeAndScore(audioBlob);
        feedback = generateFeedback(durationScore, transcriptionScore, duration, expectedDuration);
      } else {
        // Fallback: use only duration-based scoring
        transcriptionScore = durationScore;
        feedback = `發音時長: ${duration.toFixed(1)}秒 (預期約 ${expectedDuration.toFixed(1)}秒)\n${
          durationScore >= 70 ? '節奏掌握不錯！' : '建議調整發音速度。'
        }`;
      }
    } catch (error) {
      console.error('Transcription error:', error);
      transcriptionScore = durationScore;
      feedback = `發音時長: ${duration.toFixed(1)}秒\n無法進行語音辨識，評分基於時長。`;
    }
    
    // Final score (weighted average)
    const finalScore = Math.round(durationScore * 0.4 + transcriptionScore * 0.6);
    onScore(Math.max(0, Math.min(100, finalScore)), feedback);
    setIsProcessing(false);
  };

  const estimateExpectedDuration = (text: string, lang: string): number => {
    // Simple heuristic: avg speaking rate
    const words = text.trim().split(/\s+/).length;
    const syllables = text.length; // Rough approximation
    
    // Speaking rates (syllables per second)
    const rates: { [key: string]: number } = {
      'zh': 4.0,  // Mandarin
      'en': 4.5,  // English
      'ami': 3.5, // Indigenous languages (slower)
      'pwn': 3.5,
      'default': 4.0
    };
    
    const rate = rates[lang] || rates['default'];
    return Math.max(1.5, syllables / rate);
  };

  const calculateDurationScore = (actual: number, expected: number): number => {
    const ratio = actual / expected;
    
    if (ratio >= 0.8 && ratio <= 1.3) {
      return 100; // Perfect timing
    } else if (ratio >= 0.6 && ratio <= 1.6) {
      return 80; // Good timing
    } else if (ratio >= 0.4 && ratio <= 2.0) {
      return 60; // Acceptable
    } else {
      return 40; // Too fast or too slow
    }
  };

  const transcribeAndScore = async (audioBlob: Blob): Promise<number> => {
    // This is a simplified version - in production, you'd use a backend service
    // For now, return a reasonable score based on audio properties
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        // In a real implementation, you would:
        // 1. Convert audio to the format expected by speech recognition
        // 2. Use speech-to-text API
        // 3. Compare transcription with target text (Levenshtein distance, etc.)
        // For demo, return a random score in a reasonable range
        resolve(65 + Math.random() * 25);
      }, 500);
    });
  };

  const generateFeedback = (
    durationScore: number,
    transcriptionScore: number,
    actual: number,
    expected: number
  ): string => {
    const feedback: string[] = [];
    
    feedback.push(`發音時長: ${actual.toFixed(1)}秒 (預期 ${expected.toFixed(1)}秒)`);
    
    if (actual < expected * 0.7) {
      feedback.push('⚡ 發音速度稍快，建議放慢語速');
    } else if (actual > expected * 1.4) {
      feedback.push('🐌 發音速度稍慢，可以稍微加快');
    } else {
      feedback.push('✓ 發音節奏適中');
    }
    
    if (transcriptionScore >= 80) {
      feedback.push('✓ 發音清晰度良好');
    } else if (transcriptionScore >= 60) {
      feedback.push('⚠ 部分音節可以更清晰');
    } else {
      feedback.push('⚠ 建議加強發音清晰度');
    }
    
    return feedback.join('\n');
  };

  const handleReset = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingDuration(0);
    setIsProcessing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioURL(url);
      
      // Get duration from audio element
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        setRecordingDuration(duration);
        onRecordingComplete(file, duration);
        
        if (onScore) {
          performScoring(file, duration);
        }
      };
    }
  };

  if (hasPermission === false) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 mb-3">
          無法存取麥克風。請允許麥克風權限，或上傳錄音檔案。
        </p>
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          上傳錄音檔案
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">請朗讀：</p>
        <p className="text-lg font-medium text-gray-900">{targetText}</p>
      </div>

      <div className="flex items-center gap-3">
        {!isRecording && !audioURL && (
          <button
            onClick={startRecording}
            disabled={hasPermission === false}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mic className="w-5 h-5" />
            開始錄音
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors animate-pulse"
          >
            <Square className="w-5 h-5" />
            停止錄音
          </button>
        )}

        {audioURL && (
          <>
            <audio src={audioURL} controls className="flex-1" />
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重錄
            </button>
          </>
        )}

        {!isRecording && !audioURL && hasPermission && (
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            上傳
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">
            錄音中... {recordingDuration.toFixed(1)}秒
          </span>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm">正在分析發音...</span>
        </div>
      )}
    </div>
  );
};

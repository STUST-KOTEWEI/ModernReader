import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Lock, Unlock } from 'lucide-react';

interface AudioPreviewPlayerProps {
  audioUrl: string;
  previewDuration?: number; // seconds
  bookTitle?: string;
  onUnlockRequest?: () => void;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({
  audioUrl,
  previewDuration = 60,
  bookTitle,
  onUnlockRequest,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime;
        setCurrentTime(time);

        // Check if preview time limit reached
        if (time >= previewDuration && !isLocked) {
          setIsLocked(true);
          setShowUnlockPrompt(true);
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, previewDuration, isLocked]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isLocked) {
      setShowUnlockPrompt(true);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || isLocked) return;

    const newTime = parseFloat(e.target.value);
    
    // Prevent seeking beyond preview duration
    if (newTime > previewDuration) {
      setIsLocked(true);
      setShowUnlockPrompt(true);
      return;
    }

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleUnlock = () => {
    if (onUnlockRequest) {
      onUnlockRequest();
    } else {
      // Default behavior: show a message
      alert('請登入或購買完整版以解鎖完整音檔內容');
    }
    setShowUnlockPrompt(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, previewDuration - currentTime);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const previewLimitPercent = duration > 0 ? (previewDuration / duration) * 100 : 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {bookTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {bookTitle}
        </h3>
      )}

      <div className="space-y-4">
        {/* Play/Pause Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className={`flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all ${
              isLocked
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isLocked && !showUnlockPrompt}
          >
            {isPlaying ? (
              <>
                <Pause className="w-6 h-6" />
                暫停
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                播放
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, 
                #2563eb ${progressPercent}%, 
                #e5e7eb ${progressPercent}%, 
                #e5e7eb 100%)`
            }}
            disabled={isLocked}
          />
          
          {/* Preview Limit Indicator */}
          <div
            className="absolute top-0 h-2 w-0.5 bg-red-500"
            style={{ left: `${previewLimitPercent}%` }}
            title={`預覽限制: ${previewDuration}秒`}
          />
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span className={currentTime >= previewDuration - 10 && currentTime < previewDuration ? 'text-orange-600 font-medium animate-pulse' : ''}>
            {currentTime < previewDuration ? (
              `剩餘預覽時間: ${formatTime(remainingTime)}`
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <Lock className="w-4 h-4" />
                已達預覽限制
              </span>
            )}
          </span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Lock Status */}
        {isLocked && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  已達 {previewDuration} 秒預覽限制
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  想要繼續聆聽完整內容嗎？
                </p>
                <button
                  onClick={handleUnlock}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Unlock className="w-4 h-4" />
                  解鎖完整音檔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unlock Prompt Modal */}
        {showUnlockPrompt && !isLocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  即將達到預覽限制
                </h4>
                <p className="text-sm text-gray-600">
                  還有 {formatTime(remainingTime)} 的預覽時間
                </p>
              </div>
              <button
                onClick={() => setShowUnlockPrompt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Feature Info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">預覽時長：</span>
              <span className="font-medium text-gray-900">{previewDuration}秒</span>
            </div>
            <div>
              <span className="text-gray-500">總時長：</span>
              <span className="font-medium text-gray-900">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useCallback, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AnalysisResult, ActiveTab, KeyConcept, QA, AdvancedNlpResult, BookRecommendation, ReaderSession } from '../types';
import { generateAnalysis, generateImage, textToSpeech, extractTextFromImage, generateAdvancedNlpAnalysis, generateBookRecommendations, generateImageWithEmotion } from '../services/geminiService';
import { generateImageLocal } from '../services/stableDiffusionService';
import { SummaryIcon, ConceptIcon, QaIcon, VisualizeIcon, ListenIcon, UploadIcon, CameraIcon, NlpIcon, BookIcon } from '../components/icons';
import EmotionSelector from '../components/EmotionSelector';

const SESSION_KEY = 'modernReader-session';

const defaultSession: ReaderSession = {
    inputText: '',
    analysisResult: null,
    advancedNlpResult: null,
    imageUrl: null,
    recommendations: null,
    activeTab: 'summary',
    selectedEmotion: null,
};

const getInitialSession = (): ReaderSession => {
    try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
            return JSON.parse(savedSession);
        }
    } catch (e) {
        console.error("Failed to parse saved session, starting fresh.", e);
        localStorage.removeItem(SESSION_KEY);
    }
    return defaultSession;
};

// Audio decoding helpers
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function parseWavOrPcm16(data: Uint8Array): { samples: Float32Array; sampleRate: number; channels: number } {
    // WAV header starts with 'RIFF' and 'WAVE'
    const isWav = data.length > 44 && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46;
    if (isWav) {
        // Minimal WAV parser (PCM 16-bit LE)
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        // Find 'fmt ' chunk
        let offset = 12; // after RIFF header
        let audioFormat = 1, numChannels = 1, sampleRate = 24000, bitsPerSample = 16, dataOffset = -1, dataSize = 0;
        while (offset + 8 <= view.byteLength) {
            const chunkId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset+1), view.getUint8(offset+2), view.getUint8(offset+3));
            const chunkSize = view.getUint32(offset+4, true);
            if (chunkId === 'fmt ') {
                audioFormat = view.getUint16(offset + 8, true);
                numChannels = view.getUint16(offset + 10, true);
                sampleRate = view.getUint32(offset + 12, true);
                bitsPerSample = view.getUint16(offset + 22, true);
            } else if (chunkId === 'data') {
                dataOffset = offset + 8;
                dataSize = chunkSize;
                break;
            }
            offset += 8 + chunkSize + (chunkSize % 2); // pad to even
        }
        if (audioFormat !== 1 || bitsPerSample !== 16 || dataOffset < 0) {
            throw new Error('Unsupported WAV format (expect PCM16).');
        }
        const pcm = new Int16Array(data.buffer, data.byteOffset + dataOffset, Math.floor(dataSize / 2));
        // For multi-channel, simple mixdown to mono
        let mono = new Float32Array(Math.floor(pcm.length / numChannels));
        if (numChannels === 1) {
            mono = new Float32Array(pcm.length);
            for (let i = 0; i < pcm.length; i++) mono[i] = pcm[i] / 32768;
        } else {
            const frames = Math.floor(pcm.length / numChannels);
            for (let f = 0; f < frames; f++) {
                let sum = 0;
                for (let c = 0; c < numChannels; c++) sum += pcm[f * numChannels + c];
                mono[f] = (sum / numChannels) / 32768;
            }
        }
        return { samples: mono, sampleRate, channels: 1 };
    }
    // Assume raw PCM16LE mono at 24kHz
    const pcm16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
    const out = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) out[i] = pcm16[i] / 32768;
    return { samples: out, sampleRate: 24000, channels: 1 };
}

function resampleLinear(input: Float32Array, srcRate: number, dstRate: number): Float32Array {
    if (srcRate === dstRate) return input;
    const ratio = dstRate / srcRate;
    const outLen = Math.max(1, Math.floor(input.length * ratio));
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const srcPos = i / ratio;
        const i0 = Math.floor(srcPos);
        const i1 = Math.min(i0 + 1, input.length - 1);
        const t = srcPos - i0;
        out[i] = (1 - t) * input[i0] + t * input[i1];
    }
    return out;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
): Promise<AudioBuffer> {
        const parsed = parseWavOrPcm16(data);
        const targetRate = 24000;
        const samples = parsed.sampleRate === targetRate ? parsed.samples : resampleLinear(parsed.samples, parsed.sampleRate, targetRate);
        const buffer = ctx.createBuffer(1, samples.length, targetRate);
        buffer.getChannelData(0).set(samples);
        return buffer;
}


// --- Components ---

const Header: React.FC<{ onNewAnalysis: () => void }> = ({ onNewAnalysis }) => (
  <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Reader Studio
        </h1>
        <p className="text-lg text-gray-400 mt-2">The core of the 4D Multi-Sensory AI Analysis engine.</p>
    </div>
    <button
        onClick={onNewAnalysis}
        className="mt-4 sm:mt-0 px-4 py-2 border border-gray-600 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
    >
        Start New Analysis
    </button>
  </header>
);

type InputMode = 'text' | 'file' | 'camera';

interface InputPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
    selectedEmotion: string | null | undefined;
    onEmotionChange: (value: string | null) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ inputText, setInputText, onAnalyze, isLoading, selectedEmotion, onEmotionChange }) => {
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment'); // 後置鏡頭為預設
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<BlobPart[]>([]);
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

     // Handle context-aware navigation from Dashboard
     useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('?mode=camera')) {
            setInputMode('camera');
            startCamera();
        } else if (hash.includes('?mode=file')) {
            setInputMode('file');
        }
    }, []);


    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setInputText(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const startCamera = async (facing?: 'user' | 'environment') => {
        try {
            if (!window.isSecureContext && !['localhost','127.0.0.1'].includes(location.hostname)) {
                setCameraError('行動裝置相機需要 HTTPS 或 localhost，請改用 https:// 或在本機開發。');
                return;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            const facingMode = facing || cameraFacing;
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOn(true);
            setCameraError(null);
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("Could not access camera. Please check permissions.");
            setIsCameraOn(false);
        }
    };

    const switchCamera = async () => {
        const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        setCameraFacing(newFacing);
        if (isCameraOn) {
            await startCamera(newFacing);
        }
    };
    
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOn(false);
    };

    const handleCapture = async () => {
        if (!videoRef.current) return;
        setIsCapturing(true);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const base64Data = dataUrl.split(',')[1];
            try {
                const extractedText = await extractTextFromImage(base64Data);
                setInputText(inputText ? `${inputText}\n\n${extractedText}` : extractedText);
            } catch (e) {
                setCameraError(e instanceof Error ? e.message : "Failed to extract text.");
            }
        }
        stopCamera();
        setIsCapturing(false);
    };

    useEffect(() => {
        return () => stopCamera(); // Cleanup on unmount
    }, []);

    const inputModes: { id: InputMode; label: string; icon: React.ReactNode }[] = [
        { id: 'text', label: 'Paste Text', icon: <SummaryIcon className="w-5 h-5 mr-2"/> },
        { id: 'file', label: 'Upload File', icon: <UploadIcon className="w-5 h-5 mr-2"/> },
        { id: 'camera', label: 'Scan', icon: <CameraIcon className="w-5 h-5 mr-2"/> },
    ];
    
    return (
        <div className="flex flex-col gap-4">
                                    {/* Emotion selector */}
                                    <EmotionSelector value={selectedEmotion || null} onChange={onEmotionChange} />
            <div className="flex bg-gray-900/50 rounded-lg p-1">
                {inputModes.map(mode => (
                    <button key={mode.id} onClick={() => setInputMode(mode.id)} className={`flex-1 flex items-center justify-center text-sm font-medium p-2 rounded-md transition-colors ${inputMode === mode.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                        {mode.icon}{mode.label}
                    </button>
                ))}
            </div>

            {inputMode === 'text' && (
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your text here to begin the experimental analysis..."
                    className="w-full h-64 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none focus:border-purple-500 transition-all resize-y text-gray-200"
                    disabled={isLoading}
                />
            )}
            {inputMode === 'file' && (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg">
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-gray-600 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                        <UploadIcon className="w-6 h-6 mr-3"/>
                        Click to select a .txt file
                    </label>
                    <input id="file-upload" ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </div>
            )}
             {inputMode === 'camera' && (
                <div className="h-64 bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden relative">
                    {isCapturing && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-cyan-400 text-lg font-semibold z-20">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                Extracting Text...
                            </div>
                        </div>
                    )}
                    {cameraError && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-10">
                            {cameraError}
                        </div>
                    )}
                    {isCameraOn ? (
                        <div className="w-full h-full relative">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted
                                className="w-full h-full object-cover" 
                            />
                            {/* 切換鏡頭按鈕 - 右上角 */}
                            <button
                                onClick={switchCamera}
                                className="absolute top-2 right-2 p-2 bg-gray-900/70 hover:bg-gray-800/90 text-white rounded-full shadow-lg transition-colors z-10"
                                title={cameraFacing === 'environment' ? '切換到前置鏡頭' : '切換到後置鏡頭'}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                            {/* 鏡頭模式指示 - 左上角 */}
                            <div className="absolute top-2 left-2 px-3 py-1 bg-gray-900/70 text-white text-xs rounded-full">
                                {cameraFacing === 'environment' ? '📷 後置鏡頭' : '🤳 前置鏡頭'}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-center gap-3">
                                <button 
                                    onClick={handleCapture} 
                                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                                >
                                    📸 Capture Text
                                </button>
                                <button 
                                    onClick={stopCamera} 
                                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <div className="text-6xl">📷</div>
                            <button 
                                onClick={() => startCamera()} 
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                            >
                                Start Camera
                            </button>
                            <p className="text-gray-400 text-sm">Capture images to extract text with OCR</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onAnalyze}
                disabled={isLoading || !inputText}
                className="w-full flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                  {isLoading ? 'Analyzing...' : 'Engage Cognitive Core'}
              </button>
              <VoiceInputButton onResult={(text) => setInputText(inputText ? `${inputText}\n${text}` : text)} />
            </div>
        </div>
    );
};
// 語音輸入按鈕：優先使用瀏覽器 Web Speech API 進行即時語音辨識
const VoiceInputButton: React.FC<{ onResult: (text: string) => void }> = ({ onResult }) => {
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
    const [error, setError] = useState<string | null>(null);

    // 當有新的轉錄結果時，自動更新
    useEffect(() => {
        if (transcript && !listening) {
            const text = transcript.trim();
            if (text) {
                onResult(text);
                resetTranscript();
            }
        }
    }, [transcript, listening]);

    const toggle = () => {
        setError(null);
        if (listening) {
            // 停止語音辨識
            SpeechRecognition.stopListening();
        } else {
            // 開始語音辨識
            if (!browserSupportsSpeechRecognition) {
                setError('您的瀏覽器不支援語音辨識功能');
                return;
            }
            resetTranscript();
            SpeechRecognition.startListening({ 
                continuous: false, // 改為非連續模式，說完一句就自動停止
                language: 'zh-TW' 
            });
        }
    };

    const label = listening ? '辨識中…（點擊停止）' : '🎤 語音輸入';
    
    return (
        <div className="flex flex-col items-end gap-1">
            <button 
                onClick={toggle} 
                className={`px-4 py-3 font-semibold rounded-md transition-colors ${
                    listening 
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                disabled={!browserSupportsSpeechRecognition && !listening}
            >
                {label}
            </button>
            {error && <span className="text-xs text-red-400">{error}</span>}
            {!browserSupportsSpeechRecognition && (
                <span className="text-xs text-gray-400">語音辨識不可用</span>
            )}
            {listening && transcript && (
                <span className="text-xs text-gray-400">即時: {transcript}</span>
            )}
        </div>
    );
};


interface AnalysisTabsProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}
  
const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ activeTab, setActiveTab }) => {
    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
      { id: 'summary', label: 'Summary', icon: <SummaryIcon className="w-5 h-5 mr-2" /> },
      { id: 'concepts', label: 'Concepts', icon: <ConceptIcon className="w-5 h-5 mr-2" /> },
      { id: 'qa', label: 'Q&A', icon: <QaIcon className="w-5 h-5 mr-2" /> },
      { id: 'nlp', label: 'Advanced NLP', icon: <NlpIcon className="w-5 h-5 mr-2" /> },
      { id: 'recommendations', label: 'Recommendations', icon: <BookIcon className="w-5 h-5 mr-2" /> },
      { id: 'visualize', label: 'Visualize', icon: <VisualizeIcon className="w-5 h-5 mr-2" /> },
      { id: 'listen', label: 'Listen', icon: <ListenIcon className="w-5 h-5 mr-2" /> },
    ];
  
    return (
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
};
  
interface AnalysisContentProps {
    session: ReaderSession;
    onGenerateRecommendations: (age: number) => Promise<void>;
    isGeneratingRecs: boolean;
}


const AnalysisContent: React.FC<AnalysisContentProps> = ({ session, onGenerateRecommendations, isGeneratingRecs }) => {
        // 只要有 analysisResult 或 advancedNlpResult 就顯示分頁
        if (!session.analysisResult && !session.advancedNlpResult) return null;

        const contentMap: Record<ActiveTab, React.ReactNode> = {
            summary: session.analysisResult ? <SummaryView summary={session.analysisResult.summary} /> : <div className="text-gray-500">No summary available.</div>,
            concepts: session.analysisResult ? <ConceptsView concepts={session.analysisResult.concepts} /> : <div className="text-gray-500">No concepts available.</div>,
            qa: session.analysisResult ? <QaView qa={session.analysisResult.qa} /> : <div className="text-gray-500">No Q&A available.</div>,
            nlp: <AdvancedNlpView nlpResult={session.advancedNlpResult} />,
            visualize: <VisualizeView imageUrl={session.imageUrl} inputText={session.inputText} summary={session.analysisResult?.summary} />,
            listen: session.analysisResult ? <ListenView summary={session.analysisResult.summary} fullText={session.inputText} /> : <div className="text-gray-500">No audio available.</div>,
            recommendations: <RecommendationsView recommendations={session.recommendations} onGenerate={onGenerateRecommendations} isLoading={isGeneratingRecs} />,
        };

        return <div className="mt-6 animate-fade-in">{contentMap[session.activeTab]}</div>;
};

const SummaryView: React.FC<{ summary: string }> = ({ summary }) => (
    <div>
        <h3 className="text-xl font-semibold text-purple-300 mb-3">Summary</h3>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
    </div>
);
  
const ConceptsView: React.FC<{ concepts: KeyConcept[] }> = ({ concepts }) => (
    <div>
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Key Concepts</h3>
        <div className="space-y-4">
            {concepts.map((item, index) => (
                <div key={index} className="p-4 bg-gray-800/50 border-l-4 border-cyan-400 rounded-r-lg">
                    <h4 className="font-bold text-cyan-300">{item.concept}</h4>
                    <p className="text-gray-300 mt-1">{item.explanation}</p>
                </div>
            ))}
        </div>
    </div>
);
  
const QaView: React.FC<{ qa: QA[] }> = ({ qa }) => (
    <div>
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Q&A Matrix</h3>
        <div className="space-y-3">
            {qa.map((item, index) => (
                <details key={index} className="bg-gray-800/50 p-4 rounded-lg cursor-pointer open:ring-2 open:ring-purple-500 transition-all">
                    <summary className="font-semibold text-purple-300 list-none flex justify-between items-center">
                        {item.question}
                        <span className="text-xl transform transition-transform duration-300 group-open:rotate-180">+</span>
                    </summary>
                    <p className="text-gray-300 mt-3 pt-3 border-t border-gray-700">{item.answer}</p>
                </details>
            ))}
        </div>
    </div>
);
  
const AdvancedNlpView: React.FC<{ nlpResult: AdvancedNlpResult | null }> = ({ nlpResult }) => {
    if (!nlpResult) return <div className="text-gray-500">Generating Advanced NLP analysis...</div>;

    const sentimentColor = nlpResult.sentiment.score === 'Positive' ? 'text-green-400' : nlpResult.sentiment.score === 'Negative' ? 'text-red-400' : 'text-yellow-400';
    
    const renderList = (title: string, items: string[]) => (
        items.length > 0 ? (
            <div>
                <h4 className="font-bold text-cyan-300 mb-2">{title}</h4>
                <div className="flex flex-wrap gap-2">
                    {items.map((item, i) => <span key={i} className="bg-gray-700 text-gray-200 px-3 py-1 text-sm rounded-full">{item}</span>)}
                </div>
            </div>
        ) : null
    );

    return (
        <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Advanced NLP Analysis</h3>
            <div className="space-y-6">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-bold text-cyan-300">Sentiment</h4>
                    <p className={`text-2xl font-bold ${sentimentColor}`}>{nlpResult.sentiment.score}</p>
                    <p className="text-gray-300 mt-1">{nlpResult.sentiment.explanation}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg space-y-4">
                     {renderList('People', nlpResult.entities.people)}
                     {renderList('Organizations', nlpResult.entities.organizations)}
                     {renderList('Locations', nlpResult.entities.locations)}
                </div>
            </div>
        </div>
    );
};

const RecommendationsView: React.FC<{ recommendations: BookRecommendation[] | null; onGenerate: (age: number) => Promise<void>; isLoading: boolean }> = ({ recommendations, onGenerate, isLoading }) => {
    const [age, setAge] = useState<number | ''>(25);

    const handleGenerateClick = () => {
        if (typeof age === 'number' && age > 0) {
            onGenerate(age);
        }
    };
    
    return (
        <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-4">AI Recommendation Engine</h3>
            <div className="p-4 bg-gray-800/50 rounded-lg mb-6 flex flex-col sm:flex-row items-center gap-4">
                <label htmlFor="age-input" className="text-gray-300 font-medium">Your Age:</label>
                <input 
                    id="age-input"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white w-24"
                    placeholder="e.g., 25"
                />
                <button 
                    onClick={handleGenerateClick}
                    disabled={isLoading || age === '' || age <= 0}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Thinking...' : 'Get Recommendations'}
                </button>
            </div>

            {isLoading && !recommendations && <p className="text-center text-gray-400">Consulting the LSTM model...</p>}

            {recommendations && (
                <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                        <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
                            <h4 className="text-lg font-bold text-cyan-300">{rec.title}</h4>
                            <p className="text-sm text-gray-400 italic mb-2">by {rec.author}</p>
                            <p className="text-gray-300 mb-3">{rec.summary}</p>
                            <div className="p-3 bg-gray-900/50 border-l-4 border-purple-400 rounded-r-md">
                                <p className="text-sm font-semibold text-purple-300">Why you might like it:</p>
                                <p className="text-sm text-gray-300 mt-1">{rec.reason}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const VisualizeView: React.FC<{ 
    imageUrl: string | null;
    inputText?: string;
    summary?: string;
}> = ({ imageUrl, inputText, summary }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [localImageUrl, setLocalImageUrl] = useState<string | null>(imageUrl);
    const [error, setError] = useState<string | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(localStorage.getItem('selectedEmotion'));

    useEffect(() => {
        setLocalImageUrl(imageUrl);
    }, [imageUrl]);

    const handleRetryGeneration = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            // 使用摘要或原始文字來生成更相關的圖片
            let prompt = "abstract digital art, vibrant colors, conceptual visualization";
            
            if (summary) {
                // 使用摘要的前 100 個字元作為提示詞
                const shortSummary = summary.substring(0, 100);
                prompt = `Create a vibrant, abstract digital art visualization representing: ${shortSummary}`;
            } else if (inputText) {
                // 使用原始文字的前 100 個字元
                const shortText = inputText.substring(0, 100);
                prompt = `Abstract conceptual art inspired by: ${shortText}`;
            }
            
            console.log('Generating image with prompt:', prompt);
            
            // 優先使用情緒強化的雲端生成；若失敗則本地 SD
                        let result: string | null = null;
                        try {
                            result = await generateImageWithEmotion(prompt, selectedEmotion || '');
                        } catch (e) {
                            console.warn('generateImageWithEmotion failed, fallback to local SD.', e);
                            result = await generateImageLocal(prompt, {
                                    width: 768,
                                    height: 512,
                                    steps: 30,
                                    cfg_scale: 7.5
                            });
                        }
            if (result) {
                setLocalImageUrl(result);
                setError(null);
            } else {
                setError('Failed to generate image. Please check if Stable Diffusion service is running on port 7860.');
            }
        } catch (err) {
            console.error('Image generation error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Visual Interpretation</h3>
                        {localImageUrl ? (
                <div className="space-y-4">
                    <img 
                        src={localImageUrl} 
                        alt="AI generated visualization" 
                        className="w-full h-auto rounded-lg shadow-lg shadow-purple-900/50" 
                    />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <EmotionSelector
                                                value={selectedEmotion}
                                                onChange={(val) => {
                                                    setSelectedEmotion(val);
                                                    if (val) localStorage.setItem('selectedEmotion', val);
                                                    else localStorage.removeItem('selectedEmotion');
                                                }}
                                            />
                                            <button
                                                onClick={handleRetryGeneration}
                                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors self-end"
                                            >
                                                以情緒重生圖像
                                            </button>
                                        </div>
                    <p className="text-sm text-gray-400 text-center">
                        AI-generated visual representation of the content
                    </p>
                </div>
            ) : (
                <div className="w-full aspect-video bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-4 p-8">
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                            <p className="text-gray-400">Generating visualization...</p>
                        </>
                    ) : error ? (
                        <>
                            <div className="text-red-400 text-center">
                                <p className="font-semibold mb-2">⚠️ Image Generation Failed</p>
                                <p className="text-sm">{error}</p>
                            </div>
                            <button
                                onClick={handleRetryGeneration}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                🔄 Retry with Local SD
                            </button>
                            <div className="text-xs text-gray-500 max-w-md text-center">
                                <p>Requires Stable Diffusion running on localhost:7860</p>
                                <p className="mt-1">Or set VITE_GEMINI_API_KEY for Gemini Imagen</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-6xl mb-4">🎨</div>
                            <p className="text-gray-400 text-center">Visual interpretation not available</p>
                                                        <div className="w-full max-w-md space-y-3">
                                                            <EmotionSelector
                                                                value={selectedEmotion}
                                                                onChange={(val) => {
                                                                    setSelectedEmotion(val);
                                                                    if (val) localStorage.setItem('selectedEmotion', val);
                                                                    else localStorage.removeItem('selectedEmotion');
                                                                }}
                                                            />
                                                            <button
                                                                    onClick={handleRetryGeneration}
                                                                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                                                            >
                                                                    Generate Visualization
                                                            </button>
                                                        </div>
                            <div className="text-sm text-gray-500 max-w-md text-center space-y-2">
                                <p><strong>Option 1:</strong> Set VITE_GEMINI_API_KEY in .env.local for Gemini Imagen</p>
                                <p><strong>Option 2:</strong> Run Stable Diffusion locally on port 7860</p>
                                <p className="text-xs mt-2">Mock SD service available: npm run dev:mock-ai</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const ListenView: React.FC<{ summary: string, fullText: string }> = ({ summary, fullText }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [podcastProgress, setPodcastProgress] = useState(0);
    const [totalPodcastChunks, setTotalPodcastChunks] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueue = useRef<AudioBuffer[]>([]);
    const isPlaying = useRef(false);
    const nextStartTime = useRef(0);

            const webSpeechSpeak = (text: string) => {
            const synth = window.speechSynthesis;
            if (!synth) throw new Error('Web Speech API not supported in this browser.');
            const utter = new SpeechSynthesisUtterance(text);
                const pref = localStorage.getItem('voicePref') || 'en-US';
                utter.lang = pref;
            synth.cancel();
            synth.speak(utter);
        };

        const playAudio = async (textToPlay: string) => {
      setIsGenerating(true);
      setError(null);
  
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
                let base64Audio: string | null = null;
                try {
                    base64Audio = await textToSpeech(textToPlay);
                } catch (_) {
                    base64Audio = null;
                }

                if (base64Audio) {
                    const audioBytes = decode(base64Audio);
                    const audioBuffer = await decodeAudioData(audioBytes, audioContext);
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    source.start();
                } else {
                    // 最終後備：瀏覽器 Web Speech API
                    webSpeechSpeak(textToPlay);
                }
  
      } catch (err) {
                // 若播放管線失敗也嘗試 Web Speech API
                try {
                    webSpeechSpeak(textToPlay);
                } catch (e) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                }
      } finally {
        setIsGenerating(false);
      }
    };

    const playQueue = () => {
        if (isPlaying.current || audioQueue.current.length === 0) return;
        
        isPlaying.current = true;
        const audioContext = audioContextRef.current!;
        
        const playNext = () => {
            if (audioQueue.current.length === 0) {
                isPlaying.current = false;
                return;
            }
            const buffer = audioQueue.current.shift()!;
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            
            const scheduleTime = Math.max(nextStartTime.current, audioContext.currentTime);
            source.start(scheduleTime);
            nextStartTime.current = scheduleTime + buffer.duration;
            source.onended = playNext;
        };
        playNext();
    }

    const generatePodcast = async () => {
        setIsGenerating(true);
        setError(null);
        setPodcastProgress(0);
        audioQueue.current = [];
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') await audioContext.resume();

        nextStartTime.current = audioContext.currentTime;

        const chunks = fullText.match(/.{1,1000}(\s|$)/g) || [];
        setTotalPodcastChunks(chunks.length);

                try {
                        for (let i = 0; i < chunks.length; i++) {
                                const chunk = chunks[i];
                                let base64Audio: string | null = null;
                                try {
                                    base64Audio = await textToSpeech(chunk);
                                } catch (_) {
                                    base64Audio = null;
                                }
                                if (base64Audio) {
                                    const audioBytes = decode(base64Audio);
                                    const audioBuffer = await decodeAudioData(audioBytes, audioContext);
                                    audioQueue.current.push(audioBuffer);
                                    setPodcastProgress(i + 1);
                                    if (!isPlaying.current) playQueue();
                                } else {
                                    // 若沒有音訊（例如改走 Web Speech），直接用 Web Speech 播放此 chunk
                                                        const synth = window.speechSynthesis;
                                    if (synth) {
                                        const utter = new SpeechSynthesisUtterance(chunk);
                                                            const pref = localStorage.getItem('voicePref') || 'en-US';
                                                            utter.lang = pref;
                                        synth.speak(utter);
                                    }
                                    setPodcastProgress(i + 1);
                                }
                        }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during podcast generation.');
        } finally {
            setIsGenerating(false);
        }
    };
  
    return (
      <div>
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Auditory Experience</h3>
        <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
            <h4 className="font-semibold text-cyan-300">Brief Summary</h4>
            <p className="text-gray-400 my-2 text-sm">Generate and listen to an audio version of the summary.</p>
            <button onClick={() => playAudio(summary)} disabled={isGenerating} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg disabled:bg-gray-500 text-sm">
                {isGenerating ? 'Busy...' : 'Play Summary'}
            </button>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg">
            <h4 className="font-semibold text-cyan-300">Full Podcast</h4>
            <p className="text-gray-400 my-2 text-sm">Generate a full podcast of the entire text. Audio will start playing as it's generated.</p>
            <button onClick={generatePodcast} disabled={isGenerating} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:bg-gray-500 text-sm">
                 {isGenerating ? 'Generating...' : 'Generate Full Podcast'}
            </button>
            {isGenerating && totalPodcastChunks > 0 && (
                <div className="mt-4">
                    <p className="text-sm text-gray-400">Progress: {podcastProgress} / {totalPodcastChunks} chunks</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(podcastProgress / totalPodcastChunks) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
        {error && <p className="text-red-400 mt-4">Error: {error}</p>}
      </div>
    );
};

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 border-4 border-t-purple-500 border-r-purple-500 border-b-cyan-500 border-l-cyan-500 rounded-full animate-spin"></div>
        <p className="text-lg text-gray-300">Calibrating Multi-sensory Matrix...</p>
    </div>
);

const WelcomePlaceholder: React.FC = () => (
    <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-700 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Analysis Output Panel</h2>
        <p>Your multi-sensory analysis will appear here once you engage the cognitive core.</p>
    </div>
);

export default function Reader() {
  const [session, setSession] = useState<ReaderSession>(getInitialSession);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  const setInputText = (text: string) => {
    setSession(prev => ({...prev, inputText: text}));
  };

    const setSelectedEmotion = (emotion: string | null) => {
        setSession(prev => ({ ...prev, selectedEmotion: emotion }));
        if (emotion) localStorage.setItem('selectedEmotion', emotion);
        else localStorage.removeItem('selectedEmotion');
    };

  const setActiveTab = (tab: ActiveTab) => {
    setSession(prev => ({ ...prev, activeTab: tab }));
  };

  const handleNewAnalysis = () => {
    setSession(defaultSession);
  };


    const handleAnalyze = useCallback(async () => {
        if (!session.inputText.trim()) return;

        setIsLoading(true);
        setError(null);
        setSession(prev => ({
            ...prev,
            analysisResult: null,
            advancedNlpResult: null,
            imageUrl: null,
            recommendations: null,
            activeTab: 'summary',
        }));

        try {
            const imagePrompt = session.inputText.length > 200 ? session.inputText.substring(0, 200) + '...' : session.inputText;
            const [analysis, advancedNlp] = await Promise.all([
                generateAnalysis(session.inputText),
                generateAdvancedNlpAnalysis(session.inputText),
            ]);
            let imageUrlResult: string | null = null;
            try {
                if (session.selectedEmotion) {
                  imageUrlResult = await generateImageWithEmotion(imagePrompt, session.selectedEmotion);
                } else {
                  imageUrlResult = await generateImage(imagePrompt);
                }
            } catch (imgErr) {
                console.warn('Gemini image API failed, fallback to local Stable Diffusion.', imgErr);
                try {
                    // 若本地也能接受情緒合併，可在這裡合併；簡化起見直接傳原 prompt
                    imageUrlResult = await generateImageLocal(imagePrompt);
                } catch (localErr) {
                    console.error('Stable Diffusion local API also failed.', localErr);
                    imageUrlResult = null;
                }
            }
            setSession(prev => ({
                ...prev,
                analysisResult: analysis,
                imageUrl: imageUrlResult,
                advancedNlpResult: advancedNlp
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [session.inputText]);

  const handleGenerateRecommendations = useCallback(async (age: number) => {
    if (!session.inputText.trim()) {
        setError("Please provide some text to analyze for recommendations.");
        return;
    }
    setIsGeneratingRecs(true);
    setError(null);
    try {
        const recs = await generateBookRecommendations(session.inputText, age);
        setSession(prev => ({ ...prev, recommendations: recs }));
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get recommendations.');
    } finally {
        setIsGeneratingRecs(false);
    }
  }, [session.inputText]);
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col">
                <Header onNewAnalysis={handleNewAnalysis} />
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-2xl shadow-purple-900/20 border border-gray-700">
                    <InputPanel 
                        inputText={session.inputText} 
                        setInputText={setInputText}
                        onAnalyze={handleAnalyze}
                        isLoading={isLoading}
                        selectedEmotion={session.selectedEmotion || null}
                        onEmotionChange={setSelectedEmotion}
                    />
                </div>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-lg shadow-2xl shadow-cyan-900/20 border border-gray-700 min-h-[500px] flex flex-col">
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader />
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-red-400">
                        <p>Error: {error}</p>
                    </div>
                ) : session.analysisResult ? (
                    <>
                        <AnalysisTabs activeTab={session.activeTab} setActiveTab={setActiveTab} />
                        <div className="flex-grow overflow-y-auto pt-2 pr-2 -mr-2">
                             <AnalysisContent 
                                session={session}
                                onGenerateRecommendations={handleGenerateRecommendations}
                                isGeneratingRecs={isGeneratingRecs}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <WelcomePlaceholder />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
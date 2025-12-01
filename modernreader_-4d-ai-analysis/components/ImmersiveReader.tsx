// @ts-nocheck
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text3D, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  sensoryServices,
  HapticFeedback,
  ImmersiveSceneManager,
  VisualEnhancement
} from '../services/sensoryService';

interface ImmersiveReaderProps {
  content: string;
  onContentChange?: (content: string) => void;
}

// 3D 文字組件
const Text3DComponent: React.FC<{ text: string; position: [number, number, number] }> = ({ text, position }) => {
  return (
    <Text3D
      font="/fonts/helvetiker_regular.typeface.json"
      size={0.5}
      height={0.2}
      position={position}
      castShadow
    >
      {text}
      <meshStandardMaterial color="#8b5cf6" />
    </Text3D>
  );
};

// 3D 書籍組件
const Book3D: React.FC<{ 
  position: [number, number, number]; 
  rotation: [number, number, number];
  onClick?: () => void;
}> = ({ position, rotation, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2, 3, 0.3]} />
      <meshStandardMaterial 
        color={hovered ? '#a78bfa' : '#8b5cf6'} 
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
};

// 粒子效果
const ParticleField: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  useEffect(() => {
    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;
      
      const animate = () => {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] = Math.sin((Date.now() * 0.001 + i) * 0.5) * 2;
        }
        geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, []);

  const particles = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    particles[i * 3] = (Math.random() - 0.5) * 20;
    particles[i * 3 + 1] = (Math.random() - 0.5) * 20;
    particles[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#8b5cf6" transparent opacity={0.6} />
    </points>
  );
};

// 主沉浸式閱讀器組件
export default function ImmersiveReader({ content, onContentChange }: ImmersiveReaderProps) {
  const [is3DMode, setIs3DMode] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [xrSupport, setXrSupport] = useState({ vr: false, ar: false });
  
  // 輸入模式狀態
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(false);
  const [brainwaveEnabled, setBrainwaveEnabled] = useState(false);
  const [handwritingMode, setHandwritingMode] = useState(false);
  
  // 感官狀態
  const [currentScene, setCurrentScene] = useState<'library' | 'nature' | 'focus' | 'cozy'>('library');
  const [iotConnected, setIotConnected] = useState(false);
  
  // 語音識別
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // 手寫板
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  // 檢測 XR 支援
  useEffect(() => {
    (async () => {
      const support = await VisualEnhancement.checkXRSupport();
      setXrSupport(support);
    })();
  }, []);

  // 語音識別初始化
  const toggleVoiceInput = () => {
    if (!voiceEnabled) {
      sensoryServices.voice.startListening((text, isFinal) => {
        setVoiceText(text);
        if (isFinal) {
          const command = sensoryServices.voice.parseVoiceCommand(text);
          if (command) {
            handleVoiceCommand(command);
          } else if (onContentChange) {
            onContentChange(content + ' ' + text);
          }
          HapticFeedback.triggerFeedback('success');
        }
      });
      setIsListening(true);
      HapticFeedback.triggerFeedback('click');
    } else {
      sensoryServices.voice.stopListening();
      setIsListening(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // 處理語音命令
  const handleVoiceCommand = (command: { action: string; params?: any }) => {
    console.log('Voice command:', command);
    HapticFeedback.triggerFeedback('notification');
    
    switch (command.action) {
      case 'read_aloud':
        sensoryServices.audio.textToSpeechWithEmotion(content, 'neutral');
        break;
      case 'next_page':
        // 實現翻頁邏輯
        break;
      case 'zoom_in':
        // 實現縮放邏輯
        break;
      // ... 其他命令
    }
  };

  // 手勢控制初始化
  const toggleGestureControl = async () => {
    if (!gestureEnabled && videoRef.current) {
      const ok = await ensureCamera();
      if (!ok) return;
      await sensoryServices.gesture.initialize(videoRef.current);
      startGestureDetection();
      HapticFeedback.triggerFeedback('success');
    }
    setGestureEnabled(!gestureEnabled);
  };

  const startGestureDetection = () => {
    const detectLoop = async () => {
      if (gestureEnabled) {
        const gestures = await sensoryServices.gesture.detectGestures();
        if (gestures && gestures.length > 0) {
          console.log('Detected gestures:', gestures);
          HapticFeedback.triggerFeedback('click');
        }
        requestAnimationFrame(detectLoop);
      }
    };
    detectLoop();
  };

  // 眼動追蹤
  const toggleEyeTracking = async () => {
    if (!eyeTrackingEnabled && videoRef.current) {
      const ok = await ensureCamera();
      if (!ok) return;
      await sensoryServices.eyeTracking.initialize(videoRef.current);
      await sensoryServices.eyeTracking.calibrate();
      HapticFeedback.triggerFeedback('success');
    }
    setEyeTrackingEnabled(!eyeTrackingEnabled);
  };

  // 腦波整合
  const toggleBrainwave = async () => {
    if (!brainwaveEnabled) {
      await sensoryServices.brainwave.connectDevice('muse');
      HapticFeedback.triggerFeedback('success');
    }
    setBrainwaveEnabled(!brainwaveEnabled);
  };

  // 手寫板初始化
  // 相機處理：啟動/停止、鏡頭切換、HTTPS 檢查
  const isSecureOk = () => {
    // 行動裝置常需要 HTTPS 或 localhost
    if (window.isSecureContext) return true;
    const host = location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  };

  const startCamera = async (facing?: 'user' | 'environment') => {
    try {
      setCameraError(null);
      if (!isSecureOk()) {
        setCameraError('行動裝置相機需要 HTTPS 或使用 localhost 存取');
        return false;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      const facingMode = facing || cameraFacing;
      const constraints: MediaStreamConstraints = {
        video: { facingMode },
        audio: false,
      };
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // iOS 可能不支援 facingMode，嘗試列舉裝置找後置鏡頭
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        const back = cams.find(d => /back|rear|environment/i.test(d.label));
        if (back && (navigator.mediaDevices as any).getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: back.deviceId } },
            audio: false,
          });
        } else {
          // 最後再次嘗試不指定 facing
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraReady(true);
        return true;
      }
      setCameraError('相機串流無法初始化');
      return false;
    } catch (err) {
      console.error('ImmersiveReader camera error:', err);
      setCameraError(err instanceof Error ? err.message : '相機啟動失敗');
      setCameraReady(false);
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    }
  };

  const ensureCamera = async () => {
    if (cameraReady && streamRef.current) return true;
    return await startCamera();
  };

  const switchCamera = async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    await startCamera(next);
  };

  // 當手勢與眼動都關閉時釋放相機
  useEffect(() => {
    if (!gestureEnabled && !eyeTrackingEnabled) {
      stopCamera();
    }
  }, [gestureEnabled, eyeTrackingEnabled]);
  useEffect(() => {
    if (handwritingMode && canvasRef.current) {
      sensoryServices.handwriting.initialize(canvasRef.current);
    }
  }, [handwritingMode]);

  // 場景切換
  const changeScene = async (scene: typeof currentScene) => {
    const sceneConfig = await sensoryServices.scene.setScene(scene);
    setCurrentScene(scene);
    HapticFeedback.triggerFeedback('notification');
    
    // 如果連接 IoT 裝置，應用場景設置
    if (iotConnected) {
      await sensoryServices.iot.triggerScent(sceneConfig.scent as any);
      await sensoryServices.iot.adjustTemperature(sceneConfig.temperature);
    }
  };

  // IoT 裝置連接
  const connectIoTDevices = async () => {
    try {
      await sensoryServices.iot.connect('mqtt://localhost:1883');
      setIotConnected(true);
      HapticFeedback.triggerFeedback('success');
    } catch (e) {
      console.error('Failed to connect IoT devices:', e);
      HapticFeedback.triggerFeedback('error');
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* 3D 場景 */}
      <AnimatePresence>
        {is3DMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[0, 0, 10]} />
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
              <pointLight position={[-10, -10, -10]} />
              
              <Suspense fallback={null}>
                <Environment preset="sunset" />
                <Book3D 
                  position={[0, 0, 0]} 
                  rotation={[0, 0, 0]}
                  onClick={() => HapticFeedback.triggerFeedback('click')}
                />
                <ParticleField />
              </Suspense>
              
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            </Canvas>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 控制面板 */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        <motion.div
          className="bg-gray-800/90 backdrop-blur-lg rounded-lg p-4 shadow-xl"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h3 className="text-white font-semibold mb-3 text-sm">🎭 沉浸式控制</h3>
          
          {/* 3D 模式 */}
          <button
            onClick={() => {
              setIs3DMode(!is3DMode);
              HapticFeedback.triggerFeedback('click');
            }}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              is3DMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {is3DMode ? '📖 2D模式' : '🌟 3D模式'}
          </button>

          {/* VR 模式 */}
          {xrSupport.vr && (
            <button
              onClick={() => {
                setIsVRMode(!isVRMode);
                HapticFeedback.triggerFeedback('click');
              }}
              className="w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              🥽 VR模式
            </button>
          )}

          {/* 場景選擇 */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">場景氛圍</p>
            <div className="grid grid-cols-2 gap-2">
              {(['library', 'nature', 'focus', 'cozy'] as const).map(scene => (
                <button
                  key={scene}
                  onClick={() => changeScene(scene)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    currentScene === scene
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {scene === 'library' ? '📚 圖書館' :
                   scene === 'nature' ? '🌿 大自然' :
                   scene === 'focus' ? '🎯 專注' : '🛋️ 舒適'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 輸入模式面板 */}
        <motion.div
          className="bg-gray-800/90 backdrop-blur-lg rounded-lg p-4 shadow-xl"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-white font-semibold mb-3 text-sm">🎮 全方位輸入</h3>
          
          {/* 語音輸入 */}
          <button
            onClick={toggleVoiceInput}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              voiceEnabled
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎤 語音 {voiceEnabled && '(聆聽中)'}
          </button>

          {/* 手勢控制 */}
          <button
            onClick={toggleGestureControl}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              gestureEnabled
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ✋ 手勢
          </button>

          {/* 眼動追蹤 */}
          <button
            onClick={toggleEyeTracking}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              eyeTrackingEnabled
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            👁️ 眼動
          </button>

          {/* 腦波 */}
          <button
            onClick={toggleBrainwave}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              brainwaveEnabled
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🧠 腦波
          </button>

          {/* 手寫 */}
          <button
            onClick={() => {
              setHandwritingMode(!handwritingMode);
              HapticFeedback.triggerFeedback('click');
            }}
            className={`w-full mb-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              handwritingMode
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ✍️ 手寫
          </button>

          {/* IoT 裝置 */}
          <button
            onClick={connectIoTDevices}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              iotConnected
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🌐 IoT裝置 {iotConnected && '✓'}
          </button>
        </motion.div>
      </div>

      {/* 語音識別顯示 */}
      <AnimatePresence>
        {voiceEnabled && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800/90 backdrop-blur-lg rounded-lg px-6 py-4 shadow-xl min-w-[300px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-white text-sm">
                {voiceText || '正在聆聽...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 手寫板 */}
      <AnimatePresence>
        {handwritingMode && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute bottom-20 left-4 z-20 bg-white rounded-lg shadow-2xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-gray-800">手寫輸入</h4>
              <button
                onClick={async () => {
                  const text = await sensoryServices.handwriting.recognizeText();
                  if (onContentChange) {
                    onContentChange(content + ' ' + text);
                  }
                  sensoryServices.handwriting.clear();
                  HapticFeedback.triggerFeedback('success');
                }}
                className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
              >
                識別
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="border-2 border-gray-300 rounded cursor-crosshair"
              onMouseDown={(e) => {
                const rect = canvasRef.current!.getBoundingClientRect();
                sensoryServices.handwriting.startDrawing(
                  e.clientX - rect.left,
                  e.clientY - rect.top
                );
                HapticFeedback.triggerFeedback('typing');
              }}
              onMouseMove={(e) => {
                const rect = canvasRef.current!.getBoundingClientRect();
                sensoryServices.handwriting.draw(
                  e.clientX - rect.left,
                  e.clientY - rect.top
                );
              }}
              onMouseUp={() => sensoryServices.handwriting.stopDrawing()}
              onMouseLeave={() => sensoryServices.handwriting.stopDrawing()}
            />
            <button
              onClick={() => {
                sensoryServices.handwriting.clear();
                HapticFeedback.triggerFeedback('click');
              }}
              className="mt-2 w-full px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
            >
              清除
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 內容顯示區 */}
      <div className="absolute inset-0 z-0 flex items-center justify-center p-8">
        <motion.div
          className="max-w-4xl bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-white text-lg leading-relaxed">
            {content || '開始你的 4D 沉浸式閱讀體驗...'}
          </div>
        </motion.div>
      </div>

      {/* 視頻元素（用於手勢和眼動追蹤） */}
      {(gestureEnabled || eyeTrackingEnabled) && (
        <div className="absolute bottom-4 right-4 z-50">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 border border-purple-500/30">
            <video
              ref={videoRef}
              className="w-48 h-36 rounded-md object-cover"
              autoPlay
              muted
              playsInline
            />
            {/* 鏡頭切換與錯誤提示 */}
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs text-purple-300">
                {gestureEnabled && '手勢追蹤'}
                {gestureEnabled && eyeTrackingEnabled && ' + '}
                {eyeTrackingEnabled && '眼動追蹤'}
              </div>
              <button
                onClick={switchCamera}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                title={cameraFacing === 'environment' ? '切到前置鏡頭' : '切到後置鏡頭'}
              >
                {cameraFacing === 'environment' ? '後置' : '前置'}
              </button>
            </div>
            {cameraError && (
              <div className="mt-1 text-[10px] text-red-400 max-w-xs">{cameraError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

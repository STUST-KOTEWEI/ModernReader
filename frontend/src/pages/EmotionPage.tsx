import React, { useEffect, useRef, useState } from "react";
import { aiClient } from "../services/api";
import { useI18n } from "../i18n/useI18n";
import { useEmotionStore, mapFaceExpressionToMood } from "../state/emotion";

type Expressions = {
  neutral?: number;
  happy?: number;
  sad?: number;
  angry?: number;
  fearful?: number;
  disgusted?: number;
  surprised?: number;
};

export default function EmotionPage() {
  const { t } = useI18n();
  const setEmotion = useEmotionStore((s) => s.setEmotion);
  // Camera / face state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camEnabled, setCamEnabled] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [expressions, setExpressions] = useState<Expressions>({});
  const [topExpression, setTopExpression] = useState<string>("neutral");

  // Text analysis state
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [textTop, setTextTop] = useState<string | null>(null);
  const [textDist, setTextDist] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load models and start camera
  const startCamera = async () => {
    try {
      setError(null);
      setLoadingModels(true);
      
      // Load face-api.js UMD via script tag (use vladmandic fork for better model packaging)
      // Prefer local UMD served from public/models; fallback to CDN
      const LOCAL_SCRIPT_URL = "/models/face-api/face-api.js";
      const CDN_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
      
      const testLocal = async () => {
        try {
          const res = await fetch(LOCAL_SCRIPT_URL, { method: "HEAD" });
          return res.ok;
        } catch {
          return false;
        }
      };
      
      const useLocal = await testLocal();
      const scriptUrl = useLocal ? LOCAL_SCRIPT_URL : CDN_SCRIPT_URL;
      
      // Load UMD script dynamically and wait for global window.faceapi
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${scriptUrl}`));
        document.head.appendChild(script);
      });
      
      const faceapi = (window as any).faceapi;
      if (!faceapi) {
        throw new Error("face-api.js loaded but window.faceapi not available");
      }

      // Load models from local weights if available; fallback to CDN
      const LOCAL_MODEL_URL = "/models/face-api/weights";
      const CDN_MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
      const testLocalWeights = async () => {
        try {
          const res = await fetch(`${LOCAL_MODEL_URL}/tiny_face_detector_model-weights_manifest.json`, { method: "HEAD" });
          return res.ok;
        } catch {
          return false;
        }
      };
      const useLocalWeights = await testLocalWeights();
      const MODEL_URL = useLocalWeights ? LOCAL_MODEL_URL : CDN_MODEL_URL;
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setLoadingModels(false);
      setFaceReady(true);

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Avoid unhandled promise rejection: play() was interrupted by a new load request
        try { await videoRef.current.play(); } catch {}
        setCamEnabled(true);
      }

      // Start loop for expression detection
      const detectLoop = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          requestAnimationFrame(detectLoop);
          return;
        }
        try {
          const det = await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            )
            .withFaceExpressions();
          if (det?.expressions) {
            const exps = det.expressions as Expressions;
            setExpressions(exps);
            // Map face-api labels to our display ones
            let top: keyof Expressions = "neutral";
            let topVal = 0;
            for (const k of Object.keys(exps) as Array<keyof Expressions>) {
              const v = exps[k] ?? 0;
              if (v > topVal) {
                top = k;
                topVal = v;
              }
            }
            const expr = top || "neutral";
            setTopExpression(expr);
            // push to global store for cross-page recommendations
            setEmotion(mapFaceExpressionToMood(expr), 'camera');
          }
        } catch (e) {
          // ignore per-frame errors
        } finally {
          requestAnimationFrame(detectLoop);
        }
      };
      requestAnimationFrame(detectLoop);
    } catch (e: any) {
      setLoadingModels(false);
      setError(
        (e?.message || "無法啟動鏡頭或載入模型") +
          "。若為第一次使用，請先執行 scripts/download-face-api-assets.sh 下載本機模型，或確保可連線到 jsDelivr。"
      );
    }
  };

  const stopCamera = () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setCamEnabled(false);
    } catch {}
  };

  // Text analysis
  const analyzeText = async () => {
    setAnalyzing(true);
    setError(null);
    try {
  const res = await aiClient.analyzeEmotion({ text });
  setTextTop(res.top_emotion);
  // also propagate to global mood store
  setEmotion(mapFaceExpressionToMood(res.top_emotion || ''), 'text');
      setTextDist(res.emotions);
    } catch (e: any) {
      setError(e?.message || "文字情緒分析失敗");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      // cleanup camera on unmount
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('emotionAI')}</h1>
        <p className="text-gray-500">{t('cameraDetection')} + {t('textEmotionAnalysis')}</p>
      </div>

      {/* Camera panel */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{t('cameraDetection')}</h2>
            <div className="flex gap-2">
              {!camEnabled ? (
                <button
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                  onClick={startCamera}
                  disabled={loadingModels}
                >
                  {loadingModels ? t('loadingModels') : t('enableCamera')}
                </button>
              ) : (
                <button
                  className="px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={stopCamera}
                >
                  {t('disableCamera')}
                </button>
              )}
            </div>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 text-sm">
            <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('currentExpression')}</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300 animate-pulse">
                {topExpression.toUpperCase()}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(expressions).map(([k, v]) => (
                <div 
                  key={k} 
                  className={`flex items-center justify-between p-2 rounded transition-all ${
                    k === topExpression 
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 font-semibold text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>{k}</span>
                  <span className="tabular-nums">{(v * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            {!faceReady && (
              <p className="mt-2 text-gray-500">{t('firstTimeModelNote')}</p>
            )}
          </div>
        </div>

        {/* Text analysis panel */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <h2 className="font-semibold mb-3">{t('textEmotionAnalysis')}</h2>
          <textarea
            className="w-full min-h-[160px] rounded-md border border-gray-300 dark:border-gray-700 bg-transparent p-3"
            placeholder={t('pasteOrTypeText')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              onClick={analyzeText}
              disabled={!text.trim() || analyzing}
            >
              {analyzing ? t('analyzing') : t('analyzeText')}
            </button>
            {textTop && (
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('topEmotion')}：
                <span className="ml-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{textTop}</span>
              </span>
            )}
          </div>
          {textDist && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {Object.entries(textDist).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>{k}</span>
                  <span className="tabular-nums">{(v * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {t('analysisFailed')}: {error}
        </div>
      )}
    </div>
  );
}

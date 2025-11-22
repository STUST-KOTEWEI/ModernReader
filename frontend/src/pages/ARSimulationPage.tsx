import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import { Button, Card } from '../design-system';

interface ARScene {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  bookContext: string;
}

export default function ARSimulationPage() {
  const { t, language } = useI18n();
  const [selectedScene, setSelectedScene] = useState<ARScene | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const arScenes: ARScene[] = [
    {
      id: 'forest',
      name: language === 'zh' ? '森林探索' : language === 'ja' ? '森林探索' : 'Forest Exploration',
      description: language === 'zh'
        ? '在虛擬森林中體驗原住民傳說，觀察動植物互動。'
        : language === 'ja'
        ? '仮想の森で先住民の伝説を体験し、動植物の相互作用を観察。'
        : 'Experience indigenous legends in a virtual forest, observe flora and fauna interactions.',
      thumbnail: '🌲',
      bookContext: 'Forest Stories'
    },
    {
      id: 'ocean',
      name: language === 'zh' ? '海洋生態' : language === 'ja' ? '海洋生態' : 'Ocean Ecosystem',
      description: language === 'zh'
        ? '潛入 3D 海洋場景，了解達悟族的獨木舟文化與珊瑚礁守護。'
        : language === 'ja'
        ? '3D海洋シーンでタオ族のカヌー文化とサンゴ礁保護を学ぶ。'
        : 'Dive into 3D ocean scenes, learn about Tao canoe culture and reef stewardship.',
      thumbnail: '🌊',
      bookContext: 'Guardians of the Reef'
    },
    {
      id: 'mountain',
      name: language === 'zh' ? '高山部落' : language === 'ja' ? '高山部族' : 'Mountain Village',
      description: language === 'zh'
        ? '造訪虛擬高山部落，體驗賽德克族的天空舞者史詩。'
        : language === 'ja'
        ? '仮想高山部族を訪れ、セデック族の天空舞者叙事詩を体験。'
        : 'Visit a virtual mountain village and experience Seediq sky dancer epics.',
      thumbnail: '⛰️',
      bookContext: 'Sky Dancers'
    },
    {
      id: 'weaving',
      name: language === 'zh' ? '編織工藝' : language === 'ja' ? '織物工芸' : 'Weaving Crafts',
      description: language === 'zh'
        ? '互動式學習排灣族織布紋樣，透過 AR 看見圖案背後的神話故事。'
        : language === 'ja'
        ? 'パイワン族の織物パターンをARで学び、神話を発見。'
        : 'Learn Paiwan weaving patterns interactively, discover myths behind designs via AR.',
      thumbnail: '🧵',
      bookContext: 'Stories Woven in Patterns'
    },
    {
      id: 'plants',
      name: language === 'zh' ? '藥用植物' : language === 'ja' ? '薬用植物' : 'Medicinal Plants',
      description: language === 'zh'
        ? 'AR 標記辨識療癒植物，學習傳統醫藥知識。'
        : language === 'ja'
        ? 'ARマーカーで薬用植物を識別し、伝統医療知識を学ぶ。'
        : 'Identify healing plants with AR markers, learn traditional medicine.',
      thumbnail: '🌿',
      bookContext: 'Healing Plants of the Highlands'
    },
    {
      id: 'river',
      name: language === 'zh' ? '河流吟唱' : language === 'ja' ? '川の詠唱' : 'River Chants',
      description: language === 'zh'
        ? '沿著虛擬河流聆聽阿美族歌謠，觀看 3D 動畫演繹。'
        : language === 'ja'
        ? '仮想川沿いでアミ族の歌を聴き、3Dアニメを鑑賞。'
        : 'Follow a virtual river, listen to Amis chants with 3D animations.',
      thumbnail: '🎶',
      bookContext: 'Songs of the River'
    }
  ];

  const startSimulation = () => {
    setIsSimulating(true);
    // Simulate loading
    setTimeout(() => {
      setIsSimulating(false);
    }, 3000);
  };

  // Lightweight canvas-based AR-like preview (no external deps)
  const ARCanvas: React.FC<{ sceneId: string }> = ({ sceneId }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Logical size (will scale via CSS to container)
      const W = 800;
      const H = 450;
      canvas.width = W;
      canvas.height = H;

      // Seed shapes/particles based on scene
      const rngSeed = Array.from(sceneId).reduce((a, c) => a + c.charCodeAt(0), 0);
      let rnd = rngSeed;
      const rand = () => {
        // xorshift-like
        rnd ^= rnd << 13; rnd ^= rnd >> 17; rnd ^= rnd << 5; return Math.abs(rnd % 10000) / 10000;
      };

      const colors = {
        forest: ['#16a34a', '#22c55e', '#065f46'],
        ocean: ['#0284c7', '#22d3ee', '#0e7490'],
        mountain: ['#6b7280', '#9ca3af', '#374151'],
        weaving: ['#9333ea', '#f59e0b', '#ef4444'],
        plants: ['#10b981', '#34d399', '#065f46'],
        river: ['#38bdf8', '#0ea5e9', '#1d4ed8']
      } as Record<string, string[]>;

      const palette = colors[sceneId] || ['#38bdf8', '#0ea5e9', '#1d4ed8'];

      type Particle = { x: number; y: number; r: number; vx: number; vy: number; color: string };
      const particles: Particle[] = Array.from({ length: 120 }, () => ({
        x: W * rand(),
        y: H * rand(),
        r: 1 + rand() * 3,
        vx: (rand() - 0.5) * 0.6,
        vy: (rand() - 0.5) * 0.6,
        color: palette[Math.floor(rand() * palette.length)]
      }));

      // Floating AR markers
      const markers = Array.from({ length: 6 }, (_, i) => ({
        x: (i + 1) * (W / 7),
        y: H / 2 + (rand() - 0.5) * 80,
        size: 18 + rand() * 24,
        hue: Math.floor(180 + rand() * 120)
      }));

      let t0 = performance.now();
      const draw = (t1: number) => {
        const dt = Math.min(33, t1 - t0);
        t0 = t1;

        // background gradient
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(1, 'rgba(243,244,246,1)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // soft vignette
        const vignette = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.06)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // parallax layers
        const time = t1 * 0.001;
        const parallax = (layer: number) => Math.sin(time * (0.1 + layer * 0.05)) * (6 + layer * 4);

        // draw particles
        particles.forEach(p => {
          p.x += p.vx * (1 + 0.2 * Math.sin(time));
          p.y += p.vy * (1 + 0.2 * Math.cos(time));
          if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
          if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
          ctx.beginPath();
          ctx.fillStyle = p.color + 'AA';
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // draw AR markers (crosshair-like)
        markers.forEach((m, idx) => {
          const wobble = Math.sin(time * 1.2 + idx) * 10;
          const x = m.x + parallax(idx % 3) + wobble * 0.2;
          const y = m.y + parallax((idx + 1) % 3) * 0.6;
          const s = m.size + 4 * Math.sin(time * 2 + idx);
          ctx.save();
          ctx.translate(x, y);
          ctx.strokeStyle = `hsla(${m.hue}, 85%, 55%, 0.85)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-s - 6, 0); ctx.lineTo(-s + 6, 0);
          ctx.moveTo(s - 6, 0); ctx.lineTo(s + 6, 0);
          ctx.moveTo(0, -s - 6); ctx.lineTo(0, -s + 6);
          ctx.moveTo(0, s - 6); ctx.lineTo(0, s + 6);
          ctx.stroke();
          ctx.restore();
        });

        // subtle HUD text
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(`Scene: ${sceneId}  •  t=${time.toFixed(1)}s  •  particles=${particles.length}` , 12, H - 12);

        rafRef.current = requestAnimationFrame(draw);
      };

      rafRef.current = requestAnimationFrame(draw);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [sceneId]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-label="AR animated preview"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            🕶️ {language === 'zh' ? 'AR 情境模擬' : language === 'ja' ? 'ARシミュレーション' : 'AR Scenario Simulation'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {language === 'zh'
              ? '透過擴增實境與可編程物質模擬，預覽沉浸式閱讀場景。'
              : language === 'ja'
              ? 'AR とプログラマブルマテリアルシミュレーションで没入型読書を体験。'
              : 'Preview immersive reading scenarios through AR and programmable matter simulation.'}
          </p>
        </div>

        {/* AR Scenes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {arScenes.map(scene => (
            <Card
              key={scene.id}
              className={`cursor-pointer transition-all ${
                selectedScene?.id === scene.id
                  ? 'ring-4 ring-cyan-500 scale-105'
                  : 'hover:scale-102 hover:shadow-xl'
              }`}
              onClick={() => setSelectedScene(scene)}
            >
              <div className="space-y-4">
                <div className="text-6xl text-center">{scene.thumbnail}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {scene.name}
                  </h3>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">
                    📖 {scene.bookContext}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {scene.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Simulation Panel */}
        {selectedScene && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                {selectedScene.name}
              </h2>
              <Button variant="secondary" onClick={() => setSelectedScene(null)}>
                {t('close')}
              </Button>
            </div>

            {isSimulating ? (
              <div className="aspect-video bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4 animate-pulse">🔄</div>
                  <p className="text-xl font-semibold">
                    {language === 'zh' ? '載入 AR 場景中...' : language === 'ja' ? 'ARシーンを読み込み中...' : 'Loading AR Scene...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
                  {/* Animated AR-like canvas */}
                  <ARCanvas sceneId={selectedScene.id} />
                  {/* Foreground HUD */}
                  <div className="relative z-10 text-center pointer-events-none p-4">
                    <div className="text-6xl mb-2 drop-shadow-sm">{selectedScene.thumbnail}</div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 drop-shadow-sm">
                      {language === 'zh' ? 'AR 預覽區' : language === 'ja' ? 'ARプレビュー' : 'AR Preview Area'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {language === 'zh' 
                        ? '視覺效果為示意。點擊下方開始可顯示載入與過場。' 
                        : language === 'ja'
                        ? '視覚効果はデモです。下の開始でローディング演出が見られます。'
                        : 'Visuals are illustrative. Use Start below to see loading and transitions.'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <h4 className="font-semibold text-cyan-800 dark:text-cyan-300 mb-2">
                      {language === 'zh' ? '📚 關聯書籍' : language === 'ja' ? '📚 関連書籍' : '📚 Related Book'}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedScene.bookContext}</p>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                      {language === 'zh' ? '🎮 互動元素' : language === 'ja' ? '🎮 インタラクション' : '🎮 Interactive Elements'}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {language === 'zh' ? '3D 模型、音效、觸覺回饋' : language === 'ja' ? '3Dモデル、音響、触覚フィードバック' : '3D models, audio, haptic feedback'}
                    </p>
                  </div>
                </div>

                <Button onClick={startSimulation} className="w-full text-lg py-4">
                  🚀 {language === 'zh' ? '啟動 AR 模擬' : language === 'ja' ? 'ARシミュレーション開始' : 'Start AR Simulation'}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Technology Explanation */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            {language === 'zh' ? '技術說明' : language === 'ja' ? '技術説明' : 'Technology Overview'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl">🕶️</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {language === 'zh' ? 'WebXR API' : 'WebXR API'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh'
                  ? '基於 WebXR 標準實現跨裝置 AR 體驗。'
                  : language === 'ja'
                  ? 'WebXR標準でクロスデバイスAR体験を実現。'
                  : 'Cross-device AR experiences built on WebXR standards.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🧩</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {language === 'zh' ? '可編程物質' : language === 'ja' ? 'プログラマブルマター' : 'Programmable Matter'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh'
                  ? '動態形變材料模擬，提供觸覺與視覺反饋。'
                  : language === 'ja'
                  ? '動的変形素材シミュレーションで触覚・視覚フィードバック。'
                  : 'Dynamic shape-changing materials for tactile and visual feedback.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🎨</div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {language === 'zh' ? '3D 場景渲染' : language === 'ja' ? '3Dレンダリング' : '3D Rendering'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh'
                  ? '使用 Three.js 構建逼真的 3D 環境與角色。'
                  : language === 'ja'
                  ? 'Three.jsでリアルな3D環境とキャラクターを構築。'
                  : 'Build realistic 3D environments and characters with Three.js.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { edgeAI } from './edgeAI';

/**
 * 4D Sensory Service
 * Integrates Visual, Audio, Haptic, and Olfactory experiences.
 * Ported from modernreader_-4d-ai-analysis
 */

// ==================== Visual Enhancement ====================
export class VisualEnhancement {
    // AR/VR Support Check
    static async checkXRSupport() {
        if (typeof navigator !== 'undefined' && 'xr' in navigator) {
            const xr = (navigator as unknown as { xr: { isSessionSupported: (mode: string) => Promise<boolean> } }).xr;
            return {
                vr: await xr?.isSessionSupported?.('immersive-vr') || false,
                ar: await xr?.isSessionSupported?.('immersive-ar') || false,
            };
        }
        return { vr: false, ar: false };
    }

    // Ambient Lighting
    createAmbientLighting(mood: 'focus' | 'relax' | 'energize' | 'immersive') {
        const moods: Record<string, { color: string; intensity: number }> = {
            focus: { color: '#3b82f6', intensity: 0.6 },
            relax: { color: '#10b981', intensity: 0.4 },
            energize: { color: '#f59e0b', intensity: 0.8 },
            immersive: { color: '#8b5cf6', intensity: 0.5 }
        };
        return moods[mood];
    }
}

// ==================== Audio Enhancement ====================
export class AudioEnhancement {
    private audioContext: AudioContext | null = null;
    private spatialPanner: PannerNode | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
    }

    // 3D Spatial Audio
    createSpatialAudio(audioBuffer: AudioBuffer, position: { x: number; y: number; z: number }) {
        if (!this.audioContext) return null;

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;

        this.spatialPanner = this.audioContext.createPanner();
        this.spatialPanner.panningModel = 'HRTF';
        this.spatialPanner.distanceModel = 'inverse';
        this.spatialPanner.setPosition(position.x, position.y, position.z);

        source.connect(this.spatialPanner);
        this.spatialPanner.connect(this.audioContext.destination);

        return source;
    }

    // Text to Speech with Emotion
    async textToSpeechWithEmotion(text: string, emotion: 'neutral' | 'happy' | 'sad' | 'excited') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);

            const emotionSettings = {
                neutral: { pitch: 1, rate: 1, volume: 1 },
                happy: { pitch: 1.2, rate: 1.1, volume: 1 },
                sad: { pitch: 0.8, rate: 0.9, volume: 0.8 },
                excited: { pitch: 1.3, rate: 1.2, volume: 1 }
            };

            const settings = emotionSettings[emotion];
            utterance.pitch = settings.pitch;
            utterance.rate = settings.rate;
            utterance.volume = settings.volume;

            window.speechSynthesis.speak(utterance);
        }
    }
}

// ==================== Haptic Feedback ====================
export class HapticFeedback {
    static vibrate(pattern: number | number[]) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    static patterns = {
        click: [10],
        success: [50, 100, 50],
        error: [100, 50, 100, 50, 100],
        notification: [200, 100, 200],
        pageFlip: [30],
        highlight: [20, 50, 20],
        longPress: [500],
        typing: [5],
        heartbeat: [50, 200, 50, 200], // Lub-dub
        shudder: [20, 10, 20, 10, 20, 10, 20, 10], // Fast ripple
        breeze: [10, 50, 10] // Gentle wave
    };

    static triggerFeedback(type: keyof typeof HapticFeedback.patterns) {
        this.vibrate(this.patterns[type]);
    }
}

// ==================== Immersive Scene Manager ====================
export class ImmersiveSceneManager {
    private currentScene: string = 'default';

    private scenes = {
        library: {
            visual: { background: 'library-3d', lighting: 'warm' },
            audio: 'library-ambient',
            scent: 'coffee',
            temperature: 22
        },
        nature: {
            visual: { background: 'forest-3d', lighting: 'natural' },
            audio: 'nature',
            scent: 'ocean',
            temperature: 24
        },
        focus: {
            visual: { background: 'minimal', lighting: 'focus' },
            audio: 'white-noise',
            scent: 'mint',
            temperature: 20
        },
        cozy: {
            visual: { background: 'fireplace', lighting: 'dim' },
            audio: 'rain',
            scent: 'lavender',
            temperature: 23
        }
    };

    async setScene(sceneName: keyof typeof this.scenes) {
        this.currentScene = sceneName;
        return this.scenes[sceneName];
    }
}

// ==================== Sensory Budget (ACM Contribution) ====================
export class SensoryBudget {
    private currentLoad: number = 0;
    private readonly MAX_LOAD: number = 100; // Arbitrary units
    private recoveryRate: number = 10; // Load recovered per second

    constructor() {
        if (typeof window !== 'undefined') {
            setInterval(() => this.recover(), 1000);
        }
    }

    private recover() {
        this.currentLoad = Math.max(0, this.currentLoad - this.recoveryRate);
    }

    canTrigger(cost: number): boolean {
        return (this.currentLoad + cost) <= this.MAX_LOAD;
    }

    consume(cost: number) {
        this.currentLoad += cost;
    }

    getLoad(): number {
        return this.currentLoad;
    }
}

interface SensoryData {
    haptic: string;
    audio: string;
    ready: boolean;
}

// ==================== Optimistic Sensory Rendering (IEEE Contribution) ====================
// ==================== Optimistic Sensory Rendering (IEEE Contribution) ====================
export class OptimisticScheduler {
    private queue: Map<number, SensoryData> = new Map(); // Index -> SensoryVector
    private prefetchWindow: number = 2; // Look ahead 2 paragraphs

    // Simulate pre-fetching sensory data for future paragraphs
    // Now uses local Edge AI
    async prefetch(currentIndex: number, content: string[]) {
        // Import dynamically to avoid circular dependency issues if any, 
        // though strictly edgeAI is a separate module.
        // Direct import at top level is preferred if structure allows, 
        // but for now we assume global or module availability.
        // Actually, we should import `edgeAI` at the top of the file, but let's use the one we will add.

        for (let i = 1; i <= this.prefetchWindow; i++) {
            const targetIndex = currentIndex + i;
            if (targetIndex < content.length && !this.queue.has(targetIndex)) {
                // Real Async Prefetch
                const textSnippet = content[targetIndex];
                if (!textSnippet) continue;

                // Fire and forget - don't block main thread too much
                edgeAI.analyzeSentiment(textSnippet).then(sentiment => {
                    const sensoryData: SensoryData = {
                        haptic: 'subtle',
                        audio: 'neutral',
                        ready: true
                    };

                    if (sentiment) {
                        console.log(`[SensoryAI] Analysis for #${targetIndex}:`, sentiment);

                        // Map Sentiment to Sensory Effects
                        if (sentiment.label === 'POSITIVE') {
                            sensoryData.haptic = 'heartbeat';
                            sensoryData.audio = 'happy';
                        } else if (sentiment.label === 'NEGATIVE') {
                            sensoryData.haptic = 'shudder';
                            sensoryData.audio = 'sad';
                        } else {
                            sensoryData.haptic = 'breeze';
                            sensoryData.audio = 'neutral';
                        }
                    }

                    this.queue.set(targetIndex, sensoryData);
                }).catch(err => {
                    console.warn("[SensoryAI] Prefetch failed", err);
                });
            }
        }
    }

    getSensoryData(index: number) {
        return this.queue.get(index) || null;
    }
}

// Export all services
export const sensoryServices = {
    visual: new VisualEnhancement(),
    audio: new AudioEnhancement(),
    haptic: HapticFeedback,
    scene: new ImmersiveSceneManager(),
    budget: new SensoryBudget(),
    scheduler: new OptimisticScheduler(),
};

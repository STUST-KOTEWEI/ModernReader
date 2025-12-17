"use client";

import { useState } from "react";
import { Bluetooth, Volume2, Lightbulb, Activity, Zap, Waves } from "lucide-react";
import { bluetoothService } from "@/lib/services/bluetoothService";
import { sensoryServices } from "@/lib/services/sensoryService";

export default function SensoryTestPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 10));

    const handleConnect = async () => {
        addLog("Requesting Bluetooth Device...");
        const connected = await bluetoothService.connect();
        setIsConnected(connected);
        if (connected) addLog("Bluetooth Connected!");
        else addLog("Connection Failed.");
    };

    const handleVibrate = async (intensity: 'low' | 'medium' | 'high') => {
        addLog(`Triggering Haptic: ${intensity}`);
        await bluetoothService.vibrate(intensity);
        // Also trigger browser vibration as fallback
        sensoryServices.haptic.triggerFeedback('notification');
    };

    const handleAudioTest = async () => {
        addLog("Testing Spatial Audio...");
        // Initialize AudioContext on user gesture
        if (!audioContext) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioContextClass();
            setAudioContext(ctx);
        }

        // Simple oscillator beep for testing
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = audioContext || new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 440;
        gain.gain.value = 0.1;

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        addLog("Audio Played (440Hz Beep)");
    };

    const handleLighting = (mood: 'focus' | 'relax' | 'energize') => {
        const settings = sensoryServices.visual.createAmbientLighting(mood);
        addLog(`Lighting set to: ${mood} (${settings.color})`);
        document.body.style.backgroundColor = settings.color;
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 1000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-serif font-bold mb-2 flex items-center gap-3">
                    <Activity className="text-blue-600" /> Sensory Orchestrator Test
                </h1>
                <p className="text-gray-600">Verify Haptics (Web Bluetooth), Audio (Web Audio), and Visual feedback.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Haptics Section */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Bluetooth className="text-blue-500" /> Haptic Interface
                    </h2>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-700">Status</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                            </span>
                        </div>
                        <button
                            onClick={handleConnect}
                            disabled={isConnected}
                            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {isConnected ? 'Device Paired' : 'Pair Haptic Device'}
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleVibrate('low')} className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1">
                            <Zap size={16} className="text-yellow-500" />
                            <span className="text-xs">Low</span>
                        </button>
                        <button onClick={() => handleVibrate('medium')} className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1">
                            <Zap size={20} className="text-orange-500" />
                            <span className="text-xs">Med</span>
                        </button>
                        <button onClick={() => handleVibrate('high')} className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1">
                            <Zap size={24} className="text-red-500" />
                            <span className="text-xs">High</span>
                        </button>
                    </div>
                </section>

                {/* Audio & Visual Section */}
                <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                            <Volume2 className="text-purple-500" /> Spatial Audio
                        </h2>
                        <button
                            onClick={handleAudioTest}
                            className="w-full py-3 border border-purple-200 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Waves size={18} /> Test Spatial Audio
                        </button>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                            <Lightbulb className="text-yellow-500" /> Ambient Lighting
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => handleLighting('focus')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">Focus</button>
                            <button onClick={() => handleLighting('relax')} className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">Relax</button>
                            <button onClick={() => handleLighting('energize')} className="flex-1 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200">Energize</button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Logs */}
            <section className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm h-48 overflow-y-auto">
                <div className="mb-2 text-gray-500 uppercase text-xs tracking-wider">System Logs</div>
                {log.map((entry, i) => (
                    <div key={i} className="mb-1">{`> ${entry}`}</div>
                ))}
                {log.length === 0 && <div className="text-gray-600 italic">Waiting for events...</div>}
            </section>
        </div>
    );
}

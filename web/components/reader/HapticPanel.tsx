import { motion } from "framer-motion";
import { Fingerprint, Wind } from "lucide-react";

interface HapticState {
    temp: number;
    vibe: number;
    scent?: string;
    audio?: string;
}

interface HapticPanelProps {
    hapticState: HapticState;
    onSimulate: () => void;
    feedbackText: string | null;
    showFeedback: boolean;
}

export default function HapticPanel({ hapticState, onSimulate, feedbackText, showFeedback }: HapticPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8"
        >
            <div className="relative w-64 h-96 bg-white rounded-3xl border-4 border-[#e5e0d8] shadow-xl overflow-hidden flex items-center justify-center">
                {/* Haptic Visualization Layer */}
                <div
                    className="absolute inset-0 transition-opacity duration-500 bg-orange-500 mix-blend-multiply"
                    style={{ opacity: hapticState.temp / 200 }}
                />
                <motion.div
                    className="absolute inset-0 bg-blue-500 mix-blend-multiply"
                    animate={{ opacity: hapticState.vibe > 0 ? [0, hapticState.vibe / 200, 0] : 0 }}
                    transition={{ duration: 0.1, repeat: Infinity }}
                />

                <div className="z-10 text-center p-6">
                    <Fingerprint size={48} className="mx-auto mb-4 text-[#1a1a1a] opacity-50" />
                    <h3 className="font-bold text-lg mb-2">Haptic Surface</h3>
                    <p className="text-xs text-[#666] mb-4">
                        Temp: {hapticState.temp}°C <br />
                        Vibe: {hapticState.vibe}Hz
                    </p>

                    {/* Scent Display */}
                    {hapticState.scent && (
                        <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
                                <Wind size={16} />
                                <span className="text-sm font-bold">Scent Detected</span>
                            </div>
                            <p className="text-sm font-serif italic text-[#1a1a1a]">&quot;{hapticState.scent}&quot;</p>
                        </div>
                    )}

                    {/* Audio Display */}
                    {hapticState.audio && (
                        <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
                                <span className="text-sm font-bold">♫ Ambient Audio</span>
                            </div>
                            <p className="text-sm font-serif italic text-[#1a1a1a]">&quot;{hapticState.audio}&quot;</p>
                        </div>
                    )}

                    <button
                        onClick={onSimulate}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                        Simulate Tactile Feedback
                    </button>
                </div>
            </div>
            <p className="mt-8 text-[#666] text-sm max-w-md text-center">
                Touch the screen to feel the warmth, vibration, and scent of the story.
                <br />
                <span className="text-xs opacity-50">(Hardware Simulation Active)</span>
            </p>
            {showFeedback && feedbackText && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-8 bg-black/70 text-white text-sm px-4 py-2 rounded-lg"
                >
                    {feedbackText}
                </motion.div>
            )}
        </motion.div>
    );
}

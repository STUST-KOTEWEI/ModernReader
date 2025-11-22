"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Thermometer, Waves, Fingerprint, Share2, MessageCircle, BookOpen, Globe, Facebook, Twitter, Linkedin } from "lucide-react";
import clsx from "clsx";

interface SweetReaderProps {
    title: string;
    author: string;
    content: string;
}

export default function SweetReader({ title, author, content }: SweetReaderProps) {
    const [activeMode, setActiveMode] = useState<"read" | "watch" | "experience" | "tell">("read");
    const [hapticState, setHapticState] = useState({ temp: 0, vibe: 0, texture: false });
    const [isPlaying, setIsPlaying] = useState(false);
    const [language, setLanguage] = useState("English");

    return (
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-[#fdfbf7]">

            {/* Left Panel: Content & AI Avatar */}
            <div className="flex-1 flex flex-col relative border-r border-[#e5e0d8]">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-[#e5e0d8] bg-[#fdfbf7]/80 backdrop-blur-sm z-10">
                    <div>
                        <h1 className="font-serif font-bold text-xl text-[#1a1a1a]">{title}</h1>
                        <p className="text-xs text-[#666] uppercase tracking-wider">{author}</p>
                    </div>
                    <div className="flex gap-2">
                        <ModeToggle active={activeMode === "read"} onClick={() => setActiveMode("read")} icon={<BookOpen size={18} />} label="See" />
                        <ModeToggle active={activeMode === "watch"} onClick={() => setActiveMode("watch")} icon={<MessageCircle size={18} />} label="Watch" />
                        <ModeToggle active={activeMode === "experience"} onClick={() => setActiveMode("experience")} icon={<Fingerprint size={18} />} label="Experience" />
                        <ModeToggle active={activeMode === "tell"} onClick={() => setActiveMode("tell")} icon={<Share2 size={18} />} label="Tell" />
                    </div>
                </header>

                {/* Main Reading Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-16 scroll-smooth relative">
                    <AnimatePresence mode="wait">
                        {activeMode === "read" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-3xl mx-auto font-serif text-lg lg:text-xl leading-relaxed text-[#1a1a1a]"
                            >
                                {content.split('\n').map((para, i) => (
                                    <p key={i} className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left">
                                        {para}
                                    </p>
                                ))}
                            </motion.div>
                        )}

                        {activeMode === "watch" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full flex items-center justify-center"
                            >
                                <div className="w-full max-w-2xl aspect-video bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden relative group">
                                    {/* AI Avatar Visualization */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/80 to-black">
                                        <div className="text-center relative z-10">
                                            {/* Audio Wave Animation */}
                                            <div className="flex items-center justify-center gap-1 mb-8 h-16">
                                                {[...Array(5)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [20, 60, 20] }}
                                                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                                        className="w-2 bg-white/80 rounded-full"
                                                    />
                                                ))}
                                            </div>
                                            <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-orange-500 to-purple-600 rounded-full mb-4 p-1">
                                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                                                    <img src="https://api.dicebear.com/7.x/micah/svg?seed=Elder" alt="AI Avatar" className="w-full h-full object-cover opacity-80" />
                                                </div>
                                            </div>
                                            <p className="text-[#fdfbf7] font-medium text-lg">Elder Speaking ({language})</p>
                                        </div>

                                        {/* Background Effects */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
                                    </div>

                                    {/* Subtitles */}
                                    <div className="absolute bottom-12 left-0 right-0 text-center px-8">
                                        <p className="text-white/90 text-xl font-medium font-serif leading-relaxed drop-shadow-md">
                                            &quot;Long ago, before the mountains touched the sky...&quot;
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeMode === "experience" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center"
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
                                        <p className="text-xs text-[#666]">
                                            Temp: {hapticState.temp}°C <br />
                                            Vibe: {hapticState.vibe}Hz
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-8 text-[#666] text-sm max-w-md text-center">
                                    Touch the screen to feel the warmth of the campfire and the rumble of the thunder.
                                    <br />
                                    <span className="text-xs opacity-50">(Hardware Simulation Active)</span>
                                </p>
                            </motion.div>
                        )}

                        {activeMode === "tell" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="h-full flex items-center justify-center p-8"
                            >
                                <div className="bg-white p-8 rounded-3xl border border-[#e5e0d8] shadow-xl max-w-md w-full text-center">
                                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white mx-auto mb-6">
                                        <Share2 size={32} />
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl mb-2">Share the Wisdom</h2>
                                    <p className="text-[#666] mb-8">Pass this story to the next generation.</p>

                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <SocialButton icon={<Facebook />} label="Facebook" />
                                        <SocialButton icon={<Twitter />} label="Twitter" />
                                        <SocialButton icon={<Linkedin />} label="LinkedIn" />
                                    </div>

                                    <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#e5e0d8] flex items-center justify-between text-sm text-[#666]">
                                        <span className="truncate">modernreader.com/s/paiwan-legend</span>
                                        <button className="font-bold text-[#1a1a1a] hover:underline">Copy</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Haptic Status Bar (Experience Mode) */}
                <div className={clsx(
                    "h-16 border-t border-[#e5e0d8] flex items-center px-8 gap-6 transition-all duration-300 absolute bottom-0 left-0 right-0 bg-[#fdfbf7]",
                    activeMode === "experience" ? "translate-y-0" : "translate-y-full opacity-0"
                )}>
                    <div className="flex items-center gap-3">
                        <Thermometer size={20} className={hapticState.temp > 0 ? "text-orange-500" : "text-[#999]"} />
                        <div className="h-1.5 w-24 bg-[#e5e0d8] rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${hapticState.temp}%` }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Waves size={20} className={hapticState.vibe > 0 ? "text-blue-500" : "text-[#999]"} />
                        <div className="h-1.5 w-24 bg-[#e5e0d8] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${hapticState.vibe}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Tools & Podcast (Enjoy/Tell) */}
            <div className="w-full lg:w-96 bg-[#f7f5f0] border-l border-[#e5e0d8] flex flex-col">
                <div className="p-6 border-b border-[#e5e0d8]">
                    <h2 className="font-serif font-bold text-lg mb-4">Sweet Tools</h2>

                    {/* Language Selector */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm flex items-center gap-2">
                                <Globe size={16} /> Language
                            </h3>
                            <span className="text-[10px] font-bold bg-[#e5e0d8] text-[#666] px-2 py-0.5 rounded-full">1600+</span>
                        </div>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm bg-[#fdfbf7] focus:outline-none focus:border-[#1a1a1a]"
                        >
                            <option>English</option>
                            <option>Mandarin (Traditional)</option>
                            <option>Paiwan</option>
                            <option>Atayal</option>
                            <option>Amis</option>
                            <option>Bunun</option>
                        </select>
                    </div>

                    {/* Podcast Generator */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm flex items-center gap-2">
                                <Mic size={16} /> Podcast Gen
                            </h3>
                            <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">AI</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                {['Elder', 'Youth', 'Academic'].map((style) => (
                                    <button key={style} className="flex-1 text-xs py-1.5 border border-[#e5e0d8] rounded-lg hover:bg-[#fdfbf7] transition-colors">
                                        {style}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-full bg-[#1a1a1a] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors"
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                <span className="text-sm font-medium">{isPlaying ? "Pause" : "Generate & Play"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Haptic Controls Simulation */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8]">
                        <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <Fingerprint size={16} /> Haptic Sim
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between text-xs">
                                <span>Temperature</span>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    onChange={(e) => setHapticState(s => ({ ...s, temp: parseInt(e.target.value) }))}
                                    className="w-32 accent-orange-500"
                                />
                            </label>
                            <label className="flex items-center justify-between text-xs">
                                <span>Vibration</span>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    onChange={(e) => setHapticState(s => ({ ...s, vibe: parseInt(e.target.value) }))}
                                    className="w-32 accent-blue-500"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Chat / Notes */}
                <div className="flex-1 p-6">
                    <h2 className="font-serif font-bold text-lg mb-4">Discussion</h2>
                    <div className="h-64 bg-white rounded-xl border border-[#e5e0d8] p-4 mb-4 overflow-y-auto text-sm text-[#666]">
                        <p className="mb-2"><strong className="text-[#1a1a1a]">AI Elder:</strong> This story reminds us of the importance of listening to the wind. What do you think the wind represents?</p>
                        <p className="pl-4 border-l-2 border-[#e5e0d8]">It represents the voices of our ancestors.</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type your thoughts..."
                            className="flex-1 px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm focus:outline-none focus:border-[#1a1a1a]"
                        />
                        <button className="p-2 bg-[#1a1a1a] text-white rounded-lg">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ModeToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                active ? "bg-[#1a1a1a] text-white shadow-md" : "text-[#666] hover:bg-[#f0ebe4]"
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e5e0d8] hover:bg-[#fdfbf7] hover:border-[#1a1a1a] transition-all group">
            <div className="text-[#666] group-hover:text-[#1a1a1a] transition-colors">{icon}</div>
            <span className="text-xs font-medium text-[#666] group-hover:text-[#1a1a1a]">{label}</span>
        </button>
    )
}

function Mic({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    );
}

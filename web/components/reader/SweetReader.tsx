"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Thermometer, Waves, Fingerprint, Share2, MessageCircle, BookOpen, Globe, Twitter, PenTool, Sparkles, Play, Lock, Heart, Minimize2, Maximize2 } from "lucide-react"; // Import Minimize2, Maximize2
import Image from "next/image";
import clsx from "clsx";
import { PERSONAS, PersonaType } from "@/lib/personas";

// Dynamically import 3D avatar to avoid SSR issues
const EmotionalAvatar = lazy(() => import("@/components/3d/EmotionalAvatar"));

type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';

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
    const [selectedPersona, setSelectedPersona] = useState<PersonaType>("universal_guide");
    const [currentEmotion, setCurrentEmotion] = useState<Emotion>("neutral");
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'This story reminds us of the importance of listening to the wind. What do you think the wind represents?' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false); // New state for immersive mode

    // New Features State
    const [isHandwriting, setIsHandwriting] = useState(false);
    const [showLanguageSearch, setShowLanguageSearch] = useState(false);
    const [languageSearchQuery, setLanguageSearchQuery] = useState("");
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [generatedStory, setGeneratedStory] = useState("");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [tactileFeedbackText, setTactileFeedbackText] = useState<string | null>(null); // New state
    const [showTactileFeedback, setShowTactileFeedback] = useState(false); // New state

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMsg = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, newMsg]);
        const userMessage = inputValue;
        setInputValue("");
        setIsTyping(true);

        try {
            // Step 1: Detect emotion from user message
            const emotionResponse = await fetch('/api/ai/detect-emotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userMessage })
            });
            const emotionData = await emotionResponse.json();
            const detectedEmotion = emotionData.emotion || 'neutral';
            setCurrentEmotion(detectedEmotion);

            // Step 2: Get AI response with emotion awareness
            // Try Hugging Face first (free), fallback to OpenAI
            let response = await fetch('/api/ai/chat-hf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                    persona: selectedPersona,
                    userEmotion: detectedEmotion
                })
            });

            // If HF fails or not configured, try OpenAI
            if (!response.ok) {
                response = await fetch('/api/ai/chat-persona', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userMessage,
                        history: messages,
                        persona: selectedPersona,
                        userEmotion: detectedEmotion
                    })
                });
            }

            const data = await response.json();
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.response || "I cannot respond at this time."
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "Sorry, I'm having trouble connecting. Please try again."
            }]);
        }
    };

    const handleGenerateStory = async () => {
        setIsGeneratingStory(true);
        try {
            const response = await fetch('/api/ai/generate-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style: 'Elder' })
            });

            const data = await response.json();
            const story = data.story || "Story generation failed.";
            setGeneratedStory(story);
            setIsPlaying(true);

            // Auto-generate image for the story
            handleGenerateImage(story);
        } catch (error) {
            console.error('Story generation error:', error);
            setGeneratedStory("Failed to generate story. Please try again.");
        } finally {
            setIsGeneratingStory(false);
        }
    };

    const handleGenerateImage = async (prompt: string) => {
        setIsGeneratingImage(true);
        try {
            const response = await fetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Illustration for this story: ${prompt.substring(0, 200)}`,
                    style: 'cultural folklore art'
                })
            });

            const data = await response.json();
            setGeneratedImage(data.imageUrl);
        } catch (error) {
            console.error('Image generation error:', error);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleTranslate = async (targetLang: string) => {
        if (!content) return;

        setIsTranslating(true);
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: content.substring(0, 500), // Translate first 500 chars
                    targetLanguage: targetLang,
                    sourceLanguage: 'auto'
                })
            });

            const data = await response.json();
            // In a real app, you'd update the content state
            // For now, just show it worked
            alert(`Translated to ${targetLang}!\n\n${data.translatedText.substring(0, 200)}...`);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSimulateTactileFeedback = async () => {
        const sampleText = "The wind gently whispers through the rough leaves of the ancient tree."; // Sample text
        try {
            const response = await fetch('/api/v1/senses/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: "demo_session", // Placeholder
                    modality: "tactile_feedback",
                    payload: {},
                    text_snippet: sampleText
                })
            });
            if (response.ok) {
                const data = await response.json();
                setTactileFeedbackText(data.feedback_description);
                setShowTactileFeedback(true);
                setTimeout(() => setShowTactileFeedback(false), 5000); // Hide after 5 seconds
            } else {
                setTactileFeedbackText("Failed to get feedback.");
                setShowTactileFeedback(true);
                setTimeout(() => setShowTactileFeedback(false), 5000);
            }
        } catch (error) {
            console.error('Tactile feedback error:', error);
            setTactileFeedbackText("Error simulating feedback.");
            setShowTactileFeedback(true);
            setTimeout(() => setShowTactileFeedback(false), 5000);
        }
    };

    // DRM Verification State
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        // Simulate DRM License Check
        const timer = setTimeout(() => {
            setIsVerifying(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-[#fdfbf7] relative">

            {/* DRM Verification Overlay */}
            <AnimatePresence>
                {isVerifying && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-[#fdfbf7] flex flex-col items-center justify-center"
                    >
                        <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-white mb-6 animate-pulse">
                            <Lock size={32} />
                        </div>
                        <h2 className="font-serif font-bold text-xl text-[#1a1a1a] mb-2">Verifying License</h2>
                        <p className="text-[#666] text-sm font-mono">Checking DRM signature...</p>
                        <div className="mt-8 w-48 h-1 bg-[#e5e0d8] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#1a1a1a]"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Panel: Content & AI Avatar */}
            <div className={clsx("flex-1 flex flex-col relative border-r border-[#e5e0d8]", isImmersive && "w-full")}>
                {/* Header */}
                <header className={clsx("h-16 flex items-center justify-between px-8 border-b border-[#e5e0d8] bg-[#fdfbf7]/80 backdrop-blur-sm z-10 transition-all duration-300", isImmersive && "opacity-0 -translate-y-full pointer-events-none")}>
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
                {/* Immersive Mode Toggle (always visible) */}
                <button
                    onClick={() => setIsImmersive(!isImmersive)}
                    className={clsx(
                        "absolute top-4 right-4 z-20 p-2 rounded-full bg-[#1a1a1a] text-white shadow-lg transition-all duration-300",
                        isImmersive ? "bg-red-500" : ""
                    )}
                    aria-label={isImmersive ? "Exit Immersive Mode" : "Enter Immersive Mode"}
                >
                    {isImmersive ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                </button>

                {/* Main Reading Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-16 scroll-smooth relative">
                    <AnimatePresence mode="wait">
                        {activeMode === "read" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={clsx(
                                    "max-w-3xl mx-auto text-lg lg:text-xl leading-relaxed text-[#1a1a1a]",
                                    isHandwriting ? "font-cursive italic" : "font-serif"
                                )}
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
                                className="h-full flex flex-col items-center justify-center p-8"
                            >
                                {/* 3D Emotional Avatar */}
                                <div className="w-full max-w-md aspect-square bg-gradient-to-b from-[#1a1a1a] to-black rounded-2xl shadow-2xl overflow-hidden relative mb-6">
                                    <Suspense fallback={
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-white/50">Loading 3D Avatar...</div>
                                        </div>
                                    }>
                                        <EmotionalAvatar emotion={currentEmotion} isActive={isTyping} />
                                    </Suspense>
                                </div>

                                {/* Emotion & Persona Info */}
                                <div className="text-center space-y-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <Heart size={16} className="text-red-400" />
                                            <span className="text-white/90 text-sm font-medium capitalize">{currentEmotion}</span>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <span className="text-white/90 text-sm font-medium">{PERSONAS.find(p => p.id === selectedPersona)?.name}</span>
                                        </div>
                                    </div>
                                    <p className="text-white/60 text-sm max-w-md">
                                        The AI avatar responds to your emotional state, changing color and form based on detected emotions.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeMode === "experience" && (
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
                                        <p className="text-xs text-[#666]">
                                            Temp: {hapticState.temp}°C <br />
                                            Vibe: {hapticState.vibe}Hz
                                        </p>
                                        <button
                                            onClick={handleSimulateTactileFeedback}
                                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                                        >
                                            Simulate Tactile Feedback
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-8 text-[#666] text-sm max-w-md text-center">
                                    Touch the screen to feel the warmth of the campfire and the rumble of the thunder.
                                    <br />
                                    <span className="text-xs opacity-50">(Hardware Simulation Active)</span>
                                </p>
                                {showTactileFeedback && tactileFeedbackText && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="absolute bottom-8 bg-black/70 text-white text-sm px-4 py-2 rounded-lg"
                                    >
                                        {tactileFeedbackText}
                                    </motion.div>
                                )}
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

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <button
                                            onClick={() => {
                                                const text = encodeURIComponent(`Reading "${title}" on ModernReader!`);
                                                const url = encodeURIComponent(window.location.href);
                                                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                                            }}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e5e0d8] hover:bg-[#fdfbf7] hover:border-[#1a1a1a] transition-all group"
                                        >
                                            <div className="text-[#666] group-hover:text-[#1a1a1a] transition-colors"><Twitter size={24} /></div>
                                            <span className="text-xs font-medium text-[#666] group-hover:text-[#1a1a1a]">Twitter</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const text = encodeURIComponent(`Reading "${title}" on ModernReader!`);
                                                const url = encodeURIComponent(window.location.href);
                                                window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank');
                                            }}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e5e0d8] hover:bg-[#fdfbf7] hover:border-[#1a1a1a] transition-all group"
                                        >
                                            <div className="text-[#666] group-hover:text-[#1a1a1a] transition-colors"><MessageCircle size={24} /></div>
                                            <span className="text-xs font-medium text-[#666] group-hover:text-[#1a1a1a]">LINE</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Instagram doesn't have direct web sharing, so copy link
                                                navigator.clipboard.writeText(window.location.href);
                                                alert('Link copied! Share it on Instagram Stories or Posts.');
                                            }}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e5e0d8] hover:bg-[#fdfbf7] hover:hover:border-[#1a1a1a] transition-all group"
                                        >
                                            <div className="text-[#666] group-hover:text-[#1a1a1a] transition-colors"><Heart size={24} /></div>
                                            <span className="text-xs font-medium text-[#666] group-hover:text-[#1a1a1a]">Instagram</span>
                                        </button>
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
                    activeMode === "experience" ? "translate-y-0" : "translate-y-full opacity-0",
                    isImmersive && "hidden" // Hide in immersive mode
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
            <div className={clsx("w-full lg:w-96 bg-[#f7f5f0] border-l border-[#e5e0d8] flex flex-col transition-all duration-300", isImmersive && "hidden")}>
                <div className="p-6 border-b border-[#e5e0d8]">
                    <h2 className="font-serif font-bold text-lg mb-4">Sweet Tools</h2>

                    {/* Advanced Language Selector */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4 relative">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm flex items-center gap-2">
                                <Globe size={16} /> Omnilingual
                            </h3>
                            <span className="text-[10px] font-bold bg-[#e5e0d8] text-[#666] px-2 py-0.5 rounded-full">1600+</span>
                        </div>

                        {!showLanguageSearch ? (
                            <button
                                onClick={() => setShowLanguageSearch(true)}
                                className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm bg-[#fdfbf7] text-left flex justify-between items-center hover:border-[#1a1a1a] transition-colors"
                            >
                                {language}
                                <span className="text-xs text-[#999]">Change</span>
                            </button>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search 1600+ languages..."
                                    className="w-full px-3 py-2 rounded-lg border border-[#1a1a1a] text-sm focus:outline-none"
                                    value={languageSearchQuery}
                                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                                    onBlur={() => {
                                        if (!languageSearchQuery) setShowLanguageSearch(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && languageSearchQuery) {
                                            setLanguage(languageSearchQuery);
                                            handleTranslate(languageSearchQuery);
                                            setShowLanguageSearch(false);
                                            setLanguageSearchQuery("");
                                        }
                                    }}
                                />
                                <div className="text-xs text-[#666]">
                                    Press Enter to translate to &quot;{languageSearchQuery || '...'}&quot;
                                    {isTranslating && <span className="ml-2 animate-pulse">Translating...</span>}
                                </div>
                            </div>
                        )}

                        {language !== "English" && (
                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1 animate-pulse">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                                Translated via Meta Omnilingual
                            </div>
                        )}
                    </div>

                    {/* Handwriting Toggle */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4 flex items-center justify-between">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                            <PenTool size={16} /> Handwriting
                        </h3>
                        <button
                            onClick={() => setIsHandwriting(!isHandwriting)}
                            className={clsx(
                                "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                                isHandwriting ? "bg-[#1a1a1a]" : "bg-[#e5e0d8]"
                            )}
                        >
                            <div className={clsx(
                                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                isHandwriting ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* Story Generator */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-sm flex items-center gap-2">
                                <Sparkles size={16} /> Story Gen
                            </h3>
                            <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">AI</span>
                        </div>

                        {generatedStory ? (
                            <div className="space-y-3">
                                {/* Generated Image */}
                                {generatedImage && (
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#e5e0d8]">
                                        <Image
                                            src={generatedImage}
                                            alt="Generated story illustration"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        {isGeneratingImage && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="text-white text-xs">Generating image...</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-3 bg-[#fdfbf7] rounded-lg text-xs text-[#666] italic border border-[#e5e0d8]">
                                    &quot;{generatedStory}&quot;
                                </div>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-full bg-[#1a1a1a] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors"
                                >
                                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    <span className="text-sm font-medium">{isPlaying ? "Pause Audio" : "Play TTS"}</span>
                                </button>
                                <button
                                    onClick={() => { setGeneratedStory(""); setIsPlaying(false); setGeneratedImage(null); }}
                                    className="w-full text-xs text-[#666] hover:text-[#1a1a1a]"
                                >
                                    Generate New
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    {['Elder', 'Youth', 'Myth'].map((style) => (
                                        <button key={style} className="flex-1 text-xs py-1.5 border border-[#e5e0d8] rounded-lg hover:bg-[#fdfbf7] transition-colors">
                                            {style}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleGenerateStory}
                                    disabled={isGeneratingStory}
                                    className="w-full bg-[#1a1a1a] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingStory ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Sparkles size={16} />
                                    )}
                                    <span className="text-sm font-medium">{isGeneratingStory ? "Dreaming..." : "Generate Story"}</span>
                                </button>
                            </div>
                        )}
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
                <div className="flex-1 p-6 flex flex-col min-h-0">
                    {/* Persona Selector */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-[#666] uppercase tracking-wider mb-2 block">AI Persona</label>
                        <select
                            value={selectedPersona}
                            onChange={(e) => setSelectedPersona(e.target.value as PersonaType)}
                            className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                        >
                            {PERSONAS.map((persona) => (
                                <option key={persona.id} value={persona.id}>
                                    {persona.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-[#e5e0d8]'}`} />
                        Discussion
                    </h2>

                    <div className="flex-1 bg-white rounded-xl border border-[#e5e0d8] p-4 mb-4 overflow-y-auto text-sm space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'ai' ? 'bg-[#1a1a1a] text-white' : 'bg-[#e5e0d8] text-[#666]'}`}>
                                    {msg.role === 'ai' ? 'AI' : 'ME'}
                                </div>
                                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'ai' ? 'bg-[#fdfbf7] border border-[#e5e0d8] text-[#1a1a1a]' : 'bg-[#1a1a1a] text-white'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs font-bold">AI</div>
                                <div className="bg-[#fdfbf7] border border-[#e5e0d8] p-3 rounded-2xl flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask the Elder about this story..."
                            className="flex-1 px-3 py-2 rounded-lg border border-[#e5e0d8] text-sm focus:outline-none focus:border-[#1a1a1a]"
                            aria-label="Chat message"
                        />
                        <button type="submit" className="p-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-black transition-colors" aria-label="Send message">
                            <Share2 size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div >
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

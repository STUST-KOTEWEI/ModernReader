"use client";

import JSZip from "jszip";
import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Thermometer, Waves, Fingerprint, Share2, MessageCircle, BookOpen, Globe, Twitter, PenTool, Sparkles, Play, Lock, Heart, Minimize2, Maximize2, Eye } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { PERSONAS, PersonaType } from "@/lib/personas";
import { edgeAI } from "@/lib/services/edgeAI"; // Import Edge AI
import { bluetoothService } from "@/lib/services/bluetoothService"; // Import Bluetooth
import { neuralReading } from "@/lib/services/neuralReading"; // Import Neural Reading
import { sensoryServices } from "@/lib/services/sensoryService"; // Import Sensory Services
import { storyEngine } from "@/lib/services/storyEngine"; // Import Story Engine
import { Bluetooth } from "lucide-react";

// Dynamically import 3D avatar to avoid SSR issues
const EmotionalAvatar = lazy(() => import("@/components/3d/EmotionalAvatar"));
import HapticPanel from "./HapticPanel";
import AIChatPanel from "./AIChatPanel";
import HandwritingCanvas from "@/components/learning/HandwritingCanvas";

type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';

interface SweetReaderProps {
    title: string;
    author: string;
    content: string;
}

export default function SweetReader({ title: initialTitle, author: initialAuthor, content: initialContent }: SweetReaderProps) {
    // State for dynamic content (EPUB Support)
    const [title, setTitle] = useState(initialTitle);
    const [author, setAuthor] = useState(initialAuthor);
    const [content, setContent] = useState(initialContent);
    const [isUploading, setIsUploading] = useState(false);

    // Original State
    const [activeMode, setActiveMode] = useState<"read" | "watch" | "experience" | "tell">("read");
    const [hapticState, setHapticState] = useState<{ temp: number; vibe: number; texture: boolean; scent?: string; audio?: string }>({ temp: 0, vibe: 0, texture: false });
    const [isPlaying, setIsPlaying] = useState(false);
    const [language, setLanguage] = useState("English");
    const [selectedPersona, setSelectedPersona] = useState<PersonaType>("universal_guide");
    const [currentEmotion, setCurrentEmotion] = useState<Emotion>("neutral");
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'This story reminds us of the importance of listening to the wind. What do you think the wind represents?' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    // Handwriting State
    const [recognitionResult, setRecognitionResult] = useState<any>(null);
    const [isRecognizing, setIsRecognizing] = useState(false);

    const handleHandwritingRecognize = async (blob: Blob) => {
        setIsRecognizing(true);
        setRecognitionResult(null);
        
        try {
            const formData = new FormData();
            formData.append('image', blob);
            formData.append('language', 'ami'); // Default to Amis for demo
            formData.append('auto_romanize', 'true');

            // Use the correct API endpoint
            const response = await fetch('/api/v1/indigenous/handwriting/recognize', {
                method: 'POST',
                body: formData,
            });
            
            if (response.ok) {
                const data = await response.json();
                setRecognitionResult(data);
                // Optionally auto-fill the chat input or add to notes
                if (data.romanized_text) {
                    // Feedback via TTS could be added here
                }
            } else {
                console.error("Recognition failed");
            }
        } catch (error) {
            console.error("Error recognizing handwriting:", error);
        } finally {
            setIsRecognizing(false);
        }
    };

    // New Features State
    const [isHandwriting, setIsHandwriting] = useState(false);
    const [showLanguageSearch, setShowLanguageSearch] = useState(false);
    const [languageSearchQuery, setLanguageSearchQuery] = useState("");
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [generatedStory, setGeneratedStory] = useState("");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [tactileFeedbackText, setTactileFeedbackText] = useState<string | null>(null);
    const [showTactileFeedback, setShowTactileFeedback] = useState(false);
    const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
    const [isBionic, setIsBionic] = useState(false); // State for Bionic Reading

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const zip = await JSZip.loadAsync(file);

            // 1. Find the OPF file to get the reading order
            const container = await zip.file("META-INF/container.xml")?.async("text");
            if (!container) throw new Error("Invalid EPUB: No container.xml");

            const parser = new DOMParser();
            const containerDoc = parser.parseFromString(container, "text/xml");
            const rootPath = containerDoc.querySelector("rootfile")?.getAttribute("full-path");
            if (!rootPath) throw new Error("Invalid EPUB: No rootfile");

            const opfContent = await zip.file(rootPath)?.async("text");
            if (!opfContent) throw new Error("Invalid EPUB: No OPF file");

            const opfDoc = parser.parseFromString(opfContent, "text/xml");

            // Extract Metadata
            const newTitle = opfDoc.querySelector("title")?.textContent || file.name.replace(".epub", "");
            const newAuthor = opfDoc.querySelector("creator")?.textContent || "Unknown Author";

            setTitle(newTitle);
            setAuthor(newAuthor);

            // 2. Get the manifest and spine
            const manifestItems = Array.from(opfDoc.querySelectorAll("manifest > item"));
            const spineItems = Array.from(opfDoc.querySelectorAll("spine > itemref"));

            let fullText = "";

            // Helper to resolve paths
            const rootDir = rootPath.substring(0, rootPath.lastIndexOf("/") + 1);

            // 3. Iterate through spine to get content in order
            for (const itemRef of spineItems) {
                const id = itemRef.getAttribute("idref");
                const item = manifestItems.find(i => i.getAttribute("id") === id);
                if (item) {
                    const href = item.getAttribute("href");
                    if (href) {
                        const fullHref = rootDir + href;
                        // Handle potential URL decoding if needed, but usually zip paths are raw
                        const fileContent = await zip.file(fullHref)?.async("text");
                        if (fileContent) {
                            const doc = parser.parseFromString(fileContent, "text/html");
                            // Extract text, adding newlines for block elements
                            // Simple text extraction for now
                            const text = doc.body.innerText || doc.body.textContent || "";
                            fullText += text + "\n\n";
                        }
                    }
                }
            }

            if (!fullText.trim()) throw new Error("No text content found");

            setContent(fullText);
            setActiveMode("read"); // Switch to read mode to see new content
            alert(`Loaded "${newTitle}" successfully!`);

        } catch (error) {
            console.error("EPUB parsing error:", error);
            alert("Failed to load EPUB. Please ensure it is a valid DRM-free file.");
        } finally {
            setIsUploading(false);
        }
    };

    // ... existing functions


    // Effect: Trigger Edge AI Analysis on paragraph change
    useEffect(() => {
        if (activeParagraphIndex !== null && activeParagraphIndex >= 0 && content) {
            const paragraphs = content.split('\n');
            const currentText = paragraphs[activeParagraphIndex];

            if (currentText && currentText.trim().length > 10) {
                // Run analysis asynchronously
                edgeAI.analyzeSentiment(currentText).then(result => {
                    if (result) {
                        console.log(`[Edge AI] Sentiment: ${result.label} (${(result.score * 100).toFixed(1)}%)`);
                        // Map sentiment to emotion for the avatar
                        if (result.label === 'NEGATIVE') {
                            setCurrentEmotion('sadness');
                        } else if (result.label === 'POSITIVE') {
                            setCurrentEmotion('joy');
                        } else {
                            setCurrentEmotion('neutral');
                        }
                    }
                });
            }
        }
    }, [activeParagraphIndex, content]);

    // Auto-Haptics: Intersection Observer
    useEffect(() => {
        if (activeMode !== "experience") return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.getAttribute('data-index') || "0");
                    setActiveParagraphIndex(index);
                    // Debounced call to haptics
                    const text = entry.target.textContent;
                    if (text) {
                        // IEEE Contribution: Optimistic Prefetching
                        const paragraphs = content.split('\n');
                        sensoryServices.scheduler.prefetch(index, paragraphs);

                        // Simple debounce by checking if index changed
                        handleSimulateTactileFeedback(text);
                    }
                }
            });
        }, { threshold: 0.6 }); // Trigger when 60% visible

        document.querySelectorAll('.reader-paragraph').forEach(p => observer.observe(p));

        return () => observer.disconnect();
    }, [activeMode, content]);

    const handleGenerateStory = async () => {
        setIsGeneratingStory(true);
        // Local Combinatorial Story Generation (No API)
        setTimeout(() => {
            const story = storyEngine.generate('myth');

            setGeneratedStory(story);
            setIsPlaying(true);

            // Auto-generate "image"
            handleGenerateImage(story);
            setIsGeneratingStory(false);
        }, 1000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMsg = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, newMsg]);
        const userMessage = inputValue;
        const lowerMsg = userMessage.toLowerCase();

        setInputValue("");
        setIsTyping(true);

        try {
            // Step 1: Detect emotion LOCALLY using Edge AI
            const sentiment = await edgeAI.analyzeSentiment(userMessage);
            let detectedEmotion: Emotion = 'neutral';
            if (sentiment) {
                if (sentiment.label === 'POSITIVE') detectedEmotion = 'joy';
                else if (sentiment.label === 'NEGATIVE') detectedEmotion = 'sadness';
            }
            setCurrentEmotion(detectedEmotion);

            // Step 2: Generate response LOCALLY (Expanded Keyword/Rule System)
            // Simulating "thinking" delay
            setTimeout(() => {
                let responseText = "";

                // Persona-specific prefixes
                const prefixes = {
                    'nature_spirit': ["The wind whispers...", "The leaves rustle...", "The roots remember..."],
                    'playful_companion': ["Ooh!", "Listen!", "Guess what?"],
                    'universal_guide': ["Reflect on this:", "The wisdom states:", "Consider deeply:"]
                };

                // Helper to get random prefix
                const getPrefix = (p: keyof typeof prefixes) => {
                    const list = prefixes[p] || prefixes['universal_guide'];
                    return list[Math.floor(Math.random() * list.length)];
                };

                // Expanded Keyword Rules
                if (lowerMsg.includes("book") || lowerMsg.includes("story") || lowerMsg.includes("about")) {
                    responseText = "This story is a bridge between the digital and the physical. It reminds us that reading is not just seeing, but feeling.";
                } else if (lowerMsg.includes("author") || lowerMsg.includes("who wrote")) {
                    responseText = "The creator of this world sought to weave technology with tradition, honoring the old ways through new light.";
                } else if (lowerMsg.includes("meaning") || lowerMsg.includes("why")) {
                    responseText = "Meaning is not found in the words, but in the silence between them. What do you feel when you pause?";
                } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
                    responseText = `Greetings, traveler. I sense ${detectedEmotion === 'neutral' ? 'calmness' : detectedEmotion} in your heart.`;
                } else {
                    // Fallback to Persona Generics with Prefixes
                    const prefix = getPrefix(selectedPersona as keyof typeof prefixes);

                    if (selectedPersona === 'nature_spirit') {
                        if (detectedEmotion === 'joy') responseText = `${prefix} The forest rejoices with you! The sun warms the stone.`;
                        else if (detectedEmotion === 'sadness') responseText = `${prefix} Let your sorrow flow like water. The earth can hold it.`;
                        else responseText = `${prefix} The ancient trees have seen many seasons. Patience is the key.`;
                    } else if (selectedPersona === 'playful_companion') {
                        if (detectedEmotion === 'joy') responseText = `${prefix} Yay! Let's explore more!`;
                        else if (detectedEmotion === 'sadness') responseText = `${prefix} Aww, sending you a big spirit hug!`;
                        else responseText = `${prefix} That's so interesting! I wonder what happens next?`;
                    } else {
                        // Universal Guide
                        responseText = `${prefix} I hear you. Knowledge is a river. Let us flow where it leads.`;
                    }
                }

                setIsTyping(false);
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: responseText
                }]);
            }, 800);

        } catch (error) {
            console.error('Local Chat error:', error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: "My connection to the spirit world is weak..."
            }]);
        }
    };

    const handleGenerateImage = async (prompt: string) => {
        setIsGeneratingImage(true);
        // Local Mock Image (No DALL-E)
        // Using a reliable placeholder or a local asset pattern
        setTimeout(() => {
            // Return a nice abstract gradient or nature placeholder
            const gradients = [
                "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=600&auto=format&fit=crop", // Nature
                "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop", // Mountains
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop"  // Sea
            ];
            // Deterministic selection based on prompt
            const index = prompt.length % gradients.length;
            setGeneratedImage(gradients[index]);
            setIsGeneratingImage(false);
        }, 1500);
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
            alert(`Translated to ${targetLang} !\n\n${data.translatedText.substring(0, 200)}...`);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSimulateTactileFeedback = async (textOverride?: string) => {
        // ACM Contribution: Check Sensory Budget
        const HAPTIC_COST = 20;
        if (!sensoryServices.budget.canTrigger(HAPTIC_COST)) {
            console.log("[Sensory Budget] Haptic feedback suppressed due to high load.");
            return;
        }
        sensoryServices.budget.consume(HAPTIC_COST);

        const text = textOverride || "The wind gently whispers through the rough leaves of the ancient tree.";
        const lowerText = text.toLowerCase();

        // Local "Mock" Logic (No Server API)
        let feedback = "Neutral sensation.";
        let temp = 20;
        let vibe = 0;
        let scent = "Neutral air";
        let audio = "Silence";

        // Logic ported from /api/v1/senses/command/route.ts
        if (lowerText.includes("fire") || lowerText.includes("warm") || lowerText.includes("sun")) {
            feedback = "Warmth spreading across the surface.";
            temp = 45;
            scent = "Campfire smoke";
            audio = "Fire";
        } else if (lowerText.includes("ice") || lowerText.includes("cold") || lowerText.includes("snow")) {
            feedback = "A cool breeze and chilly surface.";
            temp = 10;
            scent = "Crisp winter air";
            audio = "Wind";
        } else if (lowerText.includes("thunder") || lowerText.includes("drum") || lowerText.includes("beat")) {
            feedback = "Strong rhythmic vibrations.";
            vibe = 80;
            scent = "Ozone and rain";
            audio = "Thunder";
        } else if (lowerText.includes("wind") || lowerText.includes("whisper")) {
            feedback = "Gentle, flowing vibrations.";
            vibe = 20;
            scent = "Fresh grass";
            audio = "Wind";
        } else {
            // Random ambient variation
            const random = Math.random();
            if (random > 0.7) {
                feedback = "Subtle texture changes detected.";
                vibe = 10;
                scent = "Old book paper";
                audio = "Silence";
            } else if (random > 0.4) {
                feedback = "Ambient warmth.";
                temp = 25;
                scent = "Brewed tea";
                audio = "Cafe";
            }
        }

        setTactileFeedbackText(feedback);
        setHapticState(prev => ({
            ...prev,
            temp: temp,
            vibe: vibe,
            scent: scent,
            audio: audio
        }));
        setShowTactileFeedback(true);
        setTimeout(() => setShowTactileFeedback(false), 5000);
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
                {/* Persistent Controls (Always Visible) */}
                <div className="absolute top-4 right-4 z-20 flex gap-3">
                    {/* Bionic Reading Toggle */}
                    <button
                        onClick={() => setIsBionic(!isBionic)}
                        className={clsx(
                            "p-2.5 rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm",
                            isBionic ? "bg-[#1a1a1a] text-white" : "bg-white/90 text-[#1a1a1a] hover:bg-white"
                        )}
                        title="Toggle Bionic Reading"
                    >
                        <Eye size={20} />
                    </button>

                    {/* Immersive Mode Toggle */}
                    <button
                        onClick={() => setIsImmersive(!isImmersive)}
                        className={clsx(
                            "p-2.5 rounded-full text-white shadow-lg transition-all duration-300 backdrop-blur-sm",
                            isImmersive ? "bg-red-500/90 hover:bg-red-600" : "bg-[#1a1a1a]/90 hover:bg-black"
                        )}
                        aria-label={isImmersive ? "Exit Immersive Mode" : "Enter Immersive Mode"}
                    >
                        {isImmersive ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                    </button>
                </div>

                {/* Main Reading Area */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-16 scroll-smooth relative">
                    <AnimatePresence mode="wait">
                        {(activeMode === "read" || activeMode === "experience") && (
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
                                    <p
                                        key={i}
                                        data-index={i}
                                        className={clsx(
                                            "reader-paragraph mb-6 first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left transition-opacity duration-500 notranslate",
                                            activeMode === "experience" && activeParagraphIndex !== i ? "opacity-50" : "opacity-100"
                                        )}
                                        dangerouslySetInnerHTML={{
                                            __html: isBionic ? neuralReading.applyBionicReading(para) : para
                                        }}
                                    />
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

                        {/* Experience Mode now shows text (above), HapticPanel is moved to sidebar */}

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
                                        </button >
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
                                    </div >
                                    <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#e5e0d8] flex items-center justify-between text-sm text-[#666]">
                                        <span className="truncate">modernreader.com/s/paiwan-legend</span>
                                        <button className="font-bold text-[#1a1a1a] hover:underline">Copy</button>
                                    </div>
                                </div >
                            </motion.div >
                        )}
                    </AnimatePresence >
                </div >

                {/* Haptic Status Bar (Experience Mode) */}
                < div className={
                    clsx(
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
                </div >
            </div >

            {/* Right Panel: Tools & Podcast (Enjoy/Tell) */}
            < div className={clsx("w-full lg:w-96 bg-[#f7f5f0] border-l border-[#e5e0d8] flex flex-col transition-all duration-300", isImmersive && "hidden")}>
                <div className="p-6 border-b border-[#e5e0d8] flex-1 overflow-y-auto">
                    <h2 className="font-serif font-bold text-lg mb-4">
                        {activeMode === "experience" ? "Sensory Feedback" : "Sweet Tools"}
                    </h2>

                    {activeMode === "experience" ? (
                        <HapticPanel
                            hapticState={hapticState}
                            onSimulate={() => handleSimulateTactileFeedback()}
                            feedbackText={tactileFeedbackText}
                            showFeedback={showTactileFeedback}
                        />
                    ) : (
                        <>
                            {/* Bionic Reading Toggle */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm flex items-center gap-2">
                                        <Eye size={16} /> Bionic Reading
                                    </h3>
                                    <button
                                        onClick={() => setIsBionic(!isBionic)}
                                        className={clsx(
                                            "w-10 h-6 rounded-full transition-colors relative",
                                            isBionic ? "bg-[#1a1a1a]" : "bg-[#e5e0d8]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                                            isBionic ? "translate-x-4" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                                <p className="text-xs text-[#666] mt-2">
                                    Bolds the first few letters of each word to guide your eye and increase reading speed.
                                </p>
                            </div>

                            {/* Hardware Integration */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                                <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
                                    <Bluetooth size={16} /> Hardware
                                </h3>
                                <button
                                    onClick={async () => {
                                        const connected = await bluetoothService.connect();
                                        if (connected) alert("Haptic Vest Connected!");
                                        else alert("Connection Failed (Check console or ensure device is advertising)");
                                    }}
                                    className="w-full py-2 rounded-lg bg-[#1a1a1a] text-white text-xs font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
                                >
                                    <Bluetooth size={14} /> Connect Haptic Vest
                                </button>
                            </div>

                            {/* EPUB Upload */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                                <h3 className="font-medium text-sm flex items-center gap-2 mb-2">
                                    <BookOpen size={16} /> Import Book
                                </h3>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-[#e5e0d8] border-dashed rounded-lg cursor-pointer bg-[#fdfbf7] hover:bg-[#f0ebe4] transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a1a1a]" />
                                        ) : (
                                            <>
                                                <p className="mb-1 text-xs text-[#666]"><span className="font-semibold">Click to upload</span></p>
                                                <p className="text-[10px] text-[#999]">EPUB (DRM-free)</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept=".epub" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                            </div>

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
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8] mb-4">
                                <div className="flex items-center justify-between">
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
                                
                                {isHandwriting && (
                                    <div className="mt-4 space-y-4">
                                        <HandwritingCanvas 
                                            onSave={handleHandwritingRecognize}
                                            width={280} // Fit sidebar
                                            height={180}
                                        />
                                        
                                        {isRecognizing && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                                                <Sparkles size={14} /> Recognizing...
                                            </div>
                                        )}

                                        {recognitionResult && (
                                            <div className="p-3 bg-[#fdfbf7] rounded-lg border border-[#e5e0d8] text-sm space-y-2">
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase">Recognized</span>
                                                    <div className="font-medium">{recognitionResult.recognized_text}</div>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase">Romanized</span>
                                                    <div className="font-serif italic text-lg">{recognitionResult.romanized_text}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setInputValue(prev => prev + " " + recognitionResult.romanized_text);
                                                            setRecognitionResult(null);
                                                            setIsHandwriting(false);
                                                        }}
                                                        className="flex-1 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800"
                                                    >
                                                        Insert to Chat
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                        </>
                    )}

                    {/* Chat / Notes (Always visible) */}
                    <div className="mt-8">
                        <AIChatPanel
                            messages={messages}
                            inputValue={inputValue}
                            setInputValue={setInputValue}
                            isTyping={isTyping}
                            onSendMessage={handleSendMessage}
                            selectedPersona={selectedPersona}
                            setSelectedPersona={setSelectedPersona}
                        />
                    </div>
                </div>
            </div >
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

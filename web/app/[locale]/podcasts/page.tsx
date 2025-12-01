"use client";

import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { Link } from "@/i18n/navigation";
import { useState, useRef } from "react";

const SAMPLE_TEXT = "Once upon a time, in a valley where the mist never lifted, a young hunter named Kaleb discovered a glowing stone that would change his destiny forever.";

const VOICE_STYLES = [
    { id: 'Elder', label: 'Elder', description: 'Deep, wise voice' },
    { id: 'Youth', label: 'Youth', description: 'Young, energetic' },
    { id: 'Teacher', label: 'Teacher', description: 'Clear, instructive' },
    { id: 'Storyteller', label: 'Storyteller', description: 'Narrative, engaging' },
    { id: 'Historian', label: 'Historian', description: 'Authoritative' },
    { id: 'Poet', label: 'Poet', description: 'Melodic, expressive' },
    { id: 'Guide', label: 'Guide', description: 'Friendly, helpful' },
    { id: 'Narrator', label: 'Narrator', description: 'Neutral, professional' }
];

export default function PodcastPage() {
    const [selectedStyle, setSelectedStyle] = useState('Elder');
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/podcast/generate-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: SAMPLE_TEXT,
                    style: selectedStyle
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
            } else {
                alert('Failed to generate podcast. Please check your API key.');
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate podcast.');
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="p-8 lg:p-12">
            <header className="mb-12">
                <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">Podcast Generator</h1>
                <p className="text-[#666]">Generate AI-powered audio with 8 different voice styles.</p>
            </header>

            {/* Voice Style Selector */}
            <div className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl text-[#1a1a1a] mb-4">Select Voice Style</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {VOICE_STYLES.map(style => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${selectedStyle === style.id
                                ? 'border-[#1a1a1a] bg-[#fdfbf7]'
                                : 'border-[#e5e0d8] hover:border-[#999]'
                                }`}
                        >
                            <div className="font-bold text-sm text-[#1a1a1a]">{style.label}</div>
                            <div className="text-xs text-[#666] mt-1">{style.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <h2 className="font-serif font-bold text-xl text-[#1a1a1a] mb-4">Sample Text</h2>
                <p className="text-[#666] mb-6 italic">&quot;{SAMPLE_TEXT}&quot;</p>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <Volume2 size={20} />
                    {isGenerating ? 'Generating...' : `Generate with ${selectedStyle} Voice`}
                </button>
            </div>

            {/* Audio Player */}
            {audioUrl && (
                <div className="bg-white rounded-2xl border border-[#e5e0d8] p-8">
                    <h2 className="font-serif font-bold text-xl text-[#1a1a1a] mb-4">Generated Podcast</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white hover:bg-black transition-all"
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                        </button>
                        <div className="flex-1">
                            <div className="font-bold text-[#1a1a1a]">{selectedStyle} Voice</div>
                            <div className="text-sm text-[#666]">Sample Story</div>
                        </div>
                        <a
                            href={audioUrl}
                            download="podcast.mp3"
                            className="p-3 text-[#666] hover:text-[#1a1a1a] hover:bg-[#e5e0d8] rounded-lg transition-colors"
                        >
                            <Download size={20} />
                        </a>
                    </div>
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />
                </div>
            )}

            {/* Back to Reader */}
            <div className="mt-8 text-center">
                <Link href="/reader" className="text-[#666] hover:text-[#1a1a1a] underline">
                    ← Back to Reader
                </Link>
            </div>
        </div>
    );
}

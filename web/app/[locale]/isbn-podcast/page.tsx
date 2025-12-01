"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Upload, Mic, Loader2 } from 'lucide-react';

export default function PodcastGeneratorPage() {
    const [isbn, setIsbn] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string>('');

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!isbn) {
            alert('Please enter an ISBN');
            return;
        }

        setGenerating(true);
        setAudioUrl('');

        try {
            // Fetch book info from Open Library
            const bookRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
            if (!bookRes.ok) {
                throw new Error('Book not found');
            }

            const bookData = await bookRes.json();
            const title = bookData.title || 'Unknown Book';
            const author = bookData.authors?.[0]?.name || 'Unknown Author';

            // Generate podcast script
            const script = `Welcome to ModernReader Podcast. Today we're discussing "${title}" by ${author}. This book explores fascinating themes and ideas that will captivate readers.`;

            // Generate TTS
            const ttsRes = await fetch('/api/podcast/generate-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: script,
                    voiceStyle: 'Narrator'
                })
            });

            if (!ttsRes.ok) {
                const error = await ttsRes.json();
                throw new Error(error.message || 'TTS generation failed');
            }

            // Check if it's a mock response
            const contentType = ttsRes.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = await ttsRes.json();
                if (data.isMock) {
                    alert(data.message);
                    return;
                }
            }

            // Create audio URL from blob
            const audioBlob = await ttsRes.blob();
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

        } catch (error) {
            console.error('Podcast generation error:', error);
            alert(`Failed to generate podcast: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-8 lg:p-12 max-w-4xl mx-auto">
            <header className="mb-12">
                <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">
                    <Mic className="inline mr-2" size={36} />
                    ISBN Podcast Generator
                </h1>
                <p className="text-[#666]">Generate a podcast from any book using its ISBN</p>
            </header>

            {/* Input Section */}
            <div className="bg-white rounded-2xl border border-[#e5e0d8] p-8 mb-8">
                <div className="space-y-6">
                    {/* ISBN Input */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">ISBN</label>
                        <input
                            type="text"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            placeholder="978-0-123456-78-9"
                            className="w-full px-4 py-3 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                        />
                        <p className="text-xs text-[#999] mt-1">Enter the ISBN-10 or ISBN-13 of the book</p>
                    </div>

                    {/* Cover Upload */}
                    <div>
                        <label className="block text-sm font-medium text-[#666] mb-2">Book Cover (Optional)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-[#e5e0d8] rounded-lg p-6 hover:border-[#1a1a1a] transition-colors">
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload size={32} className="text-[#999]" />
                                        <span className="text-sm text-[#666]">
                                            {coverImage ? coverImage.name : 'Click to upload cover image'}
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverUpload}
                                    className="hidden"
                                />
                            </label>

                            {coverPreview && (
                                <div className="w-32 h-48 rounded-lg overflow-hidden border border-[#e5e0d8] relative">
                                    <Image
                                        src={coverPreview}
                                        alt="Cover preview"
                                        fill
                                        className="object-cover"
                                        sizes="128px"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !isbn}
                        className="w-full px-6 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-black transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Generating Podcast...
                            </>
                        ) : (
                            <>
                                <Mic size={20} />
                                Generate Podcast
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Audio Player */}
            {audioUrl && (
                <div className="bg-white rounded-2xl border border-[#e5e0d8] p-8">
                    <h3 className="font-bold text-lg mb-4">Your Podcast</h3>
                    <audio controls className="w-full" src={audioUrl}>
                        Your browser does not support the audio element.
                    </audio>
                    <div className="mt-4 flex gap-4">
                        <a
                            href={audioUrl}
                            download="podcast.mp3"
                            className="px-4 py-2 bg-[#f0ebe4] text-[#1a1a1a] rounded-lg hover:bg-[#e5e0d8] transition-colors text-sm font-medium"
                        >
                            Download MP3
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

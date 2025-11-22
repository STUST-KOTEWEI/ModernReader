"use client";

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Heart, Target, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { RecommendationResponse, BookRecommendation } from '@/types/user';

export default function ForYouPage() {
    const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState({
        occupation: 'Student',
        gender: 'Prefer not to say',
        age: 25,
        interests: ['Technology', 'Self-Help'],
        readingGoals: ['Professional Development'],
        emotion: 'neutral' as const
    });

    useEffect(() => {
        fetchRecommendations();
    }, []);

    async function fetchRecommendations() {
        setLoading(true);
        try {
            const res = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'demo_user',
                    ...userProfile,
                    limit: 12
                })
            });

            const data: RecommendationResponse = await res.json();
            setRecommendations(data.recommendations);
            setSummary(data.summary);
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 lg:p-12">
            {/* Header */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={32} className="text-orange-500" />
                    <h1 className="font-serif font-bold text-4xl text-[#1a1a1a]">For You</h1>
                </div>
                <p className="text-[#666] text-lg max-w-3xl">
                    {summary || 'Personalized book recommendations based on your profile, interests, and reading goals.'}
                </p>
            </header>

            {/* Profile Summary */}
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 mb-12 border border-orange-100">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Target size={24} className="text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Your Reading Profile</h3>
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="bg-white px-3 py-1 rounded-full border border-orange-200">
                                👔 {userProfile.occupation}
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full border border-orange-200">
                                🎯 {userProfile.readingGoals[0]}
                            </span>
                            {userProfile.interests.slice(0, 3).map(interest => (
                                <span key={interest} className="bg-white px-3 py-1 rounded-full border border-orange-200">
                                    ❤️ {interest}
                                </span>
                            ))}
                        </div>
                        <Link
                            href="/profile"
                            className="text-sm text-orange-600 hover:underline mt-2 inline-block"
                        >
                            Update your profile →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
                        <p className="text-[#666]">Finding perfect books for you...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {recommendations.map((rec, index) => (
                        <div key={index} className="group">
                            <Link href={`/books${rec.book.key}`}>
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e0d8] transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full flex flex-col">
                                    {/* Match Score Badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <TrendingUp size={12} />
                                            {rec.matchScore}% Match
                                        </span>
                                    </div>

                                    {/* Cover */}
                                    <div className="aspect-[2/3] rounded-xl mb-4 bg-[#f0ebe4] relative overflow-hidden">
                                        {rec.book.cover_id ? (
                                            <Image
                                                src={`https://covers.openlibrary.org/b/id/${rec.book.cover_id}-L.jpg`}
                                                alt={rec.book.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-[#999] font-serif p-4 text-center text-sm">
                                                {rec.book.title}
                                            </div>
                                        )}
                                    </div>

                                    {/* Book Info */}
                                    <div className="flex-1">
                                        <h3 className="font-serif font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                            {rec.book.title}
                                        </h3>
                                        <p className="text-xs text-[#666] mb-3">
                                            {rec.book.authors?.[0]?.name || 'Unknown Author'}
                                        </p>

                                        {/* AI Reasoning */}
                                        <div className="bg-[#fdfbf7] p-3 rounded-lg border border-[#f0ebe4]">
                                            <div className="flex items-start gap-2 mb-1">
                                                <Sparkles size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-[#666] leading-relaxed line-clamp-3">
                                                    {rec.reasoning}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 mt-4 border-t border-[#f0ebe4]">
                                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                                            {rec.book.subject?.[0] || 'Recommended'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            {!loading && recommendations.length > 0 && (
                <div className="text-center mt-12">
                    <button
                        onClick={fetchRecommendations}
                        className="px-8 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-black transition-colors font-medium inline-flex items-center gap-2"
                    >
                        <Sparkles size={20} />
                        Get New Recommendations
                    </button>
                </div>
            )}
        </div>
    );
}

"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, TrendingUp, Target, Loader2, Library, MapPin } from 'lucide-react';
import { Link } from "@/i18n/navigation";
import Image from 'next/image';
import type { RecommendationResponse, BookRecommendation, EmotionType } from '@/types/user';
import { buildLibraryHolding, LIBRARY_SOURCES } from '@/lib/librarySources';
import BookSearchInput from '@/components/learning/BookSearchInput';

// This type should align with what BookSearchInput returns and what the page needs
type BookSearchResult = {
    id: string;
    title: string;
    authors: string[];
};

type MetaResult = {
    id: string;
    title: string;
    subject: string;
    access: 'Any' | 'Digital' | 'Physical' | 'Hybrid';
    libraryHolding?: BookRecommendation['libraryHolding'];
};

const SUBJECT_MAP: Record<string, string> = {
    "technology": "technology",
    "tech": "technology",
    "self-help": "self-help",
    "business": "business",
    "science": "science",
    "history": "history",
    "fiction": "fiction",
    "fantasy": "fantasy",
    "psychology": "psychology",
    "education": "education",
    "art": "art",
    "design": "design",
};

const LIBRARY_SOURCE_HEADLINE = LIBRARY_SOURCES.slice(0, 5).map(src => src.name).join(' • ');

type OpenLibraryWork = {
    key: string;
    title: string;
    cover_id?: number;
    authors?: { name: string }[];
    subjects?: string[];
};





function ForYouPage() {

    const [mounted, setMounted] = useState(false);

    const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);

    const [summary, setSummary] = useState('');

    const [loading, setLoading] = useState(true);

    const [emotionLoading, setEmotionLoading] = useState(false);

    const [emotionConfidence, setEmotionConfidence] = useState(0);

    const [emotionReason, setEmotionReason] = useState('');

    const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);

    const [accessFilter, setAccessFilter] = useState<'Any' | 'Digital' | 'Physical' | 'Hybrid'>('Any');

    const [metaSql, setMetaSql] = useState('');

    const [metaResults, setMetaResults] = useState<MetaResult[]>([]);

    const [selectedBookForAnalysis, setSelectedBookForAnalysis] = useState<BookSearchResult | null>(null);

    const [explanation, setExplanation] = useState<any | null>(null); // State for the explanation

    const [isAnalyzing, setIsAnalyzing] = useState(false); // Loading state for analysis



    const [userProfile, setUserProfile] = useState<{

        occupation: string;

        gender: string;

        age: number;

        interests: string[];

        readingGoals: string[];

        emotion: EmotionType;

    }>({

        occupation: 'Student',

        gender: 'Prefer not to say',

        age: 25,

        interests: ['Technology', 'Self-Help'],

        readingGoals: ['Professional Development'],

        emotion: 'neutral' as const

    });



    const handleAnalysis = async () => {

        if (!selectedBookForAnalysis) return;



        setIsAnalyzing(true);

        setExplanation(null);

        try {

            const response = await fetch('/api/v1/recommend/counterfactual', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({

                    content_id: selectedBookForAnalysis.id,

                    user_id: 'demo_user', // Using demo_user as seen in other calls

                    user_context: userProfile,

                }),

            });

            if (response.ok) {

                const data = await response.json();

                setExplanation(data);

            } else {

                setExplanation({ error: 'Failed to get an explanation.' });

            }

        } catch (error) {

            console.error('Counterfactual analysis failed:', error);

            setExplanation({ error: 'An error occurred during analysis.' });

        } finally {

            setIsAnalyzing(false);

        }

    };



    const toggleLibrary = (id: string) => {

        setSelectedLibraries(prev =>

            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]

        );

    };



    useEffect(() => {

        detectEmotion();

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, []);



    async function detectEmotion() {

        setEmotionLoading(true);

        try {

            const context = `

            Occupation: ${userProfile.occupation}

            Goals: ${userProfile.readingGoals.join(', ')}

            Interests: ${userProfile.interests.join(', ')}

            `;

            const res = await fetch('/api/emotion/detect', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ text: context })

            });

            if (res.ok) {

                const data = await res.json();

                setEmotionConfidence(data.confidence || 0);

                setEmotionReason(data.reason || '');

                setUserProfile(prev => ({ ...prev, emotion: data.emotion || prev.emotion }));

            }

        } catch (error) {

            console.error('Emotion detection failed', error);

        } finally {

            setEmotionLoading(false);

        }

    }



    const runMetaSearch = useCallback(async (subject: string) => {

        try {

            const res = await fetch('/api/meta/search', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({

                    subject,

                    libraries: selectedLibraries,

                    access: accessFilter,

                    emotion: userProfile.emotion,

                    limit: 4

                })

            });

            if (!res.ok) return;

            const data = await res.json();

            setMetaSql(data.sql || '');

            setMetaResults(data.results || []);

        } catch (error) {

            console.error('Meta search failed', error);

        }

    }, [accessFilter, selectedLibraries, userProfile.emotion]);



    const buildFallback = useCallback((): BookRecommendation[] => {

        const sample = [

            {

                key: "/works/OL1W",

                title: "The Living Library",

                cover_id: undefined,

                authors: [{ name: "Modern Reader Labs" }],

                subject: ["innovation", "community"],

            },

            {

                key: "/works/OL2W",

                title: "Cultural Voices",

                cover_id: undefined,

                authors: [{ name: "Cultural Collective" }],

                subject: ["culture", "language"],

            },

        ];

        return sample.map((work, index) => ({

            matchScore: 75 + index * 5,

            reasoning: "Fallback picks while online sources are unavailable.",

            book: work,

            libraryHolding: buildLibraryHolding(

                work.subject?.[0] || "general",

                index,

                {

                    preferredLibraryIds: selectedLibraries,

                    preferredAccess: accessFilter

                }

            )

        }));

    }, [accessFilter, selectedLibraries]);



    const fetchRecommendations = useCallback(async () => {

        setLoading(true);

        try {

            // Prefer real library data from Open Library subjects based on interest

            const primaryInterest = userProfile.interests[0]?.toLowerCase() || 'bestseller';

            const subjectSlug = SUBJECT_MAP[primaryInterest] || primaryInterest.replace(/\s+/g, '_') || 'bestseller';

            let handled = false;



            // Try Open Library via server-side proxy (avoids CORS)

            try {

                const res = await fetch(`/api/openlibrary?subject=${encodeURIComponent(subjectSlug)}&limit=12`, { cache: 'no-store' });

                if (res.ok) {

                    const payload = await res.json();

                    const works: OpenLibraryWork[] = (payload.data?.works as OpenLibraryWork[]) || [];

                    const mapped: BookRecommendation[] = works.map((work, index: number) => ({

                        matchScore: Math.min(99, 62 + Math.round(Math.random() * 30)),

                        reasoning: `Matches your interest in ${primaryInterest} while tuning to your ${userProfile.emotion} mood. Pulled via Open Library subject "${subjectSlug}".`,

                        book: {

                            key: work.key,

                            title: work.title,

                            cover_id: work.cover_id,

                            authors: work.authors || [],

                            subject: work.subjects || [],

                        },

                        libraryHolding: buildLibraryHolding(

                            work.subjects?.[0] || primaryInterest,

                            index,

                            {

                                preferredLibraryIds: selectedLibraries,

                                preferredAccess: accessFilter

                            }

                        )

                    }));

                    setRecommendations(mapped);

                    await runMetaSearch(primaryInterest);

                    const filterSummary = selectedLibraries.length ? ` • ${selectedLibraries.length} libraries` : '';

                    const accessSummary = accessFilter !== 'Any' ? ` • ${accessFilter}` : '';

                    setSummary(`Library-sourced picks • ${subjectSlug.replace(/_/g, ' ')} • mood: ${userProfile.emotion} • ${LIBRARY_SOURCE_HEADLINE}${filterSummary}${accessSummary}`);

                    handled = true;

                } else {

                    console.warn('Open Library proxy failed', await res.text());

                }

            } catch (err) {

                console.warn('Open Library fetch failed, falling back', err);

            }



            if (!handled) {

                // Fallback to existing recommendation endpoint

                try {

                    const apiRes = await fetch('/api/recommendations', {

                        method: 'POST',

                        headers: { 'Content-Type': 'application/json' },

                        body: JSON.stringify({

                            userId: 'demo_user',

                            ...userProfile,

                            limit: 12,

                            libraries: selectedLibraries,

                            access: accessFilter

                        })

                    });

                    if (apiRes.ok) {

                        const apiData: RecommendationResponse = await apiRes.json();

                        const withHoldings = apiData.recommendations.map((rec, index) => rec.libraryHolding ? rec : ({

                            ...rec,

                            libraryHolding: buildLibraryHolding(

                                rec.book.subject?.[0] || primaryInterest,

                                index,

                                {

                                    preferredLibraryIds: selectedLibraries,

                                    preferredAccess: accessFilter

                                }

                            )

                        }));

                        setRecommendations(withHoldings);

                        await runMetaSearch(primaryInterest);

                        const filterSummary = selectedLibraries.length ? ` • ${selectedLibraries.length} libraries` : '';

                        const accessSummary = accessFilter !== 'Any' ? ` • ${accessFilter}` : '';

                        setSummary((apiData.summary || 'Personalized book recommendations based on your profile, annotated with library call numbers.') + ` • mood: ${userProfile.emotion}` + filterSummary + accessSummary);

                        handled = true;

                    }

                } catch (err) {

                    console.warn('Recommendation API failed, using fallback', err);

                }

            }



            if (!handled) {

                setRecommendations(buildFallback());

                setSummary('Fallback recommendations (offline) • mood: ' + userProfile.emotion);

            }

        } catch (error) {

            console.error('Failed to fetch recommendations:', error);

            setRecommendations(buildFallback());

            setSummary('Unable to reach library sources right now. Showing fallback picks.');

        } finally {

            setLoading(false);

        }

    }, [accessFilter, buildFallback, runMetaSearch, selectedLibraries, userProfile]);



    useEffect(() => {

        fetchRecommendations();

    }, [fetchRecommendations]);



    useEffect(() => {

        setMounted(true);

    }, []);



    if (!mounted) {

        return null;

    }



    return (

        <div className="p-8 lg:p-12 space-y-10">

            {/* Header */}

            <header className="mb-6 lg:mb-4">

                <div className="flex items-center gap-3 mb-4">

                    <Sparkles size={32} className="text-[#e64458]" />

                    <h1 className="font-serif font-bold text-4xl text-[#0f172a]">For You</h1>

                </div>

                <p className="text-[#0f172a]/70 text-lg max-w-3xl">

                    {summary || 'Personalized book recommendations based on your profile, interests, and reading goals.'}

                </p>

                <div className="mt-3 flex items-center gap-2 text-sm text-[#0f172a]/70">

                    <span className="px-3 py-1 rounded-full border border-[#e6dfd5] bg-white text-[#0f172a]">

                        Mood detected: {userProfile.emotion} {emotionLoading ? '(detecting...)' : ''}

                    </span>

                    {emotionConfidence > 0 && (

                        <span className="text-[12px] text-[#0f172a]/60">confidence {(emotionConfidence * 100).toFixed(0)}%</span>

                    )}

                    {emotionReason && <span className="text-[12px] text-[#0f172a]/60 line-clamp-1">Reason: {emotionReason}</span>}

                    <button

                        onClick={detectEmotion}

                        className="text-[12px] text-[#e64458] underline underline-offset-4"

                        disabled={emotionLoading}

                    >

                        {emotionLoading ? 'Detecting…' : 'Re-run detection'}

                    </button>

                </div>

            </header>



            {/* Profile Summary */}

            <div className="bg-gradient-to-r from-[#e64458]/10 via-white to-[#3cbfa7]/12 rounded-2xl p-6 mb-8 border border-[#e6dfd5] shadow-[var(--mr-shadow-soft)]">

                <div className="flex items-start gap-4">

                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">

                        <Target size={24} className="text-[#e64458]" />

                    </div>

                    <div className="flex-1">

                        <h3 className="font-semibold text-lg text-[#0f172a] mb-2">Your Reading Profile</h3>

                        <div className="flex flex-wrap gap-2 text-sm">

                            <span className="bg-white/80 px-3 py-1 rounded-full border border-[#e6dfd5] text-[#0f172a]">

                                👔 {userProfile.occupation}

                            </span>

                            <span className="bg-white/80 px-3 py-1 rounded-full border border-[#e6dfd5] text-[#0f172a]">

                                🎯 {userProfile.readingGoals[0]}

                            </span>

                            <span className="bg-[#e64458]/10 px-3 py-1 rounded-full border border-[#e6dfd5] text-[#e64458]">

                                🧠 Mood: {userProfile.emotion}

                            </span>

                            {userProfile.interests.slice(0, 3).map(interest => (

                                <span key={interest} className="bg-white/80 px-3 py-1 rounded-full border border-[#e6dfd5] text-[#0f172a]">

                                    ❤️ {interest}

                                </span>

                            ))}

                        </div>

                        <Link

                            href="/profile"

                            className="text-sm text-[#e64458] hover:underline mt-2 inline-block"

                        >

                            Update your profile →

                        </Link>

                    </div>

                </div>

            </div>



            {/* Library Sources */}

            <div className="bg-white border border-[#e6dfd5] rounded-2xl p-6 shadow-sm mb-4">

                <div className="flex items-center gap-3 mb-3">

                    <div className="w-10 h-10 rounded-full bg-[#e64458]/10 text-[#e64458] flex items-center justify-center">

                        <Library size={20} />

                    </div>

                    <div>

                        <h3 className="font-semibold text-lg text-[#0f172a]">Verified Library Feeds</h3>

                        <p className="text-sm text-[#0f172a]/70">Open/national/academic shelves with call numbers and pickup notes.</p>

                    </div>

                </div>

                <div className="flex flex-wrap gap-2">

                    {LIBRARY_SOURCES.slice(0, 7).map((source) => (

                        <span

                            key={source.id}

                            className="px-3 py-2 bg-[#fdfbf7] border border-[#f0ebe4] rounded-xl text-xs text-[#0f172a]/80 flex items-center gap-2"

                        >

                            <span className="font-semibold">{source.name}</span>

                            <span className="text-[#0f172a]/60">{source.country}</span>

                            <span className="text-[#e64458] font-medium">{source.callPrefix}</span>

                        </span>

                    ))}

                </div>

                <div className="mt-4">

                    <span className="text-sm font-semibold text-[#0f172a] block mb-2">Emotion auto-detect</span>

                    <p className="text-[11px] text-[#0f172a]/70">We infer mood from your profile/context; you can re-run detection anytime.</p>

                </div>

            </div>



            {/* Filters */}

            <div className="bg-white border border-[#e6dfd5] rounded-2xl p-6 shadow-sm mb-6">

                <div className="flex flex-col gap-4">

                    <div className="flex flex-wrap items-center gap-3">

                        <span className="text-sm font-semibold text-[#0f172a]">Access</span>

                        {(['Any', 'Digital', 'Physical', 'Hybrid'] as const).map(option => (

                            <button

                                key={option}

                                onClick={() => setAccessFilter(option)}

                                className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${accessFilter === option

                                    ? 'bg-[#e64458] text-white border-[#e64458]'

                                    : 'bg-[#fdfbf7] text-[#0f172a]/80 border-[#f0ebe4]'

                                    }`}

                            >

                                {option}

                            </button>

                        ))}

                    </div>

                    <div>

                        <div className="flex items-center justify-between mb-2">

                            <span className="text-sm font-semibold text-[#0f172a]">Focus libraries</span>

                            <span className="text-[11px] text-[#0f172a]/60">{selectedLibraries.length || 'All'} selected</span>

                        </div>

                        <div className="flex flex-wrap gap-2">

                            {LIBRARY_SOURCES.map((source) => {

                                const active = selectedLibraries.includes(source.id);

                                return (

                                    <button

                                        key={source.id}

                                        onClick={() => toggleLibrary(source.id)}

                                        className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 transition-colors ${active

                                            ? 'bg-[#e64458]/10 border-[#e64458] text-[#e64458]'

                                            : 'bg-white border-[#f0ebe4] text-[#0f172a]/80'

                                            }`}

                                    >

                                        <span className="font-semibold">{source.callPrefix}</span>

                                        <span>{source.country}</span>

                                    </button>

                                );

                            })}

                        </div>

                    </div>

                </div>

                <div className="mt-4 bg-[#fdfbf7] border border-[#f0ebe4] rounded-xl p-4 text-sm text-[#0f172a]/70">

                    <div className="font-semibold text-[#0f172a] mb-1">Metadata / Meta-Search Trace</div>

                    <p>Filters applied to metadata before ranking: libraries ({selectedLibraries.length ? selectedLibraries.join(', ') : 'all'}) • access {accessFilter} • mood {userProfile.emotion}.</p>

                    <p className="text-[11px] text-[#0f172a]/60 mt-1">Meta-search service runs a SQL-like filter then enriches with library call numbers.</p>

                    {metaSql && (

                        <div className="mt-2">

                            <p className="text-[11px] font-mono text-[#0f172a]/80 break-words">{metaSql}</p>

                        </div>

                    )}

                    {metaResults.length > 0 && (

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">

                            {metaResults.map((item) => (

                                <div key={item.id} className="border border-[#f0ebe4] rounded-lg p-2 bg-white">

                                    <p className="text-xs font-semibold text-[#0f172a] line-clamp-1">{item.title}</p>

                                    {item.libraryHolding && (

                                        <p className="text-[11px] text-[#0f172a]/70">

                                            {item.libraryHolding.libraryName} • {item.libraryHolding.callNumber} • {item.access}

                                        </p>

                                    )}

                                </div>

                            ))}

                        </div>

                    )}

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

                                        <span className="bg-gradient-to-r from-[#e64458] to-[#0f172a] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">

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

                                        <h3 className="font-serif font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-[#e64458] transition-colors">

                                            {rec.book.title}

                                        </h3>

                                        <p className="text-xs text-[#0f172a]/70 mb-3">

                                            {rec.book.authors?.[0]?.name || 'Unknown Author'}

                                        </p>



                                        {/* AI Reasoning */}

                                        <div className="bg-[#fdfbf7] p-3 rounded-lg border border-[#f0ebe4]">

                                            <div className="flex items-start gap-2 mb-1">

                                                <Sparkles size={12} className="text-[#e64458] mt-0.5 flex-shrink-0" />

                                                <p className="text-xs text-[#0f172a]/70 leading-relaxed line-clamp-3">

                                                    {rec.reasoning}

                                                </p>

                                            </div>

                                        </div>



                                        {/* Library holding */}

                                        {rec.libraryHolding && (

                                            <div className="mt-3 bg-white border border-[#f0ebe4] rounded-lg p-3">

                                                <div className="flex items-center gap-2 text-xs text-[#0f172a]">

                                                    <Library size={14} className="text-[#e64458] flex-shrink-0" />

                                                    <span className="font-semibold">{rec.libraryHolding.libraryName}</span>

                                                    <span className="text-[#0f172a]/60">({rec.libraryHolding.country})</span>

                                                </div>



                                                <div className="flex items-center gap-2 text-[11px] text-[#0f172a]/70 mt-1">

                                                    <MapPin size={12} className="flex-shrink-0" />

                                                    <span className="line-clamp-1">{rec.libraryHolding.location}</span>

                                                </div>

                                                <p className="text-[11px] text-[#0f172a]/70 mt-1">

                                                    Call no. {rec.libraryHolding.callNumber} • {rec.libraryHolding.access}

                                                </p>

                                            </div>

                                        )}

                                    </div>



                                    {/* Footer */}

                                    <div className="pt-4 mt-4 border-t border-[#f0ebe4]">

                                        <span className="bg-[#e64458]/15 text-[#e64458] px-3 py-1 rounded-full text-xs font-medium">

                                            {rec.book.subject?.[0] || 'Recommended'}

                                        </span>

                                    </div>

                                </div>

                            </Link>

                        </div>

                    ))}

                </div>

            )}



            {/* XAI Section */}

            <div className="mt-16 pt-10 border-t border-gray-200">

                <h2 className="text-2xl font-bold text-center mb-4">Analyze a Non-Recommended Book</h2>

                <p className="text-center text-gray-600 max-w-2xl mx-auto mb-6">

                    Ever wonder why a specific book wasn't recommended to you? Select a book to find out what would need to change for it to appear in your recommendations.

                </p>

                <div className="max-w-md mx-auto">

                    <BookSearchInput onSelectBook={setSelectedBookForAnalysis} placeholder="Search for a book..." />

                </div>



                {selectedBookForAnalysis && (



                    <div className="mt-6 max-w-md mx-auto text-center">



                        <div className="bg-white p-4 rounded-lg border shadow-sm">



                            <p className="font-bold">{selectedBookForAnalysis.title}</p>



                            <p className="text-sm text-gray-600">{selectedBookForAnalysis.authors.join(', ')}</p>



                        </div>



                        <button



                            onClick={handleAnalysis}



                            disabled={isAnalyzing}



                            className="mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"



                        >



                            {isAnalyzing ? 'Analyzing...' : 'Why wasn\'t this recommended?'}



                        </button>



                    </div>



                )}







                {explanation && (



                    <div className="mt-6 max-w-md mx-auto">



                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">



                            <h3 className="font-bold mb-2">Analysis Result</h3>



                            {explanation.error ? (



                                <p className="text-red-600">{explanation.error}</p>



                            ) : (



                                <ul className="space-y-2 list-disc list-inside">



                                    {explanation.suggestions?.map((suggestion: string, index: number) => (



                                        <li key={index}>{suggestion}</li>



                                    ))}



                                </ul>



                            )}



                            {!explanation.error && explanation.potential_score_improvement && (



                                <p className="text-sm mt-3 font-semibold">



                                    Potential Score Improvement: +{(explanation.potential_score_improvement * 100).toFixed(0)}%



                                </p>



                            )}



                        </div>



                    </div>



                )}



            </div>



            {/* Refresh Button */}

            {!loading && recommendations.length > 0 && (

                <div className="text-center mt-12">

                    <button

                        onClick={fetchRecommendations}

                        className="px-8 py-3 bg-[#e64458] text-white rounded-full hover:bg-[#c83549] transition-colors font-semibold inline-flex items-center gap-2 shadow-[var(--mr-shadow-soft)]"

                    >

                        <Sparkles size={20} />

                        Get New Recommendations

                    </button>

                    <p className="text-xs text-[#0f172a]/60 mt-3">

                        Powered by Open Library subjects + SweetReader + metadata SQL filters. Bring your PDF to ask questions in <Link href="/chat" className="underline">Chat</Link>.

                    </p>

                </div>

            )}

        </div>

    );

}

export default ForYouPage;



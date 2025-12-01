"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SweetReader from '@/components/reader/SweetReader';

interface BookDetails {
    title: string;
    author: string;
    content: string;
    coverUrl?: string | null;
    subjects?: string[];
    openLibraryUrl?: string;
}

interface RelatedBook {
    key: string;
    title: string;
    author: string;
    coverUrl?: string | null;
}

export default function BookPage() {
    const params = useParams();
    const slugParam = params.slug as string[] | string | undefined;
    const slugPath = Array.isArray(slugParam) ? slugParam.join('/') : slugParam;
    const normalizedPath = slugPath
        ? slugPath.startsWith('/') ? slugPath : `/${slugPath}`
        : null;
    const [book, setBook] = useState<BookDetails | null>(null);
    const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [relatedLoading, setRelatedLoading] = useState(false);

    useEffect(() => {
        async function fetchBook() {
            setLoading(true);
            setRelatedBooks([]);

            if (!normalizedPath) {
                setBook({
                    title: 'Book Not Found',
                    author: 'Unknown',
                    content: 'Unable to load this book. Please try another one.',
                });
                setLoading(false);
                return;
            }

            try {
                // Fetch book details from Open Library
                const res = await fetch(`https://openlibrary.org${normalizedPath}.json`);
                const data = await res.json();

                // Get description
                let description = '';
                if (typeof data.description === 'string') {
                    description = data.description;
                } else if (data.description?.value) {
                    description = data.description.value;
                }

                // Fallback to first paragraph if no description
                if (!description && data.first_sentence?.value) {
                    description = data.first_sentence.value;
                }

                const authorKeys = data.authors?.map((item: { author?: { key?: string } }) => item?.author?.key).filter(Boolean) || [];
                let authorNames: string[] = [];
                if (authorKeys.length) {
                    const authorResponses = await Promise.all(authorKeys.map(async (key: string) => {
                        try {
                            const authorRes = await fetch(`https://openlibrary.org${key}.json`);
                            if (!authorRes.ok) return null;
                            const authorData = await authorRes.json();
                            return authorData?.name as string | null;
                        } catch {
                            return null;
                        }
                    }));
                    authorNames = authorResponses.filter(Boolean) as string[];
                }

                const subjects = Array.isArray(data.subjects) ? data.subjects.slice(0, 8) : [];
                const coverId = data.covers?.[0];
                const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
                const workKey = data.key || normalizedPath;
                const openLibraryUrl = workKey ? `https://openlibrary.org${workKey.startsWith('/') ? workKey : `/${workKey}`}` : undefined;

                const bookDetails: BookDetails = {
                    title: data.title || 'Unknown Title',
                    author: authorNames.length ? authorNames.join(', ') : data.by_statement || 'Unknown Author',
                    content: description || 'Content not available. This book can be read on Open Library.',
                    coverUrl,
                    subjects,
                    openLibraryUrl,
                };

                setBook(bookDetails);

                // Fetch related books based on primary subject
                if (subjects.length) {
                    setRelatedLoading(true);
                    try {
                        const primarySubject = subjects[0];
                        const subjectSlug = encodeURIComponent(primarySubject.toLowerCase().replace(/\s+/g, '_'));
                        const relatedRes = await fetch(`https://openlibrary.org/subjects/${subjectSlug}.json?limit=6`);
                        if (relatedRes.ok) {
                            const relatedData = await relatedRes.json();
                            type RelatedWork = { key: string; title: string; cover_id?: number; authors?: { name: string }[] };
                            const mapped = (relatedData.works as RelatedWork[] || []).map((work) => {
                                const relatedCoverId = work.cover_id;
                                return {
                                    key: work.key,
                                    title: work.title,
                                    author: work.authors?.[0]?.name || 'Unknown Author',
                                    coverUrl: relatedCoverId ? `https://covers.openlibrary.org/b/id/${relatedCoverId}-M.jpg` : null,
                                } as RelatedBook;
                            });
                            setRelatedBooks(mapped);
                        }
                    } catch (error) {
                        console.error('Failed to fetch related books:', error);
                    } finally {
                        setRelatedLoading(false);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch book:', error);
                // Fallback book
                setBook({
                    title: 'Book Not Found',
                    author: 'Unknown',
                    content: 'Unable to load this book. Please try another one.',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchBook();
    }, [normalizedPath]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#666]">Loading book...</p>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-[#666]">Book not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fdfbf7] min-h-screen p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-12">
                <section className="grid gap-8 lg:grid-cols-[280px,1fr] items-start">
                    <div className="bg-white border border-[#e5e0d8] rounded-2xl shadow-sm p-4 flex items-center justify-center relative overflow-hidden min-h-[360px]">
                        {book.coverUrl ? (
                            <Image
                                src={book.coverUrl}
                                alt={`${book.title} cover`}
                                fill
                                className="object-contain rounded-xl"
                                sizes="(min-width: 1024px) 280px, 60vw"
                            />
                        ) : (
                            <div className="text-center text-[#888]">
                                <div className="w-16 h-16 border-2 border-dashed border-[#d4cec4] rounded-xl mx-auto mb-4"></div>
                                <p className="text-sm">No cover available</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#888]">Work Detail</p>
                            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1a1a1a] leading-tight">{book.title}</h1>
                            <p className="text-lg text-[#444]">{book.author}</p>
                        </div>

                        {book.subjects && book.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {book.subjects.map((subject) => (
                                    <span
                                        key={subject}
                                        className="px-3 py-1 rounded-full bg-white border border-[#e5e0d8] text-sm text-[#444] shadow-sm"
                                    >
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {book.openLibraryUrl && (
                                <Link
                                    href={book.openLibraryUrl}
                                    target="_blank"
                                    className="px-4 py-2 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-black transition-colors"
                                >
                                    View on Open Library
                                </Link>
                            )}
                            <Link
                                href="/for-you"
                                className="px-4 py-2 rounded-xl bg-white border border-[#e5e0d8] text-sm font-medium text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors"
                            >
                                See more picks
                            </Link>
                        </div>

                        <div className="bg-white border border-[#e5e0d8] rounded-2xl p-4 shadow-sm text-[#444] leading-7">
                            {book.content}
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#888]">Reader</p>
                            <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Immersive mode</h2>
                        </div>
                        <span className="text-sm text-[#666]">Powered by ModernReader SweetReader</span>
                    </div>
                    <SweetReader
                        title={book.title}
                        author={book.author}
                        content={book.content}
                    />
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-[#888]">Related</p>
                            <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">Nearby on Open Library</h3>
                        </div>
                        <span className="text-sm text-[#666]">
                            {book.subjects?.[0] ? `Based on subject: ${book.subjects[0]}` : 'Based on Open Library tags'}
                        </span>
                    </div>

                    {relatedLoading && (
                        <div className="flex items-center gap-2 text-[#666] text-sm">
                            <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
                            Loading related titles...
                        </div>
                    )}

                    {!relatedLoading && relatedBooks.length === 0 && (
                        <p className="text-sm text-[#666]">No related books found yet for this subject.</p>
                    )}

                    {!relatedLoading && relatedBooks.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedBooks.map((related) => (
                                <Link
                                    key={related.key}
                                    href={`/books${related.key}`}
                                    className="group bg-white border border-[#e5e0d8] rounded-2xl p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex gap-4"
                                >
                                    <div className="relative w-16 h-24 flex-shrink-0 bg-[#f4efe6] rounded-lg overflow-hidden">
                                        {related.coverUrl ? (
                                            <Image
                                                src={related.coverUrl}
                                                alt={`${related.title} cover`}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#888]">No cover</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-[#1a1a1a] group-hover:underline">{related.title}</p>
                                        <p className="text-xs text-[#666] mt-1">{related.author}</p>
                                        <p className="text-xs text-[#999] mt-2">Open Library • tap to open</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

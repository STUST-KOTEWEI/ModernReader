"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SweetReader from '@/components/reader/SweetReader';

interface BookDetails {
    title: string;
    author: string;
    content: string;
}

export default function BookPage() {
    const params = useParams();
    const bookId = params.id as string;
    const [book, setBook] = useState<BookDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBook() {
            try {
                // Fetch book details from Open Library
                const res = await fetch(`https://openlibrary.org${bookId}.json`);
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

                setBook({
                    title: data.title || 'Unknown Title',
                    author: data.authors?.[0]?.name || data.by_statement || 'Unknown Author',
                    content: description || 'Content not available. This book can be read on Open Library.',
                });
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

        if (bookId) {
            fetchBook();
        }
    }, [bookId]);

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
        <SweetReader
            title={book.title}
            author={book.author}
            content={book.content}
        />
    );
}

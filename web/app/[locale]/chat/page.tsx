"use client";

import { useState } from 'react';
import { MessageSquare, Plus, Users, BookOpen, Send, Sparkles, Upload, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ChatRoom {
    id: string;
    name: string;
    type: 'book' | 'topic' | 'ai';
    bookTitle?: string;
    memberCount: number;
    lastMessage: string;
    lastMessageTime: string;
}

interface DocChunk {
    id: string;
    heading: string;
    snippet: string;
    page: number;
}

interface DocSession {
    docId: string;
    fileName: string;
    summary: string;
    holding?: {
        libraryName: string;
        callNumber: string;
        location: string;
        access: string;
        country: string;
    };
    chunks: DocChunk[];
}

const DEMO_ROOMS: ChatRoom[] = [
    {
        id: '1',
        name: 'Atomic Habits Discussion',
        type: 'book',
        bookTitle: 'Atomic Habits',
        memberCount: 234,
        lastMessage: 'Great insights on habit stacking!',
        lastMessageTime: '2m ago'
    },
    {
        id: '2',
        name: 'Science Fiction Lovers',
        type: 'topic',
        memberCount: 567,
        lastMessage: 'Just finished Dune, amazing!',
        lastMessageTime: '15m ago'
    },
    {
        id: '3',
        name: 'AI Reading Assistant',
        type: 'ai',
        memberCount: 1,
        lastMessage: 'Ask me anything about books!',
        lastMessageTime: 'Always active'
    },
    {
        id: '4',
        name: 'Self-Help & Growth',
        type: 'topic',
        memberCount: 892,
        lastMessage: 'Recommended: The Power of Now',
        lastMessageTime: '1h ago'
    }
];

export default function ChatRoomsPage() {
    const [rooms] = useState<ChatRoom[]>(DEMO_ROOMS);
    const [docSession, setDocSession] = useState<DocSession | null>(null);
    const [docQuestion, setDocQuestion] = useState('');
    const [docAnswer, setDocAnswer] = useState('');
    const [docLoading, setDocLoading] = useState(false);
    const [docUploading, setDocUploading] = useState(false);

    const handleDocUpload = async (file?: File) => {
        if (!file) return;
        setDocUploading(true);
        try {
            const res = await fetch('/api/docs/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    size: file.size,
                })
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setDocSession(data);
            setDocAnswer(data.summary);
        } catch (error) {
            console.error('Doc upload failed', error);
            setDocAnswer('Unable to ingest the document right now. Please try again.');
        } finally {
            setDocUploading(false);
        }
    };

    const handleDocAsk = async () => {
        if (!docSession || !docQuestion.trim()) return;
        setDocLoading(true);
        try {
            const res = await fetch('/api/docs/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docId: docSession.docId,
                    question: docQuestion,
                })
            });
            const data = await res.json();
            setDocAnswer(data.answer);
            if (data.chunks) {
                setDocSession(prev => prev ? { ...prev, chunks: data.chunks } : prev);
            }
        } catch (error) {
            console.error('Doc ask failed', error);
            setDocAnswer('Could not generate an answer right now.');
        } finally {
            setDocLoading(false);
        }
    };

    return (
        <div className="p-8 lg:p-12">
            {/* Header */}
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">Chat Rooms</h1>
                    <p className="text-[#666]">Discuss books, share insights, and connect with readers</p>
                </div>
                <button className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-black transition-colors font-medium flex items-center gap-2">
                    <Plus size={20} />
                    <span className="hidden md:inline">Create Room</span>
                </button>
            </header>

            {/* AskYourPDF-style doc QA */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 mb-12">
                <div className="bg-white rounded-2xl border border-[#e5e0d8] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Upload size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[#1a1a1a]">Ask Your PDF (Library)</h3>
                            <p className="text-sm text-[#666]">Upload a library PDF, then ask questions with citations.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col md:flex-row items-center gap-3">
                            <input
                                type="file"
                                accept="application/pdf"
                                className="text-sm"
                                onChange={(e) => handleDocUpload(e.target.files?.[0])}
                                disabled={docUploading}
                            />
                            {docUploading && <Loader2 size={16} className="animate-spin text-orange-500" />}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Ask a question about the document..."
                                value={docQuestion}
                                onChange={(e) => setDocQuestion(e.target.value)}
                                className="flex-1 border border-[#e5e0d8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                disabled={docLoading}
                            />
                            <button
                                onClick={handleDocAsk}
                                disabled={!docSession || docLoading}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {docLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Ask
                            </button>
                        </div>
                        <div className="bg-[#fdfbf7] border border-[#f0ebe4] rounded-xl p-4 text-sm text-[#0f172a]/80 min-h-[96px]">
                            {docAnswer || 'Upload a PDF to see a summary and start chatting.'}
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-[#e5e0d8] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[#1a1a1a]">Document Context</h3>
                            <p className="text-sm text-[#666]">Library call number, location, and snippets used to answer.</p>
                        </div>
                    </div>
                    {docSession ? (
                        <div className="space-y-3">
                            <div className="text-sm text-[#0f172a]/80">
                                <div className="font-semibold">{docSession.fileName}</div>
                                {docSession.holding && (
                                    <p className="text-xs text-[#0f172a]/70">
                                        {docSession.holding.libraryName} ({docSession.holding.country}) • Call no. {docSession.holding.callNumber} • {docSession.holding.location} • {docSession.holding.access}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                {docSession.chunks.map(chunk => (
                                    <div key={chunk.id} className="border border-[#f0ebe4] rounded-lg p-3 bg-[#fdfbf7]">
                                        <div className="flex items-center justify-between text-xs text-[#0f172a]/70 mb-1">
                                            <span className="font-semibold">{chunk.heading}</span>
                                            <span>p.{chunk.page}</span>
                                        </div>
                                        <p className="text-xs text-[#0f172a]/70 line-clamp-2">{chunk.snippet}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[#666]">No document uploaded yet.</p>
                    )}
                </div>
            </div>

            {/* Room Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <CategoryCard
                    icon={<BookOpen size={24} />}
                    title="Book Discussions"
                    count={45}
                    description="Chat about specific books"
                    color="bg-blue-50 border-blue-200 text-blue-600"
                />
                <CategoryCard
                    icon={<Users size={24} />}
                    title="Topic Rooms"
                    count={28}
                    description="Genre and interest groups"
                    color="bg-green-50 border-green-200 text-green-600"
                />
                <CategoryCard
                    icon={<Sparkles size={24} />}
                    title="AI Assistants"
                    count={3}
                    description="Chat with AI about books"
                    color="bg-purple-50 border-purple-200 text-purple-600"
                />
            </div>

            {/* Active Rooms */}
            <div className="space-y-4">
                <h2 className="font-bold text-xl mb-4">Active Rooms</h2>
                {rooms.map(room => (
                    <Link key={room.id} href={`/chat/${room.id}`}>
                        <div className="bg-white rounded-xl p-6 border border-[#e5e0d8] hover:shadow-lg hover:border-[#1a1a1a] transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Room Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${room.type === 'book' ? 'bg-blue-100 text-blue-600' :
                                            room.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                                                'bg-green-100 text-green-600'
                                        }`}>
                                        {room.type === 'book' ? <BookOpen size={20} /> :
                                            room.type === 'ai' ? <Sparkles size={20} /> :
                                                <Users size={20} />}
                                    </div>

                                    {/* Room Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg mb-1 group-hover:text-orange-600 transition-colors">
                                            {room.name}
                                        </h3>
                                        {room.bookTitle && (
                                            <p className="text-xs text-[#999] mb-2">📚 {room.bookTitle}</p>
                                        )}
                                        <p className="text-sm text-[#666] mb-2 line-clamp-1">{room.lastMessage}</p>
                                        <div className="flex items-center gap-4 text-xs text-[#999]">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {room.memberCount} members
                                            </span>
                                            <span>{room.lastMessageTime}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Join Button */}
                                <button className="px-4 py-2 bg-[#f0ebe4] text-[#1a1a1a] rounded-lg hover:bg-[#1a1a1a] hover:text-white transition-colors font-medium text-sm flex items-center gap-2">
                                    <MessageSquare size={16} />
                                    Join
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-12 bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8 border border-orange-100 text-center">
                <Sparkles size={32} className="text-orange-500 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Real-time Chat Coming Soon!</h3>
                <p className="text-[#666] max-w-2xl mx-auto">
                    We&apos;re building a real-time chat system with Supabase. You&apos;ll be able to discuss books,
                    share insights, and get AI-powered reading recommendations in live conversations.
                </p>
            </div>
        </div>
    );
}

function CategoryCard({ icon, title, count, description, color }: {
    icon: React.ReactNode;
    title: string;
    count: number;
    description: string;
    color: string;
}) {
    return (
        <div className={`p-6 rounded-xl border-2 ${color}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {icon}
                </div>
                <span className="text-2xl font-bold">{count}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm opacity-75">{description}</p>
        </div>
    );
}

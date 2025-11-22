"use client";

import { useState } from "react";
import { hyReadApi, HyReadBook } from "@/lib/hyread";
import { Link2, Check, RefreshCw, Book } from "lucide-react";

export default function HyReadConnect() {
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncedBooks, setSyncedBooks] = useState<HyReadBook[]>([]);

    const handleConnect = async () => {
        setIsSyncing(true);
        const res = await hyReadApi.linkAccount("demo-token");
        if (res.success) {
            setIsConnected(true);
            const books = await hyReadApi.syncBooks();
            setSyncedBooks(books);
        }
        setIsSyncing(false);
    };

    const handleRenew = async (bookId: string) => {
        setSyncedBooks(prev => prev.map(b => b.id === bookId ? { ...b, isRenewing: true } : b));
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSyncedBooks(prev => prev.map(b => b.id === bookId ? { ...b, isRenewing: false, daysLeft: 14 } : b));
    };

    return (
        <div className="bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden">
            <div className="p-6 border-b border-[#e5e0d8] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        H
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-[#1a1a1a]">HyRead Integration</h3>
                        <p className="text-sm text-[#666]">Sync your borrowed e-books and progress.</p>
                    </div>
                </div>
                {!isConnected ? (
                    <button
                        onClick={handleConnect}
                        disabled={isSyncing}
                        className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Link2 size={16} />}
                        {isSyncing ? "Connecting..." : "Connect Account"}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full">
                        <Check size={14} />
                        Connected
                    </div>
                )}
            </div>

            {isConnected && (
                <div className="p-6 bg-[#fdfbf7]">
                    <h4 className="text-sm font-bold text-[#666] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Book size={14} /> Synced Library ({syncedBooks.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {syncedBooks.map(book => (
                            <div key={book.id} className="bg-white p-3 rounded-xl border border-[#e5e0d8] flex gap-3 relative group">
                                <div className={`w-12 h-16 rounded-md ${book.cover} flex-shrink-0`} />
                                <div className="min-w-0 flex-1">
                                    <h5 className="font-bold text-sm truncate">{book.title}</h5>
                                    <p className="text-xs text-[#666] truncate">{book.author}</p>
                                    <div className="mt-2 h-1 bg-[#f0ebe4] rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600" style={{ width: `${book.progress}%` }} />
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-[10px] text-[#999]">{book.daysLeft || 3} days left</span>
                                        <button
                                            onClick={() => handleRenew(book.id)}
                                            disabled={book.isRenewing}
                                            className="text-[10px] font-bold text-blue-600 hover:underline disabled:text-[#999]"
                                        >
                                            {book.isRenewing ? "Renewing..." : "Renew"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import Link from "next/link";
import { Clock, Star, Search, User, TrendingUp, Globe, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Book {
  key: string;
  title: string;
  authors: { name: string }[];
  cover_id: number;
  subject: string[];
}

const CATEGORIES = ["All", "Folklore", "History", "Music", "Adventure", "Language"];

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch('https://openlibrary.org/subjects/indigenous_peoples.json?limit=12');
        const data = await res.json();
        setBooks(data.works || []);
      } catch (error) {
        console.error("Failed to fetch books", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">Global Indigenous Library</h1>
          <p className="text-[#666]">Connected to Open Library & ModernReader Network.</p>
        </div>

        {/* Live Activity Ticker */}
        <div className="bg-white border border-[#e5e0d8] rounded-full px-4 py-2 flex items-center gap-3 text-xs shadow-sm animate-fade-in">
          <div className="flex items-center gap-1.5 text-green-600 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </div>
          <span className="text-[#666]">User <span className="font-bold text-[#1a1a1a]">Kaleb</span> just finished "Braiding Sweetgrass"</span>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={20} />
          <input
            type="text"
            placeholder="Search global database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat
                  ? "bg-[#1a1a1a] text-white shadow-md"
                  : "bg-white border border-[#e5e0d8] text-[#666] hover:bg-[#fdfbf7] hover:border-[#1a1a1a]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatBadge icon={<Globe size={16} />} label="Languages" value="1,642" />
        <StatBadge icon={<TrendingUp size={16} />} label="Daily Reads" value="84.2k" />
        <StatBadge icon={<User size={16} />} label="Active Scholars" value="12k" />
        <StatBadge icon={<Activity size={16} />} label="New Works" value="+128" />
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-96 animate-pulse border border-[#e5e0d8]">
              <div className="w-full h-2/3 bg-[#f0ebe4] rounded-xl mb-4"></div>
              <div className="h-4 bg-[#f0ebe4] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[#f0ebe4] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredBooks.map((book) => (
            <Link key={book.key} href="/reader" className="group">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e0d8] transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full flex flex-col">
                {/* Cover */}
                <div className="aspect-[2/3] rounded-xl mb-4 bg-[#f0ebe4] relative overflow-hidden">
                  {book.cover_id ? (
                    <Image
                      src={`https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`}
                      alt={book.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#999] font-serif p-4 text-center">
                      {book.title}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Meta */}
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">{book.title}</h3>
                  <p className="text-xs text-[#666] mb-3 flex items-center gap-1">
                    <User size={12} /> {book.authors?.[0]?.name || "Unknown Author"}
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-[#f0ebe4] flex items-center justify-between text-[10px] font-medium text-[#999] uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Star size={10} className="text-orange-400 fill-orange-400" /> 4.8</span>
                  <span className="bg-[#f0ebe4] px-2 py-1 rounded-full text-[#666]">Read Now</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex items-center gap-3 shadow-sm">
      <div className="w-10 h-10 bg-[#fdfbf7] rounded-full flex items-center justify-center text-[#1a1a1a]">
        {icon}
      </div>
      <div>
        <div className="font-bold text-[#1a1a1a] text-lg leading-none">{value}</div>
        <div className="text-[10px] text-[#666] uppercase tracking-wider font-medium">{label}</div>
      </div>
    </div>
  )
}

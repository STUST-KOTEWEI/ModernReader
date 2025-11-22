```javascript
"use client";

import Link from "next/link";
import { Clock, Star, Search } from "lucide-react";
import { useState } from "react";

const BOOKS = [
  {
    id: 1,
    title: "The Legend of the Hundred-Pacer",
    author: "Paiwan Tradition",
    cover: "bg-orange-900",
    progress: 45,
    category: "Folklore"
  },
  {
    id: 2,
    title: "Voices of the Atayal",
    author: "Atayal Elders",
    cover: "bg-red-900",
    progress: 12,
    category: "History"
  },
  {
    id: 3,
    title: "Songs of the Ocean",
    author: "Tao Tribe",
    cover: "bg-blue-900",
    progress: 0,
    category: "Music"
  },
  {
    id: 4,
    title: "The Bunun Hunter",
    author: "Bunun Storytellers",
    cover: "bg-green-900",
    progress: 88,
    category: "Adventure"
  }
];

const CATEGORIES = ["All", "Folklore", "History", "Music", "Adventure", "Language"];

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = BOOKS.filter(book =>
    (activeCategory === "All" || book.category === activeCategory) &&
    (book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-12">
        <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">Your Library</h1>
        <p className="text-[#666]">Continue your journey into the wisdom of the ancestors.</p>
      </header>

      {/* Search & Filter */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" size={20} />
          <input
            type="text"
            placeholder="Search titles, authors, or tribes..."
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
              className={`px - 4 py - 2 rounded - full text - sm font - medium whitespace - nowrap transition - all ${
  activeCategory === cat
    ? "bg-[#1a1a1a] text-white shadow-md"
    : "bg-white border border-[#e5e0d8] text-[#666] hover:bg-[#fdfbf7] hover:border-[#1a1a1a]"
} `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Hero (Only show if no search) */}
      {!searchQuery && activeCategory === "All" && (
        <div className="mb-12 bg-[#1a1a1a] rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="w-32 h-48 bg-orange-900 rounded-lg shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500"></div>
            <div className="flex-1">
              <span className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 block">Featured Collection</span>
              <h2 className="font-serif font-bold text-3xl mb-4">The Lost Songs of the Amis</h2>
              <p className="text-white/60 mb-6 max-w-xl">Rediscover the ancient melodies that guided the Amis people across the oceans. Enhanced with spatial audio and haptic rhythm feedback.</p>
              <button className="bg-white text-[#1a1a1a] px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors">
                Start Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredBooks.map((book) => (
          <Link key={book.id} href="/reader" className="group">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e0d8] transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
              {/* Cover */}
              <div className={`aspect - [2 / 3] rounded - xl mb - 4 ${ book.cover } relative overflow - hidden`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-medium opacity-80 mb-1">{book.category}</p>
                  <h3 className="font-serif font-bold text-lg leading-tight">{book.title}</h3>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-[#666] mb-3">
                <span className="flex items-center gap-1"><UserIcon size={12} /> {book.author}</span>
                <span className="flex items-center gap-1"><Star size={12} /> 4.8</span>
              </div>

              {/* Progress */}
              <div className="w-full bg-[#f0ebe4] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#1a1a1a] h-full rounded-full" style={{ width: `${ book.progress }% ` }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-medium text-[#999] uppercase tracking-wider">
                <span>{book.progress}% Complete</span>
                <span className="flex items-center gap-1"><Clock size={10} /> 2h left</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function UserIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

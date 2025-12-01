"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Search, User, TrendingUp, Globe, Activity } from "lucide-react";
import { useTranslations } from 'next-intl';

interface Book {
  key: string;
  title: string;
  authors: { name: string }[];
  cover_id: number;
  subject: string[];
}

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Science", "Business", "Self-Help"];
const SOURCE_CARDS = [
  {
    name: "Open Library",
    href: "https://openlibrary.org",
    accent: "#e64458",
    desc: "Global open catalogue; live works, covers, subjects.",
    stat: "37M records",
  },
  {
    name: "HyRead Taiwan",
    href: "https://www.hyread.com.tw/",
    accent: "#3cbfa7",
    desc: "Chinese-language eBook and audiobook shelves from libraries.",
    stat: "2.1M items",
  },
  {
    name: "arXiv",
    href: "https://arxiv.org",
    accent: "#0f172a",
    desc: "Preprints across CS, math, physics for rapid research sync.",
    stat: "2.3M papers",
  },
  {
    name: "Library of Congress",
    href: "https://www.loc.gov/",
    accent: "#f3b57c",
    desc: "Authoritative metadata, MARC, and curated collections.",
    stat: "170M items",
  },
];

// Fallback books when Open Library API is unavailable
function getFallbackBooks(): Book[] {
  return [
    {
      key: "/works/OL1",
      title: "Atomic Habits",
      authors: [{ name: "James Clear" }],
      cover_id: 8909499,
      subject: ["Self-help", "Productivity"]
    },
    {
      key: "/works/OL2",
      title: "The Psychology of Money",
      authors: [{ name: "Morgan Housel" }],
      cover_id: 10504608,
      subject: ["Finance", "Psychology"]
    },
    {
      key: "/works/OL3",
      title: "Sapiens",
      authors: [{ name: "Yuval Noah Harari" }],
      cover_id: 8398490,
      subject: ["History", "Anthropology"]
    },
    {
      key: "/works/OL4",
      title: "The Midnight Library",
      authors: [{ name: "Matt Haig" }],
      cover_id: 10677408,
      subject: ["Fiction", "Philosophy"]
    },
    {
      key: "/works/OL5",
      title: "Educated",
      authors: [{ name: "Tara Westover" }],
      cover_id: 8738320,
      subject: ["Memoir", "Education"]
    },
    {
      key: "/works/OL6",
      title: "The Alchemist",
      authors: [{ name: "Paulo Coelho" }],
      cover_id: 28370,
      subject: ["Fiction", "Philosophy"]
    },
    {
      key: "/works/OL7",
      title: "Thinking, Fast and Slow",
      authors: [{ name: "Daniel Kahneman" }],
      cover_id: 7140891,
      subject: ["Psychology", "Economics"]
    },
    {
      key: "/works/OL8",
      title: "The 7 Habits of Highly Effective People",
      authors: [{ name: "Stephen Covey" }],
      cover_id: 421210,
      subject: ["Self-help", "Business"]
    },
    {
      key: "/works/OL9",
      title: "1984",
      authors: [{ name: "George Orwell" }],
      cover_id: 7984916,
      subject: ["Fiction", "Dystopian"]
    },
    {
      key: "/works/OL10",
      title: "The Power of Now",
      authors: [{ name: "Eckhart Tolle" }],
      cover_id: 6708356,
      subject: ["Spirituality", "Mindfulness"]
    },
    {
      key: "/works/OL11",
      title: "Dune",
      authors: [{ name: "Frank Herbert" }],
      cover_id: 8687063,
      subject: ["Science Fiction", "Adventure"]
    },
    {
      key: "/works/OL12",
      title: "The Lean Startup",
      authors: [{ name: "Eric Ries" }],
      cover_id: 7286187,
      subject: ["Business", "Entrepreneurship"]
    }
  ];
}


export default function LibraryPage() {
  const t = useTranslations('HomePage');
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['books', page],
    queryFn: async () => {
      const limit = 24;
      const offset = (page - 1) * limit;
      const res = await fetch(`https://openlibrary.org/subjects/bestseller.json?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const books: Book[] = data?.works || [];
  const hasMore = books.length === 24; // Simple check for now

  // Combine with fallback if empty or error
  const displayBooks = (books.length > 0 ? books : getFallbackBooks()).filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const heroBooks = displayBooks.slice(0, 3);
  const heroSource = heroBooks.length ? heroBooks : getFallbackBooks().slice(0, 3);

  return (
    <div className="p-6 lg:p-10 space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-mr-border bg-white/80 backdrop-blur-xl shadow-[var(--mr-shadow-soft)]">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-mr-rose/10 blur-3xl" />
        <div className="absolute -right-12 top-1/4 h-48 w-48 rounded-full bg-mr-mint/12 blur-3xl" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] p-6 lg:p-10 relative">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] bg-mr-rose/10 text-mr-rose border border-mr-rose/30">
                {t('modernAtlas')}
              </span>
              <span className="text-xs text-mr-ink/60">
                {t('liveCatalogue', { count: displayBooks.length || 0 })}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-mr-ink leading-tight">
                {t('title')}
              </h1>
              <p className="text-mr-ink/75 max-w-2xl text-base lg:text-lg">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/for-you"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-mr-ink text-white font-semibold shadow-[var(--mr-shadow-soft)] hover:shadow-[var(--mr-shadow-strong)] transition-all"
              >
                {t('personalFlow')}
              </Link>
              <Link
                href="/reader"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/70 text-mr-ink border border-mr-border font-semibold hover:border-mr-ink transition-all"
              >
                {t('openReader')}
              </Link>
              <Link
                href="/podcasts"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-mr-rose/10 text-mr-rose border border-mr-rose/30 font-semibold hover:border-mr-rose/60 transition-all"
              >
                {t('listenIn')}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge icon={<Globe size={16} />} label={t('stats.languages')} value="1,642" />
              <StatBadge icon={<TrendingUp size={16} />} label={t('stats.dailyReads')} value="84.2k" />
              <StatBadge icon={<User size={16} />} label={t('stats.scholars')} value="12k" />
              <StatBadge icon={<Activity size={16} />} label={t('stats.newWorks')} value="+128" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroSource.map((book, index) => (
              <Link
                key={`${book.key}-${index}`}
                href={`/books${book.key}`}
                className="group relative overflow-hidden rounded-2xl border border-mr-border bg-white/80 shadow-sm hover:shadow-[var(--mr-shadow-soft)] transition-all hover:-translate-y-1 flex flex-col"
              >
                <div className="absolute inset-x-4 top-0 h-24 bg-gradient-to-b from-mr-rose/12 via-transparent to-transparent blur-2xl" />
                <div className="aspect-[3/4] relative bg-mr-ink/5 overflow-hidden rounded-b-xl">
                  {book.cover_id ? (
                    <Image
                      src={`https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`}
                      alt={book.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-mr-ink/60 font-serif p-4 text-center text-sm">
                      {book.title}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-mr-ink/80 text-white text-[11px] uppercase tracking-wide">
                    {book.subject?.[0] || "Featured"}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-mr-ink/50">Live stack</p>
                  <h3 className="font-serif text-lg font-semibold text-mr-ink leading-tight line-clamp-2 group-hover:text-mr-rose transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-mr-ink/70">{book.authors?.[0]?.name || "Unknown Author"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8 rounded-3xl border border-mr-border bg-white/90 backdrop-blur-xl p-6 lg:p-8 shadow-[var(--mr-shadow-soft)]">
        {/* Search & Filter */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mr-ink/40" size={20} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/80 border border-mr-border focus:border-mr-ink focus:ring-0 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === cat
                  ? "bg-mr-ink text-white shadow-[var(--mr-shadow-soft)] border-transparent"
                  : "bg-white/70 border-mr-border text-mr-ink/70 hover:text-mr-ink hover:border-mr-ink"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBadge icon={<Globe size={16} />} label={t('stats.languages')} value="1,642" />
          <StatBadge icon={<TrendingUp size={16} />} label={t('stats.dailyReads')} value="84.2k" />
          <StatBadge icon={<User size={16} />} label={t('stats.scholars')} value="12k" />
          <StatBadge icon={<Activity size={16} />} label={t('stats.newWorks')} value="+128" />
        </div>

        {/* Book Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/70 rounded-2xl p-4 h-96 animate-pulse border border-mr-border shadow-sm">
                <div className="w-full h-2/3 bg-[#f0ebe4] rounded-xl mb-4"></div>
                <div className="h-4 bg-[#f0ebe4] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#f0ebe4] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayBooks.map((book, index) => (
              <Link key={`${book.key}-${index}`} href={`/books${book.key}`} className="group">
                <div className="relative overflow-hidden rounded-2xl border border-mr-border bg-white/80 shadow-sm transition-all duration-300 group-hover:shadow-[var(--mr-shadow-soft)] group-hover:-translate-y-1 flex flex-col h-full">
                  <div className="absolute inset-x-2 top-0 h-20 bg-gradient-to-b from-mr-rose/12 via-transparent to-transparent blur-2xl" />
                  {/* Cover */}
                  <div className="aspect-[2/3] rounded-xl m-4 mb-2 bg-mr-ink/5 relative overflow-hidden">
                    {book.cover_id ? (
                      <Image
                        src={`https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-mr-ink/60 font-serif p-4 text-center">
                        {book.title}
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/80 text-mr-ink text-[11px] font-semibold border border-mr-border">
                      {book.subject?.[0] || 'Book'}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <h3 className="font-serif font-semibold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-mr-rose transition-colors">{book.title}</h3>
                    <p className="text-xs text-mr-ink/70 mb-3 flex items-center gap-1">
                      <User size={12} /> {book.authors?.[0]?.name || "Unknown Author"}
                    </p>
                    <p className="text-sm text-mr-ink/60 line-clamp-2">
                      Tap to open the full SweetReader view and jump between summaries and raw text.
                    </p>
                    <div className="pt-4 mt-auto border-t border-mr-border flex items-center justify-between text-[11px] font-semibold text-mr-ink/70 uppercase tracking-wider">
                      <span className="bg-mr-ink/90 text-white px-3 py-1 rounded-full shadow-sm">Read</span>
                      <span className="flex items-center gap-1">
                        Open <span aria-hidden>→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && hasMore && (
          <div className="text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-10 py-3 bg-mr-rose text-white rounded-full hover:bg-[#c83549] transition-colors font-semibold shadow-[var(--mr-shadow-soft)]"
            >
              {t('loadMore')}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-mr-border bg-white/80 backdrop-blur-xl p-6 lg:p-8 shadow-[var(--mr-shadow-soft)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-mr-ink/50">{t('globalSources')}</p>
            <h3 className="font-serif text-2xl font-semibold text-mr-ink">{t('plugInto')}</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reader"
              className="px-4 py-2 rounded-full bg-mr-ink text-white text-sm font-semibold shadow-[var(--mr-shadow-soft)]"
            >
              SweetReader demo
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2 rounded-full bg-white/80 border border-mr-border text-sm font-semibold text-mr-ink hover:border-mr-ink"
            >
              {t('askPdf')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SOURCE_CARDS.map((source) => (
            <a
              key={source.name}
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="relative overflow-hidden rounded-2xl border border-mr-border bg-white/90 p-5 shadow-sm hover:shadow-[var(--mr-shadow-soft)] transition-all hover:-translate-y-1 flex flex-col gap-3"
            >
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  background: `radial-gradient(circle at 20% 20%, ${source.accent}22, transparent 40%), radial-gradient(circle at 80% 0%, ${source.accent}1a, transparent 45%)`
                }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl border border-mr-border bg-white flex items-center justify-center text-sm font-semibold" style={{ color: source.accent }}>
                    {source.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-mr-ink">{source.name}</p>
                    <p className="text-xs text-mr-ink/60">{source.stat}</p>
                  </div>
                </div>
                <span className="text-xs text-mr-ink/60">↗</span>
              </div>
              <p className="relative text-sm text-mr-ink/75 leading-relaxed">{source.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="relative overflow-hidden bg-white/80 p-4 rounded-2xl border border-mr-border flex items-center gap-3 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-mr-rose/4 via-transparent to-mr-mint/4 pointer-events-none" />
      <div className="w-10 h-10 bg-mr-ink/6 rounded-xl flex items-center justify-center text-mr-ink relative z-10">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="font-bold text-mr-ink text-lg leading-none">{value}</div>
        <div className="text-[10px] text-mr-ink/60 uppercase tracking-wider font-semibold">{label}</div>
      </div>
    </div>
  )
}

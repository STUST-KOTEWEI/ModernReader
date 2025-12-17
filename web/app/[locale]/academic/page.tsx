"use client";

import { useState } from "react";
import { Search, BookOpen, FileText, ExternalLink, Loader2, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { searchAcademicPapers, AcademicPaper } from "@/lib/academic-api";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AcademicPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AcademicPaper[]>([]);
    const [loading, setLoading] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);

    // Provide fallback for translations if key is missing
    // In a real app, you'd ensure en.json / zh.json has these keys.
    // For now, we use hardcoded fallbacks visually if needed, 
    // but we'll try to use the hook properly.
    // Since I can't see the translation files, I'll use static text for some parts 
    // or generic keys.
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await searchAcademicPapers(query, 10, sourceFilter);
            setResults(data.results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex items-center gap-3 text-white/80">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <GraduationCap size={24} className="text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Academic Research</h1>
                </div>
                <p className="text-white/60 max-w-2xl">
                    Search across arXiv, IEEE, and ACM for the latest research papers and technical reports.
                </p>
            </header>

            {/* Search Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for papers (e.g., 'Transformer', 'Quantum Computing')..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {["All", "arXiv", "IEEE", "ACM"].map((src) => (
                            <button
                                type="button"
                                key={src}
                                onClick={() => setSourceFilter(src === "All" ? undefined : src.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                    (src === "All" && !sourceFilter) || (sourceFilter === src.toLowerCase())
                                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                                }`}
                            >
                                {src}
                            </button>
                        ))}
                    </div>
                </form>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-cyan-400" size={40} />
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid gap-4">
                        {results.map((paper) => (
                            <motion.div
                                key={paper.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors group"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                                            <span className={`px-2 py-1 rounded ${
                                                paper.source.toLowerCase().includes('arxiv') ? 'bg-red-500/20 text-red-300' :
                                                paper.source.toLowerCase().includes('ieee') ? 'bg-blue-500/20 text-blue-300' :
                                                'bg-purple-500/20 text-purple-300'
                                            }`}>
                                                {paper.source}
                                            </span>
                                            <span className="text-white/40">{paper.metadata.published}</span>
                                        </div>
                                        
                                        <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                            <a href={paper.metadata.url} target="_blank" rel="noopener noreferrer">
                                                {paper.title}
                                            </a>
                                        </h3>
                                        
                                        <p className="text-white/70 text-sm line-clamp-1">
                                            {paper.authors.join(", ")}
                                        </p>

                                        <p className="text-white/50 text-sm line-clamp-3 pt-2">
                                            {paper.summary}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 shrink-0">
                                        {paper.metadata.pdf_url && (
                                            <a 
                                                href={paper.metadata.pdf_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-colors"
                                                title="View PDF"
                                            >
                                                <FileText size={20} />
                                            </a>
                                        )}
                                        <a 
                                            href={paper.metadata.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-colors"
                                            title="View Source"
                                        >
                                            <ExternalLink size={20} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : query && !loading ? (
                    <div className="text-center py-20 text-white/40">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No papers found. Try a different keyword.</p>
                    </div>
                ) : (
                    <div className="text-center py-20 text-white/20">
                        <GraduationCap size={64} className="mx-auto mb-4 opacity-30" />
                        <p>Start searching to explore the world of knowledge.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

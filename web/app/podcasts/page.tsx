import { Play, Download, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const PODCASTS = [
    {
        id: 1,
        title: "The Origins of the Chief",
        book: "The Legend of the Hundred-Pacer",
        style: "Elder",
        duration: "12:45",
        date: "2 hours ago"
    },
    {
        id: 2,
        title: "Modern Interpretation of Taboos",
        book: "Voices of the Atayal",
        style: "Academic",
        duration: "08:30",
        date: "Yesterday"
    },
    {
        id: 3,
        title: "Bedtime Story: The Flying Fish",
        book: "Songs of the Ocean",
        style: "Parent",
        duration: "05:15",
        date: "2 days ago"
    }
];

export default function PodcastPage() {
    return (
        <div className="p-8 lg:p-12">
            <header className="mb-12 flex items-end justify-between">
                <div>
                    <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2">Your Podcasts</h1>
                    <p className="text-[#666]">AI-generated audio summaries and stories.</p>
                </div>
                <Link href="/reader">
                    <button className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-medium hover:bg-black transition-colors">
                        Generate New
                    </button>
                </Link>
            </header>

            <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden">
                {PODCASTS.map((pod, i) => (
                    <div key={pod.id} className={`p-6 flex items-center gap-6 hover:bg-[#fdfbf7] transition-colors ${i !== PODCASTS.length - 1 ? 'border-b border-[#e5e0d8]' : ''}`}>
                        {/* Play Button */}
                        <button className="w-12 h-12 bg-[#f0ebe4] rounded-full flex items-center justify-center text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all">
                            <Play size={20} className="ml-1" />
                        </button>

                        {/* Info */}
                        <div className="flex-1">
                            <h3 className="font-serif font-bold text-lg text-[#1a1a1a]">{pod.title}</h3>
                            <p className="text-sm text-[#666]">From: {pod.book}</p>
                        </div>

                        {/* Meta Tags */}
                        <div className="hidden md:flex items-center gap-4">
                            <span className="px-3 py-1 rounded-full border border-[#e5e0d8] text-xs font-medium text-[#666]">
                                {pod.style} Style
                            </span>
                            <span className="text-sm text-[#999] font-mono">{pod.duration}</span>
                            <span className="text-sm text-[#999]">{pod.date}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-[#666] hover:text-[#1a1a1a] hover:bg-[#e5e0d8] rounded-lg transition-colors">
                                <Download size={20} />
                            </button>
                            <button className="p-2 text-[#666] hover:text-[#1a1a1a] hover:bg-[#e5e0d8] rounded-lg transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

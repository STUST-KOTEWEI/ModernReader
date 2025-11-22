"use client";

import { BookOpen, Library, Mic, Settings, User, MessageSquare, LogIn, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "@/components/auth/LoginModal";
import Image from "next/image";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#fdfbf7]">
            {/* Sidebar Navigation */}
            <aside className="w-20 lg:w-64 border-r border-[#e5e0d8] flex flex-col bg-[#fdfbf7] fixed h-full z-50">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-[#fdfbf7] font-serif font-bold text-xl">
                        M
                    </div>
                    <span className="hidden lg:block font-serif font-bold text-lg tracking-tight">ModernReader</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavLink href="/" icon={<Library size={20} />} label="Library" active={pathname === "/"} />
                    <NavLink href="/for-you" icon={<Sparkles size={20} />} label="For You" active={pathname === "/for-you"} />
                    <NavLink href="/reader" icon={<BookOpen size={20} />} label="Current Read" active={pathname === "/reader"} />
                    <NavLink href="/podcasts" icon={<Mic size={20} />} label="Podcasts" active={pathname === "/podcasts"} />
                    <NavLink href="/isbn-podcast" icon={<Mic size={20} />} label="ISBN Podcast" active={pathname === "/isbn-podcast"} />
                    <NavLink href="/chat" icon={<MessageSquare size={20} />} label="Chat Rooms" active={pathname.startsWith("/chat")} />
                    <NavLink href="/profile" icon={<User size={20} />} label="Profile" active={pathname === "/profile"} />
                </nav>

                <div className="p-4 border-t border-[#e5e0d8] space-y-2">
                    {session ? (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f0ebe4]">
                            {session.user?.image ? (
                                <Image src={session.user.image} alt="User" width={24} height={24} className="rounded-full" />
                            ) : (
                                <div className="w-6 h-6 bg-[#1a1a1a] rounded-full text-white flex items-center justify-center text-xs">
                                    {session.user?.name?.[0]}
                                </div>
                            )}
                            <div className="hidden lg:block min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{session.user?.name}</p>
                                <button onClick={() => signOut()} className="text-xs text-[#666] hover:text-[#1a1a1a] flex items-center gap-1">
                                    <LogOut size={10} /> Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsLoginOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#666] hover:bg-[#f0ebe4] hover:text-[#1a1a1a] transition-all duration-200 group text-left"
                        >
                            <LogIn size={20} />
                            <span className="hidden lg:block font-medium text-sm">Sign In</span>
                        </button>
                    )}
                    <NavLink href="/settings" icon={<Settings size={20} />} label="Settings" active={pathname === "/settings"} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-20 lg:ml-64 min-h-screen">
                {children}
            </main>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
    );
}

function NavLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${active
                    ? "bg-[#1a1a1a] text-[#fdfbf7] shadow-lg"
                    : "text-[#666] hover:bg-[#f0ebe4] hover:text-[#1a1a1a]"
                }`}
        >
            {icon}
            <span className="hidden lg:block font-medium text-sm">{label}</span>
        </Link>
    );
}

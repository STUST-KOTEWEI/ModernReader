"use client";

import dynamic from "next/dynamic";
import { BookOpen, Library, Mic, Settings, User, MessageSquare, LogIn, LogOut, Sparkles, Activity, Compass, Trophy, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "@/components/auth/LoginModal";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { NavLink } from "@/components/ui/NavLink";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { clsx } from "clsx";

/**
 * ClientLayout Component
 * 
 * Main layout component for the application that handles:
 * - Sidebar navigation with responsive mobile drawer
 * - User authentication state display
 * - Global error handling via ErrorBoundary
 * - Loading states via Skeleton
 * 
 * @param children - The main content to render
 */
function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isLoading = status === "loading";

    return (
        <div className="flex min-h-screen bg-[#0f172a]">
            <Toaster />

            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-xl bg-white/10 border border-white/10 text-white backdrop-blur-md"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={clsx(
                    "w-72 flex flex-col fixed h-full z-[60] text-white overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#0f172a] via-[#101c34] to-[#121829] transition-transform duration-300 lg:translate-x-0",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-label="Sidebar Navigation"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -left-16 -top-10 h-48 w-48 rounded-full bg-[#e64458]/20 blur-3xl" />
                    <div className="absolute -right-12 top-24 h-40 w-40 rounded-full bg-[#3cbfa7]/15 blur-3xl" />
                </div>

                <div className="relative p-6 flex items-center justify-center gap-3">
                    <div className="relative flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                            <Image src="/branding/logo.svg" alt="ModernReader Logo" width={32} height={32} className="object-contain" priority />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="font-serif text-lg font-bold tracking-tight">ModernReader</span>
                            <span className="text-[11px] uppercase tracking-[0.2em] text-white/70">Living Library</span>
                        </div>
                    </div>
                </div>

                <nav className="relative flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide" aria-label="Main Menu">
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/" icon={<Library size={18} />} label="Library" active={pathname === "/"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/for-you" icon={<Sparkles size={18} />} label="For You" active={pathname === "/for-you"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/learning-path" icon={<Compass size={18} />} label="Learning Path" active={pathname === "/learning-path"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/reader" icon={<BookOpen size={18} />} label="Current Read" active={pathname === "/reader"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/podcasts" icon={<Mic size={18} />} label="Podcasts" active={pathname === "/podcasts"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/isbn-podcast" icon={<Mic size={18} />} label="ISBN Podcast" active={pathname === "/isbn-podcast"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/chat" icon={<MessageSquare size={18} />} label="Chat Rooms" active={pathname.startsWith("/chat")} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/diagnostics" icon={<Activity size={18} />} label="Diagnostics" active={pathname === "/diagnostics"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/profile" icon={<User size={18} />} label="Profile" active={pathname === "/profile"} />
                    </div>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" active={pathname === "/leaderboard"} />
                    </div>
                </nav>

                <div className="relative p-4 border-t border-white/10 space-y-3 bg-white/5 backdrop-blur-sm">
                    {isLoading ? (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-2 w-12" />
                            </div>
                        </div>
                    ) : session ? (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10">
                            {session.user?.image ? (
                                <Image src={session.user.image} alt={session.user.name || "User"} width={28} height={28} className="rounded-full" />
                            ) : (
                                <div className="w-8 h-8 bg-white/20 border border-white/20 rounded-full text-white flex items-center justify-center text-xs">
                                    {session.user?.name?.[0]}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{session.user?.name}</p>
                                <button
                                    onClick={() => signOut()}
                                    className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                                    aria-label="Sign Out"
                                >
                                    <LogOut size={10} /> Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsLoginOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 group text-left"
                            aria-label="Sign In"
                        >
                            <LogIn size={18} />
                            <span className="font-medium text-sm">Sign In</span>
                        </button>
                    )}
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink href="/settings" icon={<Settings size={18} />} label="Settings" active={pathname === "/settings"} />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 min-h-screen transition-all duration-300">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
    );
}

// Render layout only on client to avoid hydration mismatches during dev
export default dynamic(() => Promise.resolve(ClientLayout), { ssr: false });

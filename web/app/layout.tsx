import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { BookOpen, Library, Mic, Settings, User, MessageSquare } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather"
});

export const metadata: Metadata = {
  title: "ModernReader | Intelligent Indigenous Reading",
  description: "Next-generation reading system with Sweet flow and AI integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} bg-[#fdfbf7] text-[#1a1a1a] font-sans min-h-screen flex`}>
        {/* Sidebar Navigation */}
        <aside className="w-20 lg:w-64 border-r border-[#e5e0d8] flex flex-col bg-[#fdfbf7] fixed h-full z-50">
          <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-[#fdfbf7] font-serif font-bold text-xl">
              M
            </div>
            <span className="hidden lg:block font-serif font-bold text-lg tracking-tight">ModernReader</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavLink href="/" icon={<Library size={20} />} label="Library" />
            <NavLink href="/reader" icon={<BookOpen size={20} />} label="Current Read" active />
            <NavLink href="/podcasts" icon={<Mic size={20} />} label="Podcasts" />
            <NavLink href="/profile" icon={<User size={20} />} label="Profile" />
            <NavLink href="/support" icon={<MessageSquare size={20} />} label="Support" />
          </nav>

          <div className="p-4 border-t border-[#e5e0d8]">
            <NavLink href="/settings" icon={<Settings size={20} />} label="Settings" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-20 lg:ml-64 min-h-screen">
          {children}
        </main>
      </body>
    </html>
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

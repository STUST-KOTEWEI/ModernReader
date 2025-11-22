import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#fdfbf7]">
            <div className="text-center">
                <h1 className="font-serif font-bold text-6xl text-[#1a1a1a] mb-4">404</h1>
                <p className="text-xl text-[#666] mb-8">Page not found</p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-black transition-colors font-medium inline-block"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}

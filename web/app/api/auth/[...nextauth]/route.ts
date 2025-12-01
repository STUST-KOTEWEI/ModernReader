import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { rateLimit } from "@/lib/rate-limit";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
        }),
        CredentialsProvider({
            name: "Demo Account",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "demo" },
                password: { label: "Password", type: "password" },
                loginType: { label: "Login Type", type: "text" },
                captcha: { label: "CAPTCHA", type: "text" }
            },
            async authorize(credentials) {
                // Rate limiting check (5 attempts per minute per username)
                const identifier = credentials?.username || 'anonymous';
                const rateLimitResult = rateLimit(identifier, 5, 60000);
                if (!rateLimitResult.success) {
                    // Return null to indicate failed auth without throwing a 500
                    return null;
                }

                // CAPTCHA verification (simple math check)
                const expectedAnswer = credentials?.captcha;
                if (!expectedAnswer || expectedAnswer !== "correct") {
                    return null;
                }

                // Mock Google Login
                if (credentials?.loginType === "google") {
                    return {
                        id: "2",
                        name: "Kaleb Chen",
                        email: "kaleb.google@gmail.com",
                        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    };
                }

                // Mock authentication for demo
                if (credentials?.username === "demo" && credentials?.password === "demo") {
                    return { id: "1", name: "Kaleb (Demo)", email: "kaleb@modernreader.com", image: "https://api.dicebear.com/7.x/micah/svg?seed=Kaleb" };
                }

                return null;
            }
        })
    ],
    pages: {
        signIn: '/auth/signin', // We'll use a custom modal instead, but this is a fallback
    },
    callbacks: {
        async session({ session }) {
            return session;
        },
    },
});

export { handler as GET, handler as POST };

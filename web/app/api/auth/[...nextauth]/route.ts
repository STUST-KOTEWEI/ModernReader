import NextAuth, { type Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { rateLimit } from "@/lib/rate-limit";
import { localUserStore } from "@/lib/db/localUserStore";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
        }),
        CredentialsProvider({
            name: "Local Account",
            credentials: {
                username: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Rate limiting check
                const identifier = credentials?.username || 'anonymous';
                const rateLimitResult = rateLimit(identifier, 10, 60000); // Relaxed for local
                if (!rateLimitResult.success) return null;

                if (!credentials?.username || !credentials?.password) return null;

                // Validate against Local Store
                const user = localUserStore.validateCredentials(credentials.username, credentials.password);

                if (user) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image
                    };
                }

                return null;
            }
        })
    ],
    pages: {
        signIn: '/auth/signin', // We'll use a custom modal instead, but this is a fallback
    },
    callbacks: {
        async session({ session }: { session: Session }) {
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
    locales: ['en', 'zh'],
    defaultLocale: 'en'
});

const authMiddleware = withAuth({
    pages: {
        signIn: "/",
    },
});

export default function middleware(req: NextRequest) {
    const publicPathnameRegex = /^\/(?:(en|zh)\/)?(auth|branding|api|_next|favicon.ico|.*\\.).*/;

    if (publicPathnameRegex.test(req.nextUrl.pathname)) {
        return intlMiddleware(req);
    } else {
        return (authMiddleware as any)(req);
    }
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};

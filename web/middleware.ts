import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
    locales: ['en', 'zh'],
    defaultLocale: 'en'
});

const authMiddleware = withAuth(
    function onSuccess(req) {
        return intlMiddleware(req);
    },
    {
        pages: {
            signIn: "/",
        },
    }
);

export default function middleware(req: NextRequest) {
    const publicPathnameRegex = /^\/(?:(en|zh)\/)?(auth|branding|api|_next|favicon.ico|.*\\.|$)*/;

    if (publicPathnameRegex.test(req.nextUrl.pathname)) {
        return intlMiddleware(req);
    } else {
        return (authMiddleware as unknown as (req: NextRequest) => Promise<NextResponse>)(req);
    }
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};

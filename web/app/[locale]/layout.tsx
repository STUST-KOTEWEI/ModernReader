import type { Metadata } from "next";
import { Space_Grotesk, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import "../globals.css";
import ClientLayout from "@/components/ClientLayout";


const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "ModernReader | Intelligent Universal Reading",
    template: "%s | ModernReader"
  },
  description: "Next-generation reading system with Sweet flow, AI integration, and universal accessibility for all species.",
  keywords: ["reading", "AI", "universal", "accessibility", "learning", "podcast", "chat", "all-species"],
  authors: [{ name: "ModernReader Team" }],
  creator: "ModernReader Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://modernreader.app",
    title: "ModernReader | Intelligent Universal Reading",
    description: "Next-generation reading system with Sweet flow and AI integration for all species.",
    siteName: "ModernReader",
    images: [
      {
        url: "/branding/og-image.png",
        width: 1200,
        height: 630,
        alt: "ModernReader Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ModernReader | Intelligent Universal Reading",
    description: "Next-generation reading system with Sweet flow and AI integration for all species.",
    images: ["/branding/og-image.png"],
    creator: "@modernreader",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

import Providers from "@/components/Providers";

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!['en', 'zh'].includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${playfair.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ClientLayout>{children}</ClientLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

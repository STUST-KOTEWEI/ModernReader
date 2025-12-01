import SweetReader from "@/components/reader/SweetReader";

const SAMPLE_CONTENT = `Welcome to ModernReader!

This is a demo reading experience. To read real books:

1. Go to the Library (home page)
2. Click on any book
3. Start reading with AI-powered features

Features available:
- 🎙️ Podcast TTS (8 voice styles)
- 💬 AI Chat (10+ personas)
- 😊 Emotion Detection
- 🌍 Translation (1600+ languages)
- ✨ Story Generation
- 🎨 DALL-E Image Generation

Enjoy your reading journey!`;

export default function ReaderPage() {
    return (
        <SweetReader
            title="Welcome to ModernReader"
            author="ModernReader Team"
            content={SAMPLE_CONTENT}
        />
    );
}

/**
 * Neural Reading Service
 * Adaptive reading based on cognitive science and eye-tracking
 * Ported from modernreader_-4d-ai-analysis
 */

interface ReadingPattern {
    wordsPerMinute: number;
    comprehensionScore: number;
    focusAreas: { x: number; y: number; duration: number }[];
    revisitedSections: number[];
    skipPatterns: string[];
}

interface AdaptiveSettings {
    fontSize: number;
    lineHeight: number;
    contrast: number;
    highlightMode: 'none' | 'bionic' | 'guided' | 'speed';
    chunkSize: number;
    pauseInterval: number;
}

class NeuralReading {
    private readingPattern: ReadingPattern | null = null;
    private startTime: number = 0;
    private wordCount: number = 0;
    private focusMap: Map<string, number> = new Map();
    private adaptiveSettings: AdaptiveSettings = {
        fontSize: 16,
        lineHeight: 1.6,
        contrast: 1.0,
        highlightMode: 'bionic',
        chunkSize: 3,
        pauseInterval: 300,
    };

    startSession(text: string): void {
        this.startTime = Date.now();
        this.wordCount = text.split(/\s+/).length;
        this.readingPattern = {
            wordsPerMinute: 0,
            comprehensionScore: 0,
            focusAreas: [],
            revisitedSections: [],
            skipPatterns: [],
        };
    }

    /**
     * Apply bionic reading enhancement
     * Bolds the first few letters of each word to guide the eye.
     */
    /**
     * Apply bionic reading enhancement
     * Smarter Version: Skips stopwords, focuses on content words.
     */
    applyBionicReading(text: string): string {
        const STOPWORDS = new Set([
            'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'this', 'that', 'these', 'those', 'it', 'he', 'she', 'they', 'we', 'you', 'i'
        ]);

        const words = text.split(/(\s+)/); // Split but keep delimiters
        return words.map(word => {
            const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();

            // Skip whitespace, short words, or stopwords
            if (word.trim().length === 0) return word;
            if (word.startsWith('<')) return word; // Skip HTML tags roughly
            if (word.length <= 3) return word;
            if (STOPWORDS.has(cleanWord)) return word;

            // Smart Bolding Logic
            let boldRatio = 0.4;
            if (word.length > 8) boldRatio = 0.5; // Emphasize long complex words

            const boldLength = Math.ceil(word.length * boldRatio);
            const boldPart = word.substring(0, boldLength);
            const normalPart = word.substring(boldLength);

            return `<strong>${boldPart}</strong>${normalPart}`;
        }).join('');
    }

    /**
     * Predict reading difficulty (0-10)
     */
    predictDifficulty(text: string): number {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/);

        if (words.length === 0) return 0;

        const avgSentenceLength = words.length / (sentences.length || 1);
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const complexWords = words.filter(w => w.length > 12).length;
        const complexWordRatio = complexWords / words.length;

        let difficulty = 0;
        difficulty += Math.min(4, avgSentenceLength / 5);
        difficulty += Math.min(3, avgWordLength / 2);
        difficulty += Math.min(3, complexWordRatio * 10);

        return Math.round(Math.min(10, difficulty));
    }
}

export const neuralReading = new NeuralReading();
export default neuralReading;

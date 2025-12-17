import { pipeline, env } from '@xenova/transformers';

// Skip local model checks if running in a browser environment where FS is not available
env.allowLocalModels = false;
env.useBrowserCache = true;

class EdgeAIService {
    private sentimentPipeline: ((text: string | string[]) => Promise<{ label: string; score: number }[] | { label: string; score: number }[][]>) | null = null;
    private isReady: boolean = false;

    constructor() {
        this.init();
    }

    async init() {
        if (this.sentimentPipeline) return;

        try {
            console.log('Initializing Edge AI (Transformers.js)...');
            // Use a small, quantized model optimized for the web
            this.sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            this.isReady = true;
            console.log('Edge AI Ready!');
        } catch (error) {
            console.error('Failed to initialize Edge AI:', error);
        }
    }

    async analyzeSentiment(text: string): Promise<{ label: string; score: number } | null> {
        if (!this.isReady || !this.sentimentPipeline) {
            await this.init();
        }

        try {
            if (!this.sentimentPipeline) throw new Error("Pipeline not ready");
            const result = await this.sentimentPipeline(text) as { label: string; score: number }[];
            // Result is an array like [{ label: 'POSITIVE', score: 0.99 }]
            return result[0];
        } catch (error) {
            console.error('Edge AI Analysis Failed:', error);
            return null;
        }
    }

    // Future: Add more pipelines like 'feature-extraction' or 'text-generation'
}

export const edgeAI = new EdgeAIService();

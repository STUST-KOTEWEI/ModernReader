/**
 * Advanced AI Service
 * World-class AI capabilities for ModernReader
 */

import { GoogleGenAI } from '@google/genai';

interface AIAnalysisResult {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  complexity: number;
  readingTime: number;
  topics: string[];
  entities: { name: string; type: string; relevance: number }[];
  recommendations: string[];
  criticalThinking: string[];
  futureImplications: string[];
  interdisciplinaryConnections: string[];
}

interface KnowledgeGraph {
  nodes: { id: string; label: string; type: string; importance: number }[];
  edges: { from: string; to: string; relationship: string; strength: number }[];
}

class AdvancedAIService {
  private genAI: GoogleGenAI | null = null;
  private cache: Map<string, AIAnalysisResult> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Comprehensive text analysis with world-class AI
   */
  async analyzeText(text: string): Promise<AIAnalysisResult> {
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.genAI) {
      throw new Error('AI model not initialized');
    }

    const prompt = `Analyze the following text with deep, critical thinking. Provide:
1. A comprehensive summary
2. Key points (5-7 main ideas)
3. Sentiment analysis
4. Complexity score (1-10)
5. Reading time estimate
6. Main topics
7. Named entities with relevance scores
8. Actionable recommendations
9. Critical thinking questions
10. Future implications and trends
11. Interdisciplinary connections

Text to analyze:
"""
${text.substring(0, 10000)}
"""

Respond in JSON format.`;

    try {
      const result = await this.genAI!.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
      const analysisText = result.text;
      
      const analysis = this.parseAIResponse(analysisText, text);
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackAnalysis(text);
    }
  }

  /**
   * Generate knowledge graph from text
   */
  async generateKnowledgeGraph(text: string): Promise<KnowledgeGraph> {
    if (!this.genAI) {
      throw new Error('AI model not initialized');
    }

    const prompt = `Extract a knowledge graph from this text. Identify:
- Key concepts (nodes)
- Relationships between concepts (edges)
- Importance scores
- Relationship types (e.g., "causes", "relates to", "part of", "contradicts")

Text:
"""
${text.substring(0, 5000)}
"""

Return as JSON: { "nodes": [...], "edges": [...] }`;

    try {
      const result = await this.genAI!.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
      const graphText = result.text;
      
      return this.parseKnowledgeGraph(graphText);
    } catch (error) {
      console.error('Knowledge graph generation failed:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Multi-perspective analysis
   */
  async analyzeMultiplePerspectives(text: string, perspectives: string[]): Promise<Map<string, string>> {
    const analyses = new Map<string, string>();

    for (const perspective of perspectives) {
      const prompt = `Analyze this text from the perspective of ${perspective}:

${text.substring(0, 3000)}

Provide insights, critiques, and unique viewpoints.`;

      try {
        const result = await this.genAI!.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        analyses.set(perspective, result.text);
      } catch (error) {
        console.error(`Failed to analyze from ${perspective} perspective:`, error);
      }
    }

    return analyses;
  }

  /**
   * Predictive reading - what comes next?
   */
  async predictNextContent(text: string): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('AI model not initialized');
    }

    const prompt = `Based on this text, predict 5 possible directions or topics that might come next:

${text.substring(Math.max(0, text.length - 2000))}

Return as JSON array of predictions.`;

    try {
      const result = await this.genAI!.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
      const predictions = this.parsePredictions(result.text);
      return predictions;
    } catch (error) {
      console.error('Prediction failed:', error);
      return [];
    }
  }

  /**
   * Cross-reference with global knowledge
   */
  async crossReferenceKnowledge(topic: string): Promise<any> {
    if (!this.genAI) {
      throw new Error('AI model not initialized');
    }

    const prompt = `Provide comprehensive cross-references for: "${topic}"

Include:
- Related academic fields
- Historical context
- Current research
- Future trends
- Key researchers/thought leaders
- Practical applications
- Ethical considerations

Return as structured JSON.`;

    try {
      const result = await this.genAI!.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
      return this.parseCrossReferences(result.text);
    } catch (error) {
      console.error('Cross-reference failed:', error);
      return {};
    }
  }

  /**
   * Generate creative connections
   */
  async generateCreativeConnections(concepts: string[]): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('AI model not initialized');
    }

    const prompt = `Find unexpected, creative connections between these concepts:
${concepts.join(', ')}

Generate 10 innovative connections that bridge different domains.`;

    try {
      const result = await this.genAI!.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
      return this.parseConnections(result.text);
    } catch (error) {
      console.error('Creative connections failed:', error);
      return [];
    }
  }

  private parseAIResponse(text: string, originalText: string): AIAnalysisResult {
    try {
      // Try to parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || parsed.key_points || [],
          sentiment: parsed.sentiment || 'neutral',
          complexity: parsed.complexity || 5,
          readingTime: parsed.readingTime || Math.ceil(originalText.split(' ').length / 200),
          topics: parsed.topics || [],
          entities: parsed.entities || [],
          recommendations: parsed.recommendations || [],
          criticalThinking: parsed.criticalThinking || parsed.critical_thinking || [],
          futureImplications: parsed.futureImplications || parsed.future_implications || [],
          interdisciplinaryConnections: parsed.interdisciplinaryConnections || parsed.interdisciplinary_connections || [],
        };
      }
    } catch (e) {
      // Fallback to text parsing
    }

    return this.getFallbackAnalysis(originalText);
  }

  private getFallbackAnalysis(text: string): AIAnalysisResult {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      summary: sentences.slice(0, 3).join('. ') + '.',
      keyPoints: sentences.slice(0, 5).map(s => s.trim()),
      sentiment: 'neutral',
      complexity: Math.min(10, Math.floor(words / 100)),
      readingTime: Math.ceil(words / 200),
      topics: [],
      entities: [],
      recommendations: ['Read carefully', 'Take notes', 'Reflect on key ideas'],
      criticalThinking: ['What is the main argument?', 'What evidence supports this?'],
      futureImplications: ['Consider long-term impacts'],
      interdisciplinaryConnections: [],
    };
  }

  private parseKnowledgeGraph(text: string): KnowledgeGraph {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse knowledge graph:', e);
    }
    return { nodes: [], edges: [] };
  }

  private parsePredictions(text: string): string[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }
    return [];
  }

  private parseCrossReferences(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback
    }
    return {};
  }

  private parseConnections(text: string): string[] {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.map(l => l.replace(/^\d+\.\s*/, '').trim());
  }

  private getCacheKey(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const advancedAIService = new AdvancedAIService();
export default advancedAIService;

/**
 * Neural Reading Service
 * Adaptive reading based on cognitive science and eye-tracking
 */

interface ReadingPattern {
  wordsPerMinute: number;
  comprehensionScore: number;
  focusAreas: { x: number; y: number; duration: number }[];
  revisitedSections: number[];
  skipPatterns: string[];
}

interface CognitiveLoad {
  level: 'low' | 'medium' | 'high' | 'overload';
  factors: string[];
  recommendations: string[];
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

  /**
   * Start tracking reading session
   */
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

    // Initialize eye-tracking if available
    this.initializeEyeTracking();
  }

  /**
   * Apply bionic reading enhancement
   */
  applyBionicReading(text: string): string {
    const words = text.split(/\s+/);
    return words.map(word => {
      if (word.length <= 2) return word;
      
      const boldLength = Math.ceil(word.length * 0.4);
      const boldPart = word.substring(0, boldLength);
      const normalPart = word.substring(boldLength);
      
      return `<strong>${boldPart}</strong>${normalPart}`;
    }).join(' ');
  }

  /**
   * Apply speed reading techniques
   */
  applySpeedReading(text: string, wpm: number = 400): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    const wordsPerChunk = Math.ceil(wpm / 60 / 10); // Chunks per second

    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
    }

    return chunks;
  }

  /**
   * Detect optimal reading parameters
   */
  detectOptimalSettings(userProfile: any): AdaptiveSettings {
    const age = userProfile.age || 30;
    const experience = userProfile.readingExperience || 'intermediate';
    const preferences = userProfile.preferences || {};

    // Age-based adjustments
    let fontSize = 16;
    if (age > 50) fontSize = 18;
    if (age > 65) fontSize = 20;

    // Experience-based adjustments
    let chunkSize = 3;
    let pauseInterval = 300;
    
    if (experience === 'beginner') {
      chunkSize = 2;
      pauseInterval = 400;
    } else if (experience === 'advanced') {
      chunkSize = 4;
      pauseInterval = 200;
    }

    return {
      fontSize,
      lineHeight: preferences.lineHeight || 1.6,
      contrast: preferences.highContrast ? 1.5 : 1.0,
      highlightMode: preferences.highlightMode || 'bionic',
      chunkSize,
      pauseInterval,
    };
  }

  /**
   * Analyze cognitive load
   */
  analyzeCognitiveLoad(readingSpeed: number, complexity: number, duration: number): CognitiveLoad {
    const factors: string[] = [];
    let level: 'low' | 'medium' | 'high' | 'overload' = 'medium';
    const recommendations: string[] = [];

    // Analyze reading speed
    if (readingSpeed < 150) {
      factors.push('Slow reading pace');
      recommendations.push('Try speed reading techniques');
    }

    // Analyze complexity
    if (complexity > 8) {
      factors.push('High text complexity');
      recommendations.push('Break into smaller sections');
      recommendations.push('Use AI summaries for overview');
      level = 'high';
    }

    // Analyze duration
    if (duration > 30 * 60 * 1000) { // 30 minutes
      factors.push('Extended reading session');
      recommendations.push('Take a break');
      recommendations.push('Practice eye exercises');
      if (level === 'high') level = 'overload';
    }

    // Calculate overall level
    if (factors.length === 0) {
      level = 'low';
    } else if (factors.length <= 2 && level !== 'high') {
      level = 'medium';
    }

    return { level, factors, recommendations };
  }

  /**
   * Generate reading heatmap
   */
  generateHeatmap(): Map<string, number> {
    return this.focusMap;
  }

  /**
   * Predict reading difficulty
   */
  predictDifficulty(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/);
    
    // Average sentence length
    const avgSentenceLength = words.length / sentences.length;
    
    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Complex word ratio (words > 12 letters)
    const complexWords = words.filter(w => w.length > 12).length;
    const complexWordRatio = complexWords / words.length;

    // Difficulty score (1-10)
    let difficulty = 0;
    difficulty += Math.min(4, avgSentenceLength / 5);
    difficulty += Math.min(3, avgWordLength / 2);
    difficulty += Math.min(3, complexWordRatio * 10);

    return Math.round(Math.min(10, difficulty));
  }

  /**
   * Personalized reading recommendations
   */
  getPersonalizedRecommendations(readingHistory: any[]): string[] {
    const recommendations: string[] = [];

    if (readingHistory.length === 0) {
      return [
        'Start with shorter articles to build reading stamina',
        'Enable bionic reading for enhanced focus',
        'Set reading goals to track progress',
      ];
    }

    const avgSpeed = readingHistory.reduce((sum, h) => sum + h.wpm, 0) / readingHistory.length;

    if (avgSpeed < 200) {
      recommendations.push('Practice speed reading exercises');
      recommendations.push('Reduce subvocalization');
    }

    if (avgSpeed > 400) {
      recommendations.push('Focus on comprehension over speed');
      recommendations.push('Take notes while reading');
    }

    recommendations.push('Try collaborative reading for diverse perspectives');
    recommendations.push('Use visualization tools to understand complex concepts');

    return recommendations;
  }

  /**
   * Eye-tracking integration (placeholder)
   */
  private initializeEyeTracking(): void {
    // Would integrate with WebGazer.js or similar
    console.log('Eye-tracking initialized');
  }

  /**
   * Track focus area
   */
  trackFocus(elementId: string, duration: number): void {
    const current = this.focusMap.get(elementId) || 0;
    this.focusMap.set(elementId, current + duration);
  }

  /**
   * Calculate comprehension score
   */
  async calculateComprehension(questions: any[], answers: any[]): Promise<number> {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        correct++;
      }
    });

    return (correct / questions.length) * 100;
  }

  /**
   * Generate reading report
   */
  generateReport(): any {
    if (!this.readingPattern) {
      return null;
    }

    const duration = Date.now() - this.startTime;
    const wpm = Math.round((this.wordCount / duration) * 60000);

    return {
      duration: Math.round(duration / 1000),
      wordsRead: this.wordCount,
      wordsPerMinute: wpm,
      comprehensionScore: this.readingPattern.comprehensionScore,
      cognitiveLoad: this.analyzeCognitiveLoad(wpm, 5, duration),
      recommendations: this.getPersonalizedRecommendations([{ wpm }]),
    };
  }

  /**
   * Apply focus mode
   */
  applyFocusMode(text: string, focusType: 'sentence' | 'paragraph' | 'gradient'): string {
    if (focusType === 'gradient') {
      // Gradually fade text except current reading area
      const lines = text.split('\n');
      return lines.map((line, index) => {
        const opacity = Math.max(0.3, 1 - Math.abs(index - Math.floor(lines.length / 2)) * 0.1);
        return `<span style="opacity: ${opacity}">${line}</span>`;
      }).join('\n');
    }

    return text;
  }

  getAdaptiveSettings(): AdaptiveSettings {
    return this.adaptiveSettings;
  }

  updateAdaptiveSettings(settings: Partial<AdaptiveSettings>): void {
    this.adaptiveSettings = { ...this.adaptiveSettings, ...settings };
  }
}

export const neuralReading = new NeuralReading();
export default neuralReading;
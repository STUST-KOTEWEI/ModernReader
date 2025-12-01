/**
 * Collaborative Intelligence Service
 * Enables multi-user collaborative reading and knowledge sharing
 */

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface Annotation {
  id: string;
  userId: string;
  text: string;
  position: { start: number; end: number };
  timestamp: number;
  type: 'highlight' | 'comment' | 'question' | 'insight';
  replies: Reply[];
  votes: number;
}

interface Reply {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

interface CollaborativeSession {
  id: string;
  documentId: string;
  participants: User[];
  annotations: Annotation[];
  sharedInsights: string[];
  startTime: number;
}

class CollaborativeIntelligence {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private currentSession: CollaborativeSession | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * Start a collaborative reading session
   */
  startSession(documentId: string, creator: User): CollaborativeSession {
    const session: CollaborativeSession = {
      id: this.generateId(),
      documentId,
      participants: [creator],
      annotations: [],
      sharedInsights: [],
      startTime: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;
    this.emit('session-started', session);

    return session;
  }

  /**
   * Join an existing session
   */
  joinSession(sessionId: string, user: User): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.participants.find(p => p.id === user.id)) {
      session.participants.push(user);
      this.emit('user-joined', { session, user });
    }

    this.currentSession = session;
  }

  /**
   * Add annotation to current session
   */
  addAnnotation(annotation: Omit<Annotation, 'id' | 'timestamp' | 'replies' | 'votes'>): Annotation {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const fullAnnotation: Annotation = {
      ...annotation,
      id: this.generateId(),
      timestamp: Date.now(),
      replies: [],
      votes: 0,
    };

    this.currentSession.annotations.push(fullAnnotation);
    this.emit('annotation-added', fullAnnotation);

    return fullAnnotation;
  }

  /**
   * Reply to an annotation
   */
  addReply(annotationId: string, userId: string, text: string): Reply {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const annotation = this.currentSession.annotations.find(a => a.id === annotationId);
    if (!annotation) {
      throw new Error('Annotation not found');
    }

    const reply: Reply = {
      id: this.generateId(),
      userId,
      text,
      timestamp: Date.now(),
    };

    annotation.replies.push(reply);
    this.emit('reply-added', { annotation, reply });

    return reply;
  }

  /**
   * Vote on an annotation
   */
  voteAnnotation(annotationId: string, direction: 1 | -1): void {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const annotation = this.currentSession.annotations.find(a => a.id === annotationId);
    if (annotation) {
      annotation.votes += direction;
      this.emit('annotation-voted', annotation);
    }
  }

  /**
   * Get collective insights from all annotations
   */
  getCollectiveInsights(): string[] {
    if (!this.currentSession) {
      return [];
    }

    // Aggregate insights from highly-voted annotations
    const topAnnotations = this.currentSession.annotations
      .filter(a => a.votes >= 3 || a.type === 'insight')
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);

    return topAnnotations.map(a => a.text);
  }

  /**
   * Generate collaborative summary
   */
  async generateCollaborativeSummary(): Promise<string> {
    if (!this.currentSession) {
      return '';
    }

    const highlights = this.currentSession.annotations
      .filter(a => a.type === 'highlight')
      .map(a => a.text)
      .join('\n');

    const questions = this.currentSession.annotations
      .filter(a => a.type === 'question')
      .map(a => a.text)
      .join('\n');

    const insights = this.currentSession.annotations
      .filter(a => a.type === 'insight')
      .map(a => a.text)
      .join('\n');

    return `
Collaborative Reading Summary
=============================

Key Highlights (${this.currentSession.participants.length} participants):
${highlights}

Questions Raised:
${questions}

Collective Insights:
${insights}
    `.trim();
  }

  /**
   * Find reading partners with similar interests
   */
  async findReadingPartners(interests: string[]): Promise<User[]> {
    // Mock implementation - would connect to real user database
    return [
      {
        id: 'user1',
        name: 'Alex Chen',
        avatar: '👨‍🎓',
        color: '#4488ff',
      },
      {
        id: 'user2',
        name: 'Sarah Williams',
        avatar: '👩‍💼',
        color: '#ff4488',
      },
      {
        id: 'user3',
        name: 'Dr. James Rodriguez',
        avatar: '👨‍🔬',
        color: '#44ff88',
      },
    ];
  }

  /**
   * Export collaborative session data
   */
  exportSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      id: session.id,
      documentId: session.documentId,
      participants: session.participants.length,
      annotations: session.annotations.length,
      duration: Date.now() - session.startTime,
      topInsights: this.getTopInsights(session),
      summary: this.generateQuickSummary(session),
    };
  }

  /**
   * Real-time sync (placeholder for WebSocket/WebRTC integration)
   */
  syncWithPeers(): void {
    // Would implement real-time synchronization
    console.log('Syncing with collaborative peers...');
  }

  /**
   * Event system
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  private getTopInsights(session: CollaborativeSession): string[] {
    return session.annotations
      .filter(a => a.type === 'insight')
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5)
      .map(a => a.text);
  }

  private generateQuickSummary(session: CollaborativeSession): string {
    return `${session.participants.length} readers contributed ${session.annotations.length} annotations over ${Math.round((Date.now() - session.startTime) / 60000)} minutes.`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session stats
   */
  getSessionStats(): any {
    if (!this.currentSession) {
      return null;
    }

    return {
      participants: this.currentSession.participants.length,
      annotations: this.currentSession.annotations.length,
      highlights: this.currentSession.annotations.filter(a => a.type === 'highlight').length,
      comments: this.currentSession.annotations.filter(a => a.type === 'comment').length,
      questions: this.currentSession.annotations.filter(a => a.type === 'question').length,
      insights: this.currentSession.annotations.filter(a => a.type === 'insight').length,
      duration: Date.now() - this.currentSession.startTime,
    };
  }
}

export const collaborativeIntelligence = new CollaborativeIntelligence();
export default collaborativeIntelligence;
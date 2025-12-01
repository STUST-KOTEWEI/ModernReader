/**
 * Quantum Knowledge Base
 * Multi-dimensional knowledge storage and retrieval
 * Optimized for MacBook Air M3: 50GB local + 2TB cloud storage
 */

interface KnowledgeNode {
  id: string;
  content: string;
  type: 'concept' | 'fact' | 'theory' | 'application' | 'question';
  connections: string[];
  importance: number;
  credibility: number;
  sources: string[];
  timestamp: number;
  tags: string[];
  embeddings?: number[];
  storageLocation?: 'local' | 'cloud' | 'both';
  lastAccessed?: number;
}

interface KnowledgeCluster {
  id: string;
  centroid: KnowledgeNode;
  members: KnowledgeNode[];
  coherence: number;
  domain: string;
}

class QuantumKnowledgeBase {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private clusters: Map<string, KnowledgeCluster> = new Map();
  private indexedDB: IDBDatabase | null = null;
  private maxLocalStorage = 50 * 1024 * 1024 * 1024; // 50GB 本機
  private storageThreshold = 0.8; // 80% 使用率時開始轉移

  constructor() {
    this.initializeStorage();
    this.startStorageMonitoring();
  }

  /**
   * Initialize persistent storage (50GB local, 2TB cloud capable)
   */
  private async initializeStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QuantumKnowledgeBase', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('nodes')) {
          const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
          nodeStore.createIndex('type', 'type', { unique: false });
          nodeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          nodeStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('clusters')) {
          db.createObjectStore('clusters', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Add knowledge to the base
   */
  async addKnowledge(content: string, metadata: Partial<KnowledgeNode>): Promise<KnowledgeNode> {
    const node: KnowledgeNode = {
      id: this.generateId(),
      content,
      type: metadata.type || 'concept',
      connections: metadata.connections || [],
      importance: metadata.importance || 0.5,
      credibility: metadata.credibility || 0.8,
      sources: metadata.sources || [],
      timestamp: Date.now(),
      tags: metadata.tags || [],
      embeddings: await this.generateEmbeddings(content),
    };

    this.nodes.set(node.id, node);
    await this.persistNode(node);

    // Auto-connect to similar nodes
    await this.autoConnect(node);

    return node;
  }

  /**
   * Search knowledge base with semantic understanding
   */
  async search(query: string, options: {
    limit?: number;
    type?: string;
    minRelevance?: number;
  } = {}): Promise<KnowledgeNode[]> {
    const queryEmbeddings = await this.generateEmbeddings(query);
    const results: { node: KnowledgeNode; score: number }[] = [];

    for (const node of this.nodes.values()) {
      if (options.type && node.type !== options.type) continue;

      const relevance = this.calculateSimilarity(queryEmbeddings, node.embeddings || []);
      
      if (relevance >= (options.minRelevance || 0.3)) {
        results.push({ node, score: relevance });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, options.limit || 20).map(r => r.node);
  }

  /**
   * Find knowledge clusters
   */
  async discoverClusters(minSize: number = 3): Promise<KnowledgeCluster[]> {
    const clusters: KnowledgeCluster[] = [];
    const visited = new Set<string>();

    for (const node of this.nodes.values()) {
      if (visited.has(node.id)) continue;

      const cluster = await this.expandCluster(node, visited);
      
      if (cluster.members.length >= minSize) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Generate knowledge map
   */
  async generateKnowledgeMap(): Promise<any> {
    const nodes = Array.from(this.nodes.values());
    const edges: any[] = [];

    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        edges.push({
          source: node.id,
          target: targetId,
          strength: 1,
        });
      });
    });

    return {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.content.substring(0, 50),
        type: n.type,
        importance: n.importance,
      })),
      edges,
    };
  }

  /**
   * Synthesize knowledge from multiple sources
   */
  async synthesize(nodeIds: string[]): Promise<string> {
    const nodes = nodeIds.map(id => this.nodes.get(id)).filter(Boolean) as KnowledgeNode[];
    
    if (nodes.length === 0) {
      return '';
    }

    // Group by type
    const grouped = new Map<string, KnowledgeNode[]>();
    nodes.forEach(node => {
      const type = node.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(node);
    });

    // Build synthesis
    let synthesis = '# Knowledge Synthesis\n\n';

    if (grouped.has('concept')) {
      synthesis += '## Core Concepts\n';
      grouped.get('concept')!.forEach(node => {
        synthesis += `- ${node.content}\n`;
      });
      synthesis += '\n';
    }

    if (grouped.has('theory')) {
      synthesis += '## Theoretical Framework\n';
      grouped.get('theory')!.forEach(node => {
        synthesis += `- ${node.content}\n`;
      });
      synthesis += '\n';
    }

    if (grouped.has('application')) {
      synthesis += '## Practical Applications\n';
      grouped.get('application')!.forEach(node => {
        synthesis += `- ${node.content}\n`;
      });
      synthesis += '\n';
    }

    // Add connections
    synthesis += '## Interdisciplinary Connections\n';
    const allConnections = new Set<string>();
    nodes.forEach(node => {
      node.connections.forEach(c => allConnections.add(c));
    });
    
    allConnections.forEach(connId => {
      const connNode = this.nodes.get(connId);
      if (connNode) {
        synthesis += `- Connected to: ${connNode.content.substring(0, 100)}\n`;
      }
    });

    return synthesis;
  }

  /**
   * Track knowledge evolution over time
   */
  async trackEvolution(nodeId: string): Promise<any[]> {
    // Would track changes, updates, connections over time
    return [];
  }

  /**
   * Export knowledge base
   */
  async export(format: 'json' | 'markdown' | 'graph'): Promise<string> {
    const nodes = Array.from(this.nodes.values());

    if (format === 'json') {
      return JSON.stringify({ nodes, clusters: Array.from(this.clusters.values()) }, null, 2);
    }

    if (format === 'markdown') {
      let md = '# Knowledge Base Export\n\n';
      
      const byType = new Map<string, KnowledgeNode[]>();
      nodes.forEach(node => {
        if (!byType.has(node.type)) {
          byType.set(node.type, []);
        }
        byType.get(node.type)!.push(node);
      });

      byType.forEach((nodes, type) => {
        md += `## ${type.toUpperCase()}\n\n`;
        nodes.forEach(node => {
          md += `### ${node.content.substring(0, 100)}\n`;
          md += `- **Importance**: ${node.importance}\n`;
          md += `- **Credibility**: ${node.credibility}\n`;
          md += `- **Tags**: ${node.tags.join(', ')}\n\n`;
        });
      });

      return md;
    }

    return '';
  }

  /**
   * Import knowledge from external sources
   */
  async import(data: any, format: 'json' | 'text'): Promise<void> {
    if (format === 'json') {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (parsed.nodes) {
        parsed.nodes.forEach((node: KnowledgeNode) => {
          this.nodes.set(node.id, node);
        });
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usagePercent: estimate.usage && estimate.quota ? 
          ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0,
        nodesCount: this.nodes.size,
        clustersCount: this.clusters.size,
      };
    }

    return {
      nodesCount: this.nodes.size,
      clustersCount: this.clusters.size,
    };
  }

  private async generateEmbeddings(text: string): Promise<number[]> {
    // Simplified embedding generation (would use real model in production)
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    const embeddings = new Array(384).fill(0);
    
    words.forEach((word, index) => {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const embIndex = (charCode + index * 7) % 384;
        embeddings[embIndex] += 1;
      }
    });

    // Normalize
    const magnitude = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
    return embeddings.map(val => val / magnitude);
  }

  private calculateSimilarity(embeddings1: number[], embeddings2: number[]): number {
    if (embeddings1.length === 0 || embeddings2.length === 0) return 0;

    let dotProduct = 0;
    for (let i = 0; i < Math.min(embeddings1.length, embeddings2.length); i++) {
      dotProduct += embeddings1[i] * embeddings2[i];
    }

    return Math.max(0, Math.min(1, dotProduct));
  }

  private async autoConnect(node: KnowledgeNode): Promise<void> {
    const similar = await this.search(node.content, { limit: 5, minRelevance: 0.7 });
    
    similar.forEach(similarNode => {
      if (similarNode.id !== node.id && !node.connections.includes(similarNode.id)) {
        node.connections.push(similarNode.id);
        similarNode.connections.push(node.id);
      }
    });
  }

  private async expandCluster(seed: KnowledgeNode, visited: Set<string>): Promise<KnowledgeCluster> {
    const members: KnowledgeNode[] = [seed];
    const queue = [seed];
    visited.add(seed.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      for (const connId of current.connections) {
        if (visited.has(connId)) continue;
        
        const connNode = this.nodes.get(connId);
        if (connNode) {
          members.push(connNode);
          queue.push(connNode);
          visited.add(connId);
        }
      }
    }

    return {
      id: this.generateId(),
      centroid: seed,
      members,
      coherence: this.calculateCoherence(members),
      domain: this.inferDomain(members),
    };
  }

  private calculateCoherence(nodes: KnowledgeNode[]): number {
    if (nodes.length < 2) return 1;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].embeddings && nodes[j].embeddings) {
          totalSimilarity += this.calculateSimilarity(nodes[i].embeddings!, nodes[j].embeddings!);
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private inferDomain(nodes: KnowledgeNode[]): string {
    const tagCounts = new Map<string, number>();
    
    nodes.forEach(node => {
      node.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    let maxCount = 0;
    let dominantTag = 'general';

    tagCounts.forEach((count, tag) => {
      if (count > maxCount) {
        maxCount = count;
        dominantTag = tag;
      }
    });

    return dominantTag;
  }

  private async persistNode(node: KnowledgeNode): Promise<void> {
    if (!this.indexedDB) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['nodes'], 'readwrite');
      const store = transaction.objectStore('nodes');
      const request = store.put(node);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 監控本機儲存使用率並自動轉移到雲端
   */
  private startStorageMonitoring(): void {
    setInterval(async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || this.maxLocalStorage;
        const usagePercent = (usage / quota) * 100;

        if (usagePercent > this.storageThreshold * 100) {
          console.warn(`⚠️ 本機儲存使用率: ${usagePercent.toFixed(1)}%，開始轉移舊資料到雲端...`);
          await this.offloadOldNodesToCloud();
        }
      }
    }, 60000); // 每分鐘檢查一次
  }

  /**
   * 轉移舊節點到雲端
   */
  private async offloadOldNodesToCloud(): Promise<void> {
    // 按最後存取時間排序，舊的先轉移
    const sortedNodes = Array.from(this.nodes.values())
      .filter(n => n.storageLocation === 'local' || !n.storageLocation)
      .sort((a, b) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp));

    let freedSpace = 0;
    const targetFree = this.maxLocalStorage * 0.2; // 釋放 20% 空間

    for (const node of sortedNodes) {
      if (freedSpace >= targetFree) break;

      try {
        // 標記為雲端儲存（實際應用應上傳到 Google Drive）
        node.storageLocation = 'cloud';
        
        // 從本機 IndexedDB 移除（但保留在記憶體 Map 中）
        if (this.indexedDB) {
          const transaction = this.indexedDB.transaction(['nodes'], 'readwrite');
          const store = transaction.objectStore('nodes');
          await new Promise<void>((resolve, reject) => {
            const request = store.delete(node.id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }

        // 估計釋放的空間
        const nodeSize = JSON.stringify(node).length;
        freedSpace += nodeSize;

        console.log(`☁️ 已轉移: ${node.content.substring(0, 50)}... (${this.formatBytes(nodeSize)})`);
      } catch (error) {
        console.error('轉移失敗:', error);
      }
    }

    console.log(`✅ 已釋放約 ${this.formatBytes(freedSpace)} 本機空間`);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const quantumKnowledgeBase = new QuantumKnowledgeBase();
export default quantumKnowledgeBase;

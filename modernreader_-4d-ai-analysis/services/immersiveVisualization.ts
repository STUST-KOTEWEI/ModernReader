/**
 * Immersive Visualization Service
 * Creates stunning 3D/4D visualizations of text and concepts
 */

import * as THREE from 'three';

interface VisualizationConfig {
  type: 'network' | 'timeline' | 'mindmap' | 'galaxy' | 'flow' | 'particles';
  theme: 'dark' | 'light' | 'neon' | 'nature' | 'cosmic';
  animated: boolean;
  interactive: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

interface VisualizationNode {
  id: string;
  label: string;
  position: THREE.Vector3;
  size: number;
  color: string;
  data: any;
}

interface VisualizationLink {
  source: string;
  target: string;
  strength: number;
  type: string;
}

class ImmersiveVisualization {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number | null = null;
  private nodes: Map<string, THREE.Mesh> = new Map();
  private links: THREE.Line[] = [];

  /**
   * Initialize 3D visualization environment
   */
  initialize(container: HTMLElement, config: VisualizationConfig): void {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.theme === 'dark' ? 0x0a0a0a : 0xffffff);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: config.quality !== 'low',
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.getPixelRatio(config.quality));
    container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting(config.theme);

    // Start animation loop
    if (config.animated) {
      this.animate();
    }

    // Handle resize
    window.addEventListener('resize', () => this.handleResize(container));
  }

  /**
   * Create knowledge network visualization
   */
  createKnowledgeNetwork(
    nodes: VisualizationNode[],
    links: VisualizationLink[],
    config: VisualizationConfig
  ): void {
    if (!this.scene) return;

    // Clear previous visualization
    this.clear();

    // Create nodes
    nodes.forEach(node => {
      const geometry = new THREE.SphereGeometry(node.size, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.2,
        shininess: 100,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(node.position);
      sphere.userData = node.data;
      
      this.scene!.add(sphere);
      this.nodes.set(node.id, sphere);

      // Add label
      this.addTextLabel(node.label, node.position, config);
    });

    // Create links
    links.forEach(link => {
      const sourceNode = this.nodes.get(link.source);
      const targetNode = this.nodes.get(link.target);
      
      if (sourceNode && targetNode) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          sourceNode.position,
          targetNode.position,
        ]);
        const material = new THREE.LineBasicMaterial({
          color: 0x888888,
          opacity: link.strength,
          transparent: true,
        });
        const line = new THREE.Line(geometry, material);
        this.scene!.add(line);
        this.links.push(line);
      }
    });

    // Add particle effects
    if (config.type === 'particles') {
      this.addParticleSystem();
    }
  }

  /**
   * Create timeline visualization
   */
  createTimeline(events: any[], config: VisualizationConfig): void {
    if (!this.scene) return;

    this.clear();

    const spacing = 10;
    events.forEach((event, index) => {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({ color: event.color || 0x4488ff });
      const cube = new THREE.Mesh(geometry, material);
      
      cube.position.x = (index - events.length / 2) * spacing;
      cube.position.y = 0;
      cube.position.z = 0;
      cube.userData = event;
      
      this.scene!.add(cube);
      this.addTextLabel(event.label, cube.position, config);
    });
  }

  /**
   * Create concept galaxy visualization
   */
  createConceptGalaxy(concepts: any[], config: VisualizationConfig): void {
    if (!this.scene) return;

    this.clear();

    const galaxyGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    concepts.forEach((concept, index) => {
      // Create spiral galaxy pattern
      const angle = (index / concepts.length) * Math.PI * 4;
      const radius = 5 + (index / concepts.length) * 40;
      const height = Math.sin(angle * 2) * 5;

      const x = Math.cos(angle) * radius;
      const y = height;
      const z = Math.sin(angle) * radius;

      positions.push(x, y, z);

      const color = new THREE.Color();
      color.setHSL((index / concepts.length), 1.0, 0.5);
      colors.push(color.r, color.g, color.b);

      // Add concept sphere
      const geometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);
      sphere.userData = concept;
      this.scene!.add(sphere);
    });

    // Add particle trail
    galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(galaxyGeometry, particleMaterial);
    this.scene!.add(particles);
  }

  /**
   * Create mind map visualization
   */
  createMindMap(rootConcept: any, children: any[], config: VisualizationConfig): void {
    if (!this.scene) return;

    this.clear();

    // Central concept
    const rootGeometry = new THREE.SphereGeometry(3, 32, 32);
    const rootMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff4444,
      emissive: 0xff2222,
      emissiveIntensity: 0.5,
    });
    const rootSphere = new THREE.Mesh(rootGeometry, rootMaterial);
    rootSphere.position.set(0, 0, 0);
    this.scene!.add(rootSphere);
    this.addTextLabel(rootConcept.label, new THREE.Vector3(0, 0, 0), config);

    // Child concepts in circular arrangement
    children.forEach((child, index) => {
      const angle = (index / children.length) * Math.PI * 2;
      const radius = 15;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 10;

      const geometry = new THREE.SphereGeometry(1.5, 24, 24);
      const material = new THREE.MeshPhongMaterial({
        color: child.color || 0x4488ff,
        emissive: child.color || 0x2244aa,
        emissiveIntensity: 0.3,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);
      sphere.userData = child;
      this.scene!.add(sphere);

      // Connect to root
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.scene!.add(line);

      this.addTextLabel(child.label, new THREE.Vector3(x, y, z), config);
    });
  }

  private setupLighting(theme: string): void {
    if (!this.scene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional lights
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(10, 10, 10);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.4);
    light2.position.set(-10, -10, -10);
    this.scene.add(light2);

    // Point lights for dramatic effect
    if (theme === 'neon' || theme === 'cosmic') {
      const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
      pointLight1.position.set(20, 20, 20);
      this.scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xff00ff, 1, 100);
      pointLight2.position.set(-20, -20, 20);
      this.scene.add(pointLight2);
    }
  }

  private addParticleSystem(): void {
    if (!this.scene) return;

    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      const color = new THREE.Color();
      color.setHSL(Math.random(), 1.0, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
  }

  private addTextLabel(text: string, position: THREE.Vector3, config: VisualizationConfig): void {
    // Text labels would be implemented using CSS2DRenderer or similar
    // Placeholder for now
  }

  private animate = (): void => {
    if (!this.scene || !this.camera || !this.renderer) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    // Rotate scene slowly
    this.scene.rotation.y += 0.001;

    // Animate nodes
    this.nodes.forEach(node => {
      node.rotation.x += 0.01;
      node.rotation.y += 0.01;
    });

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize(container: HTMLElement): void {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private getPixelRatio(quality: string): number {
    const baseRatio = window.devicePixelRatio;
    switch (quality) {
      case 'low': return Math.min(1, baseRatio);
      case 'medium': return Math.min(1.5, baseRatio);
      case 'high': return Math.min(2, baseRatio);
      case 'ultra': return baseRatio;
      default: return 1;
    }
  }

  clear(): void {
    if (!this.scene) return;

    this.nodes.forEach(node => {
      this.scene!.remove(node);
      node.geometry.dispose();
      (node.material as THREE.Material).dispose();
    });
    this.nodes.clear();

    this.links.forEach(link => {
      this.scene!.remove(link);
      link.geometry.dispose();
      (link.material as THREE.Material).dispose();
    });
    this.links = [];
  }

  dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.clear();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}

export default ImmersiveVisualization;

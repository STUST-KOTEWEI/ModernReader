"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ProgrammableMatterProps {
    emotion: string;
    intensity: number;
}

function ParticleField({ emotion, intensity }: ProgrammableMatterProps) {
    const pointsRef = useRef<THREE.Points>(null);

    // Generate particle positions
    const particles = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Create sphere distribution
            const radius = 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }

        return positions;
    }, []);

    // Emotion-based colors
    const emotionColors: Record<string, string> = {
        joy: '#FFD700',
        sadness: '#4169E1',
        anger: '#DC143C',
        fear: '#9370DB',
        surprise: '#FF69B4',
        neutral: '#808080'
    };

    const color = emotionColors[emotion] || '#808080';

    // Animate particles based on emotion intensity
    useFrame((state) => {
        if (!pointsRef.current) return;

        const time = state.clock.getElapsedTime();
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
            const i3 = i;
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];

            // Wave effect based on intensity
            const wave = Math.sin(time + x * 0.5) * intensity * 0.1;
            positions[i3 + 1] = y + wave;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.rotation.y = time * 0.1 * intensity;
    });

    return (
        <Points ref={pointsRef} positions={particles} stride={3}>
            <PointMaterial
                transparent
                color={color}
                size={0.02}
                sizeAttenuation
                depthWrite={false}
                opacity={0.8}
            />
        </Points>
    );
}

export default function ProgrammableMatter({ emotion, intensity }: ProgrammableMatterProps) {
    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={0.5} />
                <ParticleField emotion={emotion} intensity={intensity} />
            </Canvas>
        </div>
    );
}

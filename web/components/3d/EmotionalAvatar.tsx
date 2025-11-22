"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import { Mesh } from 'three';

type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';

interface EmotionalAvatarProps {
    emotion: Emotion;
    isActive: boolean;
}

const EMOTION_COLORS = {
    joy: '#FFD700',      // Gold
    sadness: '#4169E1',  // Royal Blue
    anger: '#DC143C',    // Crimson
    fear: '#9370DB',     // Medium Purple
    surprise: '#FF69B4', // Hot Pink
    neutral: '#808080'   // Gray
};

const EMOTION_DISTORT = {
    joy: 0.6,
    sadness: 0.2,
    anger: 0.8,
    fear: 0.4,
    surprise: 0.7,
    neutral: 0.3
};

function Avatar({ emotion, isActive }: EmotionalAvatarProps) {
    const meshRef = useRef<Mesh>(null);

    return (
        <Sphere args={[1, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
                color={EMOTION_COLORS[emotion]}
                attach="material"
                distort={EMOTION_DISTORT[emotion]}
                speed={isActive ? 2 : 0.5}
                roughness={0.2}
                metalness={0.8}
            />
        </Sphere>
    );
}

export default function EmotionalAvatar({ emotion, isActive }: EmotionalAvatarProps) {
    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 3] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
                <Avatar emotion={emotion} isActive={isActive} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}

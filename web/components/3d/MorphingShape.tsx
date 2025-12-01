"use client";

import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';

export type Persona = 'Poet' | 'Teacher' | 'Wise Elder' | 'Default';

interface MorphingShapeProps {
  persona: Persona;
  isSpeaking?: boolean; // New prop
}

// --- Shape and Color Definitions ---
const personasConfig = {
  Default: {
    shape: (v: THREE.Vector3) => v.normalize().multiplyScalar(1.5),
    color: '#ff8c00', // orange
  },
  Poet: {
    shape: (v: THREE.Vector3) => {
      const R = 1.3;
      const r = 0.5;
      const angle = Math.atan2(v.y, v.x);
      const majorRadius = R + r * Math.cos(angle * 5);
      v.set(
        majorRadius * Math.cos(angle),
        majorRadius * Math.sin(angle),
        r * Math.sin(angle * 5)
      );
    },
    color: '#4682b4', // steelblue
  },
  Teacher: {
    shape: (v: THREE.Vector3) => {
      const cubeV = v.clone().normalize();
      v.set(
        cubeV.x > 0 ? Math.max(cubeV.x, 0.8) : Math.min(cubeV.x, -0.8),
        cubeV.y > 0 ? Math.max(cubeV.y, 0.8) : Math.min(cubeV.y, -0.8),
        cubeV.z > 0 ? Math.max(cubeV.z, 0.8) : Math.min(cubeV.z, -0.8)
      ).multiplyScalar(1.4);
    },
    color: '#2e8b57', // seagreen
  },
  'Wise Elder': {
    shape: (v: THREE.Vector3) => {
      const icoV = v.clone().normalize();
      const displacement = Math.sin(icoV.y * 5) * Math.cos(icoV.x * 5) * Math.sin(icoV.z * 5) * 0.4;
      v.normalize().multiplyScalar(1.7 + displacement);
    },
    color: '#8a2be2', // blueviolet
  },
};

const BASE_GEOMETRY = new THREE.IcosahedronGeometry(1.5, 6);
const tempVector = new THREE.Vector3();

function MorphingShape({ persona, isSpeaking = false }: MorphingShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const sourcePositions = useRef<THREE.Float32BufferAttribute>(BASE_GEOMETRY.attributes.position as THREE.Float32BufferAttribute);

  const [{ factor, color, scale }, api] = useSpring(() => ({
    factor: 0,
    color: personasConfig.Default.color,
    scale: [1, 1, 1], // Initial scale
    config: { mass: 2, tension: 180, friction: 30 },
  }));

  useEffect(() => {
    api.start({
      factor: 1,
      from: { factor: 0 },
      color: personasConfig[persona]?.color || personasConfig.Default.color,
    });
    // Set the target shape for the animation
    const targetShapeFunc = personasConfig[persona]?.shape || personasConfig.Default.shape;
    
    // Create target positions
    const target = new Float32Array(sourcePositions.current.array.length);
    for (let i = 0; i < sourcePositions.current.count; i++) {
        tempVector.fromBufferAttribute(sourcePositions.current, i);
        targetShapeFunc(tempVector); // Apply shape func fully
        target[i * 3] = tempVector.x;
        target[i * 3 + 1] = tempVector.y;
        target[i * 3 + 2] = tempVector.z;
    }
    
    if (meshRef.current) {
        // This attribute will hold the target vertex positions
        meshRef.current.geometry.setAttribute('target', new THREE.BufferAttribute(target, 3));
    }

  }, [persona, api]);

  // Animate scale based on isSpeaking
  useEffect(() => {
    if (isSpeaking) {
      api.start({
        scale: [1.1, 1.1, 1.1],
        loop: { reverse: true }, // Pulsate
        config: { mass: 1, tension: 200, friction: 10 },
      });
    } else {
      api.start({ scale: [1, 1, 1], loop: false, config: { mass: 1, tension: 200, friction: 10 } });
    }
  }, [isSpeaking, api]);

  useFrame(() => {
    if (!meshRef.current || !meshRef.current.geometry.attributes.target) return;

    const currentPositions = meshRef.current.geometry.attributes.position as THREE.Float32BufferAttribute;
    const targetPositions = meshRef.current.geometry.attributes.target as THREE.Float32BufferAttribute;
    
    const f = factor.get();

    for (let i = 0; i < currentPositions.count; i++) {
      tempVector.fromBufferAttribute(sourcePositions.current, i).lerp(
          tempVector.fromBufferAttribute(targetPositions, i),
          f
      );
      currentPositions.setXYZ(i, tempVector.x, tempVector.y, tempVector.z);
    }
    
    currentPositions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <animated.mesh ref={meshRef} geometry={BASE_GEOMETRY} scale={scale}>
      <animated.meshStandardMaterial color={color} />
    </animated.mesh>
  );
}

export default MorphingShape;

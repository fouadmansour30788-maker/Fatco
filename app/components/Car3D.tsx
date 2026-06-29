"use client";

import { useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import {
  RoundedBox,
  ContactShadows,
  Environment,
  Lightformer,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

const BRAND = "#c1121f";
const BRAND_DARK = "#8d0e18";

function Wheel(props: ThreeElements["group"]) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.x += dt * 2.2; // rolling
  });
  return (
    <group {...props}>
      <group ref={ref}>
        {/* tyre */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 28]} />
          <meshStandardMaterial color="#15151a" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.32, 20]} />
          <meshStandardMaterial color="#d6d6da" roughness={0.25} metalness={0.9} />
        </mesh>
        {/* spokes */}
        <mesh>
          <boxGeometry args={[0.33, 0.62, 0.06]} />
          <meshStandardMaterial color="#9a9aa2" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.33, 0.06, 0.62]} />
          <meshStandardMaterial color="#9a9aa2" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Car() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Slow auto-rotation + gentle tilt that follows the cursor (parallax).
    const targetY = t * 0.35 + state.pointer.x * 0.5;
    const targetX = -0.05 + state.pointer.y * 0.18;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      targetY,
      Math.min(1, dt * 3)
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      targetX,
      Math.min(1, dt * 3)
    );
  });

  return (
    <group ref={group} position={[0, -0.25, 0]} scale={1.05}>
      {/* lower body */}
      <RoundedBox args={[3.5, 0.6, 1.55]} radius={0.22} smoothness={6} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color={BRAND} metalness={0.85} roughness={0.22} />
      </RoundedBox>
      {/* hood / boot taper */}
      <RoundedBox args={[3.1, 0.45, 1.5]} radius={0.2} smoothness={6} position={[0, 0.92, 0]} castShadow>
        <meshStandardMaterial color={BRAND} metalness={0.85} roughness={0.22} />
      </RoundedBox>
      {/* glass cabin */}
      <RoundedBox args={[1.7, 0.6, 1.36]} radius={0.16} smoothness={6} position={[-0.15, 1.32, 0]} castShadow>
        <meshStandardMaterial color="#0c0c12" metalness={0.95} roughness={0.08} />
      </RoundedBox>
      {/* roof */}
      <RoundedBox args={[1.5, 0.16, 1.3]} radius={0.08} smoothness={5} position={[-0.15, 1.62, 0]} castShadow>
        <meshStandardMaterial color={BRAND_DARK} metalness={0.85} roughness={0.25} />
      </RoundedBox>

      {/* headlights */}
      <mesh position={[1.74, 0.68, 0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fff7e6" emissive="#fff2cc" emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[1.74, 0.68, -0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fff7e6" emissive="#fff2cc" emissiveIntensity={2.2} />
      </mesh>
      {/* tail lights */}
      <mesh position={[-1.76, 0.7, 0.5]}>
        <boxGeometry args={[0.06, 0.16, 0.28]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff0000" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-1.76, 0.7, -0.5]}>
        <boxGeometry args={[0.06, 0.16, 0.28]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff0000" emissiveIntensity={1.6} />
      </mesh>

      {/* wheels */}
      <Wheel position={[1.05, 0.2, 0.8]} />
      <Wheel position={[1.05, 0.2, -0.8]} />
      <Wheel position={[-1.05, 0.2, 0.8]} />
      <Wheel position={[-1.05, 0.2, -0.8]} />
    </group>
  );
}

export default function Car3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.5, 2.2, 6], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-6, 3, -4]} intensity={40} color={BRAND} />

      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
        <Car />
      </Float>

      <ContactShadows
        position={[0, -0.45, 0]}
        opacity={0.5}
        scale={12}
        blur={2.6}
        far={4}
      />

      {/* Procedural studio reflections (no external HDR fetch). */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 3, 1]} />
        <Lightformer intensity={1.2} position={[4, 2, 2]} scale={[3, 4, 1]} />
        <Lightformer intensity={1.2} position={[-4, 1, 2]} scale={[3, 4, 1]} />
        <Lightformer
          intensity={1.5}
          color={BRAND}
          position={[0, 1, -4]}
          scale={[6, 3, 1]}
        />
      </Environment>
    </Canvas>
  );
}

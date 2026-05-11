import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, Sphere, MeshDistortMaterial, MeshTransmissionMaterial, useTexture } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";
import { usePerformance } from "../hooks/usePerformance";

function useThemeColors() {
  const [colors, setColors] = useState({ primary: "#3b82f6", secondary: "#06b6d4" });

  useEffect(() => {
    const updateColors = () => {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--primary").trim() || "#3b82f6";
      const secondary = style.getPropertyValue("--secondary").trim() || "#06b6d4";
      setColors({ primary, secondary });
    };

    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

function ParticleField() {
  const { primary } = useThemeColors();
  const { starCount, manualLowPower } = usePerformance();
  const count = manualLowPower ? 500 : 1500;
  
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 10;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.05;
    ref.current.rotation.x = time * 0.02;
  });

  return (
    <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={primary}
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function CentralHeart() {
  const { primary, secondary } = useThemeColors();
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const { planetSegments, isMobile, manualLowPower, useTransmission } = usePerformance();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y = time * 0.3;
    meshRef.current.rotation.z = time * 0.2;
    meshRef.current.position.y = Math.sin(time) * 0.15;
    
    // Pulsing effect
    const scale = 1 + Math.sin(time * 2) * 0.05;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere
        ref={meshRef}
        args={[1.2, planetSegments, planetSegments]}
        onPointerOver={() => !isMobile && setHovered(true)}
        onPointerOut={() => !isMobile && setHovered(false)}
      >
        {useTransmission ? (
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.5}
            thickness={2}
            samples={16}
            transmission={0.95}
            clearcoat={1}
            clearcoatRoughness={0}
            ior={1.5}
            chromaticAberration={0.06}
            anisotropy={0.1}
            distortion={0.5}
            distortionScale={0.3}
            temporalDistortion={0.1}
            color={hovered ? secondary : primary}
            attenuationDistance={0.5}
            attenuationColor={hovered ? secondary : primary}
          />
        ) : (
          <meshStandardMaterial 
            color={hovered ? secondary : primary}
            emissive={hovered ? secondary : primary}
            emissiveIntensity={hovered ? 2 : 1}
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        )}
      </Sphere>
      {/* Internal Glow */}
      {!manualLowPower && (
        <Sphere args={[0.8, 32, 32]}>
          <meshStandardMaterial
            color={hovered ? secondary : primary}
            emissive={hovered ? secondary : primary}
            emissiveIntensity={hovered ? 5 : 2}
            transparent
            opacity={0.3}
          />
        </Sphere>
      )}
    </Float>
  );
}

export default function Hero3D() {
  const { primary, secondary } = useThemeColors();
  const { manualLowPower, pixelRatio, disable3D } = usePerformance();

  if (disable3D) {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div
          className="w-72 h-72 rounded-full opacity-25 blur-[100px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${primary}, ${secondary}, transparent)`, animationDuration: '3s' }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 50 }} 
        dpr={pixelRatio}
        gl={{ 
          alpha: true,
          powerPreference: "high-performance",
          antialias: !manualLowPower
        }}
      >
        <ambientLight intensity={0.2} />
        
        {/* Dramatic Main Light */}
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={2} 
          castShadow={!manualLowPower} 
          color={secondary}
        />
        
        {/* Ethereal Rim Light */}
        <pointLight position={[-10, -5, -10]} intensity={3} color={primary} />
        
        {/* Soft Fill Light */}
        <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" />

        <CentralHeart />
        <ParticleField />
      </Canvas>
    </div>
  );
}

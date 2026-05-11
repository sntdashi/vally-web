import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, MeshWobbleMaterial, Torus, Float, Sphere, Points, PointMaterial, useTexture, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, Suspense } from "react";
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

function getMoonPhase() {
  const now = new Date();
  const lp = 2551443; 
  const newMoon = new Date(1970, 0, 7, 20, 35, 0);
  const phase = ((now.getTime() - newMoon.getTime()) / 1000) % lp;
  return phase / lp;
}

function Moon({ primary }: { primary: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const phase = useMemo(() => getMoonPhase(), []);
  const { planetSegments, manualLowPower } = usePerformance();
  
  // Using a high-quality public moon texture
  const moonTexture = useTexture("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg");

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y = time * 0.05;
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[1, planetSegments, planetSegments]}>
        <meshStandardMaterial 
          map={moonTexture}
          roughness={0.8}
          metalness={0.2}
          emissive={primary}
          emissiveIntensity={0.1}
        />
      </Sphere>
      {/* Moon Glow Aura */}
      {!manualLowPower && (
        <Sphere args={[1.05, planetSegments, planetSegments]}>
          <meshBasicMaterial
            color={primary}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>
      )}
      {/* Dynamic light to simulate moon phase and highlight craters */}
      <directionalLight 
        position={[Math.cos(phase * Math.PI * 2) * 10, 2, Math.sin(phase * Math.PI * 2) * 10]} 
        intensity={2} 
      />
    </group>
  );
}

function Particles({ count = 100, color = "#ffffff" }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.2;
    ref.current.rotation.z = time * 0.1;
  });

  return (
    <Points ref={ref} positions={points} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function InteractiveTorus({ args, rotation, color, emissive, speed = 1 }: any) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<any>(null!);
  const ghostRef = useRef<THREE.Mesh>(null!);
  const { isMobile, manualLowPower, useTransmission } = usePerformance();

  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const saturatedColor = useMemo(() => {
    const c = new THREE.Color(color);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(hsl.h, Math.min(1, hsl.s + 0.4), Math.min(1, hsl.l + 0.1));
    return c;
  }, [color]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.1 * speed;
      if (hovered && !manualLowPower) {
        meshRef.current.rotation.z = t * 0.5 * speed;
      }
    }
    
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = hovered && !manualLowPower ? 4 : 1.5;
      materialRef.current.color.lerp(hovered && !manualLowPower ? saturatedColor : baseColor, 0.1);
    }

    if (ghostRef.current) {
      ghostRef.current.visible = hovered && !manualLowPower;
      if (hovered && !manualLowPower) {
        ghostRef.current.rotation.z = t * 0.5 * speed;
        const scale = 1.02 + Math.sin(t * 5) * 0.01;
        ghostRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group>
      <Torus 
        ref={meshRef}
        args={args} 
        rotation={rotation}
        onPointerOver={() => !isMobile && setHovered(true)}
        onPointerOut={() => !isMobile && setHovered(false)}
      >
        {useTransmission ? (
          <MeshTransmissionMaterial
            backside
            thickness={0.2}
            transmission={0.9}
            chromaticAberration={0.05}
            anisotropy={0.1}
            distortion={0.2}
            color={color}
            emissive={emissive}
            emissiveIntensity={1}
          />
        ) : (
          <meshStandardMaterial 
            color={color}
            emissive={emissive}
            emissiveIntensity={1.5}
            transparent
            opacity={0.8}
          />
        )}
      </Torus>
      
      {/* Radial Blur Ghost Shell */}
      {!manualLowPower && (
        <Torus 
          ref={ghostRef}
          args={[args[0], args[1] * 4, args[2], args[3]]} 
          rotation={rotation}
          visible={false}
        >
          <meshStandardMaterial 
            color={color}
            emissive={emissive}
            emissiveIntensity={5}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Torus>
      )}
    </group>
  );
}

function Core() {
  const { primary, secondary } = useThemeColors();
  const { manualLowPower } = usePerformance();

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Moon primary={primary} />
        <Particles count={manualLowPower ? 50 : 150} color={secondary} />
      </Float>
      
      <InteractiveTorus 
        args={[1.5, 0.02, 16, manualLowPower ? 50 : 100]} 
        rotation={[Math.PI / 2, 0, 0]} 
        color={secondary} 
        emissive={secondary}
        speed={1}
      />
      
      <InteractiveTorus 
        args={[1.8, 0.01, 16, manualLowPower ? 50 : 100]} 
        rotation={[0, Math.PI / 4, 0]} 
        color={primary} 
        emissive={primary}
        speed={0.5}
      />
    </group>
  );
}

export default function LoveCore3D() {
  const { primary, secondary } = useThemeColors();
  const { isMobile, manualLowPower, disable3D } = usePerformance();
  return (
    <section id="core" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative z-10 text-center lg:text-left">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold mb-6 md:mb-8">
            The <span className="text-gradient">Celestial Core</span>
          </h2>
          <p className="text-lg md:text-xl opacity-60 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
            This is the heartbeat of our digital sanctuary. Now featuring a 
            real-time Moon phase tracker synchronized with the current date and time. 
            Hover over the rings to interact with the energy field.
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <div 
              style={{ borderColor: `${primary}33` }}
              className="glass px-6 py-3 rounded-2xl border flex-1 min-w-[140px] max-w-[200px]"
            >
              <span className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-1">Stability</span>
              <span style={{ color: primary }} className="text-xl md:text-2xl font-bold">99.9%</span>
            </div>
            <div 
              style={{ borderColor: `${secondary}33` }}
              className="glass px-6 py-3 rounded-2xl border flex-1 min-w-[140px] max-w-[200px]"
            >
              <span className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-1">Energy</span>
              <span style={{ color: secondary }} className="text-xl md:text-2xl font-bold">Infinite</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] md:h-[500px] relative rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden cursor-crosshair bg-white/[0.02] backdrop-blur-sm">
          {disable3D ? (
            // CSS-only moon visual for low-end devices
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="w-40 h-40 rounded-full animate-pulse relative" style={{
                background: `radial-gradient(circle at 35% 35%, #e8e8e8, #888, #444)`,
                boxShadow: `0 0 60px ${primary}44, 0 0 120px ${primary}22`,
                animationDuration: '4s'
              }}>
                <div className="absolute inset-0 rounded-full opacity-40" style={{
                  background: `radial-gradient(circle at 65% 65%, transparent, rgba(0,0,0,0.6))`
                }} />
              </div>
              <div className="absolute inset-0 rounded-full opacity-20" style={{
                background: `radial-gradient(circle at center, ${primary}44, transparent 70%)`
              }} />
            </div>
          ) : (
          <Canvas 
            camera={{ position: [0, 0, 5] }} 
            shadows={!manualLowPower} 
            gl={{ 
              alpha: true,
              powerPreference: "high-performance",
              antialias: !manualLowPower
            }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.1} />
              
              {/* Dramatic Top Light */}
              <spotLight 
                position={[5, 10, 5]} 
                angle={0.3} 
                penumbra={1} 
                intensity={2} 
                castShadow 
                color={secondary}
              />
              
              {/* Ethereal Rim Light */}
              <pointLight position={[-5, -5, -5]} intensity={2} color={primary} />
              
              <Core />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Suspense>
          </Canvas>
          )}
          <div className="absolute bottom-6 left-6 glass px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest opacity-40">
            Real-time Moon Phase • Interactive Energy Rings
          </div>
        </div>
      </div>
      
      {/* Background Glow */}
      <div 
        style={{ backgroundColor: primary }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 blur-[150px] rounded-full pointer-events-none" 
      />
    </section>
  );
}

import { motion, AnimatePresence } from "motion/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Sphere, Ring, Line, MeshDistortMaterial, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import * as THREE from "three";
import { usePerformance } from "../hooks/usePerformance";
// Custom Timer to avoid THREE.Clock deprecation warnings and ensure consistent API
class CustomTimer {
  private startTime = performance.now();
  getElapsedTime() {
    return (performance.now() - this.startTime) / 1000;
  }
}
import { Settings, Eye, EyeOff } from "lucide-react";

interface PlanetData {
  name: string;
  a: number;
  e: number;
  i: number;
  node: number;
  peri: number;
  L: number;
  period: number;
  size: number;
  texture: string;
  tilt: number;
  orbit: number;
  hasClouds?: boolean;
  hasRings?: boolean;
}

// Realistic Planet Data (Semi-major axis, eccentricity, inclination, node, perihelion, mean longitude)
const PLANET_ELEMENTS = {
  Mercury: { a: 0.387, e: 0.2056, i: 7.0, node: 48.3, peri: 77.5, L: 252.2, period: 88, size: 0.2, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg", tilt: 0.03 },
  Venus: { a: 0.723, e: 0.0068, i: 3.4, node: 76.7, peri: 131.5, L: 182.0, period: 225, size: 0.4, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg", tilt: 177.3 },
  Earth: { a: 1.000, e: 0.0167, i: 0.0, node: 0.0, peri: 102.9, L: 100.5, period: 365, size: 0.45, texture: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_day_4096.jpg", tilt: 23.4, hasClouds: true },
  Mars: { a: 1.524, e: 0.0934, i: 1.9, node: 49.6, peri: 336.0, L: 355.5, period: 687, size: 0.3, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg", tilt: 25.2 },
  Jupiter: { a: 5.203, e: 0.0485, i: 1.3, node: 100.5, peri: 14.8, L: 34.4, period: 4333, size: 1.2, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg", tilt: 3.1 },
  Saturn: { a: 9.555, e: 0.0555, i: 2.5, node: 113.7, peri: 92.4, L: 49.9, period: 10759, size: 1.0, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg", tilt: 26.7, hasRings: true },
  Uranus: { a: 19.218, e: 0.0463, i: 0.8, node: 74.0, peri: 171.0, L: 313.2, period: 30687, size: 0.7, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg", tilt: 97.8 },
  Neptune: { a: 30.070, e: 0.0090, i: 1.8, node: 131.8, peri: 45.0, L: 304.9, period: 60190, size: 0.7, texture: "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg", tilt: 28.3 },
};

const PLANETS: PlanetData[] = Object.entries(PLANET_ELEMENTS).map(([name, data]) => ({
  name,
  ...data,
  orbit: data.a * 10, // Use real semi-major axis for orbit line
}));

function calculatePlanetPosition(name: string, timeOffset: number = 0) {
  const data = PLANET_ELEMENTS[name as keyof typeof PLANET_ELEMENTS];
  if (!data) return { x: 0, y: 0, z: 0 };

  // Days since J2000 (approximate)
  const now = Date.now() + timeOffset;
  const d = (now - 946728000000) / (1000 * 60 * 60 * 24);

  // Mean anomaly
  const M = (data.L - data.peri) + (360 / data.period) * d;
  const M_rad = THREE.MathUtils.degToRad(M);

  // Eccentric anomaly (simplified)
  let E = M_rad;
  for (let i = 0; i < 3; i++) {
    E = E + (M_rad + data.e * Math.sin(E) - E);
  }

  // Position in orbital plane
  const x_orb = data.a * (Math.cos(E) - data.e);
  const y_orb = data.a * Math.sqrt(1 - data.e * data.e) * Math.sin(E);

  // Rotate to ecliptic coordinates
  const node = THREE.MathUtils.degToRad(data.node);
  const peri = THREE.MathUtils.degToRad(data.peri);
  const i = THREE.MathUtils.degToRad(data.i);

  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosPeri = Math.cos(peri - node);
  const sinPeri = Math.sin(peri - node);
  const cosI = Math.cos(i);

  const x = (cosNode * cosPeri - sinNode * sinPeri * cosI) * x_orb + (-cosNode * sinPeri - sinNode * cosPeri * cosI) * y_orb;
  const z = (sinNode * cosPeri + cosNode * sinPeri * cosI) * x_orb + (-sinNode * sinPeri + cosNode * cosPeri * cosI) * y_orb;
  const y = (sinPeri * Math.sin(i)) * x_orb + (cosPeri * Math.sin(i)) * y_orb;

  // Scale for visualization
  const scale = 10;
  return { x: x * scale, y: y * scale, z: z * scale };
}

const CELESTIAL_THEME = {
  day: {
    bg: "#08112b",
    ambient: 0.08, // Lowered for realistic shadows on planets
    bloom: 1.8,
    starColor: "#fff4d6",
    starOpacity: 0.02,
    starSize: 0.05,
    sunColor: "#ffcc33",
    sunEmissive: "#ff9900",
    sunIntensity: 40, // Increased to reach outer planets
    sunSize: 5.0,
    glowSize: 6.5
  },
  night: {
    bg: "#010103",
    ambient: 0.03, // Lowered for realistic shadows on planets
    bloom: 1.0,
    starColor: "#ffffff",
    starOpacity: 1.0,
    starSize: 1.5, // Much larger for visibility without attenuation
    sunColor: "#ffffff",
    sunEmissive: "#3b82f6", // Moon glow
    sunIntensity: 15, // Increased to reach outer planets
    sunSize: 1.8,
    glowSize: 2.2
  }
};

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

function StarField({ isDay }: { isDay: boolean }) {
  const { primary } = useThemeColors();
  const { starCount } = usePerformance();
  
  // Create 3 layers of stars for parallax
  const layers = useMemo(() => {
    const layerCounts = [Math.floor(starCount * 0.6), Math.floor(starCount * 0.3), Math.floor(starCount * 0.1)];
    return layerCounts.map((c, index) => {
      const p = new Float32Array(c * 3);
      const baseRadius = 50 + index * 30; // Further layers are further away
      for (let i = 0; i < c; i++) {
        const r = baseRadius + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        p[i * 3 + 2] = r * Math.cos(phi);
      }
      return { positions: p, speed: 0.005 * (index + 1) }; // Speed increases for "closer" layers
    });
  }, [starCount]);

  const layerRefs = useRef<THREE.Points[]>([]);
  const timer = useRef(new CustomTimer());

  useFrame(() => {
    const time = (timer.current as any).getElapsedTime();
    const scrollY = window.scrollY;
    
    layerRefs.current.forEach((ref, index) => {
      if (ref) {
        // Rotation for general movement
        ref.rotation.y = time * (0.001 * (index + 1));
        
        // Parallax scroll effect (Rocket POV penetrating space)
        // Stronger effect for better interaction
        const parallaxFactor = (index + 1) * 0.05;
        ref.position.y = scrollY * parallaxFactor * 0.5; 
        ref.position.z = scrollY * parallaxFactor * 3;   
      }
    });
  });

  return (
    <group>
      {layers.map((layer, i) => (
        <Points 
          key={i} 
          ref={(el) => {
            if (el) layerRefs.current[i] = el;
          }} 
          positions={layer.positions} 
          stride={3} 
          frustumCulled={false}
        >
          <PointMaterial
            transparent
            color={isDay ? CELESTIAL_THEME.day.starColor : CELESTIAL_THEME.night.starColor} 
            size={isDay ? CELESTIAL_THEME.day.starSize : (CELESTIAL_THEME.night.starSize - i * 0.2)} 
            sizeAttenuation={false} // Set to false so stars are always visible
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={isDay ? CELESTIAL_THEME.day.starOpacity : CELESTIAL_THEME.night.starOpacity} 
          />
        </Points>
      ))}
    </group>
  );
}

function OrbitLine({ radius, eccentricity, node, peri, inclination }: { radius: number, eccentricity: number, node: number, peri: number, inclination: number }) {
  const { orbitSegments, manualLowPower } = usePerformance();
  const points = useMemo(() => {
    const p = [];
    const b = radius * Math.sqrt(1 - eccentricity * eccentricity);
    const focus = radius * eccentricity;
    
    const nodeRad = THREE.MathUtils.degToRad(node);
    const periRad = THREE.MathUtils.degToRad(peri);
    const iRad = THREE.MathUtils.degToRad(inclination);

    const cosNode = Math.cos(nodeRad);
    const sinNode = Math.sin(nodeRad);
    const cosPeri = Math.cos(periRad - nodeRad);
    const sinPeri = Math.sin(periRad - nodeRad);
    const cosI = Math.cos(iRad);

    for (let i = 0; i <= orbitSegments; i++) {
      const angle = (i / orbitSegments) * Math.PI * 2;
      const x_orb = Math.cos(angle) * radius - focus;
      const y_orb = Math.sin(angle) * b;

      const x = (cosNode * cosPeri - sinNode * sinPeri * cosI) * x_orb + (-cosNode * sinPeri - sinNode * cosPeri * cosI) * y_orb;
      const z = (sinNode * cosPeri + cosNode * sinPeri * cosI) * x_orb + (-sinNode * sinPeri + cosNode * cosPeri * cosI) * y_orb;
      const y = (sinPeri * Math.sin(iRad)) * x_orb + (cosPeri * Math.sin(iRad)) * y_orb;

      p.push(new THREE.Vector3(x, y, z));
    }
    return p;
  }, [radius, eccentricity, node, peri, inclination, orbitSegments]);

  return (
    <group>
      {/* Core Orbit Line */}
      <Line points={points} color="white" lineWidth={0.5} transparent opacity={0.1} />
      {!manualLowPower && (
        <>
          {/* Inner Glow */}
          <Line 
            points={points} 
            color="white" 
            lineWidth={2} 
            transparent 
            opacity={0.05} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false} 
          />
          {/* Outer Glow (Wider) */}
          <Line 
            points={points} 
            color="white" 
            lineWidth={6} 
            transparent 
            opacity={0.02} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false} 
          />
        </>
      )}
    </group>
  );
}

function SaturnRings({ size }: { size: number }) {
  return (
    <Ring args={[size * 1.4, size * 2.2, 64]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial 
        color="#c5ab6e" 
        transparent 
        opacity={0.4} 
        side={THREE.DoubleSide} 
      />
    </Ring>
  );
}

function RealisticPlanet({ data, showOrbits, virtualTime, onHover, onClick }: { 
  data: PlanetData, 
  showOrbits: boolean, 
  virtualTime: number,
  onHover: (data: PlanetData | null) => void,
  onClick: (data: PlanetData) => void
}) {
  const ref = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [cloudTexture, setCloudTexture] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);
  const { secondary } = useThemeColors();
  const { planetSegments, isMobile, manualLowPower } = usePerformance();
  
  // Load textures manually to avoid suspending the entire scene
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let isMounted = true;
    
    // On mobile, we might want to use lower res textures if we had them, 
    // but for now we just ensure they are disposed correctly.
    loader.load(data.texture, 
      (tex) => {
        if (isMounted) {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          setTexture(tex);
        }
      },
      undefined,
      () => console.warn(`Failed to load texture for ${data.name}, using fallback color.`)
    );
    
    if (data.hasClouds && !manualLowPower) { // Disable clouds in low power mode
      loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png",
        (tex) => {
          if (isMounted) setCloudTexture(tex);
        }
      );
    }

    return () => {
      isMounted = false;
      if (texture) texture.dispose();
      if (cloudTexture) cloudTexture.dispose();
    };
  }, [data.texture, data.hasClouds, manualLowPower]);
  
  useFrame(() => {
    const pos = calculatePlanetPosition(data.name, virtualTime); 
    
    if (ref.current) {
      ref.current.position.set(pos.x, pos.y, pos.z);
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.007;
    }
  });

  // Fallback colors based on planet type
  const getFallbackColor = (name: string) => {
    switch(name) {
      case "Mercury": return "#8c8c8c";
      case "Venus": return "#e3bb76";
      case "Earth": return "#2271b3";
      case "Mars": return "#e27b58";
      case "Jupiter": return "#d39c7e";
      case "Saturn": return "#c5ab6e";
      case "Uranus": return "#b5e3e3";
      case "Neptune": return "#4b70dd";
      default: return "#ffffff";
    }
  };

  return (
    <group>
      {showOrbits && (
        <OrbitLine 
          radius={data.orbit} 
          eccentricity={data.e} 
          node={data.node} 
          peri={data.peri} 
          inclination={data.i} 
        />
      )}
      <group 
        ref={ref}
        onPointerOver={(e) => {
          if (isMobile) return; // Disable hover effects on mobile to save CPU
          e.stopPropagation();
          setHovered(true);
          onHover(data);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (isMobile) return;
          setHovered(false);
          onHover(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(data);
        }}
      >
        <Sphere ref={meshRef} args={[data.size, planetSegments, planetSegments]} rotation={[THREE.MathUtils.degToRad(data.tilt), 0, 0]}>
          <meshStandardMaterial 
            map={texture} 
            color={!texture ? getFallbackColor(data.name) : "#ffffff"}
            roughness={0.7} 
            metalness={0.1} 
            emissive={hovered ? secondary : "#000000"}
            emissiveIntensity={hovered ? 0.8 : 0}
          />
        </Sphere>
        {data.hasClouds && !manualLowPower && (
          <Sphere ref={cloudsRef} args={[data.size + 0.01, planetSegments, planetSegments]}>
            <meshStandardMaterial 
              map={cloudTexture} 
              color={!cloudTexture ? "#ffffff" : undefined}
              transparent 
              opacity={cloudTexture ? 0.4 : 0.1} 
              depthWrite={false} 
            />
          </Sphere>
        )}
        {data.hasRings && <SaturnRings size={data.size} />}
        
        {/* Hover Glow */}
        {hovered && !manualLowPower && (
          <Sphere args={[data.size * 1.2, 16, 16]}>
            <meshBasicMaterial color={secondary} transparent opacity={0.15} />
          </Sphere>
        )}
      </group>
    </group>
  );
}

function CoronaParticles({ count = 200, isDay }: { count?: number, isDay: boolean }) {
  const { manualLowPower } = usePerformance();
  const actualCount = manualLowPower ? Math.floor(count / 4) : count;
  const { positions, velocities } = useMemo(() => {
    const p = new Float32Array(actualCount * 3);
    const v = new Float32Array(actualCount * 3);
    for (let i = 0; i < actualCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 3.5;
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
      
      const speed = 0.01 + Math.random() * 0.02;
      v[i * 3] = (p[i * 3] / r) * speed;
      v[i * 3 + 1] = (p[i * 3 + 1] / r) * speed;
      v[i * 3 + 2] = (p[i * 3 + 2] / r) * speed;
    }
    return { positions: p, velocities: v };
  }, [count]);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state) => {
    if (!ref.current || !isDay) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      const dist = Math.sqrt(pos[i * 3]**2 + pos[i * 3 + 1]**2 + pos[i * 3 + 2]**2);
      if (dist > 5.5 + Math.sin(t + i) * 0.5) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 3.5;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isDay) return null;

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ff9900"
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.4}
      />
    </Points>
  );
}

function Sun({ isDay }: { isDay: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [moonTexture, setMoonTexture] = useState<THREE.Texture | null>(null);
  const { primary } = useThemeColors();
  const { planetSegments } = usePerformance();

  useEffect(() => {
    let isMounted = true;
    if (!isDay) {
      const loader = new THREE.TextureLoader();
      // High-resolution moon map
      loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg",
        (tex) => {
          if (isMounted) setMoonTexture(tex);
        }
      );
    }
    return () => {
      isMounted = false;
      if (moonTexture) moonTexture.dispose();
    };
  }, [isDay]);
  
  const timer = useRef(new CustomTimer());
  
  useFrame(() => {
    const t = (timer.current as any).getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.05; // Slower rotation for moon/sun
    }
    
    if (glowRef.current) {
      // Complex pulsing scale
      const s = 1 + Math.sin(t * 2.5) * 0.04 + Math.sin(t * 5) * 0.02;
      glowRef.current.scale.set(s, s, s);
      
      // Shimmering opacity and emissive intensity
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        const baseOpacity = isDay ? 0.15 : 0.08;
        const baseEmissive = isDay ? 4 : 1.5;
        
        // Create a shimmering wave using multiple sine functions
        const shimmer = Math.sin(t * 3) * 0.5 + Math.sin(t * 8) * 0.3 + Math.sin(t * 15) * 0.2;
        
        mat.opacity = baseOpacity + shimmer * (baseOpacity * 0.4);
        mat.emissiveIntensity = baseEmissive + shimmer * (baseEmissive * 0.2);
      }
    }
  });

  const size = isDay ? CELESTIAL_THEME.day.sunSize : CELESTIAL_THEME.night.sunSize;
  const glowSize = isDay ? CELESTIAL_THEME.day.glowSize : CELESTIAL_THEME.night.glowSize;

  return (
    <group>
      <CoronaParticles isDay={isDay} />
      <Sphere ref={ref} args={[size, planetSegments, planetSegments]}>
        {isDay ? (
          <MeshDistortMaterial 
            color={CELESTIAL_THEME.day.sunColor} 
            emissive={CELESTIAL_THEME.day.sunEmissive} 
            emissiveIntensity={3} 
            distort={0.4} 
            speed={2} 
          />
        ) : (
          <meshStandardMaterial 
            map={moonTexture}
            color={!moonTexture ? "#888888" : "#ffffff"}
            emissive={CELESTIAL_THEME.night.sunEmissive}
            emissiveIntensity={0.15} // Subtle emissive glow
            roughness={0.8}
            metalness={0.1}
          />
        )}
      </Sphere>
      {/* Glow Shell */}
      <Sphere ref={glowRef} args={[glowSize, planetSegments, planetSegments]}>
        <meshStandardMaterial 
          color={isDay ? CELESTIAL_THEME.day.sunColor : CELESTIAL_THEME.night.sunEmissive} 
          emissive={isDay ? CELESTIAL_THEME.day.sunEmissive : CELESTIAL_THEME.night.sunEmissive} 
          emissiveIntensity={isDay ? 4 : 1.5} 
          transparent 
          opacity={isDay ? 0.15 : 0.08} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
      <pointLight 
        position={[0, 0, 0]} 
        intensity={isDay ? CELESTIAL_THEME.day.sunIntensity : CELESTIAL_THEME.night.sunIntensity} 
        color={isDay ? CELESTIAL_THEME.day.sunColor : CELESTIAL_THEME.night.sunEmissive} 
        distance={1000} 
        decay={1.2} 
      />
    </group>
  );
}

function CometField({ count = 4 }: { count?: number }) {
  const comets = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      trail: Array.from({ length: 25 }).map(() => new THREE.Vector3()),
      active: false,
      hoverIntensity: 0,
      sparkles: Array.from({ length: 10 }).map(() => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0
      })),
      reset: function() {
        const side = Math.random() > 0.5 ? 1 : -1;
        this.position.set(
          side * (150 + Math.random() * 50),
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
        this.velocity.set(
          -side * (0.8 + Math.random() * 1.2),
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        );
        this.active = true;
        this.hoverIntensity = 0;
        this.trail.forEach(p => p.copy(this.position));
        this.sparkles.forEach(s => s.life = 0);
      }
    }));
  }, [count]);

  const headRef = useRef<THREE.Points>(null!);
  const trailRef = useRef<THREE.Points>(null!);
  const sparkleRef = useRef<THREE.Points>(null!);

  const headPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const trailPositions = useMemo(() => new Float32Array(count * 25 * 3), [count]);
  const sparklePositions = useMemo(() => new Float32Array(count * 10 * 3), [count]);
  const trailColors = useMemo(() => new Float32Array(count * 25 * 3), [count]);

  useFrame((state, delta) => {
    comets.forEach((comet, i) => {
      if (!comet.active) {
        if (Math.random() < 0.002) comet.reset();
        return;
      }

      // Decay hover intensity
      comet.hoverIntensity = Math.max(0, comet.hoverIntensity - delta * 2);

      // Update trail
      for (let j = comet.trail.length - 1; j > 0; j--) {
        comet.trail[j].copy(comet.trail[j - 1]);
      }
      comet.trail[0].copy(comet.position);

      // Update position
      comet.position.add(comet.velocity);

      // Update sparkles
      comet.sparkles.forEach((s, si) => {
        if (s.life > 0) {
          s.pos.add(s.vel);
          s.life -= delta;
          const idx = (i * 10 + si) * 3;
          sparklePositions[idx] = s.pos.x;
          sparklePositions[idx + 1] = s.pos.y;
          sparklePositions[idx + 2] = s.pos.z;
        } else {
          const idx = (i * 10 + si) * 3;
          sparklePositions[idx] = 0;
          sparklePositions[idx + 1] = -1000; // Hide
          sparklePositions[idx + 2] = 0;
        }
      });

      // Check bounds
      if (comet.position.length() > 300) {
        comet.active = false;
      }

      // Update buffers
      headPositions[i * 3] = comet.position.x;
      headPositions[i * 3 + 1] = comet.position.y;
      headPositions[i * 3 + 2] = comet.position.z;

      comet.trail.forEach((p, j) => {
        const idx = (i * 25 + j) * 3;
        trailPositions[idx] = p.x;
        trailPositions[idx + 1] = p.y;
        trailPositions[idx + 2] = p.z;

        // Dynamic trail color/brightness
        const brightness = (1 - j / 25) * (0.15 + comet.hoverIntensity * 0.5);
        trailColors[idx] = 0.5 + brightness;
        trailColors[idx + 1] = 0.8 + brightness;
        trailColors[idx + 2] = 1.0;
      });
    });

    if (headRef.current) headRef.current.geometry.attributes.position.needsUpdate = true;
    if (trailRef.current) {
      trailRef.current.geometry.attributes.position.needsUpdate = true;
      trailRef.current.geometry.attributes.color.needsUpdate = true;
    }
    if (sparkleRef.current) sparkleRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    if (e.index !== undefined) {
      const cometIndex = Math.floor(e.index / 25);
      const comet = comets[cometIndex];
      if (comet && comet.active) {
        comet.hoverIntensity = 1;
        // Spawn a sparkle
        const freeSparkle = comet.sparkles.find(s => s.life <= 0);
        if (freeSparkle) {
          freeSparkle.pos.copy(e.point);
          freeSparkle.vel.set((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1);
          freeSparkle.life = 1.5;
        }
      }
    }
  };

  return (
    <group>
      <Points ref={headRef} positions={headPositions} stride={3}>
        <PointMaterial 
          transparent 
          color="#ffffff" 
          size={0.2} 
          sizeAttenuation 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </Points>
      <Points 
        ref={trailRef} 
        positions={trailPositions} 
        colors={trailColors}
        stride={3}
        onPointerMove={handlePointerMove}
      >
        <PointMaterial 
          transparent 
          vertexColors
          size={0.15} 
          sizeAttenuation 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
          opacity={0.4} 
        />
      </Points>
      <Points ref={sparkleRef} positions={sparklePositions} stride={3}>
        <PointMaterial 
          transparent 
          color="#ffffff" 
          size={0.08} 
          sizeAttenuation 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
          opacity={0.6} 
        />
      </Points>
    </group>
  );
}

function MeteorShower() {
  const count = 20;
  const meteors = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      active: false,
      progress: 0,
      length: Math.random() * 10 + 5,
      thickness: Math.random() * 0.05 + 0.02,
      color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.5, 0.8, 0.8) // cyan/blueish
    }));
  }, [count]);

  const linesRef = useRef<THREE.Group>(null!);
  const nextShowerTime = useRef(0);
  const isShowerActive = useRef(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Trigger shower
    if (t > nextShowerTime.current && !isShowerActive.current) {
      isShowerActive.current = true;
      // Schedule next shower in 15-45 seconds
      nextShowerTime.current = t + 15 + Math.random() * 30;

      // Activate meteors
      meteors.forEach(m => {
        if (Math.random() > 0.3) { // 70% chance to spawn
          m.active = true;
          m.progress = 0;
          // Start from top right, moving to bottom left
          const startX = 50 + Math.random() * 100;
          const startY = 50 + Math.random() * 50;
          const startZ = -50 - Math.random() * 100;
          m.position.set(startX, startY, startZ);
          
          // Fast velocity
          const speed = 2 + Math.random() * 2;
          m.velocity.set(-speed, -speed * 0.8, speed * 0.2);
        }
      });
    }

    // Animate meteors
    let activeCount = 0;
    if (isShowerActive.current && linesRef.current) {
      meteors.forEach((m, i) => {
        if (m.active) {
          activeCount++;
          m.position.add(m.velocity);
          m.progress += 0.02;

          const mesh = linesRef.current.children[i] as THREE.Mesh;
          if (mesh) {
            mesh.position.copy(m.position);
            // Orient along velocity
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), m.velocity.clone().normalize());
            mesh.scale.set(m.thickness, m.length, m.thickness);
            
            const mat = mesh.material as THREE.MeshBasicMaterial;
            // Fade in and out
            mat.opacity = Math.max(0, 1 - (m.progress * 2));
          }

          if (m.progress > 1) {
            m.active = false;
            if (mesh) mesh.visible = false;
          } else {
            if (mesh) mesh.visible = true;
          }
        }
      });

      if (activeCount === 0) {
        isShowerActive.current = false;
      }
    }
  });

  return (
    <group ref={linesRef}>
      {meteors.map((m, i) => (
        <mesh key={i} visible={false}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshBasicMaterial color={m.color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function DistantSupernova() {
  const { primary, secondary } = useThemeColors();
  const count = 5;
  const supernovas = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(),
      active: false,
      progress: 0,
      maxSize: Math.random() * 30 + 15,
      colorFactor: Math.random(),
      triggerTime: Math.random() * 20
    }));
  }, [count]);

  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const color1 = new THREE.Color(primary);
    const color2 = new THREE.Color(secondary);

    supernovas.forEach((sn, i) => {
      if (!sn.active && t > sn.triggerTime) {
        sn.active = true;
        sn.progress = 0;
        sn.triggerTime = t + 20 + Math.random() * 40; // Next one in 20-60s
        sn.colorFactor = Math.random(); // New color mix
        
        // Random distant position
        const r = 300 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        sn.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
      }

      if (sn.active && groupRef.current) {
        sn.progress += 0.003; // Slower fade for prolonged glow
        const group = groupRef.current.children[i] as THREE.Group;
        if (group) {
          group.position.copy(sn.position);
          
          // Flash curve: extremely quick spike, very slow fade
          let flashIntensity = 0;
          let glowIntensity = 0;
          
          if (sn.progress < 0.02) {
            flashIntensity = sn.progress / 0.02; // 0 to 1 very fast
            glowIntensity = flashIntensity;
          } else {
            flashIntensity = Math.max(0, 1 - (sn.progress - 0.02) / 0.05); // sharp dropoff
            glowIntensity = Math.max(0, 1 - (sn.progress - 0.02) / 0.98); // prolonged fade
          }

          const core = group.children[0] as THREE.Mesh;
          const ring1 = group.children[1] as THREE.Mesh;
          const ring2 = group.children[2] as THREE.Mesh;

          // Interpolate color
          const currentColor = new THREE.Color().lerpColors(color1, color2, sn.colorFactor);
          
          // Add white to the initial flash
          const flashColor = currentColor.clone().lerp(new THREE.Color(0xffffff), flashIntensity);

          // Core
          core.scale.setScalar(sn.maxSize * (0.2 + glowIntensity * 0.8 + flashIntensity * 0.5));
          (core.material as THREE.MeshBasicMaterial).color = flashColor;
          (core.material as THREE.MeshBasicMaterial).opacity = glowIntensity * 0.6 + flashIntensity * 0.4;
          core.visible = glowIntensity > 0;

          // Ring 1 (fast expanding shockwave)
          ring1.scale.setScalar(sn.maxSize * (0.5 + sn.progress * 10));
          (ring1.material as THREE.MeshBasicMaterial).color = currentColor;
          (ring1.material as THREE.MeshBasicMaterial).opacity = flashIntensity * 0.8;
          ring1.visible = flashIntensity > 0;

          // Ring 2 (slower, lingering expanding ring)
          ring2.scale.setScalar(sn.maxSize * (1 + sn.progress * 4));
          (ring2.material as THREE.MeshBasicMaterial).color = currentColor;
          (ring2.material as THREE.MeshBasicMaterial).opacity = glowIntensity * 0.4 * (1 - sn.progress);
          ring2.visible = glowIntensity > 0;

          // Face camera
          group.quaternion.copy(state.camera.quaternion);
        }

        if (sn.progress >= 1) {
          sn.active = false;
          if (groupRef.current.children[i]) {
            groupRef.current.children[i].visible = false;
          }
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {supernovas.map((sn, i) => (
        <group key={i} visible={false}>
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[1, 1.1, 32]} />
            <meshBasicMaterial transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <ringGeometry args={[1, 1.3, 32]} />
            <meshBasicMaterial transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CelestialScene({ isDay, showOrbits, timeSpeed, onPlanetHover, onPlanetClick }: { 
  isDay: boolean, 
  showOrbits: boolean, 
  timeSpeed: number,
  onPlanetHover: (data: PlanetData | null) => void,
  onPlanetClick: (data: PlanetData) => void
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const virtualTimeRef = useRef(0);
  const { manualLowPower } = usePerformance();

  useFrame((state, delta) => {
    // Update virtual time
    virtualTimeRef.current += delta * 1000 * timeSpeed;
    
    // Update scroll position for the whole scene
    const scrollY = window.scrollY;
    if (groupRef.current) {
      groupRef.current.position.y = (scrollY * 0.01) - 5;
    }
  });

  return (
    <group ref={groupRef}>
      <Sun isDay={isDay} />
      {!manualLowPower && <CometField count={5} />}
      <MeteorShower />
      <DistantSupernova />
      {PLANETS.map((planet) => (
        <RealisticPlanet 
          key={planet.name} 
          data={planet} 
          showOrbits={showOrbits} 
          virtualTime={virtualTimeRef.current} 
          onHover={onPlanetHover}
          onClick={onPlanetClick}
        />
      ))}
      {/* Supernova / Spiral Galaxy far below the solar system */}
      {!manualLowPower && <SupernovaGalaxy />}
    </group>
  );
}

function SupernovaGalaxy() {
  const { primary, secondary } = useThemeColors();
  const pointsRef = useRef<THREE.Points>(null!);
  
  const particles = useMemo(() => {
    const count = 10000; // More particles for a dense galaxy
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const color1 = new THREE.Color(primary);
    const color2 = new THREE.Color(secondary);
    const color3 = new THREE.Color("#ffffff");
    
    for (let i = 0; i < count; i++) {
      // Create a distinct spiral galaxy with arms
      const arms = 4;
      const r = Math.random() * 80;
      const armOffset = (i % arms) * ((Math.PI * 2) / arms);
      const spiral = r * 0.1; // Twist
      const theta = armOffset + spiral + (Math.random() - 0.5) * 0.5; // Add some scatter
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = (Math.random() - 0.5) * 8 * Math.exp(-r / 20); // Bulge in the center
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Mix colors: core is bright white/primary, edges are secondary
      const mixRatio = r / 80;
      const mixedColor = color1.clone().lerp(color2, mixRatio);
      if (r < 15 || Math.random() > 0.95) mixedColor.lerp(color3, 0.8); // Bright core and random bright stars
      
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    return { positions, colors };
  }, [primary, secondary]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05; // Spin the galaxy
    }
  });

  return (
    <group position={[0, -200, 0]} rotation={[0.4, 0, 0.2]}>
      <Points ref={pointsRef} positions={particles.positions} colors={particles.colors} stride={3}>
        <PointMaterial 
          transparent 
          vertexColors
          size={0.8} 
          sizeAttenuation={false} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
          opacity={0.9} 
        />
      </Points>
    </group>
  );
}

function CelestialSkybox() {
  // Using a 4K high-resolution Milky Way / starry night texture
  const texture = useTexture("https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=3840&q=100");
  const ref = useRef<THREE.Mesh>(null!);
  const { planetSegments } = usePerformance();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.002;
      ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.001) * 0.02;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[300, planetSegments, planetSegments]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.BackSide} 
        transparent 
        opacity={0.3} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

export default function GlobalBackground() {
  const [isDark, setIsDark] = useState(true);
  const [isDay, setIsDay] = useState(true);
  const [showOrbits, setShowOrbits] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  // Hide solar system settings UI — accessible via triple-click on logo if needed
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null);
  const { primary } = useThemeColors();
  const { postProcessing, pixelRatio, disable3D, manualLowPower } = usePerformance();

  // ALL hooks must run before any conditional return
  useEffect(() => {
    const checkDark = () => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
      setIsDay(!dark);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { observer.disconnect(); };
  }, []);

  const activePlanet = selectedPlanet || hoveredPlanet;

  // CSS-only fallback — no WebGL, no hooks violations
  if (disable3D || manualLowPower) {
    return (
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden"
        style={{ backgroundColor: '#010103' }}>
        <div className="absolute inset-0">
          <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-pulse"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', top: '10%', left: '20%', animationDuration: '4s' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', bottom: '20%', right: '15%', animation: 'pulse 6s ease-in-out infinite' }} />
          <div className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', top: '50%', left: '50%', animation: 'pulse 8s ease-in-out infinite' }} />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 85% 70%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 90% 15%, rgba(255,255,255,0.5) 0%, transparent 100%)` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: isDay ? CELESTIAL_THEME.day.bg : CELESTIAL_THEME.night.bg }}
      >
        <Canvas 
          camera={{ position: [0, 40, 80], fov: 45 }}
          dpr={pixelRatio}
          gl={{ 
            antialias: !postProcessing,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true
          }}
        >
          <color attach="background" args={[isDay ? CELESTIAL_THEME.day.bg : CELESTIAL_THEME.night.bg]} />
          <ambientLight intensity={isDay ? CELESTIAL_THEME.day.ambient : CELESTIAL_THEME.night.ambient} />
          
          <StarField isDay={isDay} />
          <Suspense fallback={null}>
            <CelestialSkybox />
          </Suspense>
          <CelestialScene 
            isDay={isDay} 
            showOrbits={showOrbits} 
            timeSpeed={timeSpeed} 
            onPlanetHover={setHoveredPlanet}
            onPlanetClick={setSelectedPlanet}
          />
          
          {postProcessing && (
            <EffectComposer multisampling={0}>
              <Bloom 
                intensity={isDay ? CELESTIAL_THEME.day.bloom : CELESTIAL_THEME.night.bloom} 
                luminanceThreshold={0.15} 
                luminanceSmoothing={0.9} 
              />
            </EffectComposer>
          )}
        </Canvas>
        
        {/* Space Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        
        {/* Noise Texture to hide banding and seams */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Planet Info Overlay */}
      <AnimatePresence>
        {activePlanet && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-24 left-4 right-4 md:top-24 md:bottom-auto md:left-8 md:right-auto z-[100] pointer-events-auto"
          >
            <div className="glass p-6 rounded-[2rem] border-romantic-cyan/20 w-full md:w-auto md:min-w-[280px] shadow-2xl relative overflow-hidden">
              {/* Background Glow */}
              <div 
                className="absolute -top-12 -right-12 w-32 h-32 blur-3xl opacity-20 rounded-full"
                style={{ backgroundColor: primary }}
              />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">{activePlanet.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-romantic-cyan animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-romantic-cyan/60">Celestial Body</span>
                  </div>
                </div>
                {selectedPlanet && (
                  <button 
                    onClick={() => setSelectedPlanet(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <EyeOff size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="glass-dark p-3 rounded-xl border-white/5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block mb-1">Distance</span>
                    <span className="text-sm font-bold text-white">{activePlanet.a.toFixed(3)} AU</span>
                  </div>
                  <div className="glass-dark p-3 rounded-xl border-white/5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block mb-1">Orbital Period</span>
                    <span className="text-sm font-bold text-white">{activePlanet.period} Days</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="glass-dark p-3 rounded-xl border-white/5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block mb-1">Relative Size</span>
                    <span className="text-sm font-bold text-white">{(activePlanet.size * 100).toFixed(0)}%</span>
                  </div>
                  <div className="glass-dark p-3 rounded-xl border-white/5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block mb-1">Tilt</span>
                    <span className="text-sm font-bold text-white">{activePlanet.tilt}°</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-6 pt-4 border-t border-white/5">
                <p className="text-[10px] leading-relaxed text-white/60 italic">
                  {selectedPlanet 
                    ? "Pinned to view. Click another planet or close to reset." 
                    : "Hovering to inspect. Click to pin information."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls UI - Collapsible and less intrusive */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-6 z-[100] pointer-events-auto flex flex-col gap-3 items-end">
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="flex flex-col gap-3 items-end"
            >
              {/* Time Speed Control */}
              <div className="glass p-3 rounded-2xl flex flex-col gap-2 border-romantic-cyan/20 min-w-[180px] shadow-2xl">
                <span className="text-[9px] font-mono uppercase tracking-widest text-romantic-cyan/60 px-1">Simulation Speed</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[1, 10000, 100000, 1000000].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setTimeSpeed(speed)}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                        timeSpeed === speed 
                          ? "bg-romantic-cyan text-black" 
                          : "hover:bg-white/5 text-romantic-cyan/60"
                      }`}
                    >
                      {speed === 1 ? "Real" : `${speed.toLocaleString()}x`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orbit Toggle */}
              <button
                onClick={() => setShowOrbits(!showOrbits)}
                className="w-full p-3 rounded-2xl glass hover:bg-white/10 transition-all flex items-center justify-between gap-3 border-romantic-cyan/20 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {showOrbits ? <EyeOff size={18} className="text-romantic-cyan" /> : <Eye size={18} className="text-romantic-cyan" />}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-romantic-cyan font-bold">
                    Orbit Lines
                  </span>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${showOrbits ? 'bg-romantic-cyan/40' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${showOrbits ? 'right-1 bg-romantic-cyan' : 'left-1 bg-white/40'}`} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings button hidden — solar system settings not needed in production */}
      </div>
    </>
  );
}

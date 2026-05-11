import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PerformanceSettings {
  isMobile: boolean;
  isLowEndDevice: boolean;
  starCount: number;
  planetSegments: number;
  orbitSegments: number;
  postProcessing: boolean;
  pixelRatio: number;
  useTransmission: boolean;
  manualLowPower: boolean;
  disable3D: boolean;
  toggleLowPowerMode: () => void;
}

const PerformanceContext = createContext<PerformanceSettings | undefined>(undefined);

function detectDeviceCapability(): { isMobile: boolean; isLowEnd: boolean } {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false };

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;

  const lowRAM = (navigator as any).deviceMemory !== undefined && (navigator as any).deviceMemory <= 2;
  const lowCPU = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;
  const savingData = (navigator as any).connection?.saveData === true;
  const slowNetwork = ['slow-2g', '2g', '3g'].includes((navigator as any).connection?.effectiveType);

  const isLowEnd = isMobile && (lowRAM || lowCPU || savingData || slowNetwork);

  return { isMobile, isLowEnd };
}

function getSettings(isMobile: boolean, isLowEnd: boolean, manualLowPower: boolean) {
  const disable3D = isLowEnd;

  if (disable3D || manualLowPower) {
    return {
      isMobile,
      isLowEndDevice: isLowEnd,
      starCount: 3000,
      planetSegments: 16,
      orbitSegments: 32,
      postProcessing: false,
      pixelRatio: 1,
      useTransmission: false,
      disable3D,
    };
  }

  if (isMobile) {
    return {
      isMobile,
      isLowEndDevice: false,
      starCount: 6000,
      planetSegments: 24,
      orbitSegments: 48,
      postProcessing: false,
      pixelRatio: Math.min(window.devicePixelRatio, 1.5),
      useTransmission: false,
      disable3D: false,
    };
  }

  return {
    isMobile: false,
    isLowEndDevice: false,
    starCount: 30000,
    planetSegments: 64,
    orbitSegments: 128,
    postProcessing: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    useTransmission: true,
    disable3D: false,
  };
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const { isMobile, isLowEnd } = detectDeviceCapability();

  const [manualLowPower, setManualLowPower] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('low_power_mode');
    if (stored !== null) return stored === 'true';
    return isMobile; // Auto low power on mobile
  });

  const [settings, setSettings] = useState(() => getSettings(isMobile, isLowEnd, isMobile ? true : false));

  useEffect(() => {
    setSettings(getSettings(isMobile, isLowEnd, manualLowPower));
  }, [manualLowPower]);

  const toggleLowPowerMode = () => {
    setManualLowPower(prev => {
      const newValue = !prev;
      localStorage.setItem('low_power_mode', String(newValue));
      return newValue;
    });
  };

  const value: PerformanceSettings = {
    ...settings,
    manualLowPower,
    toggleLowPowerMode,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

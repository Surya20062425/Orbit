import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CelestialBody, CameraPreset } from './types';
import { CELESTIAL_BODIES } from './data/celestialBodies';
import { dateToJD, jdToDate } from './utils/orbitalMechanics';
import { OrreryScene } from './components/OrreryScene';
import { HeaderNav } from './components/HeaderNav';
import { TimelineControls } from './components/TimelineControls';
import { ObjectDossier } from './components/ObjectDossier';
import { PlanetaryDefenseSim } from './components/PlanetaryDefenseSim';
import { CloseApproachRadar } from './components/CloseApproachRadar';
import { EducationalHub } from './components/EducationalHub';
import { AiAssistantModal } from './components/AiAssistantModal';

export default function App() {
  const [bodies, setBodies] = useState<CelestialBody[]>(CELESTIAL_BODIES);
  
  // Default selected body: 99942 Apophis (iconic PHA)
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(
    CELESTIAL_BODIES.find((b) => b.id === 'apophis') || CELESTIAL_BODIES[3]
  );

  // Time & Simulation State
  const [currentJD, setCurrentJD] = useState<number>(() => dateToJD(new Date()));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(30); // 30 days per real second
  const [direction, setDirection] = useState<1 | -1>(1);

  // Visual Display Layers
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showBelt, setShowBelt] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPHAsOnly, setShowPHAsOnly] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Camera State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('innerSystem');

  // Modals
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [isImpactSimOpen, setIsImpactSimOpen] = useState<boolean>(false);
  const [isEduHubOpen, setIsEduHubOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  // Frame tick loop for ephemeris time evolution
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (isPlaying) {
        // days to advance = speed * direction * deltaSec
        const daysToAdvance = speed * direction * deltaSec;
        setCurrentJD((prevJD) => prevJD + daysToAdvance);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed, direction]);

  // Handler for jumping simulation date
  const handleJumpToDate = useCallback((date: Date) => {
    setCurrentJD(dateToJD(date));
  }, []);

  // Handler for Radar Jump
  const handleSelectBodyAndJumpDate = useCallback((body: CelestialBody, date: Date) => {
    setSelectedBody(body);
    setCurrentJD(dateToJD(date));
    setCameraPreset('follow');
  }, []);

  return (
    <div id="solar-orrery-app" className="relative w-screen h-screen overflow-hidden bg-[#050507] text-[#e0e0e0] flex flex-col font-sans select-none">
      {/* Top Mission Control Navigation Bar */}
      <HeaderNav
        allBodies={bodies}
        selectedBody={selectedBody}
        onSelectBody={(body) => {
          setSelectedBody(body);
          if (body) setCameraPreset('follow');
        }}
        showOrbits={showOrbits}
        onToggleOrbits={() => setShowOrbits(!showOrbits)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        showBelt={showBelt}
        onToggleBelt={() => setShowBelt(!showBelt)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showPHAsOnly={showPHAsOnly}
        onTogglePHAsOnly={() => setShowPHAsOnly(!showPHAsOnly)}
        activeCategoryFilter={activeCategoryFilter}
        onCategoryFilterChange={setActiveCategoryFilter}
        cameraPreset={cameraPreset}
        onSetCameraPreset={setCameraPreset}
        onOpenRadar={() => setIsRadarOpen(true)}
        onOpenImpactSim={() => setIsImpactSimOpen(true)}
        onOpenEduHub={() => setIsEduHubOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      />

      {/* Main Viewport Workspace: 3D Scene + Right Telemetry Dossier Panel */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* 3D WebGL Orrery Canvas */}
        <main className="relative flex-1 h-full">
          <OrreryScene
            bodies={bodies}
            selectedBody={selectedBody}
            onSelectBody={(body) => {
              setSelectedBody(body);
              if (body) setCameraPreset('follow');
            }}
            currentJD={currentJD}
            showOrbits={showOrbits}
            showLabels={showLabels}
            showBelt={showBelt}
            showGrid={showGrid}
            showPHAsOnly={showPHAsOnly}
            activeCategoryFilter={activeCategoryFilter}
            cameraPreset={cameraPreset}
            onResetCameraPreset={() => {
              if (cameraPreset !== 'free') setCameraPreset('free');
            }}
          />
        </main>

        {/* Right Collapsible Telemetry Dossier Panel */}
        {selectedBody && (
          <ObjectDossier
            body={selectedBody}
            onClose={() => setSelectedBody(null)}
            onFocusCamera={() => setCameraPreset('follow')}
            onOpenImpactSim={() => setIsImpactSimOpen(true)}
            onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          />
        )}
      </div>

      {/* Bottom Mission Control Time-Lapse & Ephemeris Controls Dock */}
      <TimelineControls
        currentJD={currentJD}
        onJDChange={setCurrentJD}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        speed={speed}
        onSpeedChange={setSpeed}
        direction={direction}
        onToggleDirection={() => setDirection(direction === 1 ? -1 : 1)}
        onJumpToDate={handleJumpToDate}
      />

      {/* Sophisticated Dark Metadata Status Footer */}
      <footer className="h-6.5 bg-[#0a0a0f] border-t border-white/5 flex items-center justify-between px-6 text-[9px] uppercase tracking-widest text-white/30 shrink-0 z-20">
        <span className="hidden sm:inline">Coordinate System: Heliocentric J2000 Ecliptic</span>
        <span className="font-mono">JPL Horizons Ephemeris • Keplerian Astrodynamics</span>
        <span className="text-amber-500/60 font-medium">Dataset V. 24.1.2 • Active Stream</span>
      </footer>

      {/* MODAL 1: Planetary Defense & Impact Sandbox */}
      {isImpactSimOpen && (
        <PlanetaryDefenseSim
          initialBody={selectedBody}
          allBodies={bodies}
          onClose={() => setIsImpactSimOpen(false)}
        />
      )}

      {/* MODAL 2: NASA JPL Close Approach Radar */}
      {isRadarOpen && (
        <CloseApproachRadar
          allBodies={bodies}
          onSelectBodyAndJumpDate={handleSelectBodyAndJumpDate}
          onClose={() => setIsRadarOpen(false)}
        />
      )}

      {/* MODAL 3: Educational Reference Center */}
      {isEduHubOpen && (
        <EducationalHub onClose={() => setIsEduHubOpen(false)} />
      )}

      {/* MODAL 4: AI Astrodynamics Consultant */}
      {isAiAssistantOpen && (
        <AiAssistantModal
          selectedBody={selectedBody}
          onClose={() => setIsAiAssistantOpen(false)}
        />
      )}
    </div>
  );
}

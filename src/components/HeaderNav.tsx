import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Orbit, 
  Search, 
  Eye, 
  EyeOff, 
  Grid, 
  Sparkles, 
  Radar, 
  ShieldAlert, 
  BookOpen, 
  Bot, 
  Layers, 
  Camera, 
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { CelestialBody, CameraPreset } from '../types';

interface HeaderNavProps {
  allBodies: CelestialBody[];
  selectedBody: CelestialBody | null;
  onSelectBody: (body: CelestialBody | null) => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showBelt: boolean;
  onToggleBelt: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showPHAsOnly: boolean;
  onTogglePHAsOnly: () => void;
  activeCategoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  cameraPreset: CameraPreset;
  onSetCameraPreset: (preset: CameraPreset) => void;
  onOpenRadar: () => void;
  onOpenImpactSim: () => void;
  onOpenEduHub: () => void;
  onOpenAiAssistant: () => void;
}

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Objects' },
  { id: 'apollo', label: 'Apollos' },
  { id: 'aten', label: 'Atens' },
  { id: 'amor', label: 'Amors' },
  { id: 'atira', label: 'Atiras' },
  { id: 'comet', label: 'Comets' },
  { id: 'planet', label: 'Planets' },
  { id: 'moon', label: 'Moons' },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({
  allBodies,
  selectedBody,
  onSelectBody,
  showOrbits,
  onToggleOrbits,
  showLabels,
  onToggleLabels,
  showBelt,
  onToggleBelt,
  showGrid,
  onToggleGrid,
  showPHAsOnly,
  onTogglePHAsOnly,
  activeCategoryFilter,
  onCategoryFilterChange,
  cameraPreset,
  onSetCameraPreset,
  onOpenRadar,
  onOpenImpactSim,
  onOpenEduHub,
  onOpenAiAssistant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showViewSettings, setShowViewSettings] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search Results
  const searchResults = allBodies.filter((b) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.designation && b.designation.toLowerCase().includes(q)) ||
      b.category.toLowerCase().includes(q) ||
      (b.description && b.description.toLowerCase().includes(q)) ||
      (b.missions && b.missions.some((m) => m.toLowerCase().includes(q)))
    );
  }).slice(0, 10);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const phaCount = allBodies.filter((b) => b.isPHA).length;

  return (
    <header 
      id="mission-control-header" 
      role="banner"
      className="w-full bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30 shadow-2xl text-[#e0e0e0] select-none"
    >
      {/* Brand & Mission Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0">
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-light tracking-widest uppercase text-white font-sans">
                AETHER <span className="font-bold text-amber-500">ORRERY</span>
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded font-semibold tracking-wider">
                3D NEO
              </span>
            </div>
            <p className="text-[9px] text-white/40 font-mono tracking-widest uppercase">
              Heliocentric J2000 • NASA JPL Ephemeris
            </p>
          </div>
        </div>

        {/* Global Object Search Bar */}
        <div ref={searchContainerRef} className="relative min-w-[170px] md:min-w-[220px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asteroid, planet..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-80 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[9px] font-semibold text-white/40 uppercase tracking-widest px-2 py-1 border-b border-white/10">
                Matching Ephemeris Targets ({searchResults.length})
              </div>
              {searchResults.map((body) => (
                <button
                  key={body.id}
                  onClick={() => {
                    onSelectBody(body);
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-amber-500/15 hover:text-amber-200 transition-colors text-white/90"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: body.color }} />
                    <span className="font-medium text-white font-sans">{body.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {body.isPHA && (
                      <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-900 rounded font-bold">
                        PHA
                      </span>
                    )}
                    <span className="text-white/40 uppercase tracking-wider">{body.category}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Filter Chips / Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl text-xs">
        {/* PHA Quick Toggle */}
        <button
          onClick={onTogglePHAsOnly}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
            showPHAsOnly
              ? 'bg-red-950 text-red-300 border border-red-800 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
              : 'text-red-400/80 hover:bg-white/5 hover:text-red-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>PHAs Only ({phaCount})</span>
        </button>

        <span className="h-4 w-px bg-white/10 mx-1" />

        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = !showPHAsOnly && activeCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                if (showPHAsOnly) onTogglePHAsOnly();
                onCategoryFilterChange(cat.id);
              }}
              className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider transition-all ${
                isSelected
                  ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>

      {/* Right Action Tools & Modal Triggers */}
      <div className="flex items-center gap-2">
        {/* JPL Live Sync Active Pill */}
        <div className="hidden xl:flex px-2.5 py-1 bg-white/5 border border-white/15 rounded text-[10px] uppercase tracking-wider text-white/50">
          JPL Data: <span className="text-emerald-400 font-semibold ml-1">Live Sync</span>
        </div>

        {/* Camera Views Preset Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCameraMenu(!showCameraMenu)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 text-white/80 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition-all"
            title="Switch Camera Perspectives"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Perspective</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>

          {showCameraMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-56 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[9px] font-semibold text-white/40 uppercase tracking-widest px-2 py-1 border-b border-white/10">
                Camera Perspectives
              </div>
              <button
                onClick={() => {
                  onSetCameraPreset('topDown');
                  setShowCameraMenu(false);
                }}
                className={`flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                  cameraPreset === 'topDown' ? 'bg-amber-500 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>Top-Down (Polar View)</span>
              </button>
              <button
                onClick={() => {
                  onSetCameraPreset('innerSystem');
                  setShowCameraMenu(false);
                }}
                className={`flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                  cameraPreset === 'innerSystem' ? 'bg-amber-500 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>Inner Solar System (0-2 AU)</span>
              </button>
              <button
                onClick={() => {
                  onSetCameraPreset('outerSystem');
                  setShowCameraMenu(false);
                }}
                className={`flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                  cameraPreset === 'outerSystem' ? 'bg-amber-500 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>Full System (0-30 AU)</span>
              </button>
              <button
                onClick={() => {
                  onSetCameraPreset('earthGeocentric');
                  setShowCameraMenu(false);
                }}
                className={`flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                  cameraPreset === 'earthGeocentric' ? 'bg-amber-500 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>Earth Flyby Proximity</span>
              </button>
            </div>
          )}
        </div>

        {/* View Layers Toggle Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowViewSettings(!showViewSettings)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 text-white/80 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition-all"
            title="Display toggles"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Layers</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>

          {showViewSettings && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-2 flex flex-col gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <label className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-white/80">
                <span>Orbit Trajectories</span>
                <input
                  type="checkbox"
                  checked={showOrbits}
                  onChange={onToggleOrbits}
                  className="accent-amber-500"
                />
              </label>
              <label className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-white/80">
                <span>Object HUD Labels</span>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={onToggleLabels}
                  className="accent-amber-500"
                />
              </label>
              <label className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-white/80">
                <span>Asteroid Belt Particles</span>
                <input
                  type="checkbox"
                  checked={showBelt}
                  onChange={onToggleBelt}
                  className="accent-amber-500"
                />
              </label>
              <label className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-white/80">
                <span>Ecliptic Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={onToggleGrid}
                  className="accent-amber-500"
                />
              </label>
            </div>
          )}
        </div>

        {/* Modal Button: Close Approach Radar Feed */}
        <button
          onClick={onOpenRadar}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/50 text-amber-200 text-xs px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Radar className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span className="hidden md:inline text-[11px] uppercase tracking-wider">CAD Radar</span>
        </button>

        {/* Modal Button: Planetary Defense Simulator */}
        <button
          onClick={onOpenImpactSim}
          className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-900/80 hover:border-red-700 text-red-300 text-xs px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden md:inline text-[11px] uppercase tracking-wider">Defense Lab</span>
        </button>

        {/* Modal Button: Educational Hub */}
        <button
          onClick={onOpenEduHub}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white/80 hover:text-white text-xs px-2.5 py-1.5 rounded-lg transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-white/60" />
          <span className="hidden md:inline text-[11px] uppercase tracking-wider">Reference</span>
        </button>

        {/* Modal Button: AI Astrodynamics Advisor */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline uppercase tracking-wider text-[11px]">AI Advisor</span>
        </button>
      </div>
    </header>
  );
};

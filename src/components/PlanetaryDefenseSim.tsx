import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Crosshair, 
  Gauge, 
  TrendingUp, 
  AlertOctagon, 
  Atom, 
  Radio, 
  Layers
} from 'lucide-react';
import { CelestialBody } from '../types';
import { calculateImpactPhysics, calculateDeflection, EARTH_RADIUS_KM } from '../utils/orbitalMechanics';

interface PlanetaryDefenseSimProps {
  initialBody: CelestialBody | null;
  allBodies: CelestialBody[];
  onClose: () => void;
}

export const PlanetaryDefenseSim: React.FC<PlanetaryDefenseSimProps> = ({
  initialBody,
  allBodies,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'impact' | 'deflect'>('impact');

  // Asteroid Selection
  const [selectedBodyId, setSelectedBodyId] = useState<string>(initialBody?.id || 'apophis');

  const activeBody = useMemo(() => {
    return allBodies.find((b) => b.id === selectedBodyId) || allBodies[0];
  }, [allBodies, selectedBodyId]);

  // Impact Parameters State
  const [customDiameter, setCustomDiameter] = useState<number>(initialBody?.diameterMeters || 370);
  const [customVelocity, setCustomVelocity] = useState<number>(initialBody?.impactVelocityKms || 17.5);
  const [customDensity, setCustomDensity] = useState<number>(2600); // 2600 kg/m^3 (stony)
  const [impactAngle, setImpactAngle] = useState<number>(45);
  const [targetSurface, setTargetSurface] = useState<'sedimentary' | 'crystalline' | 'water'>('sedimentary');

  // Deflection Parameters State
  const [deflectionTechnique, setDeflectionTechnique] = useState<'kinetic' | 'gravity' | 'nuclear' | 'laser'>('kinetic');
  const [warningYears, setWarningYears] = useState<number>(10);
  const [spacecraftMassKg, setSpacecraftMassKg] = useState<number>(1000);

  // When body changes in dropdown, update custom sliders
  const handleBodyChange = (id: string) => {
    setSelectedBodyId(id);
    const body = allBodies.find((b) => b.id === id);
    if (body) {
      setCustomDiameter(body.diameterMeters);
      setCustomVelocity(body.impactVelocityKms || 18.0);
      const density = body.spectralClass === 'M' ? 5500 : body.spectralClass === 'C' ? 1800 : 2600;
      setCustomDensity(density);
    }
  };

  // Compute Impact Physics
  const impactResults = useMemo(() => {
    return calculateImpactPhysics(
      customDiameter,
      customDensity,
      customVelocity,
      impactAngle,
      targetSurface
    );
  }, [customDiameter, customDensity, customVelocity, impactAngle, targetSurface]);

  // Compute Deflection Mission
  const deflectionResults = useMemo(() => {
    return calculateDeflection(
      customDiameter,
      customDensity,
      warningYears,
      deflectionTechnique,
      spacecraftMassKg
    );
  }, [customDiameter, customDensity, warningYears, deflectionTechnique, spacecraftMassKg]);

  return (
    <div 
      id="planetary-defense-modal" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="planetary-defense-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="bg-[#050507] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        {/* Header */}
        <div className="bg-black/60 border-b border-white/10 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-800/60 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="planetary-defense-title" className="text-base md:text-lg font-light text-white tracking-widest uppercase font-sans">
                Planetary Defense <span className="font-bold text-amber-500">& Impact Simulator</span>
              </h2>
              <p className="text-[10px] text-white/40 font-mono tracking-wider">
                NASA COLLINS/MELOSH IMPACT PHYSICS & DART DEFLECTION MECHANICS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('impact')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${
              activeTab === 'impact'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-red-400" />
            <span>1. Kinetic Impact Analyzer</span>
          </button>

          <button
            onClick={() => setActiveTab('deflect')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all ${
              activeTab === 'deflect'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>2. Deflection Strategy Lab</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Target Asteroid Selector Bar */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider text-[11px]">Select Target NEO:</span>
              <select
                value={selectedBodyId}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-500"
              >
                {allBodies
                  .filter((b) => b.category !== 'sun' && b.category !== 'planet')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.diameterMeters}m - {b.category.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-white/40">Diameter: <strong className="text-white">{customDiameter}m</strong></span>
              <span>•</span>
              <span className="text-white/40">Velocity: <strong className="text-amber-300">{customVelocity} km/s</strong></span>
            </div>
          </div>

          {activeTab === 'impact' ? (
            /* ============================================================ */
            /* TAB 1: IMPACT SCENARIO ANALYZER */
            /* ============================================================ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Config Sliders */}
              <div className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-amber-400" /> Impact Parameters
                </h3>

                {/* Diameter Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Asteroid Diameter</span>
                    <span className="font-mono font-bold text-white">{customDiameter} meters</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={2000}
                    step={10}
                    value={customDiameter}
                    onChange={(e) => setCustomDiameter(parseFloat(e.target.value))}
                    className="h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>10m (Chelyabinsk)</span>
                    <span>370m (Apophis)</span>
                    <span>1.3km (1950 DA)</span>
                  </div>
                </div>

                {/* Velocity Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Impact Velocity</span>
                    <span className="font-mono font-bold text-amber-300">{customVelocity} km/s</span>
                  </div>
                  <input
                    type="range"
                    min={11.2}
                    max={72.0}
                    step={0.5}
                    value={customVelocity}
                    onChange={(e) => setCustomVelocity(parseFloat(e.target.value))}
                    className="h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>11.2 km/s (Min)</span>
                    <span>30 km/s (Cometary)</span>
                    <span>72 km/s (Max Retrograde)</span>
                  </div>
                </div>

                {/* Density Selector */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/50">Asteroid Composition Density</span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setCustomDensity(1600)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        customDensity === 1600
                          ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      Porous / Carbon<br /><span className="text-[10px] opacity-75">1,600 kg/m³</span>
                    </button>
                    <button
                      onClick={() => setCustomDensity(2600)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        customDensity === 2600
                          ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      Stony / Silicate<br /><span className="text-[10px] opacity-75">2,600 kg/m³</span>
                    </button>
                    <button
                      onClick={() => setCustomDensity(5500)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        customDensity === 5500
                          ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      Metallic Nickel-Iron<br /><span className="text-[10px] opacity-75">5,500 kg/m³</span>
                    </button>
                  </div>
                </div>

                {/* Target Surface Type */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/50">Impact Target Surface</span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      onClick={() => setTargetSurface('sedimentary')}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        targetSurface === 'sedimentary'
                          ? 'bg-white/10 border-amber-500 text-amber-200 font-medium'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      Sedimentary Rock
                    </button>
                    <button
                      onClick={() => setTargetSurface('crystalline')}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        targetSurface === 'crystalline'
                          ? 'bg-white/10 border-amber-500 text-amber-200 font-medium'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      Crystalline Granite
                    </button>
                    <button
                      onClick={() => setTargetSurface('water')}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        targetSurface === 'water'
                          ? 'bg-white/10 border-amber-500 text-amber-200 font-medium'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      Ocean Basin
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Calculated Impact Physics & Damage Radii */}
              <div className="flex flex-col gap-4">
                {/* Total Kinetic Energy Card */}
                <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-400" /> TOTAL KINETIC ENERGY RELEASE
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-red-950 text-red-200 border border-red-800 rounded font-bold">
                      {impactResults.energyMegatonsTNT >= 1
                        ? `${impactResults.energyMegatonsTNT.toFixed(1)} MEGATONS TNT`
                        : `${(impactResults.energyMegatonsTNT * 1000).toFixed(0)} KILOTONS TNT`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1 text-xs font-mono">
                    <div className="bg-black/40 p-2.5 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">HIROSHIMA EQUIVALENT</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {Math.round(impactResults.hiroshimaEquivalents).toLocaleString()}×
                      </span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">TSAR BOMBA EQUIVALENT</span>
                      <span className="text-red-400 font-bold text-sm">
                        {impactResults.tsarBombaEquivalents.toFixed(2)}× (50 Mt)
                      </span>
                    </div>
                  </div>

                  {/* Summary Damage Narrative */}
                  <div className="mt-1 p-2.5 bg-red-950/30 rounded-lg text-xs leading-relaxed text-white/80 border border-red-900/30">
                    <strong className="text-red-300 block mb-0.5 uppercase text-[10px] tracking-wider">Physical Outcome:</strong>
                    {impactResults.damageSummary}
                  </div>
                </div>

                {/* Ground Zero & Blast Geometry Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                  <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" /> Blast Geometry & Crater Dimensions
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-black/40 p-2 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">CRATER DIAMETER</span>
                      <span className="text-white font-bold text-sm">
                        {impactResults.craterDiameterMeters > 1000
                          ? `${(impactResults.craterDiameterMeters / 1000).toFixed(2)} km`
                          : `${impactResults.craterDiameterMeters} meters`}
                      </span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">CRATER DEPTH</span>
                      <span className="text-white font-bold text-sm">
                        {impactResults.craterDepthMeters} meters
                      </span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">THERMAL FIREBALL RADIUS</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {impactResults.fireballRadiusKm} km
                      </span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">SEVERE AIRBLAST RADIUS</span>
                      <span className="text-red-400 font-bold text-sm">
                        {impactResults.airblastRadiusKm} km
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/10">
                    <span className="text-white/40">Seismic Shockwave:</span>
                    <span className="font-bold text-amber-300">Richter M{impactResults.seismicMagnitudeRichter} Earthquake</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* TAB 2: DEFLECTION MITIGATION SANDBOX */
            /* ============================================================ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Technique Selection & Warning Time */}
              <div className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Deflection Strategy Selection
                </h3>

                {/* Mitigation Technique Picker */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setDeflectionTechnique('kinetic')}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                      deflectionTechnique === 'kinetic'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Kinetic Impactor</span>
                    </div>
                    <span className="text-[10px] text-white/40">NASA DART hypervelocity strike</span>
                  </button>

                  <button
                    onClick={() => setDeflectionTechnique('gravity')}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                      deflectionTechnique === 'gravity'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Gravity Tractor</span>
                    </div>
                    <span className="text-[10px] text-white/40">Gentle gravitational hover tug</span>
                  </button>

                  <button
                    onClick={() => setDeflectionTechnique('nuclear')}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                      deflectionTechnique === 'nuclear'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Atom className="w-3.5 h-3.5" />
                      <span>Nuclear Standoff</span>
                    </div>
                    <span className="text-[10px] text-white/40">X-ray ablation surface rocket pulse</span>
                  </button>

                  <button
                    onClick={() => setDeflectionTechnique('laser')}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                      deflectionTechnique === 'laser'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                        : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Laser Ablation</span>
                    </div>
                    <span className="text-[10px] text-white/40">Solar-concentrator sublimation jet</span>
                  </button>
                </div>

                {/* Warning Lead Time Slider */}
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Warning Lead Time Prior to Impact</span>
                    <span className="font-mono font-bold text-amber-300">{warningYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={warningYears}
                    onChange={(e) => setWarningYears(parseInt(e.target.value))}
                    className="h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>1 yr (Emergency)</span>
                    <span>10 yrs (Optimal DART)</span>
                    <span>30 yrs (Long-range)</span>
                  </div>
                </div>

                {/* Spacecraft Mass Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Deflection Spacecraft Mass</span>
                    <span className="font-mono font-bold text-white">{spacecraftMassKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={10000}
                    step={250}
                    value={spacecraftMassKg}
                    onChange={(e) => setSpacecraftMassKg(parseInt(e.target.value))}
                    className="h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>500 kg (DART class)</span>
                    <span>5,000 kg (Heavy)</span>
                    <span>10,000 kg (Mega Tug)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Mission Feasibility & Miss Distance Scorecard */}
              <div className="flex flex-col gap-4">
                <div
                  className={`border rounded-xl p-5 flex flex-col gap-3 transition-all ${
                    deflectionResults.isSuccessful
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg'
                      : 'bg-red-950/20 border-red-500/40 shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        deflectionResults.isSuccessful ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {deflectionResults.isSuccessful ? (
                        <>
                          <ShieldCheck className="w-5 h-5 text-emerald-400" /> DEFLECTION MISSION SUCCESSFUL
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="w-5 h-5 text-red-400" /> DEFLECTION INSUFFICIENT (IMPACT RISK)
                        </>
                      )}
                    </span>
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded font-bold ${
                        deflectionResults.isSuccessful
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {deflectionResults.missDistanceEarthRadii} R⊕ MISS DISTANCE
                    </span>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed">
                    {deflectionResults.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-1 text-xs font-mono">
                    <div className="bg-black/40 p-2.5 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">TOTAL MISS DISTANCE</span>
                      <span className="text-white font-bold text-sm">
                        {Math.round(deflectionResults.missDistanceEarthRadii * EARTH_RADIUS_KM).toLocaleString()} km
                      </span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-white/10">
                      <span className="text-white/40 text-[9px] block uppercase tracking-wider">SAFE THRESHOLD</span>
                      <span className="text-amber-400 font-bold text-sm">
                        ≥ 2.5 R⊕ (~16,000 km)
                      </span>
                    </div>
                  </div>

                  {/* Physics Explanation */}
                  <div className="text-[11px] text-white/50 leading-relaxed border-t border-white/10 pt-2">
                    <span className="text-white/80 font-medium block mb-0.5">Orbital Astrodynamics Rule:</span>
                    A tiny orbital period shift (Δv ≈ {(deflectionResults.requiredDeltaVKms * 1000).toFixed(4)} mm/s) compounded over {warningYears} orbital years translates into tens of thousands of kilometers of trajectory displacement at Earth encounter.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

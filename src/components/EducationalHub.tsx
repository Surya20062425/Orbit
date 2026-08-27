import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Orbit, 
  AlertTriangle, 
  ShieldCheck, 
  Telescope, 
  Coins, 
  Compass, 
  Rocket, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';

interface EducationalHubProps {
  onClose: () => void;
}

export const EducationalHub: React.FC<EducationalHubProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'taxonomy' | 'torino' | 'defense' | 'surveys' | 'mining'>('taxonomy');

  return (
    <div 
      id="educational-hub-modal" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="educational-hub-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="bg-[#050507] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        {/* Header */}
        <div className="bg-black/60 border-b border-white/10 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="educational-hub-title" className="text-base md:text-lg font-light text-white tracking-widest uppercase font-sans">
                Near-Earth Object <span className="font-bold text-amber-500">Scientific Reference</span>
              </h2>
              <p className="text-[10px] text-white/40 font-mono tracking-wider">
                NASA PLANETARY DEFENSE & ASTRODYNAMICS FUNDAMENTALS
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

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'taxonomy'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Orbit className="w-4 h-4 text-amber-400" />
            <span>NEO Orbital Families</span>
          </button>

          <button
            onClick={() => setActiveTab('torino')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'torino'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Torino Hazard Scale</span>
          </button>

          <button
            onClick={() => setActiveTab('defense')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'defense'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deflection Toolkit (DART)</span>
          </button>

          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'surveys'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Telescope className="w-4 h-4 text-amber-400" />
            <span>Surveys & Telescopes</span>
          </button>

          <button
            onClick={() => setActiveTab('mining')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'mining'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Asteroid Mining & ISRU</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-xs leading-relaxed space-y-4">
          {activeTab === 'taxonomy' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Orbit className="w-4 h-4 text-amber-400" /> What Defines a Near-Earth Object (NEO)?
                </h3>
                <p className="text-white/80">
                  Near-Earth Objects (NEOs) are asteroids and comets nudged by gravitational perturbations into orbits that bring them within <strong>1.3 Astronomical Units (AU)</strong> of the Sun at perihelion (<code className="font-mono text-amber-300">q ≤ 1.3 AU</code>). Because Earth orbits at 1.0 AU, these objects have trajectories crossing or approaching Earth's orbital corridor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">1. Atiras (Apohele Asteroids)</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/10 rounded">
                      Interior to Earth
                    </span>
                  </div>
                  <p className="text-white/70">
                    Orbits strictly contained <strong>inside Earth's orbit</strong> (<code className="font-mono">a &lt; 1.0 AU</code> and aphelion <code className="font-mono">Q &lt; 0.983 AU</code>). Because they stay inside our orbit toward solar glare, they are extremely difficult to detect with ground-based optical telescopes.
                  </p>
                  <span className="text-[10px] font-mono text-white/40 mt-1">Examples: 163693 Atira, 2020 AV2 ('Ayló'chaxnim).</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">2. Atens (Earth-Crossing)</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/10 rounded">
                      a &lt; 1.0 AU, Crosses Earth
                    </span>
                  </div>
                  <p className="text-white/70">
                    Semi-major axes smaller than Earth's (<code className="font-mono">a &lt; 1.0 AU</code>), but aphelion extends beyond Earth's perihelion (<code className="font-mono">Q ≥ 0.983 AU</code>), causing their orbital path to intersect Earth's trajectory.
                  </p>
                  <span className="text-[10px] font-mono text-white/40 mt-1">Examples: 99942 Apophis, 2062 Aten, 3753 Cruithne.</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">3. Apollos (Earth-Crossing)</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded font-bold">
                      a ≥ 1.0 AU, Crosses Earth
                    </span>
                  </div>
                  <p className="text-white/70">
                    The largest cohort of NEOs. Semi-major axes greater than Earth's (<code className="font-mono">a ≥ 1.0 AU</code>) with perihelion inside Earth's aphelion (<code className="font-mono">q ≤ 1.017 AU</code>), repeatedly intersecting Earth's orbital plane.
                  </p>
                  <span className="text-[10px] font-mono text-white/40 mt-1">Examples: 101955 Bennu, 65803 Didymos, 2024 YR4, 1950 DA.</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm">4. Amors (Earth-Approachers)</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/10 rounded">
                      Exterior, 1.017 &lt; q ≤ 1.3 AU
                    </span>
                  </div>
                  <p className="text-white/70">
                    Orbits located just outside Earth's orbit without crossing it, approaching Earth from the exterior between 1.017 AU and 1.3 AU. Many cross Mars's orbit.
                  </p>
                  <span className="text-[10px] font-mono text-white/40 mt-1">Examples: 433 Eros, 1221 Amor, 1036 Ganymed.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'torino' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Understanding the Torino Impact Hazard Scale
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Adopted by the International Astronomical Union (IAU), the Torino Scale is a standardized risk matrix assigning a 0 to 10 integer rating based on both <strong>collision probability</strong> and <strong>estimated kinetic impact energy</strong>.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="bg-white/5 border border-white/10 border-l-4 border-l-emerald-500 p-3 rounded-r-xl">
                  <span className="font-bold text-emerald-400 text-xs block uppercase tracking-wider">Level 0: White / Green (No Hazard)</span>
                  <p className="text-white/70 text-[11px] mt-0.5">
                    The likelihood of a collision is zero or effectively zero. Also applies to small objects that would burn up harmlessly as meteors in Earth's upper atmosphere.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 border-l-4 border-l-emerald-400 p-3 rounded-r-xl">
                  <span className="font-bold text-emerald-300 text-xs block uppercase tracking-wider">Level 1: Green (Normal / Routine Discovery)</span>
                  <p className="text-white/70 text-[11px] mt-0.5">
                    Routine discovery of a pass near Earth posing no unusual level of danger. New telescopic observations almost always reassign these to Level 0.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 border-l-4 border-l-amber-400 p-3 rounded-r-xl">
                  <span className="font-bold text-amber-300 text-xs block uppercase tracking-wider">Levels 2 – 4: Yellow (Meriting Attention by Astronomers)</span>
                  <p className="text-white/70 text-[11px] mt-0.5">
                    A close approach with 1% or greater chance of localized devastation. Requires active telescope tracking to refine orbital uncertainty ellipses.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 border-l-4 border-l-orange-500 p-3 rounded-r-xl">
                  <span className="font-bold text-orange-400 text-xs block uppercase tracking-wider">Levels 5 – 7: Orange (Threatening / Regional to Global Devastation)</span>
                  <p className="text-white/70 text-[11px] mt-0.5">
                    Close encounter posing serious threat of regional (Level 5) or global (Level 7) climatic devastation. Governmental emergency contingency planning is warranted.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 border-l-4 border-l-red-600 p-3 rounded-r-xl">
                  <span className="font-bold text-red-400 text-xs block uppercase tracking-wider">Levels 8 – 10: Red (Certain Collisions)</span>
                  <p className="text-white/70 text-[11px] mt-0.5">
                    Collision is 100% certain. Level 8 causes localized destruction; Level 9 causes regional devastation / tsunami; Level 10 is a global extinction-level event.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'defense' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Planetary Defense Deflection Toolkit
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Planetary defense is the only cosmic hazard that humanity has the technical capability to predict decades in advance and physically prevent.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-semibold text-amber-300 text-sm block mb-1">1. Kinetic Impactor (NASA DART)</span>
                  <p className="text-white/70">
                    Slamming a heavy spacecraft into the asteroid at ~6 km/s. In Sept 2022, NASA DART struck Dimorphos, transferring momentum with an ejecta recoil multiplier ($\beta \approx 2.5$), altering its orbit by 33 minutes.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-semibold text-emerald-300 text-sm block mb-1">2. Gravity Tractor</span>
                  <p className="text-white/70">
                    A heavy ion-propulsion spacecraft hovers tens of meters above the asteroid for years. The mutual gravitational attraction slowly and gently pulls the asteroid into a modified orbit without risking fragmentation.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-semibold text-red-300 text-sm block mb-1">3. Nuclear Standoff Detonation</span>
                  <p className="text-white/70">
                    A nuclear device detonates hundreds of meters above the asteroid surface. The intense X-ray and neutron flux flash-vaporizes a thin layer of rock, creating a massive rocket-like blowoff that pushes the asteroid away.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-semibold text-purple-300 text-sm block mb-1">4. Directed Energy / Laser Ablation</span>
                  <p className="text-white/70">
                    A constellation of solar-powered laser satellites concentrates optical power onto an asteroid hotspot, creating continuous vapor jets that act as natural reaction thrusters over decades.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'surveys' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
                  <Telescope className="w-4 h-4 text-amber-400" /> Global Asteroid Early Warning Networks
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Over 35,000 Near-Earth Asteroids have been cataloged. NASA is mandated by Congress to find 90% of NEOs larger than 140 meters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-white text-sm block mb-1">Pan-STARRS (Hawaii)</span>
                  <p className="text-white/70">
                    Panoramic Survey Telescope on Haleakala, Maui, operating 1.8-meter wide-field telescopes with 1.4-gigapixel CCD sensors, responsible for discovering thousands of NEOs and comets.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-white text-sm block mb-1">Catalina Sky Survey (Arizona)</span>
                  <p className="text-white/70">
                    Operated by the University of Arizona at Mount Lemmon, discovering the highest volume of NEOs annually using dedicated Schmidt telescopes.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-white text-sm block mb-1">NASA NEO Surveyor (Launch ~2028)</span>
                  <p className="text-white/70">
                    Space-based infrared telescope positioned at Sun-Earth L1. Detects asteroids using thermal emissions rather than reflected optical sunlight.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-white text-sm block mb-1">Vera C. Rubin Observatory (Chile)</span>
                  <p className="text-white/70">
                    Equipped with an 8.4-meter primary mirror and a 3.2-gigapixel camera, surveying the entire southern sky every 3 nights, expected to discover over 100,000 small bodies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mining' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-amber-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-amber-400" /> Asteroid Mining & In-Situ Resource Utilization (ISRU)
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Near-Earth Asteroids are rich repositories of industrial metals, rare earth elements, and water-ice, offering raw materials to power interplanetary space exploration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-white text-sm block mb-1">Water ($H_2O$) = Rocket Fuel</span>
                  <p className="text-white/70">
                    Water extracted from carbonaceous asteroids can be split via solar electrolysis into liquid Hydrogen and Oxygen propellant, enabling orbital refueling depots.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-amber-300 text-sm block mb-1">Platinum Group Metals</span>
                  <p className="text-white/70">
                    Metallic (M-type) asteroids contain concentrations of Platinum, Osmium, Iridium, Palladium, and Gold hundreds of times higher than terrestrial mines.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="font-medium text-white/90 text-sm block mb-1">Structural Metals</span>
                  <p className="text-white/70">
                    High-purity Iron, Nickel, and Cobalt can be 3D-printed in zero-gravity into mega-structures, orbital habitats, and deep-space transport ships.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

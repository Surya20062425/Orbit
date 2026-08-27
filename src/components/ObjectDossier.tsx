import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Compass, 
  Orbit, 
  Coins, 
  Rocket, 
  Eye, 
  Layers, 
  Scale, 
  Bot, 
  Flame,
  Info,
  Maximize2
} from 'lucide-react';
import { CelestialBody } from '../types';
import { AU_TO_KM, AU_TO_LD } from '../utils/orbitalMechanics';

interface ObjectDossierProps {
  body: CelestialBody | null;
  onClose: () => void;
  onFocusCamera: (body: CelestialBody) => void;
  onOpenImpactSim: (body: CelestialBody) => void;
  onOpenAiAssistant: (body: CelestialBody) => void;
}

export const ObjectDossier: React.FC<ObjectDossierProps> = ({
  body,
  onClose,
  onFocusCamera,
  onOpenImpactSim,
  onOpenAiAssistant,
}) => {
  const miniCanvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Render 3D asteroid preview in mini canvas
  useEffect(() => {
    if (!body || !miniCanvasRef.current) return;
    const container = miniCanvasRef.current;
    const width = container.clientWidth || 240;
    const height = container.clientHeight || 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 2, 3);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x334466, 0.8);
    scene.add(ambientLight);

    // 3D Irregular Geometry
    let mesh: THREE.Mesh;
    if (body.category === 'planet' || body.category === 'moon' || body.id === 'sun' || body.id === 'moon') {
      const geom = new THREE.SphereGeometry(1.0, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(body.color), roughness: 0.6 });
      mesh = new THREE.Mesh(geom, mat);
    } else {
      const geom = new THREE.DodecahedronGeometry(1.0, 2);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const noise = 1.0 + (Math.sin(vx * 6) + Math.cos(vy * 6) + Math.sin(vz * 6)) * 0.12;
        pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(body.color),
        roughness: 0.8,
        metalness: body.spectralClass === 'M' ? 0.7 : 0.2,
      });
      mesh = new THREE.Mesh(geom, mat);
    }

    scene.add(mesh);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      mesh.rotation.y += 0.015;
      mesh.rotation.x += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        renderer.dispose();
      }
    };
  }, [body]);

  if (!body) return null;

  const perihelionAU = body.orbitalElements.a * (1 - body.orbitalElements.e);
  const aphelionAU = body.orbitalElements.a * (1 + body.orbitalElements.e);

  // Size Comparison Reference Logic
  const getScaleComparison = (diameterM: number) => {
    if (diameterM < 20) return { name: 'School Bus (12m)', factor: diameterM / 12 };
    if (diameterM < 80) return { name: 'Boeing 747 (70m)', factor: diameterM / 70 };
    if (diameterM < 200) return { name: 'Great Pyramid of Giza (139m)', factor: diameterM / 139 };
    if (diameterM < 600) return { name: 'Eiffel Tower (330m)', factor: diameterM / 330 };
    if (diameterM < 2000) return { name: 'Burj Khalifa (828m)', factor: diameterM / 828 };
    return { name: 'Mount Everest (8,848m)', factor: diameterM / 8848 };
  };

  const scaleRef = getScaleComparison(body.diameterMeters);

  return (
    <aside 
      id="object-dossier-panel" 
      aria-label="Object dossier details"
      className="w-80 md:w-96 bg-[#050507]/90 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full z-30 shadow-2xl overflow-y-auto text-[#e0e0e0]"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#050507]/95 backdrop-blur-md border-b border-white/10 p-4 pb-3 flex items-start justify-between gap-2 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: body.color }}
            />
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">
              {body.category.toUpperCase()} {body.isPHA ? '• POTENTIALLY HAZARDOUS' : ''}
            </span>
          </div>
          <h2 className="text-lg font-light text-white tracking-wide uppercase mt-0.5 font-sans">{body.name}</h2>
          {body.designation && (
            <p className="text-[10px] font-mono text-amber-400 tracking-wider">PROV. DESIG: {body.designation}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Close Dossier"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Model Preview Card */}
      <div className="p-4 pt-3 flex flex-col gap-3">
        <div className="relative w-full h-36 bg-black/60 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
          <div ref={miniCanvasRef} className="w-full h-full" />
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur rounded text-[9px] font-mono text-white/60 tracking-wider border border-white/10">
            3D RADAR MESH
          </div>
          {body.isPHA && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-950 border border-red-800 rounded text-[9px] font-bold text-red-300 flex items-center gap-1 shadow-lg animate-pulse">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              PHA ALERT
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onFocusCamera(body)}
            className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 text-white/90 text-xs py-2 rounded-lg font-medium transition-all"
            title="Lock camera onto this object"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] uppercase tracking-wider">Target</span>
          </button>

          <button
            onClick={() => onOpenImpactSim(body)}
            className="flex items-center justify-center gap-1 bg-red-950/60 hover:bg-red-900/60 border border-red-900/80 hover:border-red-700 text-red-300 text-xs py-2 rounded-lg font-medium transition-all"
            title="Simulate impact & deflection"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] uppercase tracking-wider">Defense</span>
          </button>

          <button
            onClick={() => onOpenAiAssistant(body)}
            className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-black text-xs py-2 rounded-lg font-semibold transition-all shadow-[0_0_10px_rgba(245,158,11,0.4)]"
            title="Ask AI Astrodynamicist"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Ask AI</span>
          </button>
        </div>

        {/* Hazard & Threat Assessment Banner */}
        {body.isPHA && (
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-red-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Threat Assessment
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-red-950 text-red-300 border border-red-900 rounded">
                MOID: {(body.moidAU * AU_TO_LD).toFixed(2)} LD
              </span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Minimum Orbit Intersection Distance (MOID) is <strong className="text-white">{body.moidAU.toFixed(5)} AU</strong> ({Math.round(body.moidAU * AU_TO_KM).toLocaleString()} km).
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-red-900/30 text-[11px]">
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider">TORINO SCALE</span>
                <span className="font-bold text-amber-400">{body.torinoScale} / 10</span>
              </div>
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider">PALERMO RATING</span>
                <span className="font-bold text-white/90">{body.palermoScale.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Overview & Description */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs leading-relaxed text-white/80">
          <p>{body.description}</p>
          {body.discoverer && (
            <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/40 font-mono tracking-wider">
              DISCOVERED: {body.discoveryYear} by {body.discoverer}
            </div>
          )}
        </div>

        {/* Keplerian Orbital Telemetry */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 border-b border-white/10 pb-1.5 uppercase tracking-wider">
            <Orbit className="w-4 h-4 text-amber-400" />
            <span>Keplerian Elements (J2000)</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-mono">
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">SEMI-MAJOR AXIS (a)</span>
              <span className="text-white font-bold">{body.orbitalElements.a.toFixed(4)} AU</span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">ECCENTRICITY (e)</span>
              <span className="text-white font-bold">{body.orbitalElements.e.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">INCLINATION (i)</span>
              <span className="text-white font-bold">{body.orbitalElements.i.toFixed(2)}°</span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">ORBITAL PERIOD</span>
              <span className="text-white font-bold">{body.orbitalElements.periodYears.toFixed(2)} yrs</span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">PERIHELION (q)</span>
              <span className="text-emerald-400 font-bold">{perihelionAU.toFixed(3)} AU</span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">APHELION (Q)</span>
              <span className="text-amber-400 font-bold">{aphelionAU.toFixed(3)} AU</span>
            </div>
          </div>
        </div>

        {/* Physical Characteristics & Size Comparator */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 border-b border-white/10 pb-1.5 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Physical Attributes & Size</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-mono">
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">EST. DIAMETER</span>
              <span className="text-white font-bold">
                {body.diameterMeters >= 1000
                  ? `${(body.diameterMeters / 1000).toFixed(2)} km`
                  : `${body.diameterMeters} m`}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">SPECTRAL CLASS</span>
              <span className="text-white font-bold">Type {body.spectralClass}</span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">ROTATION PERIOD</span>
              <span className="text-white font-bold">
                {body.rotationPeriodHours ? `${body.rotationPeriodHours.toFixed(1)} hrs` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-white/40 block uppercase tracking-wider">ABS MAGNITUDE (H)</span>
              <span className="text-white font-bold">{body.absoluteMagnitudeH.toFixed(1)} mag</span>
            </div>
          </div>

          {/* Size Comparison Diagram */}
          <div className="mt-1 pt-2 border-t border-white/10 text-xs">
            <span className="text-[9px] text-white/40 block uppercase tracking-wider">SCALE COMPARISON</span>
            <div className="flex items-center justify-between text-[11px] text-white/90 mt-0.5">
              <span>≈ {scaleRef.factor.toFixed(1)}× {scaleRef.name}</span>
            </div>
          </div>
        </div>

        {/* Space Mining Valuation */}
        {body.resources && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 uppercase tracking-wider">
                <Coins className="w-4 h-4" />
                <span>Asteroid Resource Value</span>
              </span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                ${body.resources.totalEstimatedValueUsdTrillions} Trillion
              </span>
            </div>
            <div className="text-[11px] text-white/70">
              <span className="text-white/40 text-[9px] uppercase tracking-wider block">KEY EXTRACTABLE METALS:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {body.resources.keyMinerals.map((mineral) => (
                  <span key={mineral} className="px-2 py-0.5 bg-white/5 text-amber-200 rounded text-[10px] font-mono border border-white/10">
                    {mineral}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notable Missions */}
        {body.missions && body.missions.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/80 border-b border-white/10 pb-1.5 uppercase tracking-wider">
              <Rocket className="w-4 h-4 text-amber-400" />
              <span>Exploration Missions</span>
            </div>
            <ul className="text-[11px] text-white/70 space-y-1 mt-0.5">
              {body.missions.map((m) => (
                <li key={m} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

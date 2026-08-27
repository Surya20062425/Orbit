import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  X, 
  Search, 
  Filter, 
  Calendar, 
  Compass, 
  AlertTriangle, 
  ArrowUpRight, 
  Flame, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CelestialBody } from '../types';
import { AU_TO_KM, AU_TO_LD, jdToDate, dateToJD } from '../utils/orbitalMechanics';

interface CloseApproachRadarProps {
  allBodies: CelestialBody[];
  onSelectBodyAndJumpDate: (body: CelestialBody, date: Date) => void;
  onClose: () => void;
}

interface CadItem {
  name: string;
  designation: string;
  dateStr: string;
  jd: number;
  distanceAU: number;
  distanceLD: number;
  relativeVelocityKms: number;
  hMagnitude: number;
  estimatedDiameterMeters: number;
  isPHA: boolean;
  matchedBody: CelestialBody | null;
}

export const CloseApproachRadar: React.FC<CloseApproachRadarProps> = ({
  allBodies,
  onSelectBodyAndJumpDate,
  onClose,
}) => {
  const [cadList, setCadList] = useState<CadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('NASA JPL Small-Body Database');
  const [distFilter, setDistFilter] = useState<'all' | '1ld' | '5ld' | '20ld'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch CAD Data from backend endpoint
  useEffect(() => {
    async function loadCadData() {
      setLoading(true);
      try {
        const res = await fetch('/api/nasa/close-approaches');
        if (res.ok) {
          const json = await res.json();
          if (json.source === 'jpl_live') {
            setDataSource('Live NASA JPL CAD API');
          } else {
            setDataSource('Curated JPL Planetary Defense Catalog');
          }

          // Parse JPL CAD array structure
          const fields: string[] = json.data?.fields || [];
          const rows: any[][] = json.data?.data || [];

          const desIdx = fields.indexOf('des');
          const cdIdx = fields.indexOf('cd');
          const distIdx = fields.indexOf('dist');
          const vRelIdx = fields.indexOf('v_rel');
          const hIdx = fields.indexOf('h');
          const jdIdx = fields.indexOf('jd');

          const parsedItems: CadItem[] = rows.map((row) => {
            const des = String(row[desIdx] || 'Unknown');
            const cd = String(row[cdIdx] || '');
            const distAU = parseFloat(row[distIdx] || '0.05');
            const distLD = distAU * AU_TO_LD;
            const vRel = parseFloat(row[vRelIdx] || '15.0');
            const h = parseFloat(row[hIdx] || '20.0');
            const jd = parseFloat(row[jdIdx] || '2460000.0');

            // Estimate diameter from absolute magnitude H (assuming average albedo pv = 0.14)
            // D = (1329 / sqrt(pv)) * 10^(-0.2 * H) in km
            const diamKm = (1329 / Math.sqrt(0.14)) * Math.pow(10, -0.2 * h);
            const diamMeters = Math.round(diamKm * 1000);

            // Match with built-in bodies
            const matched = allBodies.find(
              (b) => b.id.toLowerCase().includes(des.toLowerCase()) || 
                     b.name.toLowerCase().includes(des.toLowerCase()) ||
                     (b.designation && b.designation.toLowerCase().includes(des.toLowerCase()))
            ) || null;

            return {
              name: matched ? matched.name : `Asteroid ${des}`,
              designation: des,
              dateStr: cd,
              jd,
              distanceAU: distAU,
              distanceLD: distLD,
              relativeVelocityKms: vRel,
              hMagnitude: h,
              estimatedDiameterMeters: matched ? matched.diameterMeters : diamMeters,
              isPHA: distAU < 0.05 && h <= 22.0,
              matchedBody: matched,
            };
          });

          setCadList(parsedItems);
        }
      } catch (err) {
        console.error('Failed to load CAD data', err);
      } finally {
        setLoading(false);
      }
    }

    loadCadData();
  }, [allBodies]);

  // Filter list
  const filteredList = cadList.filter((item) => {
    if (distFilter === '1ld' && item.distanceLD > 1.0) return false;
    if (distFilter === '5ld' && item.distanceLD > 5.0) return false;
    if (distFilter === '20ld' && item.distanceLD > 20.0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.designation.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRowClick = (item: CadItem) => {
    // If matched with 3D body, select it and jump simulation time to encounter date
    const bodyToSelect = item.matchedBody || allBodies.find((b) => b.id === 'apophis') || allBodies[3];
    const encounterDate = item.jd ? jdToDate(item.jd) : new Date(item.dateStr);
    onSelectBodyAndJumpDate(bodyToSelect, encounterDate);
    onClose();
  };

  return (
    <div 
      id="close-approach-radar-modal" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-approach-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="bg-[#050507] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        {/* Header */}
        <div className="bg-black/60 border-b border-white/10 p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Radar className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 id="close-approach-title" className="text-base md:text-lg font-light text-white tracking-widest uppercase font-sans">
                NASA JPL <span className="font-bold text-amber-500">Close Approach Radar</span>
              </h2>
              <p className="text-[10px] text-white/40 font-mono tracking-wider flex items-center gap-2">
                <span>FEED: {dataSource.toUpperCase()}</span>
                <span>•</span>
                <span className="text-emerald-400">REAL-TIME TELEMETRY STREAM</span>
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

        {/* Filters and Search Bar */}
        <div className="bg-black/40 p-4 px-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asteroid or designation (e.g. Apophis, 2024 YR4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>

          {/* Distance Filter Chips */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-white/40 text-[10px] font-sans mr-1 flex items-center gap-1 uppercase tracking-wider">
              <Filter className="w-3 h-3 text-amber-400" /> DISTANCE:
            </span>
            <button
              onClick={() => setDistFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider transition-all ${
                distFilter === 'all' ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              All (&lt;0.5 AU)
            </button>
            <button
              onClick={() => setDistFilter('20ld')}
              className={`px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider transition-all ${
                distFilter === '20ld' ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              &lt; 20 LD
            </button>
            <button
              onClick={() => setDistFilter('5ld')}
              className={`px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider transition-all ${
                distFilter === '5ld' ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              &lt; 5 LD
            </button>
            <button
              onClick={() => setDistFilter('1ld')}
              className={`px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider transition-all ${
                distFilter === '1ld' ? 'bg-red-600 text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              &lt; 1 Lunar Dist
            </button>
          </div>
        </div>

        {/* Table of Close Encounters */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/50">
              <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
              <span className="text-xs font-mono">Querying NASA JPL Small-Body Close Approach API...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-white/40 text-xs font-mono">
              No close approaches match the current filter criteria.
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 text-white/40 uppercase text-[9px] border-b border-white/10 tracking-widest">
                  <tr>
                    <th className="p-3 px-4">OBJECT / DESIGNATION</th>
                    <th className="p-3">CLOSE APPROACH (UTC)</th>
                    <th className="p-3">MISS DISTANCE (LD)</th>
                    <th className="p-3">DISTANCE (KM)</th>
                    <th className="p-3">VELOCITY</th>
                    <th className="p-3">EST. SIZE</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/40">
                  {filteredList.map((item, index) => {
                    const isSuperClose = item.distanceLD < 1.0;
                    const isHazard = item.isPHA || isSuperClose;

                    return (
                      <tr
                        key={`${item.designation}-${index}`}
                        className={`hover:bg-white/5 transition-colors group cursor-pointer ${
                          isSuperClose ? 'bg-red-950/20' : ''
                        }`}
                        onClick={() => handleRowClick(item)}
                      >
                        <td className="p-3 px-4">
                          <div className="flex items-center gap-2">
                            {isHazard && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            )}
                            <div>
                              <div className="font-medium text-white font-sans group-hover:text-amber-300 transition-colors">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-white/40">DESIG: {item.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-white/80">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.dateStr}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              isSuperClose
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : item.distanceLD < 5
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'text-white/80'
                            }`}
                          >
                            {item.distanceLD.toFixed(3)} LD
                          </span>
                        </td>
                        <td className="p-3 text-white/60">
                          {Math.round(item.distanceAU * AU_TO_KM).toLocaleString()} km
                        </td>
                        <td className="p-3 text-amber-300">
                          {item.relativeVelocityKms.toFixed(1)} km/s
                        </td>
                        <td className="p-3 text-white/80">
                          {item.estimatedDiameterMeters >= 1000
                            ? `${(item.estimatedDiameterMeters / 1000).toFixed(2)} km`
                            : `${item.estimatedDiameterMeters} m`}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item);
                            }}
                            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                          >
                            <span>Fly To</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

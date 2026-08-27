import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { jdToDate, dateToJD } from '../utils/orbitalMechanics';

interface TimelineControlsProps {
  currentJD: number;
  onJDChange: (newJD: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (newSpeed: number) => void;
  direction: 1 | -1;
  onToggleDirection: () => void;
  onJumpToDate: (date: Date) => void;
}

const SPEED_PRESETS = [
  { label: '1d/s', value: 1 },
  { label: '7d/s', value: 7 },
  { label: '30d/s', value: 30 },
  { label: '90d/s', value: 90 },
  { label: '1y/s', value: 365.25 },
  { label: '5y/s', value: 365.25 * 5 },
];

const HISTORIC_PRESETS = [
  { label: 'Today (Now)', date: new Date() },
  { label: 'Apophis Super-Flyby (Apr 2029)', date: new Date('2029-04-13T21:46:00Z') },
  { label: '2024 YR4 Approach (Dec 2032)', date: new Date('2032-12-22T16:48:00Z') },
  { label: 'DART Asteroid Impact (Sep 2022)', date: new Date('2022-09-26T23:14:00Z') },
  { label: 'Chelyabinsk Meteor (Feb 2013)', date: new Date('2013-02-15T03:20:00Z') },
  { label: 'Tunguska Event (Jun 1908)', date: new Date('1908-06-30T00:17:00Z') },
  { label: 'Halley Comet Perihelion (Jul 2061)', date: new Date('2061-07-28T00:00:00Z') },
  { label: '1950 DA Hazard Window (Mar 2880)', date: new Date('2880-03-16T00:00:00Z') },
];

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentJD,
  onJDChange,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  direction,
  onToggleDirection,
  onJumpToDate,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const currentDate = jdToDate(currentJD);

  // Format date to ISO/UTC string
  const dateFormatted = currentDate.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const yearNumber = currentDate.getUTCFullYear();

  // Handle Scrubbing slider (range spanning 2000 to 2065 in JD)
  const minJD = 2451545.0; // 2000-01-01
  const maxJD = 2475470.0; // 2065-07-01

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onJDChange(parseFloat(e.target.value));
  };

  const handleStep = (days: number) => {
    onJDChange(currentJD + days);
  };

  return (
    <div id="timeline-controls-dock" className="w-full bg-black/75 backdrop-blur-2xl border-t border-white/10 p-3 px-4 md:px-6 flex flex-col gap-2.5 z-20 text-[#e0e0e0] select-none shadow-2xl">
      {/* Top Row: Date Display, Play Controls, Speed Selector, Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Simulation Time & Julian Day Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-200 tracking-wide">{dateFormatted}</span>
              <span className="text-[10px] text-white/40 font-mono tracking-tight">JD {currentJD.toFixed(2)} • Year {yearNumber}</span>
            </div>
          </div>

          {/* Jump to Today Button */}
          <button
            onClick={() => onJumpToDate(new Date())}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 text-xs px-2.5 py-1.5 rounded-lg transition-colors text-white/80 hover:text-white font-medium"
            title="Reset to current local time"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white/50" />
            <span className="uppercase text-[11px] tracking-wider">Today</span>
          </button>

          {/* Historic Events Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/50 text-xs px-3 py-1.5 rounded-lg transition-colors text-amber-300 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="uppercase text-[11px] tracking-wider">Flyby Encounters</span>
            </button>

            {showPresetsMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-80 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[9px] font-semibold text-white/40 uppercase tracking-widest px-2.5 py-1.5 border-b border-white/10">
                  Select Landmark Close Approach
                </div>
                {HISTORIC_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onJumpToDate(preset.date);
                      setShowPresetsMenu(false);
                    }}
                    className="flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-amber-500/15 hover:text-amber-200 transition-colors text-white/90"
                  >
                    <span>{preset.label}</span>
                    <span className="text-[10px] font-mono text-white/40">{preset.date.getUTCFullYear()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
          {/* Step Back 30 days */}
          <button
            onClick={() => handleStep(-30)}
            className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
            title="Step back 30 days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Reverse Direction Toggle */}
          <button
            onClick={onToggleDirection}
            className={`p-1.5 rounded-lg transition-colors ${
              direction === -1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'hover:bg-white/10 text-white/50 hover:text-white'
            }`}
            title={direction === -1 ? 'Simulating backwards in time' : 'Reverse time flow'}
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all shrink-0"
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          {/* Forward */}
          <button
            onClick={() => {
              if (direction === -1) onToggleDirection();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              direction === 1 ? 'text-amber-400' : 'hover:bg-white/10 text-white/50'
            }`}
            title="Normal forward time flow"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Step Forward 30 days */}
          <button
            onClick={() => handleStep(30)}
            className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
            title="Step forward 30 days"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Speed Multiplier Selector */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl text-xs font-mono">
          <span className="text-[10px] text-white/40 px-1.5 font-sans font-medium flex items-center gap-1 tracking-wider uppercase">
            <Zap className="w-3 h-3 text-amber-400" /> SPEED:
          </span>
          {SPEED_PRESETS.map((preset) => {
            const isSelected = speed === preset.value;
            return (
              <button
                key={preset.label}
                onClick={() => onSpeedChange(preset.value)}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Continuous Interactive Timeline Scrubber Slider */}
      <div className="flex items-center gap-3 w-full pt-1">
        <span className="text-[10px] font-mono text-white/40 w-12 text-right">2000</span>
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={minJD}
            max={maxJD}
            step={1}
            value={Math.max(minJD, Math.min(maxJD, currentJD))}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all focus:outline-none"
          />
          {/* Milestone markers on timeline */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none"
            style={{ left: `${((dateToJD(new Date('2029-04-13')) - minJD) / (maxJD - minJD)) * 100}%` }}
            title="Apophis Flyby (2029)"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] pointer-events-none"
            style={{ left: `${((dateToJD(new Date('2032-12-22')) - minJD) / (maxJD - minJD)) * 100}%` }}
            title="2024 YR4 Encounter (2032)"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] pointer-events-none"
            style={{ left: `${((dateToJD(new Date('2061-07-28')) - minJD) / (maxJD - minJD)) * 100}%` }}
            title="Halley Perihelion (2061)"
          />
        </div>
        <span className="text-[10px] font-mono text-white/40 w-12">2065</span>
      </div>
    </div>
  );
};

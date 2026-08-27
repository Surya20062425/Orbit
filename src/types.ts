export type OrbitCategory = 
  | 'sun'
  | 'planet'
  | 'moon'
  | 'atira' 
  | 'aten' 
  | 'apollo' 
  | 'amor' 
  | 'pha' 
  | 'comet' 
  | 'interstellar';

export type SpectralClass = 'C' | 'S' | 'M' | 'D' | 'V' | 'B' | 'Q' | 'Unknown';

export interface OrbitalElements {
  /** Semi-major axis in AU */
  a: number;
  /** Eccentricity (0 <= e < 1 for ellipse, > 1 for hyperbolic) */
  e: number;
  /** Inclination in degrees */
  i: number;
  /** Longitude of Ascending Node in degrees */
  node: number;
  /** Argument of Perihelion in degrees */
  peri: number;
  /** Mean anomaly at epoch in degrees */
  M0: number;
  /** Epoch in Julian Days (typically J2000 = 2451545.0) */
  epoch: number;
  /** Orbital period in Julian years or days */
  periodYears: number;
  /** Indicates whether the orbit is geocentric around Earth */
  isGeocentric?: boolean;
}

export interface CloseApproachRecord {
  dateStr: string;
  jd: number;
  distanceAU: number;
  distanceLD: number;
  relativeVelocityKms: number;
  missDistanceKm: number;
  uncertaintyHours?: number;
}

export interface ResourceValuation {
  totalEstimatedValueUsdTrillions: number;
  waterPct: number;
  ironPct: number;
  nickelPct: number;
  platinumGroupPct: number;
  rareEarthPct: number;
  keyMinerals: string[];
}

export interface CelestialBody {
  id: string;
  name: string;
  designation?: string;
  category: OrbitCategory;
  isPHA: boolean;
  orbitalElements: OrbitalElements;
  /** Diameter in meters */
  diameterMeters: number;
  /** Mass in kilograms */
  massKg: number;
  /** Absolute visual magnitude H */
  absoluteMagnitudeH: number;
  /** Albedo (reflectivity) 0-1 */
  albedo: number;
  /** Rotation period in hours */
  rotationPeriodHours?: number;
  /** Spectral classification */
  spectralClass: SpectralClass;
  /** Estimated primary composition summary */
  compositionSummary: string;
  /** Color hex string for orbit and marker rendering */
  color: string;
  /** Minimum Orbit Intersection Distance with Earth in AU */
  moidAU: number;
  /** Torino Scale (0 to 10) */
  torinoScale: number;
  /** Palermo Technical Scale */
  palermoScale: number;
  /** Approximate average impact velocity with Earth in km/s */
  impactVelocityKms: number;
  /** Historical and upcoming close approaches */
  closeApproaches: CloseApproachRecord[];
  /** Mineral & mining resource potential */
  resources?: ResourceValuation;
  /** Notable exploration missions */
  missions?: string[];
  /** Detailed scientific dossier / description */
  description: string;
  /** Discovery details */
  discoveryYear?: number;
  discoverer?: string;
}

export type CameraPreset = 'free' | 'follow' | 'topDown' | 'innerSystem' | 'outerSystem' | 'earthGeocentric';

export interface TimeState {
  currentDate: Date;
  currentJD: number;
  speedDaysPerSec: number;
  isPlaying: boolean;
  direction: 1 | -1;
}

export interface ImpactSimulationResults {
  kineticEnergyJoules: number;
  energyMegatonsTNT: number;
  hiroshimaEquivalents: number;
  tsarBombaEquivalents: number;
  craterDiameterMeters: number;
  craterDepthMeters: number;
  fireballRadiusKm: number;
  airblastRadiusKm: number;
  seismicMagnitudeRichter: number;
  atmosphericBurstAltitudeKm: number | null; // null if ground impact
  damageSummary: string;
}

export interface DeflectionSimulationResults {
  requiredDeltaVKms: number;
  missDistanceEarthRadii: number;
  isSuccessful: boolean;
  missionDurationYears: number;
  spacecraftMassKg: number;
  technique: 'kinetic' | 'gravity' | 'nuclear' | 'laser';
  summary: string;
}

import { OrbitalElements, ImpactSimulationResults, DeflectionSimulationResults } from '../types';

export const AU_TO_KM = 149597870.7;
export const AU_TO_LD = 389.172; // 1 AU ≈ 389.172 Lunar Distances
export const LD_TO_KM = 384400;
export const EARTH_RADIUS_KM = 6371;
export const SUN_GM = 1.32712440018e11; // km^3/s^2 (G * M_sun)
export const J2000_EPOCH = 2451545.0; // 2000-01-01 12:00:00 UTC

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface HeliocentricState {
  positionAU: Vector3D;
  radiusAU: number;
  trueAnomalyDeg: number;
  eccentricAnomalyDeg: number;
  meanAnomalyDeg: number;
  orbitalVelocityKms: number;
}

/**
 * Convert Javascript Date to Julian Date (JD)
 */
export function dateToJD(date: Date): number {
  const time = date.getTime();
  return (time / 86400000.0) + 2440587.5;
}

/**
 * Convert Julian Date to Javascript Date
 */
export function jdToDate(jd: number): Date {
  const time = (jd - 2440587.5) * 86400000.0;
  return new Date(time);
}

/**
 * Robust Newton-Raphson Solver for Kepler's Equation: M = E - e * sin(E)
 * @param M Mean anomaly in radians
 * @param e Eccentricity (0 <= e < 1)
 */
export function solveKepler(M: number, e: number): number {
  // Normalize M into [0, 2pi)
  const pi2 = 2 * Math.PI;
  let m = M % pi2;
  if (m < 0) m += pi2;

  // Initial estimate
  let E = e > 0.8 ? Math.PI : m;
  
  // Iterative Newton-Raphson
  const maxIterations = 35;
  const tolerance = 1e-9;

  for (let iter = 0; iter < maxIterations; iter++) {
    const f = E - e * Math.sin(E) - m;
    if (Math.abs(f) < tolerance) break;
    const fPrime = 1 - e * Math.cos(E);
    E = E - f / fPrime;
  }

  return E;
}

const EARTH_ORBITAL_ELEMENTS: OrbitalElements = {
  a: 1.000000,
  e: 0.0167086,
  i: 0.00005,
  node: -11.260,
  peri: 102.947,
  M0: 357.517,
  epoch: 2451545.0,
  periodYears: 1.000000,
};

/**
 * Calculates 3D Heliocentric Cartesian Position (in AU) for a given epoch JD
 * Coordinate system:
 * X = Vernal equinox in ecliptic plane
 * Z = Perpendicular in ecliptic plane (90 deg counterclockwise)
 * Y = Celestial North perpendicular to ecliptic plane (Up vector for Three.js)
 */
export function calculateHeliocentricPosition(elements: OrbitalElements, jd: number): HeliocentricState {
  const { a, e, i, node, peri, M0, epoch, periodYears, isGeocentric } = elements;

  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;

  // Mean motion n in degrees/day
  // P in days = periodYears * 365.256363
  const periodDays = Math.max(0.1, periodYears * 365.256363);
  const n = 360.0 / periodDays;

  // Delta time from epoch in days
  const dt = jd - epoch;

  // Mean anomaly M at target time
  let M_deg = (M0 + n * dt) % 360;
  if (M_deg < 0) M_deg += 360;
  const M_rad = M_deg * deg2rad;

  let E_rad = 0;
  let nu_rad = 0;
  let r = 0;

  if (e < 1.0) {
    // Elliptic orbit
    E_rad = solveKepler(M_rad, e);
    
    // True anomaly nu
    const sinNuHalf = Math.sqrt(1 + e) * Math.sin(E_rad / 2);
    const cosNuHalf = Math.sqrt(1 - e) * Math.cos(E_rad / 2);
    nu_rad = 2 * Math.atan2(sinNuHalf, cosNuHalf);

    // Distance in AU (relative to primary)
    r = a * (1 - e * Math.cos(E_rad));
  } else {
    // Hyperbolic orbit approximation (for interstellar objects like 'Oumuamua / Borisov)
    const hyperbolicM = M_rad;
    let H = hyperbolicM;
    for (let k = 0; k < 20; k++) {
      const f = e * Math.sinh(H) - H - hyperbolicM;
      if (Math.abs(f) < 1e-8) break;
      const fPrime = e * Math.cosh(H) - 1;
      H = H - f / fPrime;
    }
    nu_rad = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2));
    r = Math.abs(a * (e * e - 1) / (1 + e * Math.cos(nu_rad)));
    E_rad = H;
  }

  // Argument of latitude u = perihelion + true anomaly
  const omega_rad = peri * deg2rad;
  const Omega_rad = node * deg2rad;
  const inc_rad = i * deg2rad;

  const u = omega_rad + nu_rad;

  // Relative Coordinates rotated into Ecliptic J2000
  let relX = r * (Math.cos(Omega_rad) * Math.cos(u) - Math.sin(Omega_rad) * Math.sin(u) * Math.cos(inc_rad));
  let relZ = r * (Math.sin(Omega_rad) * Math.cos(u) + Math.cos(Omega_rad) * Math.sin(u) * Math.cos(inc_rad));
  let relY = r * (Math.sin(u) * Math.sin(inc_rad));

  let finalX = relX;
  let finalY = relY;
  let finalZ = relZ;
  let finalRadius = r;
  let velocityKms = 0;

  if (isGeocentric) {
    // If the body is a natural satellite (e.g. Moon), calculate Earth's heliocentric position and add relative offset
    const earthState = calculateHeliocentricPosition(EARTH_ORBITAL_ELEMENTS, jd);
    finalX = earthState.positionAU.x + relX;
    finalY = earthState.positionAU.y + relY;
    finalZ = earthState.positionAU.z + relZ;
    finalRadius = Math.sqrt(finalX * finalX + finalY * finalY + finalZ * finalZ);
    velocityKms = 1.022; // Moon's orbital speed relative to Earth
  } else {
    // Orbital velocity via Vis-Viva equation: v = sqrt( GM * (2/r - 1/a) )
    if (r > 0) {
      const invA = a > 0 ? 1 / a : 0;
      const vFactor = Math.max(0, 2 / r - invA);
      velocityKms = 29.784 * Math.sqrt(vFactor);
    }
  }

  return {
    positionAU: { x: finalX, y: finalY, z: finalZ },
    radiusAU: finalRadius,
    trueAnomalyDeg: nu_rad * rad2deg,
    eccentricAnomalyDeg: E_rad * rad2deg,
    meanAnomalyDeg: M_deg,
    orbitalVelocityKms: velocityKms,
  };
}

/**
 * Generate 3D point array representing complete orbit curve for rendering
 */
export function generateOrbitPoints(elements: OrbitalElements, segments = 160): Vector3D[] {
  const points: Vector3D[] = [];
  const { a, e, i, node, peri } = elements;
  const deg2rad = Math.PI / 180;
  const omega_rad = peri * deg2rad;
  const Omega_rad = node * deg2rad;
  const inc_rad = i * deg2rad;

  if (e < 1.0) {
    // Complete closed ellipse
    for (let step = 0; step <= segments; step++) {
      const E = (step / segments) * 2 * Math.PI;
      const sinNuHalf = Math.sqrt(1 + e) * Math.sin(E / 2);
      const cosNuHalf = Math.sqrt(1 - e) * Math.cos(E / 2);
      const nu = 2 * Math.atan2(sinNuHalf, cosNuHalf);
      const r = a * (1 - e * Math.cos(E));
      const u = omega_rad + nu;

      const x = r * (Math.cos(Omega_rad) * Math.cos(u) - Math.sin(Omega_rad) * Math.sin(u) * Math.cos(inc_rad));
      const z = r * (Math.sin(Omega_rad) * Math.cos(u) + Math.cos(Omega_rad) * Math.sin(u) * Math.cos(inc_rad));
      const y = r * (Math.sin(u) * Math.sin(inc_rad));

      points.push({ x, y, z });
    }
  } else {
    // Hyperbolic branch (-70 deg to +70 deg anomaly)
    const maxH = 2.0;
    for (let step = -segments / 2; step <= segments / 2; step++) {
      const H = (step / (segments / 2)) * maxH;
      const nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2));
      const r = Math.abs(a * (e * e - 1) / (1 + e * Math.cos(nu)));
      const u = omega_rad + nu;

      const x = r * (Math.cos(Omega_rad) * Math.cos(u) - Math.sin(Omega_rad) * Math.sin(u) * Math.cos(inc_rad));
      const z = r * (Math.sin(Omega_rad) * Math.cos(u) + Math.cos(Omega_rad) * Math.sin(u) * Math.cos(inc_rad));
      const y = r * (Math.sin(u) * Math.sin(inc_rad));

      points.push({ x, y, z });
    }
  }

  return points;
}

/**
 * Calculate Euclidean 3D distance between two positions in AU
 */
export function calculateDistance(p1: Vector3D, p2: Vector3D) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  const distAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distKm = distAU * AU_TO_KM;
  const distLD = distAU * AU_TO_LD;
  const lightTimeSec = distKm / 299792.458;

  return {
    distAU,
    distKm,
    distLD,
    lightTimeSec,
  };
}

/**
 * Calculate detailed impact physics and consequences based on Collins/Melosh/Marcus impact crater scaling
 */
export function calculateImpactPhysics(
  diameterMeters: number,
  densityKgM3: number,
  velocityKms: number,
  impactAngleDeg: number = 45,
  targetType: 'sedimentary' | 'crystalline' | 'water' = 'sedimentary'
): ImpactSimulationResults {
  const radius = diameterMeters / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const massKg = volume * densityKgM3;
  const velocityMetersPerSec = velocityKms * 1000;

  // Kinetic energy E = 1/2 * m * v^2
  const kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMetersPerSec, 2);
  const energyMegatonsTNT = kineticEnergyJoules / 4.184e15;
  const hiroshimaEquivalents = energyMegatonsTNT / 0.015; // 15 kt
  const tsarBombaEquivalents = energyMegatonsTNT / 50.0; // 50 Mt

  // Atmospheric entry and burst altitude estimate
  // Small stony objects (< 50m) airburst in the upper/middle atmosphere like Chelyabinsk / Tunguska
  let atmosphericBurstAltitudeKm: number | null = null;
  if (diameterMeters < 80 && densityKgM3 < 4000) {
    atmosphericBurstAltitudeKm = Math.max(5, 45 - diameterMeters * 0.4);
  }

  // Transient Crater scaling (Schmidt-Holsapple / Melosh)
  // D_tc = 1.161 * (rho_p / rho_t)^(1/3) * L^0.78 * v^0.44 * g^-0.22 * sin(theta)^(1/3)
  const targetDensity = targetType === 'water' ? 1000 : targetType === 'crystalline' ? 2750 : 2400;
  const angleRad = (impactAngleDeg * Math.PI) / 180;
  const g = 9.81;

  let craterDiameterMeters = 0;
  let craterDepthMeters = 0;

  if (!atmosphericBurstAltitudeKm || diameterMeters >= 40) {
    const rawCrater = 1.161 * 
      Math.pow(densityKgM3 / targetDensity, 1 / 3) * 
      Math.pow(diameterMeters, 0.78) * 
      Math.pow(velocityMetersPerSec, 0.44) * 
      Math.pow(g, -0.22) * 
      Math.pow(Math.sin(angleRad), 1 / 3);

    // Final complex vs simple crater transition (~3.2 km on Earth)
    if (rawCrater > 3200) {
      craterDiameterMeters = 1.17 * Math.pow(rawCrater, 1.13) / Math.pow(3200, 0.13);
      craterDepthMeters = 0.28 * Math.pow(craterDiameterMeters, 0.301) * 1000;
    } else {
      craterDiameterMeters = rawCrater * 1.25;
      craterDepthMeters = craterDiameterMeters / 4.5;
    }
  }

  // Thermal radiation fireball radius: R_f ≈ 0.002 * E^(1/3) km (E in Joules)
  const fireballRadiusKm = Math.min(2500, 0.0019 * Math.pow(kineticEnergyJoules, 1 / 3) / 1000);

  // Severe airblast radius (4 psi overpressure - collapses residential buildings):
  // R_blast ≈ 3.5 * (E_Mt)^(1/3) km
  const airblastRadiusKm = Math.min(4000, 3.8 * Math.pow(energyMegatonsTNT, 1 / 3));

  // Richter scale equivalent: M_w = 0.67 * log10(E_joules) - 5.87
  const seismicMagnitudeRichter = Math.max(0, Math.min(10.5, 0.67 * Math.log10(kineticEnergyJoules) - 5.87));

  // Damage summary text
  let damageSummary = '';
  if (energyMegatonsTNT < 0.1) {
    damageSummary = 'High-altitude atmospheric detonation. Bright fireball, localized sonic boom, scattered harmless meteorite fragments.';
  } else if (energyMegatonsTNT < 5) {
    damageSummary = 'Chelyabinsk to Tunguska-class event. Severe shockwave breaks windows across hundreds of sq km, flash burns, localized forest flattening.';
  } else if (energyMegatonsTNT < 100) {
    damageSummary = 'City to metropolitan destroyer. Massive ground crater, complete structural obliteration within 30 km, heavy hurricane-force blast winds.';
  } else if (energyMegatonsTNT < 10000) {
    damageSummary = 'Regional catastrophe. State/country-scale devastating blast, thermal ignition of wildfires over 100+ km radius, massive seismic shock, localized tsunami if ocean impact.';
  } else {
    damageSummary = 'Global extinction-level event (Chicxulub class). Worldwide fires, shock heating of atmosphere, nuclear winter lasting years, collapse of marine and terrestrial food chains.';
  }

  return {
    kineticEnergyJoules,
    energyMegatonsTNT,
    hiroshimaEquivalents,
    tsarBombaEquivalents,
    craterDiameterMeters: Math.round(craterDiameterMeters),
    craterDepthMeters: Math.round(craterDepthMeters),
    fireballRadiusKm: Math.round(fireballRadiusKm * 10) / 10,
    airblastRadiusKm: Math.round(airblastRadiusKm * 10) / 10,
    seismicMagnitudeRichter: Math.round(seismicMagnitudeRichter * 10) / 10,
    atmosphericBurstAltitudeKm: atmosphericBurstAltitudeKm ? Math.round(atmosphericBurstAltitudeKm) : null,
    damageSummary,
  };
}

/**
 * Calculate Planetary Defense Deflection requirements
 */
export function calculateDeflection(
  diameterMeters: number,
  densityKgM3: number,
  warningYears: number,
  technique: 'kinetic' | 'gravity' | 'nuclear' | 'laser',
  spacecraftMassKg: number = 1000
): DeflectionSimulationResults {
  const radius = diameterMeters / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const asteroidMassKg = volume * densityKgM3;

  // Safe miss distance target = 2.5 Earth radii (~16,000 km)
  const targetMissDistanceKm = 2.5 * EARTH_RADIUS_KM;

  // Velocity change delta-v required to shift arrival time/position over warning time:
  // dx = 3 * pi * a * dt * (dv / v_orbit)
  // dv ≈ targetMissDistance / (warningYears * 3.15e7 seconds * leverage_factor)
  const warningSeconds = Math.max(1, warningYears) * 365.25 * 86400;
  const requiredDeltaVKms = (targetMissDistanceKm / warningSeconds) * 1.5; // in km/s

  let achievableDeltaVKms = 0;
  let summary = '';

  if (technique === 'kinetic') {
    // DART kinetic impactor: dv = beta * (m_sc * v_rel) / M_ast
    const beta = 2.5; // momentum enhancement factor from ejecta recoil (DART observed ~2.2 - 3.6)
    const impactVelocityKms = 6.5;
    const dvMetersPerSec = (beta * spacecraftMassKg * (impactVelocityKms * 1000)) / asteroidMassKg;
    achievableDeltaVKms = dvMetersPerSec / 1000;
    summary = `NASA DART kinetic impactor deliveres momentum boost with ejecta multiplier β = ${beta}.`;
  } else if (technique === 'gravity') {
    // Gravity Tractor: gentle gravitational tugging over years
    // a_tug = G * m_sc / d^2
    const hoverDistanceMeters = radius + 40;
    const tugAccel = (6.6743e-11 * spacecraftMassKg) / Math.pow(hoverDistanceMeters, 2);
    const tugDurationSeconds = warningSeconds * 0.6;
    achievableDeltaVKms = (tugAccel * tugDurationSeconds) / 1000;
    summary = `Continuous ion-electric spacecraft hovers at ${Math.round(hoverDistanceMeters)}m, pulling the asteroid via gravitational attraction.`;
  } else if (technique === 'nuclear') {
    // Nuclear Standoff: 1 Mt detonation vaporizes thin surface layer producing rocket blowoff
    const yieldMt = 1.0;
    const ablationMassKg = asteroidMassKg * 0.0001 * yieldMt;
    const exhaustVelocityKms = 30; // hot plasma blowoff
    achievableDeltaVKms = (ablationMassKg * exhaustVelocityKms) / asteroidMassKg;
    summary = `1 Megaton standoff detonation creates rapid surface X-ray ablation and rocket recoil impulse.`;
  } else {
    // Laser Ablation (DE-STAR)
    const laserPowerMW = 50;
    const continuousForceNewtons = laserPowerMW * 0.025; // thrust from sublimation jet
    const thrustDurationSeconds = warningSeconds * 0.8;
    achievableDeltaVKms = (continuousForceNewtons * thrustDurationSeconds) / (asteroidMassKg * 1000);
    summary = `Orbital solar-concentrator laser heats the surface to 2,800K, vaporizing rock into a propulsive thruster jet.`;
  }

  const generatedMissDistanceKm = (achievableDeltaVKms * warningSeconds) / 1.5;
  const missDistanceEarthRadii = generatedMissDistanceKm / EARTH_RADIUS_KM;
  const isSuccessful = missDistanceEarthRadii >= 2.5;

  return {
    requiredDeltaVKms,
    missDistanceEarthRadii: Math.round(missDistanceEarthRadii * 10) / 10,
    isSuccessful,
    missionDurationYears: warningYears,
    spacecraftMassKg,
    technique,
    summary,
  };
}

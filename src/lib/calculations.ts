import { RouteStop, HazardObservation, VehicleRestrictions } from '@/types/route';

/**
 * Calculates Great-Circle distance between two coordinates in Kilometres (Haversine formula)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total route path distance in KM
 */
export function calculateTotalRouteDistanceKm(coords: [number, number][]): number {
  if (!coords || coords.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalKm += calculateHaversineDistanceKm(
      coords[i][0],
      coords[i][1],
      coords[i + 1][0],
      coords[i + 1][1]
    );
  }
  return parseFloat(totalKm.toFixed(2));
}

/**
 * Calculates estimated running time (in minutes)
 * Default urban speed: 20 km/h + 1 minute baseline dwell time per passenger stop
 */
export function calculateEstimatedRunningTime(
  distanceKm: number,
  stops: RouteStop[],
  avgSpeedKph: number = 22
): number {
  if (distanceKm <= 0) return 0;
  const drivingMinutes = (distanceKm / avgSpeedKph) * 60;
  const totalDwellMinutes = stops.reduce((sum, stop) => sum + (stop.dwellMinutes || 1), 0);
  return Math.round(drivingMinutes + totalDwellMinutes);
}

/**
 * 5x5 HSE Risk Matrix Categorization
 */
export function getRiskLevel(score: number): {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  label: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  if (score >= 15) {
    return {
      level: 'HIGH',
      label: 'High Risk (15-25)',
      badgeClass: 'bg-red-600 text-white',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
      borderClass: 'border-red-500',
    };
  } else if (score >= 8) {
    return {
      level: 'MEDIUM',
      label: 'Medium Risk (8-12)',
      badgeClass: 'bg-amber-500 text-white',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-500',
    };
  } else {
    return {
      level: 'LOW',
      label: 'Low / Acceptable (1-6)',
      badgeClass: 'bg-emerald-600 text-white',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-500',
    };
  }
}

/**
 * Validates fleet restrictions against logged route hazards
 */
export function evaluateFleetCompatibility(
  hazards: HazardObservation[],
  restrictions: VehicleRestrictions
): {
  doubleDeckerSafe: boolean;
  coachSafe: boolean;
  evSafe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let doubleDeckerSafe = restrictions.doubleDeckerAllowed;
  let coachSafe = restrictions.coachAllowed;
  let evSafe = restrictions.evAllowed;

  hazards.forEach((hazard) => {
    if (hazard.category === 'Low Bridge') {
      doubleDeckerSafe = false;
      warnings.push(`Low Bridge at ${hazard.locationName} prohibits Double Deck vehicles.`);
    }
    if (hazard.category === 'Tree Strike / Overhanging Foliage' && (hazard.severity >= 4 || hazard.residualScore >= 12)) {
      warnings.push(`Severe foliage at ${hazard.locationName} poses high upper-deck strike risk.`);
    }
    if (hazard.category === 'Tight Turning Radius' && hazard.residualScore >= 12) {
      coachSafe = false;
      warnings.push(`Tight turning radius at ${hazard.locationName} restricts long 15m coaches.`);
    }
    if (hazard.category === 'Steep Gradient / Poor Camber' && hazard.residualScore >= 15) {
      warnings.push(`Severe gradient at ${hazard.locationName} requires EV regeneration / battery thermal review.`);
    }
  });

  return {
    doubleDeckerSafe,
    coachSafe,
    evSafe,
    warnings,
  };
}

/**
 * Converts Kilometres to Statute Miles
 */
export function kmToMiles(km: number): number {
  return parseFloat((km * 0.621371).toFixed(2));
}

/**
 * Converts Statute Miles to Kilometres
 */
export function milesToKm(miles: number): number {
  return parseFloat((miles / 0.621371).toFixed(2));
}

/**
 * Converts GPS speed in Metres/Second to Miles Per Hour (mph)
 */
export function mpsToMph(mps: number): number {
  if (!mps || mps <= 0) return 0;
  return parseFloat((mps * 2.23694).toFixed(1));
}

/**
 * Formats total seconds into HH:MM:SS or MM:SS format
 */
export function formatDurationHMS(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Computes True Average Moving Speed (excluding paused / hold times)
 */
export function calculateTrueAverageSpeed(
  distanceKm: number,
  activeMovingSeconds: number
): { speedKph: number; speedMph: number } {
  if (distanceKm <= 0 || activeMovingSeconds <= 5) {
    return { speedKph: 0, speedMph: 0 };
  }
  const hours = activeMovingSeconds / 3600;
  const speedKph = parseFloat((distanceKm / hours).toFixed(1));
  const speedMph = parseFloat((speedKph * 0.621371).toFixed(1));
  return { speedKph, speedMph };
}


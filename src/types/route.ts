export type StopType = 
  | 'main_stop_time_point' 
  | 'bus_stop_regular' 
  | 'junction' 
  | 'roadworks_long_term' 
  | 'other'
  | 'bus_stop' 
  | 'popup_stop' 
  | 'roadworks';

export interface RouteStop {
  id: string;
  name: string;
  stopType: StopType;
  lat: number;
  lng: number;
  dwellMinutes: number;
  notes?: string;
  order: number;
}

export type HazardCategory = 
  | 'Low Bridge'
  | 'Tree Strike / Overhanging Foliage'
  | 'School Zone / Pedestrian Density'
  | 'Blind Corner / Narrow Carriageway'
  | 'Tight Turning Radius'
  | 'Steep Gradient / Poor Camber'
  | 'Traffic Congestion / Unsignalised Junction'
  | 'Roadworks / Temporary Diversion'
  | 'Parked Vehicles / Bottleneck'
  | 'Level Crossing'
  | 'Other Operational Hazard';

export type HazardSeverity = 1 | 2 | 3 | 4 | 5;
export type HazardLikelihood = 1 | 2 | 3 | 4 | 5;

export interface HazardObservation {
  id: string;
  title: string;
  category: HazardCategory;
  lat: number;
  lng: number;
  locationName: string;
  severity: HazardSeverity;
  likelihood: HazardLikelihood;
  initialScore: number;
  residualSeverity: HazardSeverity;
  residualLikelihood: HazardLikelihood;
  residualScore: number;
  controlMeasures: string;
  riskDescription?: string;
  controlMeasure?: string;
  speedLimitMph?: number;
  vehicleRestrictions?: string[];
  photos?: string[];
  assessorNotes?: string;
  timestamp: string;
}

export interface VehicleRestrictions {
  maxVehicleHeightM: number;
  doubleDeckerAllowed: boolean;
  coachAllowed: boolean;
  evAllowed: boolean;
  minTurningRadiusM?: number;
  maxAxleWeightTonnes?: number;
  notes?: string;
}

export interface GovernanceSignOff {
  assessorName: string;
  assessorRole: string;
  assessorSignature?: string;
  assessorDate?: string;
  managerName: string;
  managerRole: string;
  managerSignature?: string;
  managerDate?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewComments?: string;
}

export type SurveyStatus = 'idle' | 'recording' | 'paused' | 'completed';

export type SurveyPauseReason = 
  | 'Hazard Site Inspection'
  | 'Railway Level Crossing'
  | 'Roadworks / Temporary Diversion'
  | 'Traffic Congestion / Bottleneck'
  | 'Driver Rest / Dwell Hold'
  | 'Depot Operations Consult'
  | 'Other Operational Pause';

export interface SurveyPauseLog {
  id: string;
  pausedAt: string;
  resumedAt?: string;
  durationSeconds: number;
  reason: SurveyPauseReason | string;
  coordinates?: [number, number];
}

export interface LiveSurveyTelemetry {
  status: SurveyStatus;
  startedAt?: string;
  completedAt?: string;
  elapsedSeconds: number;
  activeMovingSeconds: number;
  pausedSeconds: number;
  currentSpeedMph: number;
  averageMovingSpeedMph: number;
  averageMovingSpeedKph: number;
  recordedDistanceMiles: number;
  recordedDistanceKm: number;
  pauseLogs: SurveyPauseLog[];
}

export interface RouteAssessment {
  id: string;
  routeNumber: string;
  routeTitle: string;
  region: string; // User-defined Operating Region
  depot: string;  // User-defined Garage / Depot
  operatingCompany: string;
  assessorName: string;
  assessmentDate: string;
  reviewDate: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Requires Review';
  
  // GIS Geometry & Metric Data
  pathCoordinates: [number, number][];
  totalDistanceKm: number;
  estimatedRunningTimeMin: number;
  averageSpeedKph: number;
  
  // Stops & Hazards
  stops: RouteStop[];
  hazards: HazardObservation[];
  
  // Live Survey Telemetry (Start / Pause / Resume / Stop)
  surveyTelemetry?: LiveSurveyTelemetry;
  
  // Assignment & Chain of Command Delegation
  assignedToAssessorId?: string;
  assignedAssessorName?: string;
  assignedByDepotAdmin?: string;
  targetCompletionDate?: string;
  assignmentNotes?: string;
  
  // Fleet & Governance
  vehicleRestrictions: VehicleRestrictions;
  governance: GovernanceSignOff;
  
  createdAt: string;
  updatedAt: string;
}

export type GisToolMode = 
  | 'browse'
  | 'draw_path'
  | 'drop_bus_stop'
  | 'drop_popup_stop'
  | 'drop_junction'
  | 'drop_roadworks'
  | 'drop_other'
  | 'drop_hazard';

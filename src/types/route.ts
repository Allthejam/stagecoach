export type StopType = 'bus_stop' | 'popup_stop' | 'junction' | 'roadworks' | 'other';

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

export interface RouteAssessment {
  id: string;
  routeNumber: string;
  routeTitle: string;
  region: string; // e.g. Stagecoach Highlands, Stagecoach Manchester
  depot: string;  // Garage / Depot (e.g. Aviemore, Inverness, Hyde Road)
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

export interface StagecoachRegionInfo {
  regionName: string;
  garages: string[];
}

export const STAGECOACH_UK_REGIONS: StagecoachRegionInfo[] = [
  {
    regionName: 'Stagecoach Highlands',
    garages: ['Aviemore', 'Inverness (Seafield)', 'Fort William', 'Skye (Portree)', 'Thurso', 'Tain', 'Orkney (Kirkwall)']
  },
  {
    regionName: 'Stagecoach East Scotland',
    garages: ['Dundee', 'Perth', 'Dunfermline', 'Glenrothes', 'St Andrews', 'Arbroath', 'Blairgowrie']
  },
  {
    regionName: 'Stagecoach West Scotland',
    garages: ['Glasgow (Cumbernauld)', 'Ayr', 'Kilmarnock', 'Dumfries', 'Ardrossan', 'Stranraer']
  },
  {
    regionName: 'Stagecoach Manchester & Wigan',
    garages: ['Manchester (Hyde Road)', 'Manchester (Sharston)', 'Stockport (Daw Bank)', 'Middleton', 'Wigan']
  },
  {
    regionName: 'Stagecoach Merseyside & South Lancashire',
    garages: ['Liverpool (Gillmoss)', 'Chester', 'Birkenhead (Rock Ferry)', 'Preston']
  },
  {
    regionName: 'Stagecoach Cumbria & North Lancashire',
    garages: ['Carlisle', 'Kendal', 'Lancaster', 'Barrow-in-Furness', 'Workington', 'Penrith']
  },
  {
    regionName: 'Stagecoach North East',
    garages: ['Newcastle (Walkergate)', 'Newcastle (Slatyford)', 'Sunderland (Wheatsheaf)', 'South Shields', 'Hartlepool', 'Stockton']
  },
  {
    regionName: 'Stagecoach Yorkshire',
    garages: ['Sheffield (Holbrook)', 'Sheffield (Ecclesfield)', 'Barnsley', 'Chesterfield', 'Rawmarsh']
  },
  {
    regionName: 'Stagecoach East Midlands',
    garages: ['Lincoln', 'Hull', 'Grimsby', 'Scunthorpe', 'Mansfield', 'Worksop', 'Gainsborough', 'Skegness']
  },
  {
    regionName: 'Stagecoach Midlands',
    garages: ['Northampton', 'Leamington Spa', 'Rugby', 'Nuneaton', 'Kettering', 'Corby']
  },
  {
    regionName: 'Stagecoach East',
    garages: ['Cambridge (Cowley Road)', 'Peterborough', 'Bedford', 'Fenstanton']
  },
  {
    regionName: 'Stagecoach South',
    garages: ['Portsmouth', 'Winchester', 'Basingstoke', 'Andover', 'Worthing', 'Chichester', 'Aldershot']
  },
  {
    regionName: 'Stagecoach South East',
    garages: ['Canterbury', 'Dover', 'Folkestone', 'Ashford', 'Thanet (Broadstairs)', 'Hastings', 'Eastbourne', 'Herne Bay']
  },
  {
    regionName: 'Stagecoach South West',
    garages: ['Exeter (Matford)', 'Torquay', 'Plymouth', 'Barnstaple', 'Exmouth', 'Newton Abbot']
  },
  {
    regionName: 'Stagecoach Wales (De Cymru)',
    garages: ['Cardiff', 'Cwmbran', 'Blackwood', 'Merthyr Tydfil', 'Aberdare', 'Brynmawr', 'Porth']
  }
];

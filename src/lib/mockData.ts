import { RouteAssessment } from '@/types/route';

/**
 * Scottish Highlands Sample Templates (For reference or on-demand template import)
 */
export const sampleHighlandsRoutes: RouteAssessment[] = [
  {
    id: 'route-133',
    routeNumber: '133',
    routeTitle: 'Grantown-on-Spey – Advie – Cromdale Circular',
    region: 'Stagecoach Highlands',
    depot: 'Aviemore',
    operatingCompany: 'Stagecoach Highlands',
    assessorName: 'C. Bell (Senior Route Assessor)',
    assessmentDate: '2026-04-13',
    reviewDate: '2027-04-13',
    status: 'Approved',
    totalDistanceKm: 28.4,
    estimatedRunningTimeMin: 52,
    averageSpeedKph: 35,
    pathCoordinates: [
      [57.3295, -3.6062], // Craig Maclean Sports Centre
      [57.3380, -3.5950], // Grantown Square & High Street
      [57.3520, -3.5650], // Castle Grant Railway Arch
      [57.3700, -3.5200], // Cottartown & Dulicht Bridge
      [57.3910, -3.4650], // Cromdale Corridor
      [57.4100, -3.4200], // Advie Village Hall Turn
      [57.3850, -3.4400], // Speyside Way Relief
      [57.3550, -3.5100], // B9102 Return Loop
      [57.3350, -3.5700], // Speybridge Roundabout
      [57.3295, -3.6062]  // Craig Maclean Sports Centre (Finish)
    ],
    stops: [
      {
        id: 's1',
        name: 'Craig Maclean Sports Centre (Depot Start)',
        stopType: 'bus_stop',
        lat: 57.3295,
        lng: -3.6062,
        dwellMinutes: 1,
        notes: 'Depot start terminal & passenger boarding',
        order: 1
      },
      {
        id: 's2',
        name: 'Grantown High Street (The Square)',
        stopType: 'bus_stop',
        lat: 57.3325,
        lng: -3.6015,
        dwellMinutes: 1.5,
        notes: 'Town center main stop, high passenger volume',
        order: 2
      },
      {
        id: 's3',
        name: 'Speybridge Critical Roundabout',
        stopType: 'junction',
        lat: 57.3410,
        lng: -3.5890,
        dwellMinutes: 0.5,
        notes: 'Tight turning swept radius, yield hold point on A95/B9102',
        order: 3
      },
      {
        id: 's4',
        name: 'Dulicht Bridge Culvert Works',
        stopType: 'roadworks',
        lat: 57.3560,
        lng: -3.5550,
        dwellMinutes: 1.5,
        notes: 'Major bridge reinforcement contraflow & 3-way lights active 2026-2028',
        order: 4
      },
      {
        id: 's5',
        name: 'Cromdale Pop-up Shelter (Diversion Stop)',
        stopType: 'popup_stop',
        lat: 57.3710,
        lng: -3.5150,
        dwellMinutes: 1,
        notes: 'Pop-up temporary stop replacing closed church stop due to pipe repairs',
        order: 5
      },
      {
        id: 's6',
        name: 'Advie Village Hall Turnaround',
        stopType: 'bus_stop',
        lat: 57.4100,
        lng: -3.4200,
        dwellMinutes: 2,
        notes: 'Rural turnaround loop at Advie hall',
        order: 6
      },
      {
        id: 's7',
        name: 'Speyside Way Relief Checkpoint',
        stopType: 'other',
        lat: 57.3850,
        lng: -3.4400,
        dwellMinutes: 1,
        notes: 'Driver intermediate timing point & passenger hail point',
        order: 7
      },
      {
        id: 's8',
        name: 'Craig Maclean Sports Centre (Finish Stand)',
        stopType: 'bus_stop',
        lat: 57.3295,
        lng: -3.6062,
        dwellMinutes: 1,
        notes: 'Terminal finish stand and driver debrief',
        order: 8
      }
    ],
    hazards: [
      {
        id: 'h1',
        title: 'Castle Grant Railway Arch (Low Bridge & Haunch)',
        category: 'Low Bridge',
        lat: 57.3485,
        lng: -3.5750,
        locationName: 'Castle Grant Arch / A95 Approach',
        severity: 5,
        likelihood: 4,
        initialScore: 20,
        residualSeverity: 2,
        residualLikelihood: 2,
        residualScore: 4,
        controlMeasures: '1. Strict vehicle restriction: ALL Double Deck vehicles prohibited.\n2. Solo & Midi single decks permitted with center-lane arch navigation.\n3. Driver hazard alert card in cab.\n4. Warning beacon alert configured on Ticket Machine (ETM).',
        speedLimitMph: 20,
        vehicleRestrictions: ['Double Deck High Prohibited (<4.10m)', 'Double Deck Low Prohibited'],
        assessorNotes: 'Low arched stone railway bridge signed at 16ft central clearance. Arch haunch reduces clearance below 4.10m on nearside.',
        photos: ['https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80'],
        timestamp: '2026-04-13T09:15:00Z'
      },
      {
        id: 'h2',
        title: 'B9102 Cottartown Pine & Birch Tree Strike Zone',
        category: 'Tree Strike / Overhanging Foliage',
        lat: 57.3620,
        lng: -3.5400,
        locationName: 'B9102 Cottartown to Cromdale Corridor',
        severity: 4,
        likelihood: 4,
        initialScore: 16,
        residualSeverity: 2,
        residualLikelihood: 2,
        residualScore: 4,
        controlMeasures: '1. Fitted reinforced nearside mirror deflector guard brackets on dedicated fleet.\n2. Speed reduction to 25mph on blind wooded sections.\n3. Section 154 Highways Act tree-cutting notice served to Forestry Estate.',
        speedLimitMph: 25,
        vehicleRestrictions: ['Double Deck Prohibited (Overhanging Canopy)'],
        assessorNotes: 'Overhanging pine and birch branches protruding into near-side sweep between Cottartown and Cromdale.',
        photos: ['https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80'],
        timestamp: '2026-04-13T10:30:00Z'
      },
      {
        id: 'h3',
        title: 'Advie Single Track Soft Verges & Deep Culverts',
        category: 'Blind Corner / Narrow Carriageway',
        lat: 57.3980,
        lng: -3.4500,
        locationName: 'Advie Rural Link Road',
        severity: 4,
        likelihood: 3,
        initialScore: 12,
        residualSeverity: 2,
        residualLikelihood: 2,
        residualScore: 4,
        controlMeasures: '1. Strict anti-verge drop policy: Drivers instructed NEVER to yield onto unpaved verges.\n2. Mandatory use of designated tarmac intervisible passing places.\n3. Maximum speed capped at 20 mph.',
        speedLimitMph: 20,
        assessorNotes: 'Single-track unclassified road with unstable, unreinforced soft peat verges bordering 1.2m deep drainage ditches.',
        photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
        timestamp: '2026-04-13T11:45:00Z'
      },
      {
        id: 'h4',
        title: 'Grantown High Street Primary School & Pinch Point',
        category: 'School Zone / Pedestrian Density',
        lat: 57.3330,
        lng: -3.5990,
        locationName: 'Grantown High Street / South Street',
        severity: 4,
        likelihood: 3,
        initialScore: 12,
        residualSeverity: 2,
        residualLikelihood: 1,
        residualScore: 2,
        controlMeasures: '1. 15 mph defensive driving speed ceiling during bell times (08:15-09:00 & 15:00-15:45).\n2. Mandatory horn warning tap if visibility masked by delivery lorries.\n3. Door interlocking protocol verified at stop.',
        speedLimitMph: 15,
        assessorNotes: 'Heavy pedestrian congestion, school children crossing between parked delivery vans during peak school run.',
        photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80'],
        timestamp: '2026-04-13T13:00:00Z'
      }
    ],
    vehicleRestrictions: {
      maxVehicleHeightM: 4.10,
      doubleDeckerAllowed: false,
      coachAllowed: false,
      evAllowed: true,
      minTurningRadiusM: 10.5,
      maxAxleWeightTonnes: 12.0,
      notes: 'Castle Grant Arch haunch (<4.10m) and single-track B9102 strictly PROHIBIT Double Deckers. ADL Enviro200 Midi (8.9m) & Optare Solo approved.'
    },
    governance: {
      assessorName: 'C. Bell',
      assessorRole: 'Senior Route Risk Assessor',
      assessorSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="35" font-family="cursive" font-size="24" fill="%23002D62">C. Bell</text></svg>',
      assessorDate: '2026-04-13',
      managerName: 'M. MacMillan',
      managerRole: 'Operations Manager (Highlands)',
      managerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="35" font-family="cursive" font-size="24" fill="%23002D62">M. MacMillan</text></svg>',
      managerDate: '2026-04-14',
      status: 'APPROVED',
      reviewComments: 'Annual review complete. Castle Grant archway clearance restrictions reaffirmed. Highland Council sign survey logged #HC-2026-088.'
    },
    createdAt: '2026-04-13T08:00:00Z',
    updatedAt: '2026-04-14T15:30:00Z'
  },
  {
    id: 'route-11',
    routeNumber: '11',
    routeTitle: 'Inverness Bus Station – Inverness Airport – Nairn',
    region: 'Stagecoach Highlands',
    depot: 'Inverness (Seafield)',
    operatingCompany: 'Stagecoach Highlands',
    assessorName: 'D. Fraser (Route Risk Lead)',
    assessmentDate: '2026-03-20',
    reviewDate: '2027-03-20',
    status: 'Approved',
    totalDistanceKm: 27.5,
    estimatedRunningTimeMin: 48,
    averageSpeedKph: 38,
    pathCoordinates: [
      [57.4815, -4.2255],
      [57.4850, -4.2000],
      [57.4930, -4.1300],
      [57.5350, -4.0500],
      [57.5850, -3.8750]
    ],
    stops: [
      {
        id: 's11-1',
        name: 'Inverness Bus Station (Stance 4)',
        stopType: 'bus_stop',
        lat: 57.4815,
        lng: -4.2255,
        dwellMinutes: 3,
        order: 1
      },
      {
        id: 's11-2',
        name: 'Millburn Academy',
        stopType: 'bus_stop',
        lat: 57.4850,
        lng: -4.2000,
        dwellMinutes: 1,
        order: 2
      },
      {
        id: 's11-3',
        name: 'Inverness Retail Park (Tesco Extra)',
        stopType: 'bus_stop',
        lat: 57.4930,
        lng: -4.1300,
        dwellMinutes: 1.5,
        order: 3
      },
      {
        id: 's11-4',
        name: 'Inverness Airport Terminal Stance',
        stopType: 'bus_stop',
        lat: 57.5350,
        lng: -4.0500,
        dwellMinutes: 3,
        order: 4
      },
      {
        id: 's11-5',
        name: 'Nairn Bus Station Terminal',
        stopType: 'bus_stop',
        lat: 57.5850,
        lng: -3.8750,
        dwellMinutes: 2,
        order: 5
      }
    ],
    hazards: [
      {
        id: 'h11-1',
        title: 'Airport Terminal Turning Loop & Pedestrian Island',
        category: 'Tight Turning Radius',
        lat: 57.5340,
        lng: -4.0520,
        locationName: 'Inverness Airport Terminal Forecourt',
        severity: 3,
        likelihood: 3,
        initialScore: 9,
        residualSeverity: 2,
        residualLikelihood: 1,
        residualScore: 2,
        controlMeasures: '1. Max speed 10mph in terminal loop.\n2. Hazard 4-way flashers when reversing or maneuvering at stand.',
        speedLimitMph: 10,
        timestamp: '2026-03-20T10:00:00Z'
      }
    ],
    vehicleRestrictions: {
      maxVehicleHeightM: 4.40,
      doubleDeckerAllowed: true,
      coachAllowed: true,
      evAllowed: true,
      notes: 'Full clearance on A96 corridor.'
    },
    governance: {
      assessorName: 'D. Fraser',
      assessorRole: 'Route Risk Lead',
      managerName: 'M. MacMillan',
      managerRole: 'Operations Manager',
      status: 'APPROVED'
    },
    createdAt: '2026-03-20T08:00:00Z',
    updatedAt: '2026-03-22T11:00:00Z'
  },
  {
    id: 'route-55',
    routeNumber: '55',
    routeTitle: 'Aviemore – Coylumbridge – Cairngorm Mountain Base',
    region: 'Stagecoach Highlands',
    depot: 'Aviemore',
    operatingCompany: 'Stagecoach Highlands',
    assessorName: 'C. Bell (Route Assessor)',
    assessmentDate: '2026-01-15',
    reviewDate: '2027-01-15',
    status: 'Approved',
    totalDistanceKm: 17.8,
    estimatedRunningTimeMin: 35,
    averageSpeedKph: 32,
    pathCoordinates: [
      [57.1880, -3.8290],
      [57.1750, -3.7850],
      [57.1550, -3.7200],
      [57.1340, -3.6740]
    ],
    stops: [
      {
        id: 's55-1',
        name: 'Aviemore Rail Station Interchange',
        stopType: 'bus_stop',
        lat: 57.1880,
        lng: -3.8290,
        dwellMinutes: 2,
        order: 1
      },
      {
        id: 's55-2',
        name: 'Coylumbridge Hotel & Caravan Park',
        stopType: 'bus_stop',
        lat: 57.1750,
        lng: -3.7850,
        dwellMinutes: 1,
        order: 2
      },
      {
        id: 's55-3',
        name: 'Loch Morlich Watersports Beach',
        stopType: 'bus_stop',
        lat: 57.1550,
        lng: -3.7200,
        dwellMinutes: 1.5,
        order: 3
      },
      {
        id: 's55-4',
        name: 'Cairngorm Mountain Ski Centre Base',
        stopType: 'bus_stop',
        lat: 57.1340,
        lng: -3.6740,
        dwellMinutes: 3,
        order: 4
      }
    ],
    hazards: [
      {
        id: 'h55-1',
        title: 'Cairngorm Ski Road 1:6 Gradient & Black Ice Crest',
        category: 'Steep Gradient / Poor Camber',
        lat: 57.1420,
        lng: -3.6900,
        locationName: 'Cairngorm Mountain Ski Road Upper Hairpins',
        severity: 5,
        likelihood: 4,
        initialScore: 20,
        residualSeverity: 3,
        residualLikelihood: 2,
        residualScore: 6,
        controlMeasures: '1. Daily winter road inspection with Mountain Ranger station.\n2. Mandatory retarder check before descent.\n3. Speed restricted to 20 mph under adverse weather.',
        speedLimitMph: 20,
        timestamp: '2026-01-15T09:00:00Z'
      }
    ],
    vehicleRestrictions: {
      maxVehicleHeightM: 3.80,
      doubleDeckerAllowed: false,
      coachAllowed: false,
      evAllowed: false,
      notes: 'Severe mountain crosswinds and 1:6 ice gradients PROHIBIT Double Deckers.'
    },
    governance: {
      assessorName: 'C. Bell',
      assessorRole: 'Senior Route Assessor',
      managerName: 'M. MacMillan',
      managerRole: 'Operations Manager',
      status: 'APPROVED'
    },
    createdAt: '2026-01-15T07:30:00Z',
    updatedAt: '2026-01-16T12:00:00Z'
  }
];

/**
 * Clean slate default routes for live production
 */
export const initialMockRoutes: RouteAssessment[] = [];

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { usePwa } from '@/context/PwaContext';
import { HazardCategory } from '@/types/route';
import { 
  AlertTriangle, 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  MapPin, 
  ShieldCheck, 
  Check, 
  Layers,
  Sparkles,
  Move,
  RefreshCw,
  FolderOpen,
  Eye
} from 'lucide-react';

const CATEGORIES: HazardCategory[] = [
  'Blind Corner / Narrow Carriageway',
  'Tree Strike / Overhanging Foliage',
  'Low Bridge',
  'School Zone / Pedestrian Density',
  'Tight Turning Radius',
  'Steep Gradient / Poor Camber',
  'Traffic Congestion / Unsignalised Junction',
  'Roadworks / Temporary Diversion',
  'Parked Vehicles / Bottleneck',
  'Level Crossing',
  'Other Operational Hazard',
];

export default function QuickSetRiskModal() {
  const { 
    isSetRiskModalOpen, 
    setIsSetRiskModalOpen, 
    userGpsPosition, 
    quickSaveRiskHazard,
    currentRoute,
    showToast
  } = useRouteContext();

  const { cameraPermission, requestCameraPermission } = usePwa();

  const [category, setCategory] = useState<HazardCategory>('Blind Corner / Narrow Carriageway');
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDescription, setRiskDescription] = useState('');
  const [controlMeasure, setControlMeasure] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [customLat, setCustomLat] = useState<number>(57.3295);
  const [customLng, setCustomLng] = useState<number>(-3.6062);
  const [isAdjustingCoords, setIsAdjustingCoords] = useState(false);

  // Live in-app camera viewfinder states
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Native input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Stop camera helper
  const stopLiveCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraActive(false);
    setCameraError(null);
  }, []);

  // Start / restart live camera stream
  const startLiveCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    stopLiveCamera();
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera video streaming is not supported on this browser. Use native camera or file upload.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setIsLiveCameraActive(true);
      setFacingMode(mode);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Live camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Could not access the selected camera lens. Please try native camera or upload.'
      );
    }
  }, [facingMode, stopLiveCamera]);

  // Flip between Rear ('environment') and Front ('user') lenses
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextMode);
  };

  // Capture still snapshot from live video stream
  const handleSnapPhoto = () => {
    if (!videoRef.current || photos.length >= 3) return;

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Compress to JPEG format
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setPhotos((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, photoDataUrl];
    });

    showToast(`Photo #${photos.length + 1} captured!`);

    // If reached 3 photos, automatically close live viewfinder
    if (photos.length + 1 >= 3) {
      stopLiveCamera();
    }
  };

  // Sync GPS position when opened and clean up camera when closed
  useEffect(() => {
    if (isSetRiskModalOpen) {
      if (userGpsPosition) {
        setCustomLat(userGpsPosition[0]);
        setCustomLng(userGpsPosition[1]);
      } else if (currentRoute?.pathCoordinates && currentRoute.pathCoordinates.length > 0) {
        const last = currentRoute.pathCoordinates[currentRoute.pathCoordinates.length - 1];
        setCustomLat(last[0]);
        setCustomLng(last[1]);
      }
      setRiskTitle('');
      setRiskDescription('');
      setControlMeasure('');
      setPhotos([]);
      setIsAdjustingCoords(false);
      stopLiveCamera();
    } else {
      stopLiveCamera();
    }
    return () => {
      stopLiveCamera();
    };
  }, [isSetRiskModalOpen, userGpsPosition, currentRoute, stopLiveCamera]);

  // Handle storage file uploads & native camera fallback
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (photos.length >= 3) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!riskDescription.trim()) {
      alert('Please enter a description for this hazard/risk event.');
      return;
    }

    if (!controlMeasure.trim()) {
      alert('Please enter the mandatory control measure to mitigate this risk.');
      return;
    }

    stopLiveCamera();

    quickSaveRiskHazard({
      title: riskTitle.trim() || category,
      category,
      riskDescription: riskDescription.trim(),
      controlMeasure: controlMeasure.trim(),
      photos,
      lat: customLat,
      lng: customLng,
      locationName: `Hazard at [${customLat.toFixed(4)}, ${customLng.toFixed(4)}]`
    });

    setIsSetRiskModalOpen(false);
  };

  if (!isSetRiskModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  🔴 Geotagged Risk
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {customLat.toFixed(4)}, {customLng.toFixed(4)}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Set Route Hazard & Risk Event
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopLiveCamera();
              setIsSetRiskModalOpen(false);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Hazard Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as HazardCategory)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Short Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Hazard Title / Location Reference <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={riskTitle}
              onChange={(e) => setRiskTitle(e.target.value)}
              placeholder={`e.g. ${category} near Milepost 3`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* BOX 1: What is the Risk? */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-3.5 space-y-1.5">
            <label className="block text-xs font-black text-red-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>⚠️ Box 1: What is the Hazard / Risk?</span>
                <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">Required</span>
            </label>
            <textarea
              required
              rows={3}
              value={riskDescription}
              onChange={(e) => setRiskDescription(e.target.value)}
              placeholder="Describe the physical hazard, blind sightlines, road narrowing, overhanging foliage, or pedestrian conflict points..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 leading-relaxed resize-none"
            />
          </div>

          {/* BOX 2: Mandatory Control Measure */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-3.5 space-y-1.5">
            <label className="block text-xs font-black text-emerald-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>🛡️ Box 2: Mandatory Control Measure</span>
                <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">Required</span>
            </label>
            <textarea
              required
              rows={3}
              value={controlMeasure}
              onChange={(e) => setControlMeasure(e.target.value)}
              placeholder="Specify the exact mitigation required (e.g. Reduce speed to 10mph, sound horn, mirror checks, priority give-way to oncoming double-deckers)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />
          </div>

          {/* PHOTO EVIDENCE SECTION: 2 SEPARATE FUNCTIONS (1. CAMERA ACCESS vs 2. DEVICE STORAGE) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <label className="text-xs font-black text-slate-200 flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-stagecoach-amber" />
                <span>Hazard Evidence Photos ({photos.length}/3)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Camera (Front & Back) + Device Storage
              </span>
            </div>

            {/* Hidden native inputs */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Live Camera Viewfinder Overlay */}
            {isLiveCameraActive && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500 bg-black shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video sm:aspect-[4/3] object-cover rounded-xl bg-black"
                />

                {/* Viewfinder Overlay Crosshair */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-32 h-32 border border-white/40 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400"></div>
                  </div>
                </div>

                {/* Camera Lens Indicator */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20 flex items-center space-x-1">
                  <span>📷 {facingMode === 'environment' ? 'Back Camera (Road View)' : 'Front Camera (Cab View)'}</span>
                </div>

                {/* Camera Controls Floating Bar */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 shadow-lg flex items-center space-x-1.5 cursor-pointer"
                    title="Switch between front and back cameras"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Flip Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xl flex items-center space-x-1.5 cursor-pointer animate-pulse"
                  >
                    <Camera className="w-4 h-4 fill-slate-950" />
                    <span>Snap Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-white text-xs font-bold rounded-xl border border-red-800 shadow-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Camera Error / Troubleshooting Notice */}
            {cameraError && (
              <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="mt-1.5 underline font-bold text-amber-300 hover:text-white block"
                  >
                    Try Native Device Camera App instead ➡️
                  </button>
                </div>
              </div>
            )}

            {/* Photo Thumbnails */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                    <img src={src} alt={`Hazard photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full shadow-lg transition"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">
                      Photo #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons: 2 Distinct Functions (1. Camera vs 2. Storage) */}
            {photos.length < 3 && !isLiveCameraActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                
                {/* Function 1: Live Camera Access with Front/Back switching */}
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                      <Camera className="w-4 h-4" />
                      <span>1. Camera Lens Access</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Live viewfinder with front and rear lens switching
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => startLiveCamera('environment')}
                      className="py-2 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Live Viewfinder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>Device Camera</span>
                    </button>
                  </div>
                </div>

                {/* Function 2: Device Storage & Gallery Upload */}
                <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-400">
                      <FolderOpen className="w-4 h-4" />
                      <span>2. Device Storage & Gallery</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select existing hazard photos or diagrams from storage
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse Storage / Gallery</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Coordinate Adjustment Accordion */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
            <button
              type="button"
              onClick={() => setIsAdjustingCoords(!isAdjustingCoords)}
              className="w-full flex items-center justify-between text-slate-400 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center space-x-1.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Pin Location: {customLat.toFixed(5)}, {customLng.toFixed(5)}</span>
              </span>
              <span className="text-[11px] text-sky-400 font-bold">
                {isAdjustingCoords ? 'Hide Adjustment' : 'Adjust Pin 📍'}
              </span>
            </button>

            {isAdjustingCoords && (
              <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => setCustomLat(parseFloat(e.target.value) || customLat)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLng}
                    onChange={(e) => setCustomLng(parseFloat(e.target.value) || customLng)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                {userGpsPosition && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLat(userGpsPosition[0]);
                      setCustomLng(userGpsPosition[1]);
                    }}
                    className="col-span-2 text-[11px] text-sky-400 hover:underline text-left cursor-pointer"
                  >
                    Reset to Live GPS Position [{userGpsPosition[0].toFixed(5)}, {userGpsPosition[1].toFixed(5)}]
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                stopLiveCamera();
                setIsSetRiskModalOpen(false);
              }}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-red-900/40 transition flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Drop Red Pin & Save Risk</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

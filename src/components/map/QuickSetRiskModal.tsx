"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouteContext } from '@/context/RouteContext';
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
  Move
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
    currentRoute
  } = useRouteContext();

  const [category, setCategory] = useState<HazardCategory>('Blind Corner / Narrow Carriageway');
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDescription, setRiskDescription] = useState('');
  const [controlMeasure, setControlMeasure] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [customLat, setCustomLat] = useState<number>(57.3295);
  const [customLng, setCustomLng] = useState<number>(-3.6062);
  const [isAdjustingCoords, setIsAdjustingCoords] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync GPS position when opened
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
      // Reset form
      setRiskTitle('');
      setRiskDescription('');
      setControlMeasure('');
      setPhotos([]);
      setIsAdjustingCoords(false);
    }
  }, [isSetRiskModalOpen, userGpsPosition, currentRoute]);

  if (!isSetRiskModalOpen) return null;

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    // Reset file input
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!riskDescription.trim()) {
      alert('Please enter a description for this risk event.');
      return;
    }

    if (!controlMeasure.trim()) {
      alert('Please enter the mandatory control measure to mitigate this risk.');
      return;
    }

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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-start justify-between">
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
            onClick={() => setIsSetRiskModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
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
              placeholder={`e.g. ${category} near School Entrance`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            >
            </input>
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
              placeholder="Describe the physical hazard, blind sightlines, road narrowing, overhanging obstacles, or pedestrian conflict points..."
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
              placeholder="Specify the exact mitigation required (e.g. Reduce speed to 10mph, sound horn, mirror sweeps, give-way priority to oncoming double-deckers)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />
          </div>

          {/* PHOTO ATTACHMENTS (Up to 3 Photos) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-stagecoach-amber" />
                <span>Attach Photos ({photos.length}/3)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Camera or Gallery
              </span>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageCapture}
              className="hidden"
            />

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
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Camera / Upload Action Buttons */}
            {photos.length < 3 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Take Camera Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Choose Photo</span>
                </button>
              </div>
            )}
          </div>

          {/* Coordinate Adjustment Accordion */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
            <button
              type="button"
              onClick={() => setIsAdjustingCoords(!isAdjustingCoords)}
              className="w-full flex items-center justify-between text-slate-400 hover:text-white transition"
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
              onClick={() => setIsSetRiskModalOpen(false)}
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

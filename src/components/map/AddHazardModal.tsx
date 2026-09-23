"use client";

import React, { useState, useEffect } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { HazardCategory, HazardObservation, HazardSeverity, HazardLikelihood } from '@/types/route';
import { getRiskLevel } from '@/lib/calculations';
import { compressImageFile } from '@/lib/storage';
import { AlertTriangle, Camera, X, ShieldCheck, Gauge, Bus } from 'lucide-react';

const hazardCategories: HazardCategory[] = [
  'Low Bridge',
  'Tree Strike / Overhanging Foliage',
  'School Zone / Pedestrian Density',
  'Blind Corner / Narrow Carriageway',
  'Tight Turning Radius',
  'Steep Gradient / Poor Camber',
  'Traffic Congestion / Unsignalised Junction',
  'Roadworks / Temporary Diversion',
  'Parked Vehicles / Bottleneck',
  'Level Crossing',
  'Other Operational Hazard',
];

export default function AddHazardModal() {
  const {
    isAddHazardModalOpen,
    setIsAddHazardModalOpen,
    pendingCoords,
    updateCurrentRoute,
    showToast,
  } = useRouteContext();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HazardCategory>('Low Bridge');
  const [locationName, setLocationName] = useState('');
  const [severity, setSeverity] = useState<HazardSeverity>(4);
  const [likelihood, setLikelihood] = useState<HazardLikelihood>(3);
  const [residualSeverity, setResidualSeverity] = useState<HazardSeverity>(3);
  const [residualLikelihood, setResidualLikelihood] = useState<HazardLikelihood>(1);
  const [controlMeasures, setControlMeasures] = useState('');
  const [speedLimitMph, setSpeedLimitMph] = useState<number | ''>(20);
  const [assessorNotes, setAssessorNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  
  const [prohibitDoubleDeck, setProhibitDoubleDeck] = useState(false);
  const [prohibitCoach, setProhibitCoach] = useState(false);

  useEffect(() => {
    if (isAddHazardModalOpen) {
      setTitle('');
      setLocationName('');
      setControlMeasures('');
      setAssessorNotes('');
      setPhotos([]);
      setSeverity(4);
      setLikelihood(3);
      setResidualSeverity(3);
      setResidualLikelihood(1);
      setSpeedLimitMph(20);
      setProhibitDoubleDeck(false);
      setProhibitCoach(false);
    }
  }, [isAddHazardModalOpen]);

  // Auto-set category specific defaults
  useEffect(() => {
    if (category === 'Low Bridge') {
      setProhibitDoubleDeck(true);
      if (!controlMeasures) {
        setControlMeasures('Mandatory vehicle height check. Double-deckers prohibited. Drive in center carriageway arch.');
      }
    } else if (category === 'Tree Strike / Overhanging Foliage') {
      if (!controlMeasures) {
        setControlMeasures('Tree branch overhang at nearside. Reduce speed to 15 mph. Log council trimming request.');
      }
    }
  }, [category]);

  if (!isAddHazardModalOpen || !pendingCoords) return null;

  const initialScore = severity * likelihood;
  const residualScore = residualSeverity * residualLikelihood;
  const initialRisk = getRiskLevel(initialScore);
  const residualRisk = getRiskLevel(residualScore);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingPhoto(true);
      try {
        const compressedBase64 = await compressImageFile(e.target.files[0]);
        setPhotos((prev) => [...prev, compressedBase64]);
        showToast('Photo captured & compressed');
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    const restrictions: string[] = [];
    if (prohibitDoubleDeck) restrictions.push('Double Deck Vehicles Prohibited');
    if (prohibitCoach) restrictions.push('Long Coaches (15m) Prohibited');

    const newHazard: HazardObservation = {
      id: `haz-${Date.now().toString(36)}`,
      title: title.trim(),
      category: category,
      lat: pendingCoords[0],
      lng: pendingCoords[1],
      locationName: locationName.trim(),
      severity: severity,
      likelihood: likelihood,
      initialScore: initialScore,
      residualSeverity: residualSeverity,
      residualLikelihood: residualLikelihood,
      residualScore: residualScore,
      controlMeasures: controlMeasures.trim() || 'Standard defensive driving and adherence to speed limit.',
      speedLimitMph: speedLimitMph !== '' ? Number(speedLimitMph) : undefined,
      vehicleRestrictions: restrictions.length > 0 ? restrictions : undefined,
      photos: photos,
      assessorNotes: assessorNotes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    updateCurrentRoute((prev) => ({
      ...prev,
      hazards: [...prev.hazards, newHazard],
    }));

    setIsAddHazardModalOpen(false);
    showToast(`Logged Hazard: "${newHazard.title}" (Residual Risk ${residualScore})`);
  };

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-stagecoach-navy text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pin Geotagged Hazard</h3>
              <p className="text-[11px] text-slate-300 font-mono">
                GPS: {pendingCoords[0].toFixed(5)}, {pendingCoords[1].toFixed(5)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddHazardModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-800 text-xs sm:text-sm">
          
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hazard Classification *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as HazardCategory)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
            >
              {hazardCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hazard Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Low Railway Arch Clearance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-stagecoach-blue focus:outline-none text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ashton Old Road / Fairfield Arch"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-stagecoach-blue focus:outline-none text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* 5x5 Matrix Scoring Grid */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700">5×5 Risk Matrix Assessment</span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${residualRisk.badgeClass}`}>
                Residual: {residualScore} ({residualRisk.level})
              </span>
            </div>

            {/* Inherent Score Sliders */}
            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Inherent Severity</span>
                  <span className="text-slate-900">{severity}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value) as HazardSeverity)}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Inherent Likelihood</span>
                  <span className="text-slate-900">{likelihood}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={likelihood}
                  onChange={(e) => setLikelihood(Number(e.target.value) as HazardLikelihood)}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Residual Score Sliders */}
            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Residual Severity</span>
                  <span className="text-slate-900">{residualSeverity}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={residualSeverity}
                  onChange={(e) => setResidualSeverity(Number(e.target.value) as HazardSeverity)}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Residual Likelihood</span>
                  <span className="text-slate-900">{residualLikelihood}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={residualLikelihood}
                  onChange={(e) => setResidualLikelihood(Number(e.target.value) as HazardLikelihood)}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Control Measures */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mandatory Driver & Operational Controls *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Maintain center of carriageway, reduce speed to 15 mph, sound horn if blind approach."
              value={controlMeasures}
              onChange={(e) => setControlMeasures(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-stagecoach-blue focus:outline-none text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Speed Limit & Fleet Restrictions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Advisory Speed Limit (MPH)
              </label>
              <input
                type="number"
                min="5"
                max="70"
                step="5"
                value={speedLimitMph}
                onChange={(e) => setSpeedLimitMph(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-stagecoach-blue focus:outline-none text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Fleet Prohibitions</span>
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prohibitDoubleDeck}
                  onChange={(e) => setProhibitDoubleDeck(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-red-700">Prohibit Double Deckers</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prohibitCoach}
                  onChange={(e) => setProhibitCoach(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span>Prohibit Coaches (15m)</span>
              </label>
            </div>
          </div>

          {/* Native Camera Photo Capture */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Geotagged Survey Photos ({photos.length})
              </label>
              <label className="inline-flex items-center px-2.5 py-1 bg-stagecoach-blue text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-800 transition-colors shadow-sm">
                <Camera className="w-3.5 h-3.5 mr-1" />
                <span>Take / Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-300">
                    <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessor Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assessor Confidential Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Council survey pending; inspection date 18/09/2026."
              value={assessorNotes}
              onChange={(e) => setAssessorNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-stagecoach-blue focus:outline-none text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddHazardModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingPhoto}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Pin Hazard to Map
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

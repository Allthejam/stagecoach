"use client";

import React from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { getRiskLevel } from '@/lib/calculations';
import { 
  X, 
  AlertTriangle, 
  MapPin, 
  ShieldCheck, 
  Gauge, 
  Bus, 
  Calendar, 
  FileText, 
  Trash2, 
  Camera 
} from 'lucide-react';

export default function HazardDetailModal() {
  const { 
    selectedHazardForModal, 
    setSelectedHazardForModal, 
    updateCurrentRoute, 
    showConfirmModal,
    showToast 
  } = useRouteContext();

  if (!selectedHazardForModal) return null;

  const hazard = selectedHazardForModal;
  const initialRisk = getRiskLevel(hazard.initialScore);
  const residualRisk = getRiskLevel(hazard.residualScore);

  const handleDeleteHazard = () => {
    showConfirmModal({
      title: 'Delete Hazard Observation?',
      message: `Are you sure you want to remove the hazard "${hazard.title}" from this route assessment?`,
      confirmText: 'Delete Hazard',
      isDestructive: true,
      onConfirm: () => {
        updateCurrentRoute((prev) => ({
          ...prev,
          hazards: prev.hazards.filter((h) => h.id !== hazard.id),
        }));
        setSelectedHazardForModal(null);
        showToast('Hazard deleted');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${residualRisk.bgClass} ${residualRisk.textClass}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-stagecoach-amber border border-slate-700">
                  {hazard.category}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${residualRisk.badgeClass}`}>
                  Residual Risk: {hazard.residualScore} ({residualRisk.level})
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                {hazard.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setSelectedHazardForModal(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* Location & GPS Info */}
          <div className="flex items-start justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-5 h-5 text-stagecoach-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exact Survey Location</p>
                <p className="text-sm font-bold text-slate-900">{hazard.locationName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  GPS: {hazard.lat.toFixed(5)}, {hazard.lng.toFixed(5)}
                </p>
              </div>
            </div>
            {hazard.speedLimitMph && (
              <div className="flex flex-col items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Gauge className="w-4 h-4 text-slate-600 mb-0.5" />
                <span className="text-xs font-extrabold text-slate-900">{hazard.speedLimitMph} MPH</span>
                <span className="text-[9px] text-slate-400 font-medium">Advisory</span>
              </div>
            )}
          </div>

          {/* 5x5 HSE Risk Matrix Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Initial Score */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600 uppercase">Initial Inherent Risk</span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  Score: {hazard.initialScore}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Severity: <span className="font-semibold text-slate-900">{hazard.severity}/5</span></div>
                <div>Likelihood: <span className="font-semibold text-slate-900">{hazard.likelihood}/5</span></div>
                <div className="text-[11px] text-slate-500 italic">Pre-control operational baseline</div>
              </div>
            </div>

            {/* Residual Score */}
            <div className={`p-3.5 rounded-xl border ${residualRisk.bgClass} ${residualRisk.borderClass}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 uppercase">Residual Controlled Risk</span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${residualRisk.badgeClass}`}>
                  Score: {hazard.residualScore}
                </span>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div>Residual Severity: <span className="font-semibold text-slate-900">{hazard.residualSeverity}/5</span></div>
                <div>Residual Likelihood: <span className="font-semibold text-slate-900">{hazard.residualLikelihood}/5</span></div>
                <div className="text-[11px] font-semibold text-slate-800">{residualRisk.label}</div>
              </div>
            </div>
          </div>

          {/* Control Measures */}
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-700 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Mandatory Driver & Operational Control Measures</span>
            </div>
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {hazard.controlMeasures || 'No specific control measures recorded.'}
            </div>
          </div>

          {/* Vehicle Restrictions */}
          {hazard.vehicleRestrictions && hazard.vehicleRestrictions.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-700 mb-1.5">
                <Bus className="w-4 h-4 text-stagecoach-blue" />
                <span>Vehicle Fleet Restrictions & Prohibitions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hazard.vehicleRestrictions.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
                  >
                    ⚠️ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {hazard.photos && hazard.photos.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-700 mb-2">
                <Camera className="w-4 h-4 text-slate-600" />
                <span>Field Geotagged Survey Photos ({hazard.photos.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hazard.photos.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img
                      src={url}
                      alt={`Survey Hazard ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessor Notes */}
          {hazard.assessorNotes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Assessor Confidential Notes: </span>
              {hazard.assessorNotes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDeleteHazard}
            className="inline-flex items-center px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Hazard
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedHazardForModal(null)}
            className="px-5 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}

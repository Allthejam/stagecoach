"use client";

import React, { useState } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { useAuthContext } from '@/context/AuthContext';
import { 
  ClipboardList, 
  UserCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Navigation, 
  FileText, 
  ChevronRight, 
  Send, 
  MapPin, 
  Bus, 
  Building2, 
  Warehouse,
  ShieldCheck
} from 'lucide-react';

export default function RouteAssignmentManager() {
  const { 
    routes, 
    filteredRoutes, 
    currentRoute, 
    selectRoute, 
    setActiveTab, 
    setIsGpsTracking, 
    assignRouteToAssessor 
  } = useRouteContext();
  const { operatorProfile, usersList, canManageRole } = useAuthContext();

  const [selectedRouteId, setSelectedRouteId] = useState<string>(currentRoute?.id || (routes[0]?.id || ''));
  const [selectedAssessorId, setSelectedAssessorId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

  const isAssessor = operatorProfile.role === 'assessor';
  const isManager = operatorProfile.role === 'master_admin' || operatorProfile.role === 'regional_admin' || operatorProfile.role === 'depot_admin';

  // Assessors available for assignment
  const availableAssessors = usersList.filter((u) => u.role === 'assessor' && u.status === 'active');

  // Filter routes: if Assessor, highlight their assigned routes; if manager, show depot/region routes
  const myAssignedRoutes = routes.filter((r) => 
    r.assignedToAssessorId === operatorProfile.uid || 
    (r.assessorName && r.assessorName.toLowerCase() === (operatorProfile.displayName || '').toLowerCase())
  );

  const handleOpenAssign = (routeId: string) => {
    setSelectedRouteId(routeId);
    const target = routes.find((r) => r.id === routeId);
    if (target) {
      setSelectedAssessorId(target.assignedToAssessorId || (availableAssessors[0]?.uid || ''));
      setTargetDate(target.targetCompletionDate || '');
      setAssignmentNotes(target.assignmentNotes || '');
    }
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId || !selectedAssessorId) return;
    const assessor = availableAssessors.find((a) => a.uid === selectedAssessorId);
    const assessorName = assessor ? assessor.displayName : 'Assigned Assessor';

    await assignRouteToAssessor(
      selectedRouteId,
      selectedAssessorId,
      assessorName,
      targetDate,
      assignmentNotes
    );

    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stagecoach-amber/20 border border-stagecoach-amber/30 text-stagecoach-amber flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black">
              {isAssessor ? 'My Assigned Route Risk Surveys' : 'Depot Route Assignment & Delegation'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAssessor 
              ? 'Routes assigned to you by Depot Operations for live GPS survey, hazard identification, and clearance verification.'
              : 'Appoint certified RRA Assessors to specific corridors and track audit progress across your depot.'}
          </p>
        </div>

        {isManager && (
          <div className="text-right">
            <span className="text-[11px] text-amber-400 font-bold block">
              {routes.filter((r) => r.assignedToAssessorId).length} / {routes.length} Routes Assigned
            </span>
            <span className="text-[10px] text-slate-400">
              Active Depot: {operatorProfile.depot || 'All Depots'}
            </span>
          </div>
        )}
      </div>

      {/* Assessor Special View: My Assigned Work Queue */}
      {isAssessor && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-stagecoach-blue" />
            <span>My Active Assignments ({myAssignedRoutes.length})</span>
          </h3>

          {myAssignedRoutes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800">No Routes Currently Assigned to You</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your Depot Operations Manager has not assigned any pending route surveys to your profile yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAssignedRoutes.map((r) => (
                <div 
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-stagecoach-navy text-stagecoach-amber font-black text-xs mb-1">
                        Route {r.routeNumber}
                      </span>
                      <h4 className="font-black text-base text-slate-900 leading-tight">{r.routeTitle}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{r.region} • {r.depot}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                      r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      r.status === 'Requires Review' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  {r.assignmentNotes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <p className="font-bold text-[11px] mb-0.5">Depot Manager Instructions:</p>
                      <p className="italic">{r.assignmentNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {r.targetCompletionDate || 'Open Timeline'}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-bold text-slate-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{r.hazards.length} Hazards Logged</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => {
                        selectRoute(r.id);
                        setActiveTab('map');
                        setIsGpsTracking(true);
                      }}
                      className="flex-1 py-2.5 bg-stagecoach-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start GPS Field Survey</span>
                    </button>
                    <button
                      onClick={() => {
                        selectRoute(r.id);
                        setActiveTab('hazards');
                      }}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hazards</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Management Route Delegation Register */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <Warehouse className="w-4 h-4 text-stagecoach-amber" />
          <span>Depot Route Risk Register & Assignment Status</span>
        </h3>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Region & Depot</th>
                  <th className="py-3 px-4">Assigned Assessor</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4">Hazards / Clearance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((r) => {
                  const isCurrent = r.id === currentRoute?.id;
                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-amber-50/50' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-stagecoach-amber shrink-0">
                            {r.routeNumber}
                          </span>
                          <span className="font-bold text-slate-900 max-w-[220px] truncate block" title={r.routeTitle}>
                            {r.routeTitle}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="block font-semibold text-slate-800">{r.region}</span>
                        <span className="text-[11px] text-slate-500">{r.depot}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {r.assignedAssessorName ? (
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">
                              {r.assignedAssessorName.charAt(0)}
                            </div>
                            <span>{r.assignedAssessorName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {r.targetCompletionDate || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 text-slate-700 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{r.hazards.length} Hazards</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          r.status === 'Requires Review' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isManager && (
                            <button
                              onClick={() => handleOpenAssign(r.id)}
                              className="px-2.5 py-1.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition shadow-sm"
                            >
                              Assign
                            </button>
                          )}
                          <button
                            onClick={() => {
                              selectRoute(r.id);
                              setActiveTab('map');
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stagecoach-navy text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Assign Route to Assessor</h3>
                  <p className="text-[11px] text-slate-300">Set assigned surveyor and survey instructions</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Route</label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      Route {r.routeNumber} - {r.routeTitle} ({r.depot})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appoint Certified Assessor</label>
                <select
                  value={selectedAssessorId}
                  onChange={(e) => setSelectedAssessorId(e.target.value)}
                  required
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                >
                  <option value="">-- Choose Field Assessor --</option>
                  {availableAssessors.map((a) => (
                    <option key={a.uid} value={a.uid}>
                      {a.displayName} ({a.assessorNumber || 'Certified'}) - {a.depot || a.region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Survey Instructions & Special Checks</label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Please survey the low railway bridge clearance on the High Street and verify tree branch overhang for double deckers..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Appoint & Assign Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

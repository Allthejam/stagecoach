"use client";

import React, { useState } from 'react';
import { useFleetContext, BusVehicle, VehicleType, VehicleStatus, VEHICLE_TYPE_LABELS } from '@/context/FleetContext';
import { useRouteContext } from '@/context/RouteContext';
import { useAuthContext } from '@/context/AuthContext';
import { 
  Bus, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Warehouse, 
  Zap, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Layers, 
  Ruler, 
  ArrowUpDown, 
  ShieldCheck,
  BatteryCharging,
  Users
} from 'lucide-react';

export default function DepotFleetManagement() {
  const { buses, addBus, updateBus, deleteBus } = useFleetContext();
  const { availableRegionsForFilter, availableGaragesForFilter } = useRouteContext();
  const { operatorProfile } = useAuthContext();

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDepot, setSelectedDepot] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusVehicle | null>(null);
  const [formFleetNumber, setFormFleetNumber] = useState('');
  const [formRegistration, setFormRegistration] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formDepot, setFormDepot] = useState('');
  const [formVehicleType, setFormVehicleType] = useState<VehicleType>('double_decker');
  const [formMakeModel, setFormMakeModel] = useState('Alexander Dennis Enviro400 MMC');
  const [formHeightM, setFormHeightM] = useState(4.40);
  const [formWidthM, setFormWidthM] = useState(2.55);
  const [formLengthM, setFormLengthM] = useState(11.5);
  const [formTurningRadiusM, setFormTurningRadiusM] = useState(12.5);
  const [formSeatingCapacity, setFormSeatingCapacity] = useState(78);
  const [formIsEv, setFormIsEv] = useState(false);
  const [formStatus, setFormStatus] = useState<VehicleStatus>('in_service');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingBus(null);
    setFormFleetNumber('');
    setFormRegistration('');
    setFormRegion(selectedRegion || operatorProfile.region || 'North Scotland');
    setFormDepot(selectedDepot || operatorProfile.depot || 'Inverness Depot');
    setFormVehicleType('double_decker');
    setFormMakeModel('Alexander Dennis Enviro400 MMC');
    setFormHeightM(4.40);
    setFormWidthM(2.55);
    setFormLengthM(11.5);
    setFormTurningRadiusM(12.5);
    setFormSeatingCapacity(78);
    setFormIsEv(false);
    setFormStatus('in_service');
    setFormNotes('');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (bus: BusVehicle) => {
    setEditingBus(bus);
    setFormFleetNumber(bus.fleetNumber);
    setFormRegistration(bus.registration);
    setFormRegion(bus.region);
    setFormDepot(bus.depot);
    setFormVehicleType(bus.vehicleType);
    setFormMakeModel(bus.makeModel);
    setFormHeightM(bus.heightM);
    setFormWidthM(bus.widthM);
    setFormLengthM(bus.lengthM);
    setFormTurningRadiusM(bus.turningRadiusM);
    setFormSeatingCapacity(bus.seatingCapacity);
    setFormIsEv(bus.isEv);
    setFormStatus(bus.status);
    setFormNotes(bus.notes || '');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFleetNumber.trim() || !formRegistration.trim() || !formDepot.trim()) {
      setFormError('Fleet Number, Registration Plate, and Depot are required.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const busPayload = {
      fleetNumber: formFleetNumber.trim().toUpperCase(),
      registration: formRegistration.trim().toUpperCase(),
      region: formRegion.trim() || 'Stagecoach Network',
      depot: formDepot.trim(),
      vehicleType: formVehicleType,
      makeModel: formMakeModel.trim(),
      heightM: Number(formHeightM),
      widthM: Number(formWidthM),
      lengthM: Number(formLengthM),
      turningRadiusM: Number(formTurningRadiusM),
      seatingCapacity: Number(formSeatingCapacity),
      isEv: formIsEv,
      status: formStatus,
      notes: formNotes.trim() || undefined
    };

    let res;
    if (editingBus) {
      res = await updateBus(editingBus.id, busPayload);
    } else {
      res = await addBus(busPayload);
    }

    setIsSaving(false);

    if (res.success) {
      setFormSuccess(editingBus ? 'Vehicle details updated!' : 'Bus successfully registered to depot!');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } else {
      setFormError(res.error || 'Failed to save vehicle record.');
    }
  };

  // Filtered Buses
  const filteredBuses = buses.filter((b) => {
    const matchesRegion = !selectedRegion || b.region.toLowerCase().includes(selectedRegion.toLowerCase());
    const matchesDepot = !selectedDepot || b.depot.toLowerCase().includes(selectedDepot.toLowerCase());
    const matchesType = selectedType === 'all' || b.vehicleType === selectedType;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;
    const matchesSearch = 
      !searchTerm ||
      b.fleetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.depot.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRegion && matchesDepot && matchesType && matchesStatus && matchesSearch;
  });

  // KPI Metrics
  const totalBuses = filteredBuses.length;
  const doubleDeckers = filteredBuses.filter((b) => b.vehicleType === 'double_decker').length;
  const evBuses = filteredBuses.filter((b) => b.isEv || b.vehicleType === 'electric_ev').length;
  const inService = filteredBuses.filter((b) => b.status === 'in_service').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-stagecoach-amber/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Depot Bus Fleet & Vehicle Roster
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage specific buses allocated to depots, vehicle clearances, double decker heights, and EV allocations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bus to Depot</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Depot Fleet</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalBuses}</span>
            <span className="text-xs text-slate-500">Vehicles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Double Deckers</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-indigo-700">{doubleDeckers}</span>
            <span className="text-xs text-slate-500">High Clearance</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Zero-Emission EVs</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{evBuses}</span>
            <span className="text-xs text-slate-500">Battery Electric</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active in Service</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-blue-600">{inService}</span>
            <span className="text-xs text-slate-500">Ready for Route</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fleet number, reg plate, model..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
          />
        </div>

        {/* Region Filter */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            placeholder="Filter Region..."
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-28"
          />
        </div>

        {/* Depot Filter */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50">
          <Warehouse className="w-3.5 h-3.5 text-blue-500" />
          <input
            type="text"
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
            placeholder="Filter Depot / Garage..."
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none w-32"
          />
        </div>

        {/* Vehicle Type Filter */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Vehicle Types</option>
            <option value="double_decker">Double Decker</option>
            <option value="single_decker">Single Decker</option>
            <option value="electric_ev">Electric EV</option>
            <option value="midi_bus">Midi Bus</option>
            <option value="coach">Coach</option>
          </select>
        </div>

        {(selectedRegion || selectedDepot || selectedType !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setSelectedRegion('');
              setSelectedDepot('');
              setSelectedType('all');
              setSearchTerm('');
            }}
            className="text-xs text-stagecoach-blue font-bold hover:underline px-2"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Buses Roster Cards Grid */}
      {filteredBuses.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Bus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Buses Found in Depot Roster</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start adding your regional buses and fleet specs to ensure accurate clearance checks against bridges and turns.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
          >
            Register First Bus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuses.map((bus) => {
            const typeInfo = VEHICLE_TYPE_LABELS[bus.vehicleType] || VEHICLE_TYPE_LABELS.double_decker;
            const isDoubleDecker = bus.vehicleType === 'double_decker' || bus.heightM >= 4.2;

            return (
              <div
                key={bus.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
              >
                {/* Card Top */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                          #{bus.fleetNumber}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded">
                          {bus.registration}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {bus.makeModel}
                      </p>
                    </div>

                    <span className={'text-[10px] font-bold px-2 py-0.5 rounded border ' + typeInfo.badgeColor}>
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Depot & Region Pill */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      <Building2 className="w-3 h-3 text-stagecoach-amber" />
                      <span>{bus.region}</span>
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      <Warehouse className="w-3 h-3 text-blue-500" />
                      <span>{bus.depot}</span>
                    </span>
                  </div>

                  {/* Physical Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block font-semibold">Height</span>
                      <span className={'text-xs font-black ' + (isDoubleDecker ? 'text-amber-700' : 'text-slate-900')}>
                        {bus.heightM.toFixed(2)}m
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block font-semibold">Turning</span>
                      <span className="text-xs font-black text-slate-900">
                        {bus.turningRadiusM.toFixed(1)}m
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block font-semibold">Capacity</span>
                      <span className="text-xs font-black text-slate-900">
                        {bus.seatingCapacity} seats
                      </span>
                    </div>
                  </div>

                  {/* EV or Special Specs */}
                  {bus.isEv && (
                    <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span>Zero-Emission EV Approved</span>
                    </div>
                  )}

                  {bus.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg line-clamp-2">
                      &ldquo;{bus.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (
                    bus.status === 'in_service' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : bus.status === 'maintenance'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  )}>
                    {bus.status.replace('_', ' ').toUpperCase()}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(bus)}
                      className="p-1.5 text-slate-500 hover:text-stagecoach-blue hover:bg-slate-100 rounded-lg transition"
                      title="Edit Bus Specs"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBus(bus.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Bus from Depot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Bus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-stagecoach-navy text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {editingBus ? 'Edit Depot Vehicle' : 'Register Bus to Depot'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Specify physical dimensions for route hazard & bridge clearance checks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBus} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fleet Number</label>
                  <input
                    type="text"
                    required
                    value={formFleetNumber}
                    onChange={(e) => setFormFleetNumber(e.target.value)}
                    placeholder="e.g. 10452"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Plate</label>
                  <input
                    type="text"
                    required
                    value={formRegistration}
                    onChange={(e) => setFormRegistration(e.target.value)}
                    placeholder="e.g. SV21 XYZ"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Region</label>
                  <input
                    type="text"
                    required
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="e.g. North Scotland"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Depot / Garage</label>
                  <input
                    type="text"
                    required
                    value={formDepot}
                    onChange={(e) => setFormDepot(e.target.value)}
                    placeholder="e.g. Inverness Depot"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Classification</label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value as VehicleType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  >
                    <option value="double_decker">Double Decker (High Clearance)</option>
                    <option value="single_decker">Single Decker</option>
                    <option value="electric_ev">Electric EV Bus</option>
                    <option value="midi_bus">Midi Bus (Narrow)</option>
                    <option value="coach">Intercity Coach</option>
                    <option value="articulated">Articulated Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Make & Model</label>
                  <input
                    type="text"
                    value={formMakeModel}
                    onChange={(e) => setFormMakeModel(e.target.value)}
                    placeholder="e.g. Alexander Dennis Enviro400"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              {/* Physical Dimension Inputs */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Bridge Clearance & Geometry Dimensions
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Height (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formHeightM}
                      onChange={(e) => setFormHeightM(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Width (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formWidthM}
                      onChange={(e) => setFormWidthM(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Turning Circle (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formTurningRadiusM}
                      onChange={(e) => setFormTurningRadiusM(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Seating Capacity</label>
                    <input
                      type="number"
                      value={formSeatingCapacity}
                      onChange={(e) => setFormSeatingCapacity(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 px-1">
                    <label className="text-xs font-semibold text-slate-700">Zero-Emission EV</label>
                    <input
                      type="checkbox"
                      checked={formIsEv}
                      onChange={(e) => setFormIsEv(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fleet Operational Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as VehicleStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                >
                  <option value="in_service">In Service (Active Route Operations)</option>
                  <option value="maintenance">Maintenance / Inspection / Workshop</option>
                  <option value="reserve">Reserve Fleet</option>
                  <option value="retired">Decommissioned / Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Depot Comments</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Fitted with CCTV mirrorless camera system, low bridge warning sensor..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingBus ? 'Update Vehicle' : 'Register Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

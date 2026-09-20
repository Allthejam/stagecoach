"use client";

import React, { useState } from 'react';
import { useRouteContext } from '@/context/RouteContext';
import { useAuthContext } from '@/context/AuthContext';
import { 
  Building2, 
  Warehouse, 
  Plus, 
  Search, 
  PhoneCall, 
  MapPin, 
  HardHat, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Bus
} from 'lucide-react';

export interface DepotDirectoryItem {
  id: string;
  region: string;
  depotName: string;
  address: string;
  controlRoomPhone: string;
  depotManager: string;
  engineeringPhone: string;
  policeLiaison: string;
}

export default function DepotsManagementView() {
  const { routes } = useRouteContext();
  const { operatorProfile, updateOperatorProfile } = useAuthContext();

  const [depotsList, setDepotsList] = useState<DepotDirectoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stagecoach_rra_depots_directory_v1');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'depot-inv-01',
        region: 'North Scotland',
        depotName: 'Inverness Depot',
        address: 'Seafield Road, Longman Industrial Estate, Inverness IV1 1SG',
        controlRoomPhone: '0800 555 999',
        depotManager: 'Inverness Duty Operations Lead',
        engineeringPhone: '0800 555 888',
        policeLiaison: '101 (Highlands & Islands Division)'
      },
      {
        id: 'depot-abd-01',
        region: 'North Scotland',
        depotName: 'Aberdeen Depot',
        address: '395 King Street, Aberdeen AB24 5RP',
        controlRoomPhone: '0800 555 998',
        depotManager: 'Aberdeen Operations Manager',
        engineeringPhone: '0800 555 887',
        policeLiaison: '101 (North East Police Scotland)'
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepot, setEditingDepot] = useState<DepotDirectoryItem | null>(null);
  const [formRegion, setFormRegion] = useState('');
  const [formDepotName, setFormDepotName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formControlPhone, setFormControlPhone] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formEngineering, setFormEngineering] = useState('');
  const [formPolice, setFormPolice] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const saveToStorage = (updated: DepotDirectoryItem[]) => {
    setDepotsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stagecoach_rra_depots_directory_v1', JSON.stringify(updated));
    }
  };

  const openAddModal = () => {
    setEditingDepot(null);
    setFormRegion(operatorProfile.region || 'North Scotland');
    setFormDepotName('');
    setFormAddress('');
    setFormControlPhone(operatorProfile.emergencyContacts.controlRoomPhone || '0800 555 999');
    setFormManager('Depot Duty Manager');
    setFormEngineering(operatorProfile.emergencyContacts.fleetEngineeringPhone || '0800 555 888');
    setFormPolice(operatorProfile.emergencyContacts.policeLiaison || '101');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: DepotDirectoryItem) => {
    setEditingDepot(d);
    setFormRegion(d.region);
    setFormDepotName(d.depotName);
    setFormAddress(d.address);
    setFormControlPhone(d.controlRoomPhone);
    setFormManager(d.depotManager);
    setFormEngineering(d.engineeringPhone);
    setFormPolice(d.policeLiaison);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveDepot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRegion.trim() || !formDepotName.trim()) {
      setFormError('Region and Depot Name are required.');
      return;
    }

    const item: DepotDirectoryItem = {
      id: editingDepot ? editingDepot.id : ('depot_' + Date.now()),
      region: formRegion.trim(),
      depotName: formDepotName.trim(),
      address: formAddress.trim(),
      controlRoomPhone: formControlPhone.trim(),
      depotManager: formManager.trim(),
      engineeringPhone: formEngineering.trim(),
      policeLiaison: formPolice.trim()
    };

    let updated: DepotDirectoryItem[];
    if (editingDepot) {
      updated = depotsList.map((d) => (d.id === editingDepot.id ? item : d));
    } else {
      updated = [item, ...depotsList];
    }

    saveToStorage(updated);
    setFormSuccess('Depot details saved successfully!');
    setTimeout(() => {
      setIsModalOpen(false);
    }, 700);
  };

  const handleDeleteDepot = (id: string) => {
    const updated = depotsList.filter((d) => d.id !== id);
    saveToStorage(updated);
  };

  // Unique regions
  const availableRegions = Array.from(new Set(depotsList.map((d) => d.region)));

  // Filtered List
  const filteredDepots = depotsList.filter((d) => {
    const matchesRegion = selectedRegionFilter === 'all' || d.region === selectedRegionFilter;
    const matchesSearch = 
      !searchTerm ||
      d.depotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Regions & Operating Garages Directory
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure operating company regions, garage locations, 24/7 control hotlines, and local engineering contacts.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Operating Depot</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search depot name, region, address..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
          />
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedRegionFilter}
            onChange={(e) => setSelectedRegionFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Regions</option>
            {availableRegions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Depots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDepots.map((depot) => (
          <div
            key={depot.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                  {depot.region}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1.5 flex items-center space-x-2">
                  <Warehouse className="w-4 h-4 text-blue-600" />
                  <span>{depot.depotName}</span>
                </h3>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => openEditModal(depot)}
                  className="p-1.5 text-slate-400 hover:text-stagecoach-blue hover:bg-slate-100 rounded-lg transition"
                  title="Edit Depot"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDepot(depot.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Depot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {depot.address && (
              <p className="text-xs text-slate-600 flex items-start space-x-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{depot.address}</span>
              </p>
            )}

            {/* Emergency Contacts List */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-500 font-semibold block">Control Room</span>
                <span className="font-bold text-slate-900">{depot.controlRoomPhone || '0800 555 999'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-500 font-semibold block">Duty Manager</span>
                <span className="font-bold text-slate-900 truncate block">{depot.depotManager || 'Operations Lead'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-500 font-semibold block">Engineering Dispatch</span>
                <span className="font-bold text-slate-900">{depot.engineeringPhone || '0800 555 888'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-500 font-semibold block">Police Liaison</span>
                <span className="font-bold text-slate-900">{depot.policeLiaison || '101 / 999'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Depot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stagecoach-navy text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {editingDepot ? 'Edit Operating Depot' : 'Add Operating Depot'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Depot contact details and emergency response dispatch
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

            <form onSubmit={handleSaveDepot} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Depot / Garage Name</label>
                  <input
                    type="text"
                    required
                    value={formDepotName}
                    onChange={(e) => setFormDepotName(e.target.value)}
                    placeholder="e.g. Inverness Depot"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / Postcode</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Seafield Road, Longman Industrial Estate, Inverness IV1 1SG"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">24/7 Control Room Phone</label>
                  <input
                    type="text"
                    value={formControlPhone}
                    onChange={(e) => setFormControlPhone(e.target.value)}
                    placeholder="0800 555 999"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duty Manager Contact</label>
                  <input
                    type="text"
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    placeholder="Operations Lead"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fleet Engineering Breakdown</label>
                  <input
                    type="text"
                    value={formEngineering}
                    onChange={(e) => setFormEngineering(e.target.value)}
                    placeholder="0800 555 888"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Police Liaison</label>
                  <input
                    type="text"
                    value={formPolice}
                    onChange={(e) => setFormPolice(e.target.value)}
                    placeholder="101 / 999"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stagecoach-blue"
                  />
                </div>
              </div>

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
                  className="px-5 py-2 bg-stagecoach-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {editingDepot ? 'Update Depot' : 'Save Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

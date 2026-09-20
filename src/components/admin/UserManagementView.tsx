"use client";

import React, { useState } from 'react';
import { useAuthContext, UserProfile, UserRole, ROLE_LABELS } from '@/context/AuthContext';
import { useRouteContext } from '@/context/RouteContext';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  Warehouse, 
  Mail, 
  Phone, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter,
  BadgeCheck,
  Lock
} from 'lucide-react';

export default function UserManagementView() {
  const { 
    operatorProfile, 
    usersList, 
    createOrUpdateUser, 
    deleteUserRecord, 
    canManageRole 
  } = useAuthContext();

  const { availableRegionsForFilter, availableGaragesForFilter } = useRouteContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Modal State for Add/Edit User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('assessor');
  const [formRegion, setFormRegion] = useState('');
  const [formDepot, setFormDepot] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAssessorNumber, setFormAssessorNumber] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Available roles that current logged-in user can assign
  const allRoles: UserRole[] = ['master_admin', 'regional_admin', 'depot_admin', 'assessor'];
  const assignableRoles: UserRole[] = allRoles.filter((role: UserRole) => canManageRole(role));

  const openAddModal = () => {
    setEditingUser(null);
    setFormDisplayName('');
    setFormEmail('');
    setFormRole(assignableRoles.includes('assessor') ? 'assessor' : assignableRoles[0] || 'assessor');
    setFormRegion(operatorProfile.role === 'regional_admin' || operatorProfile.role === 'depot_admin' ? operatorProfile.region : '');
    setFormDepot(operatorProfile.role === 'depot_admin' ? operatorProfile.depot : '');
    setFormPhone('');
    setFormAssessorNumber('SC-RRA-' + Math.floor(100 + Math.random() * 900));
    setFormStatus('active');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormDisplayName(u.displayName);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormRegion(u.region || '');
    setFormDepot(u.depot || '');
    setFormPhone(u.phone || '');
    setFormAssessorNumber(u.assessorNumber || '');
    setFormStatus(u.status || 'active');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDisplayName.trim() || !formEmail.trim()) {
      setFormError('Name and work email are required.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const res = await createOrUpdateUser({
      uid: editingUser ? editingUser.uid : undefined,
      displayName: formDisplayName.trim(),
      email: formEmail.trim(),
      role: formRole,
      region: formRegion.trim() || 'All Regions',
      depot: formDepot.trim() || 'Main Depot',
      phone: formPhone.trim(),
      assessorNumber: formAssessorNumber.trim() || ('SC-RRA-' + Math.floor(100 + Math.random() * 900)),
      status: formStatus
    });

    setIsSaving(false);

    if (res.success) {
      setFormSuccess('User permissions updated successfully.');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } else {
      setFormError(res.error || 'Failed to save user.');
    }
  };

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.assessorNumber && u.assessorNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesRegion = regionFilter === 'all' || u.region === regionFilter;
    return matchesSearch && matchesRole && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stagecoach-amber/20 border border-stagecoach-amber/30 text-stagecoach-amber flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Stagecoach Access Control & Role Hierarchy
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Top-down administration: Master Admin &rarr; Regional Admins &rarr; Depot Admins &rarr; RRA Field Assessors
          </p>
        </div>

        {assignableRoles.length > 0 && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or assessor ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-stagecoach-amber"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Roles</option>
            <option value="master_admin" className="bg-slate-900">Master Admins</option>
            <option value="regional_admin" className="bg-slate-900">Regional Admins</option>
            <option value="depot_admin" className="bg-slate-900">Depot Admins</option>
            <option value="assessor" className="bg-slate-900">RRA Assessors</option>
          </select>
        </div>
      </div>

      {/* User Directory Table / Cards */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No team members match your filter criteria.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.assessor;
            const canEditThisUser = canManageRole(u.role);

            return (
              <div
                key={u.uid}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-md flex flex-wrap items-center justify-between gap-3"
              >
                {/* User Info */}
                <div className="flex items-center space-x-3.5 min-w-[200px]">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-stagecoach-amber">
                    {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{u.displayName}</span>
                      <span className={'text-[10px] font-bold px-2 py-0.5 rounded border ' + roleInfo.badgeColor}>
                        {roleInfo.title}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{u.email}</span>
                      </span>
                      {u.assessorNumber && (
                        <span className="text-slate-500 font-mono">[{u.assessorNumber}]</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Region & Depot Tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-stagecoach-amber" />
                    <span>{u.region || 'All Regions'}</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    <Warehouse className="w-3.5 h-3.5 text-blue-400" />
                    <span>{u.depot || 'All Depots'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {canEditThisUser ? (
                    <>
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title="Edit User Role & Permissions"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {u.uid !== operatorProfile.uid && (
                        <button
                          onClick={() => deleteUserRecord(u.uid)}
                          className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 transition"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic px-2 py-1">
                      Protected Tier
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-stagecoach-amber text-slate-950 flex items-center justify-center font-black">
                  {editingUser ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {editingUser ? 'Edit User Permissions' : 'Assign New Team Member'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Set role tier, assigned region, depot, and safety credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="e.g. John MacLeod"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@stagecoach.co.uk"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber"
                  />
                </div>
              </div>

              {/* Role Tier Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hierarchical Role Tier
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r].title} — {ROLE_LABELS[r].description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region & Depot Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Operating Region</label>
                  <input
                    type="text"
                    value={formRegion}
                    disabled={operatorProfile.role === 'depot_admin'}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="e.g. North Scotland"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Garage / Depot</label>
                  <input
                    type="text"
                    value={formDepot}
                    disabled={operatorProfile.role === 'depot_admin'}
                    onChange={(e) => setFormDepot(e.target.value)}
                    placeholder="e.g. Inverness Depot"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Assessor Number & Direct Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Official Assessor Number</label>
                  <input
                    type="text"
                    value={formAssessorNumber}
                    onChange={(e) => setFormAssessorNumber(e.target.value)}
                    placeholder="SC-RRA-882"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Direct Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+44 7700 900077"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stagecoach-amber"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-stagecoach-amber hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl shadow transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

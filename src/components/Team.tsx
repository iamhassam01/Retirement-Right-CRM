import React, { useState, useEffect } from 'react';
import { teamService, TeamMember } from '../services/team.service';
import { Shield, MoreHorizontal, UserPlus, Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';

const Team: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'ADVISOR' | 'STAFF'>('STAFF');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const data = await teamService.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!formName || !formEmail) return;

    setIsSaving(true);
    try {
      const newMember = await teamService.invite({
        name: formName,
        email: formEmail,
        role: formRole
      });
      setMembers(prev => [...prev, newMember]);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await teamService.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('STAFF');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-50 text-purple-700';
      case 'ADVISOR': return 'bg-teal-50 text-teal-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'ADVISOR': return 'Advisor';
      default: return 'Staff';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-navy-900" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Team & Access</h2>
          <p className="text-slate-500 text-sm">Manage user roles, permissions, and compliance access.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-navy-800"
        >
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {members.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Access Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-navy-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      <Shield size={10} /> {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <UserPlus size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-navy-900 mb-2">No Team Members Yet</h3>
            <p className="text-slate-500 mb-6">Invite your first team member to get started</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800"
            >
              + Add Member
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title="Invite New Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Full Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Email Address</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Permission Level</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="STAFF">Staff (Standard)</option>
              <option value="ADVISOR">Advisor</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
            <button
              onClick={handleInvite}
              disabled={isSaving || !formName || !formEmail}
              className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Send Invitation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Team;
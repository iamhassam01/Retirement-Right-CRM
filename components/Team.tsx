import React, { useState } from 'react';
import { Shield, MoreHorizontal, UserPlus, Lock } from 'lucide-react';
import Modal from './Modal';

const Team: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TEAM_MEMBERS = [
    { name: 'John Jenkins', role: 'Senior Advisor', email: 'john.j@retirementright.com', access: 'Admin', status: 'Active' },
    { name: 'Mike Ross', role: 'Associate Advisor', email: 'mike.r@retirementright.com', access: 'Advisor', status: 'Active' },
    { name: 'Jessica Pearson', role: 'Operations Manager', email: 'jessica.p@retirementright.com', access: 'Admin', status: 'Active' },
    { name: 'Rachel Zane', role: 'Paraplanner', email: 'rachel.z@retirementright.com', access: 'Staff', status: 'Active' },
  ];

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
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Access Level</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TEAM_MEMBERS.map((member, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://picsum.photos/100/100?random=${idx + 10}`} className="w-8 h-8 rounded-full" alt={member.name} />
                    <div>
                      <p className="text-sm font-medium text-navy-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{member.role}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.access === 'Admin' ? 'bg-purple-50 text-purple-700' : 
                    member.access === 'Advisor' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Shield size={10} /> {member.access}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-navy-900">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Invite New Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Full Name</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. John Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Email Address</label>
            <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Role</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                   <option>Advisor</option>
                   <option>Paraplanner</option>
                   <option>Admin Staff</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Permission Level</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                   <option>Standard</option>
                   <option>Admin (Full Access)</option>
                   <option>View Only</option>
                </select>
             </div>
          </div>
          <div className="pt-4 flex gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
             <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Send Invitation</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Team;
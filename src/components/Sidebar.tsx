import React, { useState } from 'react';
import {
    LayoutDashboard, Users, UserPlus, Trello, Calendar,
    Presentation, FileText, PieChart, Settings, MessageSquare, Shield,
    ChevronLeft, ChevronRight, LogOut, ListTodo, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isCollapsed, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const mainNav = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', label: 'Follow-ups', icon: ListTodo },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'pipeline', label: 'Pipeline', icon: Trello },
    ];

    const relationshipNav = [
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'leads', label: 'Leads', icon: UserPlus },
        { id: 'workshops', label: 'Events', icon: Presentation },
        { id: 'communications', label: 'Communications', icon: MessageSquare },
    ];

    const adminNav = [
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'reports', label: 'Reports', icon: PieChart },
        { id: 'team', label: 'Team & Access', icon: Shield },
    ];

    // Generate user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U';
        const names = user.name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return user.name.substring(0, 2).toUpperCase();
    };

    const NavItem: React.FC<{ item: any }> = ({ item }) => {
        const isActive = currentView === item.id;
        const Icon = item.icon;

        return (
            <button
                onClick={() => setCurrentView(item.id)}
                className={`relative w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group mb-1.5 ${isActive
                    ? 'bg-gradient-to-r from-teal-500/10 to-transparent text-teal-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            >
                <div className={`flex items-center gap-3.5 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                    <Icon
                        size={22}
                        strokeWidth={1.5}
                        className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                    />

                    <span className={`text-[14px] font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
                        } ${isActive ? 'text-teal-50 font-semibold' : ''}`}>
                        {item.label}
                    </span>
                </div>

                {/* Active Indicator Strip */}
                {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full shadow-[0_0_12px_rgba(20,184,166,0.5)]" />
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-[100] whitespace-nowrap">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45"></div>
                    </div>
                )}
            </button>
        );
    };

    const SectionLabel = ({ label }: { label: string }) => (
        <div className={`px-4 mb-3 mt-6 transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                {label}
            </p>
        </div>
    );

    // Logout Confirmation Modal - Same style as Quick Add / New Appointment modals
    const LogoutModal = () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop - Same as Modal.tsx */}
            <div
                className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setShowLogoutModal(false)}
            ></div>

            {/* Modal Content - Same as Modal.tsx */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-navy-900">Confirm Logout</h3>
                    <button
                        onClick={() => setShowLogoutModal(false)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-slate-50"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 mb-6">Are you sure you want to logout from your account?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowLogoutModal(false);
                                logout();
                            }}
                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div
                className={`fixed left-0 top-0 h-screen bg-[#0F172A] border-r border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'
                    }`}
            >
                {/* Brand Header */}
                <div className={`h-20 flex items-center border-b border-slate-800/80 transition-all duration-300 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className={`transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}
                        />
                        <div className={`flex flex-col transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                                Retirement<span className="text-teal-500">Right</span>
                            </span>
                            <span className="text-xs text-slate-500 font-medium tracking-wide">Advisor OS v2.0</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Groups - Hidden Scrollbar */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    <div className="mb-2">
                        {!isCollapsed && <SectionLabel label="Workspace" />}
                        {mainNav.map(item => <NavItem key={item.id} item={item} />)}
                    </div>

                    <div className="mb-2">
                        {!isCollapsed && <SectionLabel label="Relationships" />}
                        {relationshipNav.map(item => <NavItem key={item.id} item={item} />)}
                    </div>

                    <div>
                        {!isCollapsed && <SectionLabel label="Intelligence" />}
                        {adminNav.map(item => <NavItem key={item.id} item={item} />)}
                    </div>
                </div>

                {/* Toggle Button - Integrated into border */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-24 w-6 h-6 bg-slate-800 border border-slate-700 text-slate-400 rounded-full flex items-center justify-center hover:text-white hover:bg-teal-600 hover:border-teal-500 transition-all shadow-md z-50 focus:outline-none"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-800 bg-[#0B1120] shrink-0">
                    <div className={`flex items-center gap-3.5 w-full p-2.5 rounded-xl ${isCollapsed ? 'justify-center' : 'text-left'}`}>
                        {/* User Avatar with Image or Initials */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-slate-700 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    getUserInitials()
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B1120]"></div>
                        </div>

                        <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className={`text-slate-500 hover:text-rose-400 transition-colors duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                    {/* Settings Link */}
                    <button
                        onClick={() => setCurrentView('settings')}
                        className={`mt-2 w-full flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <Settings size={16} />
                        <span className={`text-xs ${isCollapsed ? 'hidden' : 'block'}`}>Settings</span>
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && <LogoutModal />}
        </>
    );
};

export default Sidebar;
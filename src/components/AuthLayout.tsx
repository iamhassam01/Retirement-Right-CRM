import React from 'react';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 relative overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(20, 184, 166, 0.3) 0%, transparent 50%),
                                    radial-gradient(circle at 75% 75%, rgba(20, 184, 166, 0.2) 0%, transparent 50%)`
                    }} />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                            <Building2 className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Retirement Right</h1>
                            <p className="text-slate-400 text-sm">CRM Platform</p>
                        </div>
                    </div>

                    {/* Tagline */}
                    <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                        Empowering<br />
                        <span className="text-teal-400">Financial Advisors</span>
                    </h2>
                    <p className="text-slate-300 text-lg mb-12 max-w-md">
                        Streamline your client relationships, automate workflows, and grow your practice.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        {[
                            'Client & Pipeline Management',
                            'AI-Powered Voice Calling',
                            'WordPress Event Sync',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                                </div>
                                <span className="text-slate-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
                            <Building2 className="text-white" size={22} />
                        </div>
                        <span className="text-xl font-bold text-navy-900">Retirement Right</span>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-navy-900">{title}</h2>
                            <p className="text-slate-500 mt-2">{subtitle}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            if (response.data.success) {
                setIsSuccess(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <AuthLayout title="Check Your Email" subtitle="Password reset instructions sent">
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <p className="text-slate-600 mb-6">
                        If an account exists for <span className="font-medium">{email}</span>, you'll receive password reset instructions shortly.
                    </p>
                    <Link
                        to="/reset-password"
                        state={{ email }}
                        className="inline-block w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-navy-900/20"
                    >
                        Continue to Reset Password
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mt-4 text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to login
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Forgot Password?" subtitle="Enter your email to reset your password">
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1.5">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-navy-900/20 hover:shadow-xl hover:shadow-navy-900/30"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        'Send Reset Link'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;

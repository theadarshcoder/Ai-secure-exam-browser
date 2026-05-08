import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Loader2, CheckCircle2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle, submitting, success
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setStatus('submitting');
        try {
            const response = await api.post('/api/public/set-password', {
                token,
                password
            });

            if (response.data.success) {
                setStatus('success');
                toast.success('Password set successfully!');
            }
        } catch (error) {
            setStatus('idle');
            toast.error(error.response?.data?.error || 'Failed to set password.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Invalid or missing setup token.</p>
                    <button onClick={() => navigate('/')} className="text-zinc-400 hover:text-white underline text-sm">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 font-outfit">
            <div className="max-w-md w-full bg-[#111114] border border-[#232326] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
                
                {status === 'success' ? (
                    <div className="text-center space-y-6 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Setup Complete!</h2>
                        <p className="text-zinc-400">Your administrator account is now fully active. You can now access your dashboard.</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                        >
                            Login to Dashboard <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <Lock className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Set Admin Password</h2>
                            <p className="text-zinc-400 text-sm">Protect your institution with a strong password.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">New Password</label>
                                <input 
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1C1C21] border border-[#2D2D33] rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirm Password</label>
                                <input 
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#1C1C21] border border-[#2D2D33] rounded-2xl px-5 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                                />
                            </div>

                            <button 
                                disabled={status === 'submitting'}
                                type="submit"
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl mt-4 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                            >
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Finalizing Setup...
                                    </>
                                ) : (
                                    'Complete Onboarding'
                                )}
                            </button>
                        </form>
                        
                        <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs mt-4">
                            <ShieldCheck className="w-4 h-4" />
                            <span>AES-256 Encrypted Connection</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetPassword;

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyRequest = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Verification token is missing.');
                return;
            }

            try {
                const response = await api.get(`/api/public/verify-request?token=${token}`);
                
                if (response.data.success) {
                    setStatus('success');
                    setMessage(response.data.message);
                    setInstitutionName(response.data.data?.institutionName || '');
                    toast.success('Email verified successfully!');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed. The link might be expired.');
                toast.error('Verification failed');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 font-outfit">
            <div className="max-w-md w-full bg-[#111114] border border-[#232326] rounded-3xl p-8 text-center shadow-2xl">
                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verifying Your Request</h2>
                        <p className="text-gray-400">Please wait while we secure your trial workspace...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verification Successful!</h2>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <p className="text-emerald-400 font-medium">{institutionName}</p>
                            <p className="text-sm text-gray-400 mt-1">Your trial workspace is now active.</p>
                        </div>
                        <p className="text-gray-400 text-sm">{message}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            Go to Login <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
                        <p className="text-red-400/80 bg-red-500/5 p-4 rounded-2xl border border-red-500/10 text-sm">
                            {message}
                        </p>
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-[#1C1C21] text-white font-bold rounded-2xl border border-[#2D2D33] hover:bg-[#25252B] transition-all"
                        >
                            Return to Homepage
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyRequest;

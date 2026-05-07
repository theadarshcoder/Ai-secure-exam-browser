import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOtp = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [status, setStatus] = useState('idle'); // idle, verifying, success, error
    const [message, setMessage] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            toast.error('Session expired. Please request access again.');
            navigate('/');
        }
    }, [email, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            toast.error('Please enter the full 6-digit code.');
            return;
        }

        setStatus('verifying');
        try {
            const response = await axios.post('http://localhost:5001/api/public/verify-request', {
                email,
                otp: otpValue
            });

            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message);
                setInstitutionName(response.data.data?.institutionName || '');
                toast.success('Account provisioned successfully!');
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Verification failed. Please try again.');
            toast.error('Invalid OTP');
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 font-outfit">
            <div className="max-w-md w-full bg-[#111114] border border-[#232326] rounded-3xl p-8 shadow-2xl">
                {status !== 'success' && (
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                            <ShieldCheck className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                        <p className="text-gray-400 text-sm">
                            We've sent a 6-digit code to <br />
                            <span className="text-blue-400 font-medium">{email}</span>
                        </p>
                    </div>
                )}

                {status === 'success' ? (
                    <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Trial Ready! 🎉</h2>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <p className="text-emerald-400 font-medium">{institutionName}</p>
                            <p className="text-sm text-gray-400 mt-1">Check your email for password setup.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            Go to Login <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 bg-[#1C1C21] border border-[#2D2D33] rounded-xl text-center text-xl font-bold text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            ))}
                        </div>

                        {status === 'error' && (
                            <p className="text-red-400 text-xs text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 animate-shake">
                                {message}
                            </p>
                        )}

                        <button
                            onClick={handleVerify}
                            disabled={status === 'verifying' || otp.join('').length !== 6}
                            className="w-full py-4 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {status === 'verifying' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                                </>
                            ) : (
                                'Verify & Provision'
                            )}
                        </button>

                        <div className="text-center">
                            <button 
                                onClick={() => navigate('/')}
                                className="text-gray-500 text-sm hover:text-white transition-colors"
                            >
                                Back to request access
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyOtp;

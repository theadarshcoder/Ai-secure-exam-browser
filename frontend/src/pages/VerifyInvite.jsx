import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Shield, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════
//  Verify Invite Page — Student lands here from email link
//  /verify?token=xyz → verify → auto-login → exam cockpit
// ═══════════════════════════════════════════════════════════

export default function VerifyInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [examInfo, setExamInfo] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setErrorMsg('Invalid invitation link. No token provided.');
            return;
        }
        verifyToken(token);
    }, []);

    const verifyToken = async (token) => {
        try {
            // Generate or retrieve device ID (same pattern as login flow)
            let deviceId = sessionStorage.getItem('vision_device_id');
            if (!deviceId) {
                deviceId = uuidv4();
                sessionStorage.setItem('vision_device_id', deviceId);
            }

            const response = await api.post('/api/auth/verify-invite', {
                token,
                deviceId
            });

            const data = response.data;

            // Store session data (same as login flow)
            sessionStorage.setItem('vision_token', data.token);
            sessionStorage.setItem('vision_user', JSON.stringify(data.user));
            sessionStorage.setItem('vision_role', data.user.role);

            setExamInfo({
                examId: data.examId,
                examTitle: data.examTitle,
                userName: data.user.name
            });

            setStatus('success');

            // Auto-redirect directly to the Exam Cockpit after 2 seconds
            setTimeout(() => {
                navigate(`/exam/${data.examId}`);
            }, 2500);

        } catch (err) {
            setStatus('error');
            const msg = err.response?.data?.error || err.response?.data?.message || 'Invalid or expired invitation link.';
            setErrorMsg(msg);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.bgGlow} />
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoContainer}>
                    <div style={styles.logoIcon}>
                        <Shield size={28} strokeWidth={2.5} color="#10b981" />
                    </div>
                    <h1 style={styles.logoText}>Vision</h1>
                    <p style={styles.logoSub}>Secure Exam Platform</p>
                </div>

                {/* Status Content */}
                {status === 'verifying' && (
                    <div style={styles.statusBlock}>
                        <div style={styles.spinnerWrapper}>
                            <Loader2 size={40} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                        <h2 style={styles.statusTitle}>Verifying Invitation</h2>
                        <p style={styles.statusDesc}>Please wait while we validate your access link...</p>
                        <div style={styles.progressBar}>
                            <div style={styles.progressFill} />
                        </div>
                    </div>
                )}

                {status === 'success' && examInfo && (
                    <div style={styles.statusBlock}>
                        <div style={{...styles.iconCircle, background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.3)'}}>
                            <CheckCircle size={36} color="#10b981" />
                        </div>
                        <h2 style={{...styles.statusTitle, color: '#10b981'}}>Verified Successfully!</h2>
                        <p style={styles.statusDesc}>
                            Welcome, <strong>{examInfo.userName}</strong>
                        </p>
                        <div style={styles.examInfoBox}>
                            <span style={styles.examLabel}>Exam</span>
                            <span style={styles.examTitle}>{examInfo.examTitle}</span>
                        </div>
                        <p style={styles.redirectText}>Redirecting to exam dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={styles.statusBlock}>
                        <div style={{...styles.iconCircle, background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)'}}>
                            <XCircle size={36} color="#ef4444" />
                        </div>
                        <h2 style={{...styles.statusTitle, color: '#ef4444'}}>Verification Failed</h2>
                        <p style={styles.statusDesc}>{errorMsg}</p>
                        <div style={styles.helpBox}>
                            <AlertTriangle size={14} color="#f59e0b" />
                            <span>Contact your exam administrator for a new invitation link.</span>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            style={styles.loginBtn}
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>

            {/* Spin Animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes progressSlide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
    },
    bgGlow: {
        position: 'absolute',
        top: '30%',
        left: '50%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
    },
    card: {
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        animation: 'fadeIn 0.6s ease-out',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
    },
    logoContainer: {
        textAlign: 'center',
        marginBottom: '36px'
    },
    logoIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px'
    },
    logoText: {
        fontSize: '24px',
        fontWeight: 800,
        color: '#ffffff',
        margin: '0',
        letterSpacing: '-0.5px'
    },
    logoSub: {
        fontSize: '12px',
        color: '#71717a',
        margin: '4px 0 0',
        fontWeight: 500,
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
    },
    statusBlock: {
        textAlign: 'center'
    },
    spinnerWrapper: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px'
    },
    statusTitle: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#ffffff',
        margin: '0 0 8px',
        letterSpacing: '-0.3px'
    },
    statusDesc: {
        fontSize: '14px',
        color: '#a1a1aa',
        margin: '0 0 24px',
        lineHeight: 1.6
    },
    progressBar: {
        width: '200px',
        height: '3px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '4px',
        overflow: 'hidden',
        margin: '0 auto'
    },
    progressFill: {
        width: '40%',
        height: '100%',
        background: 'linear-gradient(90deg, #10b981, #34d399)',
        borderRadius: '4px',
        animation: 'progressSlide 1.5s ease-in-out infinite'
    },
    iconCircle: {
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
    },
    examInfoBox: {
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    examLabel: {
        fontSize: '10px',
        fontWeight: 700,
        color: '#10b981',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    examTitle: {
        fontSize: '15px',
        fontWeight: 600,
        color: '#ffffff'
    },
    redirectText: {
        fontSize: '12px',
        color: '#52525b',
        margin: '0',
        fontStyle: 'italic'
    },
    helpBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '12px',
        color: '#a1a1aa',
        textAlign: 'left'
    },
    loginBtn: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        padding: '12px 28px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, Send, Loader2, CheckCircle, AlertCircle, Users, Trash2 } from 'lucide-react';
import api from '../services/api';
import CSVHelper from './CSVHelper';

export default function BulkInviteModal({ isOpen, onClose, examId, examTitle }) {
    const [students, setStudents] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState([]);
    const fileRef = useRef(null);

    if (!isOpen) return null;

    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const parseCSV = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return { parsed: [], errs: ['CSV must have a header row and at least one data row.'] };

        const header = lines[0].toLowerCase();
        const hasHeader = header.includes('name') || header.includes('email');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        const parsed = []; const errs = []; const seen = new Set();
        dataLines.forEach((line, i) => {
            const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const name = cols[0] || '';
            const email = (cols[1] || '').toLowerCase().trim();

            if (!name || !email) { errs.push(`Row ${i + 2}: Missing name or email`); return; }
            if (!isValidEmail(email)) { errs.push(`Row ${i + 2}: Invalid email "${email}"`); return; }
            if (seen.has(email)) { errs.push(`Row ${i + 2}: Duplicate email "${email}"`); return; }
            seen.add(email);
            parsed.push({ name, email });
        });
        return { parsed, errs };
    };

    const handleFile = (file) => {
        if (!file) return;
        if (!file.name.endsWith('.csv')) { setErrors(['Only .csv files are supported']); return; }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const { parsed, errs } = parseCSV(e.target.result);
            setStudents(parsed);
            setErrors(errs);
            setResult(null);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };

    const downloadSampleCSV = () => {
        const csv = 'name,email\nRahul Sharma,rahul@example.com\nPriya Singh,priya@example.com\nAman Verma,aman@example.com';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'sample_students.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleSendInvites = async () => {
        if (students.length === 0) return;
        setSending(true); setResult(null);
        try {
            const response = await api.post(`/api/exams/${examId}/bulk-invite`, { students });
            const data = response.data;
            setResult(data);

            // Edge Case Fix #4: Secure credential download
            if (data.downloadableCredentials?.length > 0) {
                const csvHeader = 'Name,Email,Password,Status';
                const csvRows = data.downloadableCredentials.map(c =>
                    `"${c.name}","${c.email}","${c.password}","${c.status}"`
                );
                const csvContent = [csvHeader, ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Vision_Credentials_${examId.substring(0, 8)}.csv`;
                a.click();
                // Security: Destroy URL and nullify data from memory immediately
                URL.revokeObjectURL(url);
                response.data.downloadableCredentials = null;
            }
        } catch (err) {
            setResult({ error: err.response?.data?.error || err.response?.data?.message || 'Failed to send invites.' });
        } finally {
            setSending(false);
        }
    };

    const removeStudent = (idx) => setStudents(prev => prev.filter((_, i) => i !== idx));

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={S.header}>
                    <div>
                        <h2 style={S.title}><Users size={18} /> Invite Students</h2>
                        <p style={S.subtitle}>{examTitle}</p>
                    </div>
                    <button onClick={onClose} style={S.closeBtn}><X size={18} /></button>
                </div>

                {/* Upload Zone */}
                {students.length === 0 && !result && (
                    <div
                        style={{...S.dropZone, ...(isDragging ? S.dropZoneActive : {})}}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload size={40} strokeWidth={2.5} className="text-primary-500" style={{ marginBottom: 20 }} />
                        <p style={S.dropText}>Drop CSV file here or click to browse</p>
                        <div style={{ marginTop: '20px', display: 'inline-block', textAlign: 'left', background: 'var(--bg-surface)', padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--border-main)' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em', opacity: 0.5 }}>Expected Format:</p>
                            <code style={{ fontSize: '13px', color: 'var(--primary-500)', fontFamily: 'monospace', fontWeight: 900 }}>name, email</code>
                        </div>
                        <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => handleFile(e.target.files[0])} />
                    </div>
                )}

                {students.length === 0 && !result && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                        <button onClick={downloadSampleCSV} style={S.sampleBtn}>
                            <Download size={13} /> Download Sample CSV
                        </button>
                        <CSVHelper format="name, email" example="John Doe, john@example.com" />
                    </div>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                    <div style={S.errorBox}>
                        <AlertCircle size={14} color="#ef4444" />
                        <div>{errors.slice(0, 5).map((e, i) => <p key={i} style={{ margin: '2px 0', fontSize: 12 }}>{e}</p>)}
                            {errors.length > 5 && <p style={{ margin: '2px 0', fontSize: 11, color: '#a1a1aa' }}>...and {errors.length - 5} more</p>}
                        </div>
                    </div>
                )}

                {/* Preview Table */}
                {students.length > 0 && !result && (
                    <>
                        <div style={S.tableHeader}>
                            <span style={S.badge}><FileSpreadsheet size={12} /> {students.length} students from {fileName}</span>
                            <button onClick={() => { setStudents([]); setFileName(''); setErrors([]); }} style={S.clearBtn}>
                                <Trash2 size={12} /> Clear
                            </button>
                        </div>
                        <div style={S.tableWrap}>
                            <table style={S.table}>
                                <thead><tr><th style={S.th}>#</th><th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}></th></tr></thead>
                                <tbody>
                                    {students.slice(0, 50).map((s, i) => (
                                        <tr key={i} style={S.tr}>
                                            <td style={S.td}>{i + 1}</td>
                                            <td style={S.td}>{s.name}</td>
                                            <td style={{...S.td, fontFamily: 'monospace', fontSize: 12}}>{s.email}</td>
                                            <td style={S.td}><button onClick={() => removeStudent(i)} style={S.removeBtn}><X size={12} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {students.length > 50 && <p style={{ textAlign: 'center', color: '#71717a', fontSize: 11, padding: 8 }}>Showing 50 of {students.length}</p>}
                        </div>
                        <div style={{ marginTop: '24px' }}>
                            <button 
                                onClick={handleSendInvites} 
                                disabled={sending} 
                                style={{
                                    ...S.sendBtn, 
                                    ...(sending ? { opacity: 0.8, cursor: 'not-allowed' } : {}),
                                    background: sending ? 'var(--primary-500)' : 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)'
                                }}
                            >
                                {sending ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Dispatching Protocols...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} strokeWidth={2.5} />
                                        <span>Authorize & Send {students.length} Invites</span>
                                    </>
                                )}
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>
                                Secure delivery via Vision Mail Relay
                            </p>
                        </div>
                    </>
                )}

                {/* Result */}
                {result && !result.error && (
                    <div style={S.resultBox}>
                        <div style={{ width: 80, hieght: 80, borderRadius: 24, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 24px' }}>
                           <CheckCircle size={40} color="#10b981" strokeWidth={2.5} />
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: 20, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>Transmission Success</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontWeight: 500 }}>{result.message}</p>
                        
                        <div style={S.statsGrid}>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.newUsersCreated || 0}</span><span style={S.statLabel}>New</span></div>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.existingUsers || 0}</span><span style={S.statLabel}>Active</span></div>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.emailsQueued || 0}</span><span style={S.statLabel}>Sent</span></div>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.skipped || 0}</span><span style={S.statLabel}>Skip</span></div>
                        </div>
                        <p style={{ color: 'var(--primary-500)', fontSize: 11, marginTop: 24, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credentials CSV downloaded automatically.</p>
                        <button onClick={onClose} style={S.doneBtn}>Close Uplink</button>
                    </div>
                )}
                {result?.error && (
                    <div style={S.errorBox}>
                        <AlertCircle size={20} color="#ef4444" strokeWidth={2.5} />
                        <div>
                           <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 800, textTransform: 'uppercase' }}>Protocol Error</p>
                           <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{result.error}</p>
                        </div>
                    </div>
                )}
                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                `}</style>
            </div>
        </div>
    );
}

const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 },
    modal: { background: 'var(--bg-surface)', border: '1px solid var(--border-main)', borderRadius: 40, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: '48px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)', position: 'relative' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
    title: { color: 'var(--text-primary)', fontSize: 26, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 14, letterSpacing: -1, textTransform: 'uppercase', fontStyle: 'italic' },
    subtitle: { color: 'var(--text-muted)', fontSize: 12, margin: '8px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5 },
    closeBtn: { background: 'var(--bg-surface-hover)', border: '1px solid var(--border-main)', borderRadius: 16, padding: 12, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    dropZone: { border: '2px dashed var(--border-main)', borderRadius: 32, padding: '80px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'var(--bg-surface-hover)' },
    dropZoneActive: { borderColor: 'var(--primary-500)', background: 'rgba(var(--primary-500-rgb), 0.05)', transform: 'scale(1.02)' },
    dropText: { color: 'var(--text-primary)', fontSize: 16, fontWeight: 900, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: -0.2 },
    sampleBtn: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px auto 0', background: 'var(--bg-surface)', border: '1px solid var(--border-main)', borderRadius: 16, padding: '14px 28px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.1em' },
    errorBox: { display: 'flex', gap: 16, alignItems: 'center', background: '#ef4444', borderRadius: 24, padding: '24px', marginTop: 32, boxShadow: '0 20px 40px -10px rgba(239, 68, 68, 0.3)' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
    badge: { display: 'flex', alignItems: 'center', gap: 12, color: 'var(--primary-500)', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(var(--primary-500-rgb), 0.1)', padding: '8px 16px', borderRadius: 12 },
    clearBtn: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: '10px 20px', color: '#ef4444', fontSize: 11, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' },
    tableWrap: { maxHeight: 350, overflowY: 'auto', border: '1px solid var(--border-main)', borderRadius: 24, background: 'var(--bg-surface-hover)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '18px 24px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-main)', position: 'sticky', top: 0, zIndex: 10 },
    tr: { borderBottom: '1px solid var(--border-main)', transition: 'background 0.2s' },
    td: { padding: '16px 24px', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 },
    removeBtn: { background: 'var(--bg-surface)', border: '1px solid var(--border-main)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', padding: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    sendBtn: { width: '100%', border: 'none', borderRadius: 20, padding: '20px 32px', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'all 0.3s', boxShadow: '0 20px 40px -10px rgba(var(--primary-500-rgb), 0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' },
    resultBox: { textAlign: 'center', padding: '16px 0' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 40 },
    stat: { background: 'var(--bg-surface-hover)', border: '1px solid var(--border-main)', borderRadius: 20, padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, transition: 'transform 0.2s' },
    statNum: { fontSize: 28, fontWeight: 900, color: 'var(--primary-500)', letterSpacing: -1 },
    statLabel: { fontSize: 10, color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 },
    doneBtn: { marginTop: 40, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-main)', borderRadius: 16, padding: '18px 48px', color: 'var(--text-primary)', fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.15em' }
};

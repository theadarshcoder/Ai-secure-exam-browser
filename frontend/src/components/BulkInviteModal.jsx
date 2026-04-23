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
                        <Upload size={32} color="#10b981" style={{ marginBottom: 12 }} />
                        <p style={S.dropText}>Drop CSV file here or click to browse</p>
                        <div style={{ marginTop: '16px', display: 'inline-block', textAlign: 'left', background: '#f1f5f9', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Expected CSV Format:</p>
                            <code style={{ fontSize: '12px', color: '#059669', fontFamily: 'monospace', fontWeight: 700 }}>name, email</code>
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
                        <button onClick={handleSendInvites} disabled={sending} style={{...S.sendBtn, ...(sending ? { opacity: 0.7 } : {})}}>
                            {sending ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending Invites...</> : <><Send size={15} /> Send {students.length} Invites</>}
                        </button>
                    </>
                )}

                {/* Result */}
                {result && !result.error && (
                    <div style={S.resultBox}>
                        <CheckCircle size={28} color="#10b981" />
                        <h3 style={{ color: '#fff', margin: '8px 0 4px', fontSize: 16 }}>Invites Processed!</h3>
                        <p style={{ color: '#a1a1aa', fontSize: 13, margin: 0 }}>{result.message}</p>
                        <div style={S.statsGrid}>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.newUsersCreated || 0}</span><span style={S.statLabel}>New Users</span></div>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.existingUsers || 0}</span><span style={S.statLabel}>Existing</span></div>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.emailsQueued || 0}</span><span style={S.statLabel}>Emails Queued</span></div>
                            <div style={S.stat}><span style={S.statNum}>{result.summary?.skipped || 0}</span><span style={S.statLabel}>Skipped</span></div>
                        </div>
                        <p style={{ color: '#52525b', fontSize: 11, marginTop: 12 }}>Credentials CSV has been downloaded automatically.</p>
                        <button onClick={onClose} style={S.doneBtn}>Done</button>
                    </div>
                )}
                {result?.error && (
                    <div style={S.errorBox}>
                        <AlertCircle size={16} color="#ef4444" />
                        <p style={{ margin: 0, color: '#fca5a5', fontSize: 13 }}>{result.error}</p>
                    </div>
                )}
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 },
    modal: { background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    title: { color: '#0f172a', fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: -0.4 },
    subtitle: { color: '#64748b', fontSize: 13, margin: '4px 0 0', fontWeight: 500 },
    closeBtn: { background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: 8, color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' },
    dropZone: { border: '2px dashed #10b98133', borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#f0fdf444' },
    dropZoneActive: { borderColor: '#10b981', background: '#f0fdf4' },
    dropText: { color: '#334155', fontSize: 15, fontWeight: 600, margin: '0 0 4px' },
    dropHint: { color: '#64748b', fontSize: 12, margin: 0 },
    sampleBtn: { display: 'flex', alignItems: 'center', gap: 8, margin: '16px auto 0', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 18px', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    errorBox: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: '12px 16px', marginTop: 16, color: '#991b1b', fontSize: 13 },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 },
    badge: { display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontSize: 13, fontWeight: 600 },
    clearBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #fee2e2', borderRadius: 8, padding: '6px 12px', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    tableWrap: { maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 20 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '10px 16px', fontSize: 13, color: '#334155' },
    removeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, transition: 'color 0.2s' },
    sendBtn: { width: '100%', background: '#0f172a', border: 'none', borderRadius: 12, padding: '14px 24px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    resultBox: { textAlign: 'center', padding: '24px 0' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 },
    stat: { background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '16px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 },
    statNum: { fontSize: 22, fontWeight: 700, color: '#059669' },
    statLabel: { fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
    doneBtn: { marginTop: 24, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 32px', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }
};

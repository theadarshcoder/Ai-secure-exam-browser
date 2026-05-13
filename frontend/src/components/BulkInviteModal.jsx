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
            const rawErr = err.response?.data?.error;
            const errMsg = (typeof rawErr === 'string' ? rawErr : null) || err.response?.data?.message || 'Failed to send invites.';
            setResult({ error: errMsg });
        } finally {
            setSending(false);
        }
    };

    const removeStudent = (idx) => setStudents(prev => prev.filter((_, i) => i !== idx));

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface border border-main rounded-3xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-main">
                    <div>
                        <h3 className="text-sm font-bold text-primary flex items-center gap-2.5">
                            <Users size={16} strokeWidth={2.5} className="text-primary-500" />
                            Invite Students
                        </h3>
                        <p className="text-[10px] text-muted font-semibold mt-1 uppercase tracking-wider">{examTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-xl transition-all active:scale-95 border border-transparent hover:border-main text-muted hover:text-primary">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Upload Zone */}
                    {students.length === 0 && !result && (
                        <>
                            <div
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                                    isDragging 
                                        ? 'border-primary-500 bg-primary-500/5 scale-[1.01]' 
                                        : 'border-main bg-surface-hover/50 hover:border-primary-500/30'
                                }`}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload size={32} strokeWidth={2} className="text-primary-500 mx-auto mb-4" />
                                <p className="text-[13px] font-semibold text-primary mb-1">Drop CSV file here or click to browse</p>
                                <p className="text-[11px] text-muted font-medium">Supports .csv files only</p>
                                <div className="mt-5 inline-block text-left bg-surface px-4 py-3 rounded-xl border border-main">
                                    <p className="text-[9px] text-muted font-semibold uppercase tracking-wider mb-1.5">Expected Format</p>
                                    <code className="text-[12px] text-primary-500 font-mono font-bold">name, email</code>
                                </div>
                                <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => handleFile(e.target.files[0])} />
                            </div>

                            <div className="flex items-center justify-center gap-3 mt-4">
                                <button onClick={downloadSampleCSV} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-main rounded-xl text-[10px] font-semibold text-muted hover:text-primary hover:border-primary-500/30 transition-all active:scale-95 uppercase tracking-wider">
                                    <Download size={12} /> Download Sample CSV
                                </button>
                                <CSVHelper format="name, email" example="John Doe, john@example.com" />
                            </div>
                        </>
                    )}

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="flex gap-3 items-start bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-4">
                            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-red-500 font-medium">
                                {errors.slice(0, 5).map((e, i) => <p key={i} className="my-0.5">{e}</p>)}
                                {errors.length > 5 && <p className="text-muted text-[10px] mt-1">...and {errors.length - 5} more</p>}
                            </div>
                        </div>
                    )}

                    {/* Preview Table */}
                    {students.length > 0 && !result && (
                        <>
                            <div className="flex items-center justify-between mt-2 mb-4">
                                <span className="flex items-center gap-2 text-[11px] font-semibold text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-lg">
                                    <FileSpreadsheet size={12} /> {students.length} students from {fileName}
                                </span>
                                <button onClick={() => { setStudents([]); setFileName(''); setErrors([]); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-semibold text-red-500 hover:bg-red-500/20 transition-all active:scale-95 uppercase tracking-wider">
                                    <Trash2 size={11} /> Clear
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto border border-main rounded-xl bg-surface-hover/30 custom-scrollbar">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[9px] font-semibold text-muted uppercase tracking-wider">
                                            <th className="text-left px-4 py-3 bg-surface sticky top-0 z-10 border-b border-main">#</th>
                                            <th className="text-left px-4 py-3 bg-surface sticky top-0 z-10 border-b border-main">Name</th>
                                            <th className="text-left px-4 py-3 bg-surface sticky top-0 z-10 border-b border-main">Email</th>
                                            <th className="px-4 py-3 bg-surface sticky top-0 z-10 border-b border-main w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.slice(0, 50).map((s, i) => (
                                            <tr key={i} className="hover:bg-surface-hover/50 transition-colors">
                                                <td className="px-4 py-2.5 text-[11px] text-muted font-mono font-semibold">{i + 1}</td>
                                                <td className="px-4 py-2.5 text-[12px] text-primary font-semibold">{s.name}</td>
                                                <td className="px-4 py-2.5 text-[11px] text-muted font-mono">{s.email}</td>
                                                <td className="px-4 py-2.5">
                                                    <button onClick={() => removeStudent(i)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-500 transition-all">
                                                        <X size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {students.length > 50 && <p className="text-center text-[10px] text-muted font-medium py-2">Showing 50 of {students.length}</p>}
                            </div>

                            <div className="mt-5">
                                <button 
                                    onClick={handleSendInvites} 
                                    disabled={sending} 
                                    className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-white text-[12px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20 ${
                                        sending ? 'bg-primary-500 opacity-80 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
                                    }`}
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Sending Invites...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} strokeWidth={2.5} />
                                            <span>Send {students.length} Invites</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[9px] text-muted font-medium mt-2.5 uppercase tracking-wider opacity-50">
                                    Credentials will be sent via email
                                </p>
                            </div>
                        </>
                    )}

                    {/* Success Result */}
                    {result && !result.error && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
                                <CheckCircle size={32} className="text-emerald-500" strokeWidth={2} />
                            </div>
                            <h3 className="text-base font-bold text-primary mb-1">Invites Sent Successfully</h3>
                            <p className="text-[12px] text-muted font-medium">{result.message}</p>
                            
                            <div className="grid grid-cols-4 gap-3 mt-6">
                                {[
                                    { num: result.summary?.newUsersCreated || 0, label: 'New' },
                                    { num: result.summary?.existingUsers || 0, label: 'Existing' },
                                    { num: result.summary?.emailsQueued || 0, label: 'Sent' },
                                    { num: result.summary?.skipped || 0, label: 'Skipped' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-surface-hover/50 border border-main rounded-xl py-4 px-2 text-center">
                                        <p className="text-xl font-bold text-primary tabular-nums">{s.num}</p>
                                        <p className="text-[9px] text-muted font-semibold uppercase tracking-wider mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[10px] text-emerald-500 font-semibold mt-5 uppercase tracking-wider">Credentials CSV downloaded automatically</p>
                            
                            <button onClick={onClose} className="mt-5 px-8 py-2.5 bg-surface-hover border border-main rounded-xl text-[11px] font-semibold text-primary hover:border-primary-500/30 transition-all active:scale-95 uppercase tracking-wider">
                                Done
                            </button>
                        </div>
                    )}

                    {/* Error Result */}
                    {result?.error && (
                        <div className="flex gap-3 items-start bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-4 mt-4">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[12px] font-semibold text-red-500">Failed to Send</p>
                                <p className="text-[11px] text-muted mt-1">{result.error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

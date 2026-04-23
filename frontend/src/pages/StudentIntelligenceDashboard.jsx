import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    MessageSquare, 
    TrendingUp, 
    AlertTriangle, 
    Clock, 
    Calendar,
    ChevronLeft,
    Download,
    User,
    Mail,
    Award,
    ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentIntelligenceDashboard = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                setLoading(true);
                const token = sessionStorage.getItem('vision_token');
                const { data } = await axios.get(`${API_URL}/api/admin/students/${studentId}/report?page=${page}&limit=10`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReport(data);
            } catch (error) {
                console.error("Failed to fetch student report", error);
                toast.error("Failed to load intelligence data");
            } finally {
                setLoading(false);
            }
        };
        fetchIntelligence();
    }, [studentId, page, API_URL]);

    const handleDownloadPDF = () => {
        toast.success("Preparing detailed intelligence report PDF...");
        // Future implementation: html2canvas + jspdf
    };

    if (loading && !report) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Crunching behavioral data...</p>
            </div>
        );
    }

    if (!report) return <div className="text-center text-red-500 mt-10">Data not found</div>;

    const { student, overview, timelineData, pagination } = report;

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
            {/* 1. TOP NAVIGATION & ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
                >
                    <ChevronLeft size={18} /> Back to Dashboard
                </button>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        <Download size={18} /> Export Smart Report
                    </button>
                </div>
            </div>

            {/* 2. STUDENT IDENTITY CARD */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex justify-center items-center text-3xl font-bold text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                    {student.profilePicture ? (
                        <img src={student.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                        student.name.charAt(0)
                    )}
                    <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
                        {student.isVerified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-green-200">
                                Verified Candidate
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1.5"><Mail size={14} /> {student.email}</span>
                        <span className="flex items-center gap-1.5"><User size={14} /> ID: {student._id.slice(-8).toUpperCase()}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Global Risk Status</span>
                    <div className={`px-4 py-1.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm ${
                        overview.riskLevel.includes('High') ? 'bg-red-100 text-red-600 border border-red-200' : 
                        overview.riskLevel.includes('Medium') ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-600 border border-green-200'
                    }`}>
                        <ShieldAlert size={16} />
                        {overview.riskLevel}
                    </div>
                </div>
            </div>

            {/* 3. PERFORMANCE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Exams Attempted" 
                    value={overview.totalLifetimeExams} 
                    icon={<Calendar className="text-blue-500" size={20} />}
                    sub="Lifetime history"
                />
                <StatCard 
                    title="Avg. Percentage" 
                    value={overview.avgPercentage} 
                    icon={<Award className="text-purple-500" size={20} />}
                    sub="Overall accuracy"
                />
                <StatCard 
                    title="Success Rate" 
                    value={overview.passRate} 
                    icon={<TrendingUp className="text-emerald-500" size={20} />}
                    sub="Exam pass ratio"
                />
                <StatCard 
                    title="Risk Factor" 
                    value={overview.riskScore} 
                    icon={<AlertTriangle className="text-orange-500" size={20} />}
                    sub="Proctoring health"
                />
            </div>

            {/* 4. AI INSIGHTS & ANOMALIES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Behavioral Insights */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-600" /> Behavioral Intelligence
                        </h2>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">AI Analysis</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Violation Breakdown</p>
                            <div className="space-y-2">
                                {Object.entries(overview.violationsBreakdown || {}).length > 0 ? (
                                    Object.entries(overview.violationsBreakdown).map(([type, count]) => (
                                        <div key={type} className="flex justify-between items-center bg-white p-2 rounded-lg text-sm border border-gray-100">
                                            <span className="text-gray-600">{type}</span>
                                            <span className="font-bold text-red-500">{count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-green-600 font-medium py-2">No violations recorded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex-1">
                                <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">Proctoring Metrics</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end border-b border-blue-100/50 pb-2">
                                        <span className="text-sm text-blue-700">Total Tab Switches</span>
                                        <span className="text-xl font-black text-blue-800">{overview.totalTabSwitches}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-blue-700">Integrity Confidence</span>
                                        <span className="text-xl font-black text-blue-800">
                                            {100 - parseInt(overview.riskScore)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Anomaly Detection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                        <AlertTriangle className="text-gray-100" size={80} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 relative z-10">
                        <ShieldAlert size={20} className="text-red-500" /> Anomaly Detection
                    </h2>
                    
                    <div className="relative z-10">
                        {overview.anomalyDetected ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex flex-col gap-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-bold text-sm">Suspicious Activity Found</p>
                                        <p className="text-xs leading-relaxed mt-1">{overview.anomalyDetected.message}</p>
                                    </div>
                                </div>
                                <div className="bg-white/50 p-2 rounded-lg text-[10px] font-mono">
                                    CONTEXT: {overview.anomalyDetected.exam}
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-green-50 text-green-700 rounded-xl border border-green-100 flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Award size={24} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Pattern Consistent</p>
                                    <p className="text-xs opacity-75 mt-1">No behavioral anomalies detected. Student performance follows a logical progression.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. EXAM TIMELINE TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-white to-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Clock size={20} className="text-blue-600" /> Performance Timeline
                    </h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{pagination.totalPages > 0 ? `Total ${pagination.totalPages * pagination.limit} Entries` : '0 Entries'}</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="p-5">Exam Details</th>
                                <th className="p-5 text-center">Outcome</th>
                                <th className="p-5 text-center">Score</th>
                                <th className="p-5 text-center">Integrity</th>
                                <th className="p-5 text-right">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {timelineData.length > 0 ? timelineData.map((session) => (
                                <tr key={session._id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{session.examTitle}</p>
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-medium italic">
                                                    {new Date(session.startedAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                            session.status === 'submitted' || session.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                                            session.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className={`text-lg font-black ${session.passed ? "text-emerald-600" : "text-rose-500"}`}>
                                            {session.percentage}%
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{session.passed ? 'PASSED' : 'FAILED'}</p>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`w-3 h-1.5 rounded-full ${
                                                            i < (5 - (session.violations?.length || 0)) 
                                                            ? (session.violations?.length > 2 ? 'bg-yellow-400' : 'bg-green-400') 
                                                            : 'bg-gray-100'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400">{session.tabSwitchCount} Tabs</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-mono text-[10px] text-gray-300 group-hover:text-blue-300 transition-colors">
                                        {session._id.slice(-12).toUpperCase()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-gray-400 font-medium">No historical data available for this candidate.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 flex justify-between items-center border-t border-gray-100 bg-gray-50/50">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition text-sm font-bold text-gray-600 shadow-sm"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Page {page} of {pagination.totalPages}</span>
                        <button 
                            disabled={page === pagination.totalPages} 
                            onClick={() => setPage(page + 1)}
                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition text-sm font-bold text-gray-600 shadow-sm"
                        >
                            Next <ChevronLeft size={16} className="rotate-180" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-component for individual metric cards
const StatCard = ({ title, value, icon, sub }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
        <div className="absolute -bottom-2 -right-2 p-1 opacity-[0.03] group-hover:scale-125 transition-transform duration-500 text-black">
            {icon}
        </div>
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                {React.cloneElement(icon, { size: 16 })}
            </div>
        </div>
        <div className="text-3xl font-black text-gray-800 mb-1">{value}</div>
        <p className="text-[10px] font-medium text-gray-400">{sub}</p>
    </div>
);

export default StudentIntelligenceDashboard;

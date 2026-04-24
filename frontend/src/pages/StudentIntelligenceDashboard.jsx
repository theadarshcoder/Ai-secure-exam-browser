import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentReport } from '../services/api';
import { 
    TrendingUp, 
    AlertTriangle, 
    Clock, 
    Calendar,
    ChevronLeft,
    Download,
    User,
    Mail,
    Award,
    ShieldAlert,
    Brain,
    Target,
    Zap,
    AlertOctagon
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StudentIntelligenceDashboard = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const dashboardRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                setLoading(true);
                const data = await getStudentReport(studentId, page, 10);
                setReport(data);
            } catch (error) {
                console.error("Failed to fetch student report", error);
                toast.error("Failed to load intelligence data");
            } finally {
                setLoading(false);
            }
        };
        fetchIntelligence();
    }, [studentId, page]);

    const handleDownloadPDF = async () => {
        const element = dashboardRef.current;
        if (!element) return;

        toast.loading("Generating Secure Report...", { id: 'pdf-gen' });
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f9fafb'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Intelligence_Report_${report.student.info.name.replace(/\s+/g, '_')}.pdf`);
            toast.success("Report downloaded successfully!", { id: 'pdf-gen' });
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF", { id: 'pdf-gen' });
        }
    };

    if (loading && !report) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <Brain className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={32} />
                </div>
                <p className="text-gray-500 font-medium animate-pulse">Analyzing student behavior & performance...</p>
            </div>
        );
    }

    if (!report) return <div className="text-center text-red-500 mt-10">Intelligence data not found.</div>;

    const { student, intelligence, insights, timelineData = [], pagination } = report;
    
    // Prepare chart data (reversed to show chronological order)
    const chartData = (timelineData || []).slice().reverse().map(item => ({
        name: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
        score: item.percentage || 0
    }));

    if (!student || !student.info) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md">
                    <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Student Not Found</h2>
                    <p className="text-gray-500 mb-6">The student record you are looking for does not exist or has been removed.</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={dashboardRef} className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-gray-900">
            {/* 1. TOP NAVIGATION & ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
                >
                    <ChevronLeft size={18} /> Back
                </button>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Download size={18} /> Download Intelligence Report
                    </button>
                </div>
            </div>

            {/* 2. STUDENT IDENTITY CARD */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex justify-center items-center text-3xl font-bold text-white shadow-xl shadow-indigo-100 overflow-hidden">
                        {student.info.profilePicture ? (
                            <img src={student.info.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            student.info.name.charAt(0)
                        )}
                    </div>
                    {student.info.isVerified && (
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full border-4 border-white shadow-sm">
                            <Award size={14} />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 text-center md:text-left relative z-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{student.info.name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 text-sm mt-2">
                        <span className="flex items-center gap-1.5"><Mail size={14} /> {student.info.email}</span>
                        <span className="flex items-center gap-1.5 font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">UID: {student.info._id.slice(-8)}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-2 relative z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Risk Intelligence Level</span>
                    <div className={`px-5 py-2 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm border-2 ${
                        intelligence.riskLevel === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                        intelligence.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            intelligence.riskLevel === 'High' ? 'bg-red-500' : 
                            intelligence.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></div>
                        {intelligence.riskLevel} Risk
                    </div>
                </div>
            </div>

            {/* 3. PERFORMANCE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Exams Taken" 
                    value={student.overview.totalExams} 
                    icon={<Calendar className="text-blue-500" size={20} />}
                    sub="Lifetime attempts"
                    color="blue"
                />
                <StatCard 
                    title="Avg Score" 
                    value={`${student.overview.avgPercentage}%`} 
                    icon={<Award className="text-purple-500" size={20} />}
                    sub="Overall accuracy"
                    color="purple"
                />
                <StatCard 
                    title="Success Rate" 
                    value={`${student.overview.passRate}%`} 
                    icon={<TrendingUp className="text-emerald-500" size={20} />}
                    sub="Pass percentage"
                    color="emerald"
                />
                <StatCard 
                    title="Risk Score" 
                    value={intelligence.riskScore} 
                    icon={<AlertTriangle className="text-rose-500" size={20} />}
                    sub="Behavioral index"
                    color="rose"
                />
            </div>

            {/* 4. MAIN ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Performance Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                                <TrendingUp size={22} className="text-indigo-600" /> Performance Trend
                            </h2>
                            <p className="text-xs text-gray-400 mt-1 font-medium italic">Score progression over last {chartData.length} exams</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            insights.improvementTrend === 'increasing' ? 'bg-emerald-100 text-emerald-600' :
                            insights.improvementTrend === 'declining' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                            Trend: {insights.improvementTrend}
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={[0, 100]} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Behavioral & AI Insights */}
                <div className="flex flex-col gap-6">
                    {/* Insights Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 bg-gradient-to-br from-white to-gray-50">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Brain size={20} className="text-purple-600" /> AI Insights
                        </h2>
                        
                        <div className="space-y-4">
                            <InsightItem 
                                icon={<Target className="text-emerald-500" size={16} />}
                                label="Strongest Category"
                                value={insights.strongArea}
                                sub="Best consistent performance"
                            />
                            <InsightItem 
                                icon={<Zap className="text-amber-500" size={16} />}
                                label="Growth Potential"
                                value={insights.weakArea}
                                sub="Needs focused improvement"
                            />
                            <InsightItem 
                                icon={<ShieldAlert className="text-indigo-500" size={16} />}
                                label="Cheating Pattern"
                                value={intelligence.cheatingPattern}
                                sub="Behavioral consistency check"
                            />
                        </div>
                    </div>

                    {/* Anomaly Detection */}
                    <div className={`p-6 rounded-3xl border-2 shadow-lg transition-all ${
                        insights.anomalyDetection ? 'bg-red-50 border-red-100 shadow-red-100' : 'bg-emerald-50 border-emerald-100 shadow-emerald-100'
                    }`}>
                        <h2 className={`text-lg font-black mb-3 flex items-center gap-2 ${
                            insights.anomalyDetection ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                            {insights.anomalyDetection ? <AlertOctagon size={22} /> : <ShieldAlert size={22} />}
                            Anomaly Engine
                        </h2>
                        
                        {insights.anomalyDetection ? (
                            <div>
                                <p className="text-red-800 font-bold text-sm leading-snug">{insights.anomalyDetection.type}</p>
                                <p className="text-red-600 text-xs mt-1 leading-relaxed">{insights.anomalyDetection.message}</p>
                                <div className="mt-4 bg-white/60 backdrop-blur-sm p-2 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">
                                    Flagged for Review
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-emerald-800 font-bold text-sm">Behavior Consistent</p>
                                <p className="text-emerald-600 text-xs mt-1">AI verified that performance aligns with historical data and behavioral patterns.</p>
                                <div className="mt-4 bg-white/60 backdrop-blur-sm p-2 rounded-xl text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">
                                    Trusted Identity
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. TIMELINE & VIOLATION BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Timeline Table */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                            <Clock size={20} className="text-indigo-600" /> Academic Timeline
                        </h2>
                        <div className="flex items-center gap-4">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page {page} of {pagination.pages}</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50">
                                    <th className="p-5">Exam</th>
                                    <th className="p-5 text-center">Result</th>
                                    <th className="p-5 text-center">Score</th>
                                    <th className="p-5 text-center">Security</th>
                                    <th className="p-5 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {timelineData.length > 0 ? timelineData.map((session) => (
                                    <tr key={session._id} className="hover:bg-indigo-50/20 transition-all group">
                                        <td className="p-5">
                                            <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{session.examTitle}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{session.category}</p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                session.status === 'flagged' ? 'bg-red-100 text-red-600' :
                                                session.status === 'reviewed' ? 'bg-blue-100 text-blue-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className={`text-lg font-black ${session.passed ? "text-emerald-600" : "text-rose-500"}`}>
                                                {session.percentage}%
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">{session.passed ? 'PASSED' : 'FAILED'}</p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className={`w-3 h-1.5 rounded-full ${
                                                            session.violations?.length >= (4-i) ? 'bg-red-400' : 'bg-gray-100'
                                                        }`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">{session.tabSwitches} Tabs</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right font-medium text-xs text-gray-400">
                                            {new Date(session.submittedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-gray-300 font-bold italic underline decoration-indigo-100 decoration-4 underline-offset-8">No historical data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="p-4 flex justify-between items-center bg-gray-50/50">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-100 transition text-xs font-bold shadow-sm"
                            >
                                Previous
                            </button>
                            <button 
                                disabled={page === pagination.pages} 
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-100 transition text-xs font-bold shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Violation Breakdown Pie Chart (Simulated with progress bars for simplicity/aesthetics) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-500" /> Behavioral Faults
                    </h2>
                    
                    <div className="space-y-6">
                        {Object.entries(intelligence.violationsBreakdown).length > 0 ? (
                            Object.entries(intelligence.violationsBreakdown).map(([type, count]) => (
                                <div key={type}>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="font-bold text-gray-600">{type}</span>
                                        <span className="font-black text-rose-500">{count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min((count / student.overview.totalExams) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border-2 border-emerald-100">
                                    <ShieldAlert size={24} />
                                </div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Pristine Record</p>
                                <p className="text-[10px] text-gray-400 mt-1 italic">Zero behavioral violations detected across all sessions.</p>
                            </div>
                        )}
                    </div>
                    
                    {student.overview.totalTabSwitches > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-50">
                             <div className="flex justify-between text-xs mb-2">
                                <span className="font-bold text-gray-400">Total Tab Switches</span>
                                <span className="font-black text-indigo-600">{student.overview.totalTabSwitches}</span>
                            </div>
                            <div className="h-1 bg-indigo-50 rounded-full"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, sub, color }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        rose: 'text-rose-600 bg-rose-50'
    };
    
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-100 group-hover:bg-indigo-400 transition-colors"></div>
            </div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{title}</h3>
            <div className="text-3xl font-black text-gray-900 mt-1 tabular-nums">{value}</div>
            <p className="text-[10px] font-medium text-gray-400 mt-1">{sub}</p>
        </div>
    );
};

const InsightItem = ({ icon, label, value, sub }) => (
    <div className="flex gap-4 items-start group">
        <div className="mt-1 p-2 bg-gray-50 rounded-lg group-hover:bg-white group-hover:shadow-md transition-all">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
            <p className="text-sm font-black text-gray-800 mt-1">{value}</p>
            <p className="text-[10px] text-gray-400 italic font-medium">{sub}</p>
        </div>
    </div>
);

export default StudentIntelligenceDashboard;

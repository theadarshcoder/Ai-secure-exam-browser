import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentReport } from '../services/api';
import { ThemeToggle } from '../contexts/ThemeContext';
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
        if (!element) {
            toast.error("Dashboard reference not found.");
            return;
        }

        const loadingToast = toast.loading("Generating Secure Intelligence Report...");
        try {
            // Optimization: Scroll to top to ensure all elements are visible for capture
            window.scrollTo(0, 0);

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true, // Enable logging for debugging
                backgroundColor: null, // Transparent to preserve theme colors
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc) => {
                    // Hide elements with 'no-print' class in the clone
                    const noPrintElems = clonedDoc.querySelectorAll('.no-print');
                    noPrintElems.forEach(el => el.style.display = 'none');
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate dimensions to fit the page
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight, undefined, 'FAST');
            pdf.save(`Vision_Intelligence_${report.student.info.name.replace(/\s+/g, '_')}.pdf`);
            
            toast.success("Intelligence Report ready!", { id: loadingToast });
        } catch (error) {
            console.error("PDF Generation Detailed Error:", error);
            toast.error("Failed to generate PDF. Please try again.", { id: loadingToast });
        }
    };

    if (loading && !report) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-page">
                <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 border-4 border-main rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                    <Brain className="absolute inset-0 m-auto text-primary-500 animate-pulse" size={32} />
                </div>
                <p className="text-muted font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Analyzing behavioral neural network...</p>
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
            <div className="flex flex-col items-center justify-center h-screen bg-page p-8 text-center">
                <div className="bg-surface p-12 rounded-[2.5rem] shadow-2xl border border-main max-w-md">
                    <AlertTriangle className="text-primary-500 mx-auto mb-6" size={56} />
                    <h2 className="text-2xl font-black text-primary mb-3 tracking-tighter uppercase">Node Missing</h2>
                    <p className="text-muted text-xs mb-8 font-black uppercase tracking-widest leading-relaxed">The target intelligence profile has been purged or moved.</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-full h-14 bg-primary-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
                    >
                        Return to Command Center
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={dashboardRef} className="p-4 md:p-8 bg-page min-h-screen font-sans text-primary">
            {/* 1. TOP NAVIGATION & ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 text-secondary bg-surface border border-main rounded-xl hover:bg-surface-hover transition shadow-sm font-medium"
                >
                    <ChevronLeft size={18} /> Back
                </button>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ThemeToggle />
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                    >
                        <Download size={18} /> Download Intelligence Report
                    </button>
                </div>
            </div>

            {/* 2. STUDENT IDENTITY CARD */}
            <div className="bg-surface p-5 rounded-2xl border border-main mb-6 flex flex-col md:flex-row items-center gap-5">
                <div className="relative shrink-0">
                    <div className="w-14 h-14 bg-surface-hover border border-main rounded-xl flex justify-center items-center text-xl font-bold text-muted overflow-hidden">
                        {student.info.profilePicture ? (
                            <img src={student.info.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            student.info.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    {student.info.isVerified && (
                        <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-surface shadow-sm">
                            <Award size={10} />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-xl font-bold text-primary tracking-tight">{student.info.name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 text-muted text-[12px] mt-1.5">
                        <span className="flex items-center gap-1.5"><Mail size={12} /> {student.info.email}</span>
                        <span className="flex items-center gap-1 font-mono bg-surface-hover px-2 py-0.5 rounded text-[10px] border border-main">UID: {student.info._id.slice(-8)}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1.5">
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Risk Level</span>
                    <div className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] flex items-center gap-2 border ${
                        intelligence.riskLevel === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        intelligence.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            intelligence.riskLevel === 'High' ? 'bg-red-500' : 
                            intelligence.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {intelligence.riskLevel} Risk
                    </div>
                </div>
            </div>

            {/* 3. PERFORMANCE GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard 
                    title="Exams Taken" 
                    value={student.overview.totalExams} 
                    icon={<Calendar size={15} />}
                    sub="Lifetime attempts"
                />
                <StatCard 
                    title="Avg Score" 
                    value={`${student.overview.avgPercentage}%`} 
                    icon={<Award size={15} />}
                    sub="Overall accuracy"
                />
                <StatCard 
                    title="Success Rate" 
                    value={`${student.overview.passRate}%`} 
                    icon={<TrendingUp size={15} />}
                    sub="Pass percentage"
                />
                <StatCard 
                    title="Risk Score" 
                    value={intelligence.riskScore} 
                    icon={<AlertTriangle size={15} />}
                    sub="Behavioral index"
                />
            </div>

            {/* 4. MAIN ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Performance Trend Chart */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-3xl shadow-sm border border-main">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                                <TrendingUp size={22} className="text-primary-500" /> Performance Trend
                            </h2>
                            <p className="text-xs text-muted mt-1 font-medium">Score progression over last {chartData.length} exams</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            insights.improvementTrend === 'increasing' ? 'bg-emerald-500/10 text-emerald-500' :
                            insights.improvementTrend === 'declining' ? 'bg-red-500/10 text-red-500' : 'bg-surface-hover text-muted'
                        }`}>
                            Trend: {insights.improvementTrend}
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 800, fill: 'var(--text-muted)'}}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={[0, 100]} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 800, fill: 'var(--text-muted)'}}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '20px', 
                                        border: '1px solid var(--border-main)', 
                                        background: 'var(--bg-surface)',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                                        fontSize: '11px',
                                        fontWeight: '900',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="var(--accent-primary)" 
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
                    <div className="bg-surface p-6 rounded-3xl shadow-sm border border-main">
                        <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                            <Brain size={20} className="text-primary-500" /> AI Insights
                            <span className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ml-1">BETA</span>
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
                            
                             <div className="pt-4 mt-4 border-t border-dashed border-main">
                                <div className="flex gap-4 items-start opacity-30 grayscale">
                                    <div className="mt-1 p-2 bg-surface-hover rounded-lg">
                                        <Target className="text-muted" size={16} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">Predictive Risk</p>
                                            <span className="text-[8px] bg-surface-hover text-muted px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Coming Soon</span>
                                        </div>
                                        <p className="text-sm font-black text-muted mt-1">N/A</p>
                                        <p className="text-[10px] text-muted font-medium">Future performance prediction</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Anomaly Detection */}
                    <div className={`p-6 rounded-3xl border shadow-lg transition-all ${
                        insights.anomalyDetection ? 'bg-red-500/10 border-red-500/20 shadow-red-500/5' : 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5'
                    }`}>
                        <h2 className={`text-lg font-black mb-3 flex items-center gap-2 ${
                            insights.anomalyDetection ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                            {insights.anomalyDetection ? <AlertOctagon size={22} /> : <ShieldAlert size={22} />}
                            Anomaly Engine
                        </h2>
                        
                        {insights.anomalyDetection ? (
                            <div>
                                <p className="text-red-600 font-bold text-sm leading-snug">{insights.anomalyDetection.type}</p>
                                <p className="text-red-500 text-xs mt-1 leading-relaxed">{insights.anomalyDetection.message}</p>
                                <div className="mt-4 bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">
                                    Flagged for Review
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-emerald-600 font-bold text-sm">Behavior Consistent</p>
                                <p className="text-emerald-500 text-xs mt-1">Performance aligns with historical data and behavioral patterns.</p>
                                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center">
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
                <div className="lg:col-span-3 bg-surface rounded-3xl shadow-sm border border-main overflow-hidden">
                    <div className="p-6 border-b border-main flex justify-between items-center bg-surface-hover">
                        <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
                            <Clock size={20} className="text-primary-500" /> Academic Timeline
                        </h2>
                        <div className="flex items-center gap-4">
                             <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Page {page} of {pagination.pages}</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-muted text-[10px] font-bold uppercase tracking-widest border-b border-main">
                                    <th className="p-5">Exam</th>
                                    <th className="p-5 text-center">Result</th>
                                    <th className="p-5 text-center">Score</th>
                                    <th className="p-5 text-center">Security</th>
                                    <th className="p-5 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-main">
                                {timelineData.length > 0 ? timelineData.map((session) => (
                                    <tr key={session._id} className="hover:bg-primary-500/5 transition-all group border-b border-main last:border-0">
                                        <td className="p-6">
                                            <p className="font-black text-primary group-hover:text-primary-500 transition-colors uppercase tracking-tight text-sm">{session.examTitle}</p>
                                            <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-1">{session.category}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                session.status === 'flagged' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                session.status === 'reviewed' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' :
                                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            }`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className={`text-xl font-black tabular-nums ${session.passed ? "text-emerald-500" : "text-primary-500"}`}>
                                                {session.percentage}%
                                            </div>
                                            <p className="text-[8px] font-black text-muted/30 uppercase tracking-[0.2em]">{session.passed ? 'PASSED' : 'FAILED'}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className={`w-4 h-1.5 rounded-full ${
                                                            session.violations?.length >= (4-i) ? 'bg-primary-500' : 'bg-surface-hover border border-main'
                                                        }`} />
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">{session.tabSwitches} Flags</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right font-black text-[10px] text-muted uppercase tracking-widest">
                                            {new Date(session.submittedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center text-muted font-black uppercase tracking-widest opacity-20">Intelligence stream empty.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="p-6 flex justify-between items-center bg-surface-hover/50 border-t border-main">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                                className="px-6 py-2.5 bg-surface border border-main rounded-xl disabled:opacity-30 hover:bg-surface-hover transition text-[10px] font-black uppercase tracking-widest shadow-sm text-primary"
                            >
                                Previous
                            </button>
                            <button 
                                disabled={page === pagination.pages} 
                                onClick={() => setPage(page + 1)}
                                className="px-6 py-2.5 bg-surface border border-main rounded-xl disabled:opacity-30 hover:bg-surface-hover transition text-[10px] font-black uppercase tracking-widest shadow-sm text-primary"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Violation Breakdown Pie Chart (Simulated with progress bars for simplicity/aesthetics) */}
                <div className="bg-surface p-6 rounded-3xl shadow-sm border border-main">
                    <h2 className="text-lg font-extrabold text-primary mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-500" /> Behavioral Faults
                    </h2>
                    
                    <div className="space-y-6">
                        {Object.entries(intelligence.violationsBreakdown).length > 0 ? (
                            Object.entries(intelligence.violationsBreakdown).map(([type, count]) => (
                                <div key={type}>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                        <span className="text-muted opacity-50">{type}</span>
                                        <span className="text-rose-500">{count}</span>
                                    </div>
                                    <div className="h-2 bg-surface-hover rounded-full overflow-hidden border border-main">
                                        <div 
                                            className="h-full bg-rose-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(244,63,94,0.4)]" 
                                            style={{ width: `${Math.min((count / student.overview.totalExams) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[240px] text-center bg-surface-hover/30 rounded-3xl border border-dashed border-main">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20 shadow-xl">
                                    <ShieldAlert size={28} strokeWidth={2.5} />
                                </div>
                                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">Pristine Record</p>
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-2 opacity-30">Zero behavioral violations detected in registry.</p>
                            </div>
                        )}
                    </div>
                    
                    {student.overview.totalTabSwitches > 0 && (
                        <div className="mt-8 pt-6 border-t border-main">
                     <div className="flex justify-between text-xs mb-2">
                                <span className="font-bold text-muted uppercase tracking-widest text-[9px]">Total Tab Switches</span>
                                <span className="font-black text-primary-500">{student.overview.totalTabSwitches}</span>
                            </div>
                            <div className="h-1 bg-primary-500/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, sub }) => (
    <div className="bg-surface p-5 rounded-2xl border border-main hover:border-primary-500/20 hover:shadow-sm transition-all">
        <div className="flex items-center gap-2 text-muted mb-3">
            <span className="p-1.5 bg-surface-hover border border-main rounded-lg">{icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest">{title}</span>
        </div>
        <div className="text-2xl font-bold text-primary tabular-nums">{value}</div>
        <p className="text-[11px] text-muted mt-1">{sub}</p>
    </div>
);

const InsightItem = ({ icon, label, value, sub }) => (
    <div className="flex gap-4 items-start group">
        <div className="mt-1 p-2 bg-surface-hover rounded-lg group-hover:bg-surface group-hover:shadow-md transition-all border border-transparent group-hover:border-main">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">{label}</p>
            <p className="text-sm font-black text-primary mt-1">{value}</p>
            <p className="text-[10px] text-muted font-medium">{sub}</p>
        </div>
    </div>
);

export default StudentIntelligenceDashboard;

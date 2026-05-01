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
    AlertOctagon,
    ShieldCheck
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

        const loadingToast = toast.loading("Synthesizing Professional Intelligence Dossier...");
        try {
            // Scroll to top to ensure complete capture
            window.scrollTo(0, 0);
            
            // Allow time for any lazy-loaded elements or animations to settle
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(element, {
                scale: 1.2, // Slightly reduced scale for better memory safety on mobile/low-end devices
                useCORS: true,
                allowTaint: false,
                logging: true, // Enabled logging temporarily to help user debug if it still fails
                backgroundColor: '#0a0c10', 
                scrollX: 0,
                scrollY: -window.scrollY,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc) => {
                    // Hide UI elements in the PDF
                    const noPrintElems = clonedDoc.querySelectorAll('.no-print');
                    noPrintElems.forEach(el => el.style.display = 'none');
                    
                    // Show PDF-only header
                    const pdfHeader = clonedDoc.querySelector('.pdf-only-header');
                    if (pdfHeader) pdfHeader.style.display = 'block';
                    
                    // Remove backdrop-filter as it's unsupported by html2canvas and causes failures
                    const blurryElems = clonedDoc.querySelectorAll('*');
                    blurryElems.forEach(el => {
                        const style = window.getComputedStyle(el);
                        if (style.backdropFilter && style.backdropFilter !== 'none') {
                            el.style.backdropFilter = 'none';
                            el.style.backgroundColor = 'rgba(20, 22, 28, 0.95)'; // Fallback solid background
                        }
                    });

                    // Adjust spacing for PDF
                    const mainContainer = clonedDoc.querySelector('.p-4.md\\:p-8');
                    if (mainContainer) mainContainer.style.padding = '40px';
                }
            });

            if (!canvas || canvas.width === 0) {
                throw new Error("Canvas generation failed or returned empty.");
            }

            const imgData = canvas.toDataURL('image/jpeg', 0.8); 
            const pdf = new jsPDF('p', 'mm', 'a4', true); // compress: true
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = pageWidth / imgWidth;
            const finalWidth = pageWidth;
            const finalHeight = imgHeight * ratio;

            let heightLeft = finalHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, finalWidth, finalHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - finalHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, finalWidth, finalHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            pdf.save(`VISION_INTEL_${report.student.info.name.toUpperCase().replace(/\s+/g, '_')}.pdf`);
            toast.success("Intelligence Dossier Exported.", { id: loadingToast });
        } catch (error) {
            console.error("PDF Export Failure Technical Details:", {
                message: error.message,
                stack: error.stack,
                reportExists: !!report,
                refExists: !!dashboardRef.current
            });
            toast.error("Export Failed. Please check browser permissions or try a different browser.", { id: loadingToast });
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
            {/* PDF ONLY HEADER (HIDDEN ON WEB) */}
            <div className="pdf-only-header hidden border-b-2 border-primary-500 pb-6 mb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Vision Intelligence Dossier</h1>
                        <p className="text-[10px] text-muted font-black tracking-[0.3em] uppercase mt-1">High-Security Candidate Behavioral Analysis</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Confidential Record</p>
                        <p className="text-[9px] text-muted font-bold mt-1 uppercase tracking-widest">Exported: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
            {/* 1. TOP NAVIGATION & ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-4 no-print">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors active:scale-95"
                >
                    <ChevronLeft size={16} strokeWidth={3} /> Back to Hub
                </button>
                
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <ThemeToggle />
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                    >
                        <Download size={14} strokeWidth={3} /> Download Report
                    </button>
                </div>
            </div>

            {/* 2. UNIFIED OVERVIEW HEADER */}
            <div className="mb-20">
                {/* Header row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full flex justify-center items-center text-3xl font-black text-primary overflow-hidden">
                                {student.info.profilePicture ? (
                                    <img src={student.info.profilePicture} alt="" className="w-full h-full object-cover" crossOrigin="anonymous"/>
                                ) : (
                                    student.info.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            {student.info.isVerified && (
                                <div className="absolute -bottom-1 -right-1 text-emerald-500 bg-page rounded-full p-0.5">
                                    <Award size={18} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h1 className="text-4xl font-black text-primary tracking-tighter uppercase">{student.info.name}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-muted text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-80">
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {student.info.email}</span>
                                <span className="flex items-center gap-1.5"><User size={14} /> UID: {student.info._id.slice(-8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-1.5">
                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Risk Level</span>
                        <div className={`font-black text-[13px] uppercase tracking-widest flex items-center gap-2 ${
                            intelligence.riskLevel === 'High' ? 'text-red-500' : 
                            intelligence.riskLevel === 'Medium' ? 'text-amber-600' : 
                            'text-emerald-500'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                intelligence.riskLevel === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                                intelligence.riskLevel === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                            }`} />
                            {intelligence.riskLevel} Risk
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
                    <StatCard 
                        title="Exams Taken" 
                        value={student.overview.totalExams} 
                        icon={<Calendar size={18} />}
                        sub="Lifetime attempts"
                    />
                    <StatCard 
                        title="Avg Score" 
                        value={`${student.overview.avgPercentage}%`} 
                        icon={<Award size={18} />}
                        sub="Overall accuracy"
                    />
                    <StatCard 
                        title="Success Rate" 
                        value={`${student.overview.passRate}%`} 
                        icon={<TrendingUp size={18} />}
                        sub="Pass percentage"
                    />
                    <StatCard 
                        title="Risk Score" 
                        value={intelligence.riskScore} 
                        icon={<AlertTriangle size={18} />}
                        sub="Behavioral index"
                    />
                    
                    {/* Identity Alert Area */}
                    <div className="flex flex-col">
                        {!student.info.isVerified && student.info.verificationIssue ? (
                            <div className="flex flex-col animate-pulse">
                                <div className="flex items-center gap-2 text-red-500 mb-1.5">
                                    <ShieldAlert size={16} strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Identity Alert</span>
                                </div>
                                <p className="text-xl font-black text-red-600 leading-tight uppercase tracking-tight">{student.info.verificationIssue}</p>
                                <p className="text-[9px] text-red-500/70 mt-1 uppercase font-bold tracking-widest">AI Flagged Fraud Pattern</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-emerald-500 mb-1.5">
                                    <ShieldCheck size={16} strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Trust Status</span>
                                </div>
                                <p className="text-xl font-black text-emerald-600 leading-tight uppercase tracking-tight">Identity Verified</p>
                                <p className="text-[9px] text-emerald-500 mt-1 uppercase font-bold tracking-widest">Biometric Match Confirmed</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. MAIN ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-20">
                {/* Performance Trend Chart */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-primary flex items-center gap-2.5 uppercase tracking-tighter">
                                <TrendingUp size={22} className="text-primary-500" /> Performance Trend
                            </h2>
                            <p className="text-[10px] text-muted mt-1.5 font-bold uppercase tracking-widest opacity-70">Score progression over last {chartData.length} exams</p>
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            insights.improvementTrend === 'increasing' ? 'text-emerald-500' :
                            insights.improvementTrend === 'declining' ? 'text-red-500' : 'text-muted'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${insights.improvementTrend === 'increasing' ? 'bg-emerald-500' : insights.improvementTrend === 'declining' ? 'bg-red-500' : 'bg-muted'}`} />
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
                <div className="flex flex-col gap-12">
                    {/* Insights Card */}
                    <div>
                        <h2 className="text-xl font-black text-primary mb-8 flex items-center gap-2.5 uppercase tracking-tighter">
                            <Brain size={20} className="text-primary-500" /> AI Insights
                            <span className="text-[8px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full font-black uppercase tracking-[0.2em] ml-1">BETA</span>
                        </h2>
                        
                        <div className="space-y-6">
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
                    <div>
                        <h2 className={`text-xl font-black mb-6 flex items-center gap-2.5 uppercase tracking-tighter ${
                            insights.anomalyDetection ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                            {insights.anomalyDetection ? <AlertOctagon size={22} /> : <ShieldAlert size={22} />}
                            Anomaly Engine
                        </h2>
                        
                        {insights.anomalyDetection ? (
                            <div className="border-l-2 border-red-500 pl-4 py-1">
                                <p className="text-red-600 font-black text-sm uppercase tracking-tight">{insights.anomalyDetection.type}</p>
                                <p className="text-red-500 text-[10px] font-bold mt-1.5 uppercase tracking-widest leading-relaxed opacity-80">{insights.anomalyDetection.message}</p>
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-4">Flagged for Review</p>
                            </div>
                        ) : (
                            <div className="border-l-2 border-emerald-500 pl-4 py-1">
                                <p className="text-emerald-600 font-black text-sm uppercase tracking-tight">Behavior Consistent</p>
                                <p className="text-emerald-500 text-[10px] font-bold mt-1.5 uppercase tracking-widest opacity-80">Performance aligns with historical data.</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-4">Trusted Identity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. TIMELINE & VIOLATION BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
                {/* Timeline Table */}
                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-primary flex items-center gap-2.5 uppercase tracking-tighter">
                            <Clock size={20} className="text-primary-500" /> Academic Timeline
                        </h2>
                        <div className="flex items-center gap-4">
                             <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-80">Page {page} of {pagination.pages}</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-muted text-[9px] font-black uppercase tracking-[0.3em] border-b border-main">
                                    <th className="pb-4 pr-4">Exam</th>
                                    <th className="pb-4 px-4">Result</th>
                                    <th className="pb-4 px-4">Score</th>
                                    <th className="pb-4 px-4">Security</th>
                                    <th className="pb-4 pl-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-main">
                                {timelineData.length > 0 ? timelineData.map((session) => (
                                    <tr key={session._id} className="group border-b border-main last:border-0 hover:bg-surface-hover/30 transition-colors">
                                        <td className="py-6 pr-4">
                                            <p className="font-black text-primary group-hover:text-primary-500 transition-colors uppercase tracking-tight text-sm">{session.examTitle}</p>
                                            <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1 opacity-80">{session.category}</p>
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                session.status === 'flagged' ? 'text-red-500' :
                                                session.status === 'reviewed' ? 'text-primary-500' :
                                                'text-emerald-500'
                                            }`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className={`text-lg font-black tabular-nums ${session.passed ? "text-emerald-500" : "text-primary-500"}`}>
                                                {session.percentage}%
                                            </div>
                                            <p className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mt-0.5 opacity-60">{session.passed ? 'PASSED' : 'FAILED'}</p>
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{session.tabSwitches} Flags</span>
                                        </td>
                                        <td className="py-6 pl-4 text-right font-black text-[10px] text-muted uppercase tracking-widest">
                                            {new Date(session.submittedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-muted font-black uppercase tracking-widest opacity-30">Intelligence stream empty.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-8 flex justify-between items-center">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-500 transition-colors disabled:opacity-30"
                            >
                                Previous
                            </button>
                            <button 
                                disabled={page === pagination.pages} 
                                onClick={() => setPage(page + 1)}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-500 transition-colors disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Violation Breakdown Pie Chart */}
                <div>
                    <h2 className="text-xl font-black text-primary mb-8 flex items-center gap-2.5 uppercase tracking-tighter">
                        <AlertTriangle size={20} className="text-rose-500" /> Behavioral Faults
                    </h2>
                    
                    <div className="space-y-6">
                        {Object.entries(intelligence.violationsBreakdown).length > 0 ? (
                            Object.entries(intelligence.violationsBreakdown).map(([type, count]) => (
                                <div key={type}>
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2.5">
                                        <span className="text-muted opacity-80">{type}</span>
                                        <span className="text-rose-500">{count}</span>
                                    </div>
                                    <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-rose-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(244,63,94,0.4)]" 
                                            style={{ width: `${Math.min((count / student.overview.totalExams) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-start pt-2">
                                <ShieldAlert size={20} strokeWidth={3} className="text-emerald-500 mb-3" />
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Pristine Record</p>
                                <p className="text-[9px] text-muted font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60 leading-relaxed">Zero behavioral violations detected in registry.</p>
                            </div>
                        )}
                    </div>
                    
                    {student.overview.totalTabSwitches > 0 && (
                        <div className="mt-8 pt-8 border-t border-main">
                             <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2.5">
                                <span className="text-muted opacity-80">Total Tab Switches</span>
                                <span className="text-primary-500">{student.overview.totalTabSwitches}</span>
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
    <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-2 text-muted mb-1.5">
            <span className="text-primary-500/70">{icon}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{title}</span>
        </div>
        <div className="text-3xl font-black text-primary tabular-nums tracking-tighter leading-none">{value}</div>
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60 mt-1">{sub}</p>
    </div>
);

const InsightItem = ({ icon, label, value, sub }) => (
    <div className="flex gap-4 items-start">
        <div className="mt-0.5 flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] leading-none">{label}</p>
            <p className="text-sm font-black text-primary mt-2 uppercase tracking-tight">{value}</p>
            <p className="text-[9px] text-muted font-bold mt-1 uppercase tracking-widest opacity-60">{sub}</p>
        </div>
    </div>
);

export default StudentIntelligenceDashboard;

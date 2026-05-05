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

                    // Adjust spacing for PDF
                    const mainContainer = clonedDoc.querySelector('.max-w-7xl');
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
            console.error("PDF Export Failure Technical Details:", error);
            toast.error(`Export Failed: ${error.message || "Unknown error"}`, { id: loadingToast });
        }
    };

    if (loading && !report) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-main">
                <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
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
        <div ref={dashboardRef} className="bg-main min-h-screen font-sans text-primary overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full px-8 py-6 space-y-8">
                {/* PDF ONLY HEADER (HIDDEN ON WEB) */}
                <div className="pdf-only-header hidden border-b-2 border-primary-500 pb-6 mb-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-primary tracking-tight">Vision Intelligence Dossier</h1>
                            <p className="text-xs text-muted font-medium mt-1">High-Security Candidate Behavioral Analysis</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest">Confidential Record</p>
                            <p className="text-xs text-muted font-medium mt-1">Exported: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* 1. TOP NAVIGATION & ACTION BAR */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[13px] font-medium text-muted hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={16} strokeWidth={2} /> Back to Hub
                    </button>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <ThemeToggle />
                        <button 
                            onClick={handleDownloadPDF}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-primary hover:text-primary-500 font-semibold text-[13px] transition-colors"
                        >
                            <Download size={16} strokeWidth={2} /> Export Report
                        </button>
                    </div>
                </div>

                {/* 2. PROFILE HEADER */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-b border-main pb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full flex justify-center items-center text-2xl font-bold bg-surface text-primary overflow-hidden">
                                {student.info.profilePicture ? (
                                    <img src={student.info.profilePicture} alt="" className="w-full h-full object-cover" crossOrigin="anonymous"/>
                                ) : (
                                    student.info.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            {student.info.isVerified && (
                                <div className="absolute -bottom-1 -right-1 text-emerald-500 bg-main rounded-full p-0.5">
                                    <Award size={18} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h1 className="text-2xl font-bold text-primary tracking-tight">{student.info.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-muted text-[13px] font-medium mt-1">
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {student.info.email}</span>
                                <span className="flex items-center gap-1.5"><User size={14} /> UID: {student.info._id.slice(-8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 md:gap-10">
                        {/* Identity Alert */}
                        <div className="flex flex-col items-start md:items-end text-left md:text-right">
                            {!student.info.isVerified && student.info.verificationIssue ? (
                                <>
                                    <div className="flex items-center gap-1.5 text-red-500 mb-1">
                                        <ShieldAlert size={14} strokeWidth={2.5} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Identity Alert</span>
                                    </div>
                                    <p className="text-[13px] font-semibold text-red-600 leading-tight">{student.info.verificationIssue}</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                                        <ShieldCheck size={14} strokeWidth={2.5} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Trust Status</span>
                                    </div>
                                    <p className="text-[13px] font-semibold text-emerald-600 leading-tight">Identity Verified</p>
                                </>
                            )}
                        </div>

                        {/* Risk Level */}
                        <div className="flex flex-col items-start md:items-end text-left md:text-right pl-0 md:pl-10 md:border-l border-main">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Risk Level</span>
                            <div className={`font-semibold text-[13px] flex items-center gap-1.5 ${
                                intelligence.riskLevel === 'High' ? 'text-red-500' : 
                                intelligence.riskLevel === 'Medium' ? 'text-amber-500' : 
                                'text-emerald-500'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    intelligence.riskLevel === 'High' ? 'bg-red-500' : 
                                    intelligence.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                {intelligence.riskLevel} Risk
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-main pb-6">
                    <StatCard 
                        title="Exams Taken" 
                        value={student.overview.totalExams} 
                        icon={<Calendar size={16} />}
                        sub="Lifetime attempts"
                    />
                    <StatCard 
                        title="Avg Score" 
                        value={`${student.overview.avgPercentage}%`} 
                        icon={<Award size={16} />}
                        sub="Overall accuracy"
                    />
                    <StatCard 
                        title="Success Rate" 
                        value={`${student.overview.passRate}%`} 
                        icon={<TrendingUp size={16} />}
                        sub="Pass percentage"
                    />
                    <StatCard 
                        title="Risk Score" 
                        value={intelligence.riskScore} 
                        icon={<AlertTriangle size={16} />}
                        sub="Behavioral index"
                    />
                </div>

                {/* 4. MAIN ANALYTICS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Performance Trend Chart */}
                    <div className="lg:col-span-8 bg-surface rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-[15px] font-semibold text-primary flex items-center gap-2">
                                    <TrendingUp size={16} className="text-muted" /> Performance Trend
                                </h2>
                                <p className="text-[12px] text-muted mt-2 font-medium">Score progression over last {chartData.length} exams</p>
                            </div>
                            <div className={`text-[12px] font-semibold flex items-center gap-1.5 ${
                                insights.improvementTrend === 'increasing' ? 'text-emerald-500' :
                                insights.improvementTrend === 'declining' ? 'text-red-500' : 'text-muted'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${insights.improvementTrend === 'increasing' ? 'bg-emerald-500' : insights.improvementTrend === 'declining' ? 'bg-red-500' : 'bg-muted'}`} />
                                Trend: <span className="capitalize">{insights.improvementTrend}</span>
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
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11, fontWeight: 500, fill: 'var(--text-muted)'}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[0, 100]} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11, fontWeight: 500, fill: 'var(--text-muted)'}}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            background: 'var(--bg-surface)',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="score" 
                                        stroke="var(--accent-primary)" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#colorScore)" 
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Behavioral & AI Insights */}
                    <div className="lg:col-span-4 bg-surface rounded-2xl p-6 flex flex-col gap-8">
                        {/* Insights Card */}
                        <div className="flex flex-col">
                            <h2 className="text-[15px] font-semibold text-primary mb-6 flex items-center gap-2">
                                <Brain size={16} className="text-muted" /> Cognitive Profile
                            </h2>
                            
                            <div className="space-y-5">
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
                        <div className="flex flex-col">
                            <h2 className={`text-[14px] font-semibold mb-4 flex items-center gap-2 ${
                                insights.anomalyDetection ? 'text-red-500' : 'text-emerald-500'
                            }`}>
                                {insights.anomalyDetection ? <AlertOctagon size={16} /> : <ShieldAlert size={16} />}
                                Anomaly Engine
                            </h2>
                            
                            {insights.anomalyDetection ? (
                                <div className="border-l-2 border-red-500 pl-4 py-1">
                                    <p className="text-red-600 font-semibold text-[13px]">{insights.anomalyDetection.type}</p>
                                    <p className="text-red-500/80 text-[12px] font-medium mt-1.5 leading-relaxed">{insights.anomalyDetection.message}</p>
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-4">Flagged for Review</p>
                                </div>
                            ) : (
                                <div className="border-l-2 border-emerald-500 pl-4 py-1">
                                    <p className="text-emerald-600 font-semibold text-[13px]">Behavior Consistent</p>
                                    <p className="text-emerald-500/80 text-[12px] font-medium mt-1.5 leading-relaxed">Performance aligns with historical data models.</p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-4">Trusted Identity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, sub }) => (
    <div className="flex flex-col gap-0.5 w-full">
        <div className="flex items-center gap-1.5 text-muted mb-1">
            <span className="text-primary/40">{icon}</span>
            <span className="text-[11px] font-medium">{title}</span>
        </div>
        <div className="text-[22px] font-bold text-primary tracking-tight">{value}</div>
        <p className="text-[11px] font-medium text-muted">{sub}</p>
    </div>
);

const InsightItem = ({ icon, label, value, sub }) => (
    <div className="flex gap-3 items-start">
        <div className="mt-0.5 flex-shrink-0 text-muted">
            {icon}
        </div>
        <div>
            <p className="text-[11px] font-medium text-muted">{label}</p>
            <p className="text-[13px] font-semibold text-primary mt-0.5">{value}</p>
            <p className="text-[11px] text-muted font-medium mt-0.5">{sub}</p>
        </div>
    </div>
);

export default StudentIntelligenceDashboard;

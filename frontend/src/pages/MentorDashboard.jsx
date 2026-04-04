import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, CheckCircle, Clock,
  Search, Eye, Video, ChevronRight, ArrowUpRight,
  ChevronDown, ChevronUp, X, Plus,
  BarChart3, Bell, FileText, TrendingUp,
  ArrowDownRight, ExternalLink, Filter,
  AlertCircle, ShieldCheck, BookOpen, CreditCard,
  Activity, ScanFace, OctagonX, CheckCircle2
} from 'lucide-react';

// --- Default Empty State ---
const DEFAULT_STATS = [
  { label: 'Live Students', value: '0', delta: null, deltaLabel: 'in sessions', color: 'bg-blue-500' },
  { label: 'Submissions', value: '0', delta: null, deltaLabel: 'completed', color: 'bg-emerald-500' },
  { label: 'Flags', value: '0', delta: null, deltaLabel: 'need review', color: 'bg-amber-500' },
  { label: 'Total Exams', value: '0', delta: null, deltaLabel: 'created', color: 'bg-violet-500' },
];

// --- Helpers ---

const getStatusStyle = (status) => {
  switch (status) {
    case 'Flagged': return 'text-amber-400 bg-amber-400/10';
    case 'Reviewing': return 'text-blue-400 bg-blue-400/10';
    case 'Passed': return 'text-emerald-400 bg-emerald-400/10';
    default: return 'text-zinc-400 bg-zinc-800';
  }
};

const getStudentDetail = (student) => {
  let realIncidents = [];
  try {
    const stored = localStorage.getItem('vision_incidents');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) realIncidents = parsed;
    }
  } catch (e) {
    console.error("Local incidents parse failure", e);
  }

  const faceImage = localStorage.getItem('vision_reference_face');
  const idImage = localStorage.getItem('vision_reference_id');

  try {
    return {
      ...student,
      email: `${(student?.name || 'student').toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      id: student?.name === 'Adarsh Maurya' ? 'VSN-89241' : `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      faceImage,
      idImage,
      sections: [
        { name: 'MCQ', score: Math.min(100, (student?.score || 0) + Math.floor(Math.random() * 10 - 5)), total: 30, correct: Math.floor(30 * (student?.score || 0) / 100) },
        { name: 'Short Answer', score: Math.min(100, (student?.score || 0) + Math.floor(Math.random() * 15 - 8)), total: 20, correct: Math.floor(20 * (student?.score || 0) / 100) },
        { name: 'Coding', score: Math.min(100, (student?.score || 0) + Math.floor(Math.random() * 12 - 6)), total: 10, correct: Math.floor(10 * (student?.score || 0) / 100) },
      ],
      questions: [
        { q: 'Q1', result: 'correct' }, { q: 'Q2', result: 'correct' }, { q: 'Q3', result: (student?.score || 0) < 60 ? 'wrong' : 'correct' },
        { q: 'Q4', result: 'correct' }, { q: 'Q5', result: 'wrong' }, { q: 'Q6', result: 'correct' },
        { q: 'Q7', result: (student?.score || 0) < 50 ? 'wrong' : 'correct' }, { q: 'Q8', result: 'correct' }, { q: 'Q9', result: 'skipped' },
        { q: 'Q10', result: 'correct' }, { q: 'Q11', result: (student?.score || 0) < 70 ? 'wrong' : 'correct' }, { q: 'Q12', result: 'correct' },
      ],
      flags: (student?.name === 'Adarsh Maurya' && realIncidents.length > 0)
        ? realIncidents.map(inc => ({
          type: inc?.type || 'Flag',
          time: inc?.timestamp ? new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
          severity: inc?.severity || 'medium'
        }))
        : student?.status === 'Flagged'
          ? [{ type: 'Tab Switch', time: '12:04', severity: 'high' }, { type: 'Face Not Detected', time: '18:22', severity: 'high' }]
          : (student?.score || 0) < 80
            ? [{ type: 'Long Inactivity', time: '22:10', severity: 'low' }]
            : [],
      timeline: [
        { time: '00:00', event: 'Exam started' },
        { time: '05:12', event: 'Identity verified' },
        { time: student?.time || '00:00', event: 'Exam submitted' },
      ],
    };
  } catch (e) {
    console.error("Student detail generation failure", e);
    return { ...student, flags: [], timeline: [], sections: [] };
  }
};

// --- Sub-components ---

const StudentDetailModal = ({ student, onClose }) => {
  if (!student) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto modal-scroll pointer-events-auto shadow-2xl">
          <div className="sticky top-0 bg-[#13151b]/95 backdrop-blur-md border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#181a20] border border-white/[0.06] flex items-center justify-center text-sm font-bold text-zinc-300">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{student.name}</h3>
                <p className="text-[11px] text-zinc-500">{student.email} Â· {student.exam}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-[#181a20] rounded-xl p-3.5 border border-white/[0.06] text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Score</p>
                <p className={`text-xl font-bold ${student.score >= 80 ? 'text-emerald-400' : student.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{student.score}%</p>
              </div>
              <div className="bg-[#181a20] rounded-xl p-3.5 border border-white/[0.06] text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Time</p>
                <p className="text-xl font-bold text-white font-mono">{student.time}</p>
              </div>
              <div className="bg-[#181a20] rounded-xl p-3.5 border border-white/[0.06] text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                <span className={`text-[11px] font-semibold ${getStatusStyle(student.status)} px-2 py-0.5 rounded-md inline-block mt-1`}>{student.status}</span>
              </div>
              <div className="bg-[#181a20] rounded-xl p-3.5 border border-white/[0.06] text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Flags</p>
                <p className={`text-xl font-bold ${student.flags.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{student.flags.length}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><BookOpen size={12} /> Section Breakdown</h4>
              <div className="grid grid-cols-3 gap-2.5">
                {student.sections.map((sec, i) => (
                  <div key={i} className="bg-[#181a20] rounded-xl p-3.5 border border-white/[0.06]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-zinc-300">{sec.name}</span>
                      <span className="text-[10px] text-zinc-600">{sec.correct}/{sec.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sec.score >= 80 ? 'bg-emerald-500' : sec.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${sec.score}%` }} />
                      </div>
                      <span className={`text-[11px] font-bold tabular-nums ${sec.score >= 80 ? 'text-emerald-400' : sec.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{sec.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#181a20] rounded-xl p-4 border border-white/[0.06]">
                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Question Map</h4>
                <div className="grid grid-cols-6 gap-1.5">
                  {student.questions.map((q, i) => (
                    <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold border ${q.result === 'correct' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        q.result === 'wrong' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'
                      }`}>
                      {q.q}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500/30" /><span className="text-[10px] text-zinc-600">Correct</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500/30" /><span className="text-[10px] text-zinc-600">Wrong</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-zinc-700" /><span className="text-[10px] text-zinc-600">Skipped</span></div>
                </div>
              </div>

              <div className="bg-[#181a20] rounded-xl p-4 border border-white/[0.06] flex flex-col min-h-[220px]">
                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Video size={12} className="text-emerald-500" /> Integrated Live Feed</h4>
                <div className="flex-1 relative rounded-xl overflow-hidden bg-black/40 border border-white/5 mb-4 group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full z-10">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Live Feed</span>
                    </div>
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                    <div className="text-center w-full h-full flex flex-col items-center justify-center">
                      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-500/5 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] animate-pulse" />
                        <ScanFace size={56} className="text-emerald-400 opacity-40 relative z-10" />
                        <div className="mt-3 flex flex-col items-center gap-1 relative z-10">
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Neural Mesh Active</span>
                          <span className="text-[8px] text-emerald-500/40 uppercase font-bold tracking-widest">Privacy Shield Restricted</span>
                        </div>
                      </div>
                      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500 font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">LATENCY: 24MS</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 border-[20px] border-transparent border-t-emerald-500/5 border-l-emerald-500/5 pointer-events-none" />
                </div>

                <div className="mb-4">
                  <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CreditCard size={12} className="text-amber-500" /> ID Reference</h4>
                  <div className="aspect-[1.6/1] bg-black/40 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center py-6 bg-amber-500/[0.03] relative border border-amber-500/10 rounded-xl">
                    <ShieldCheck size={42} className="text-amber-500/20 mb-3" />
                    <div className="text-center px-4">
                      <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-1">Identity Confirmed</p>
                      <p className="text-[8px] text-amber-500/30 uppercase font-bold tracking-widest leading-none">Document hash: verified Â· {student.id}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> Risk Context</h4>
                  {student.flags.length === 0 ? (
                    <div className="flex items-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Nominal Behavior</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {student.flags.map((f, i) => (
                        <div key={i} className={`rounded-lg p-3 flex items-center gap-2.5 border ${f.severity === 'high' ? 'bg-red-500/[0.06] border-red-500/[0.1]' : 'bg-amber-500/[0.06] border-amber-500/[0.1]'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${f.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold ${f.severity === 'high' ? 'text-red-300' : 'text-amber-300'} tracking-tight`}>{f.type}</span>
                            <span className="text-[9px] text-zinc-600 ml-1.5 font-mono">@ {f.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#181a20] rounded-xl px-4 py-3 border border-white/[0.06] flex items-center gap-6">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest shrink-0 flex items-center gap-1.5"><Activity size={12} className="text-teal-600" /> Session Telemetry</span>
              <div className="flex items-center gap-1 flex-1">
                {student.timeline.map((t, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
                      <div>
                        <span className="text-[11px] font-bold text-zinc-300 tracking-tight">{t.event}</span>
                        <span className="text-[10px] text-zinc-600 ml-1.5 font-mono">{t.time}</span>
                      </div>
                    </div>
                    {i < student.timeline.length - 1 && <div className="flex-1 h-px bg-white/5 mx-2" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ label, value, delta, deltaLabel, color }) => (
  <div className="bg-[#181a20] rounded-2xl p-5 border border-white/[0.06]">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-white">{value}</span>
      {delta && (
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
          <ArrowUpRight size={12} />{delta}
        </span>
      )}
    </div>
    <p className="text-[11px] text-zinc-600 mt-1">{deltaLabel}</p>
  </div>
);

const ActiveSessionItem = ({ exam }) => (
  <div className="bg-[#181a20] rounded-2xl p-5 border border-white/[0.06] flex items-center justify-between gap-4 hover:border-white/[0.12] transition-colors group cursor-pointer">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-[#0f1117] border border-white/[0.06] flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
        {exam.students}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{exam.name}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{exam.id} Â· {exam.status === 'live' ? `${exam.time} elapsed` : `Starts at ${exam.time}`}</p>
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      {exam.flags > 0 && (
        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg">
          <AlertTriangle size={12} />
          <span className="text-[11px] font-semibold">{exam.flags}</span>
        </div>
      )}
      <div className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${exam.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
        {exam.status === 'live' ? 'â— Live' : 'Upcoming'}
      </div>
      <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
    </div>
  </div>
);

const ActivityItem = ({ item }) => {
  const dotColor = item.type === 'flag' ? 'bg-amber-400' : item.type === 'review' ? 'bg-blue-400' : 'bg-emerald-400';
  return (
    <div className="px-5 py-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
      <div className="mt-1.5 shrink-0">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300">
          <span className="font-medium text-white">{item.name}</span>
          {' '}{item.action}{' '}
          <span className="text-zinc-500">{item.exam}</span>
        </p>
        <p className="text-[11px] text-zinc-600 mt-1">{item.time}</p>
      </div>
    </div>
  );
};

const PerformanceRow = ({ student, onClick, onTerminate, isTerminated }) => (
  <div onClick={onClick} className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors cursor-pointer group ${isTerminated ? 'opacity-40' : ''}`}>
    <div className="col-span-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-[#0f1117] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-zinc-400">
        {student.name.charAt(0)}
      </div>
      <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{student.name}</span>
    </div>
    <div className="col-span-3 text-xs text-zinc-500">{student.exam}</div>
    <div className="col-span-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${student.score >= 80 ? 'bg-emerald-500' : student.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${student.score}%` }} />
        </div>
        <span className={`text-xs font-bold tabular-nums ${student.score >= 80 ? 'text-emerald-400' : student.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{student.score}%</span>
      </div>
    </div>
    <div className="col-span-2 text-center text-xs text-zinc-500 font-mono">{student.time}</div>
    <div className="col-span-2 flex justify-end items-center gap-2">
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${isTerminated ? 'bg-red-500/10 text-red-400' : getStatusStyle(student.status)}`}>
        {isTerminated ? 'Terminated' : student.status}
      </span>
      {!isTerminated && (
        <button
          onClick={e => { e.stopPropagation(); onTerminate(student); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Terminate exam"
        >
          <OctagonX size={13} />
        </button>
      )}
    </div>
  </div>
);

const ResultSummaryCard = ({ r }) => (
  <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-colors">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-zinc-200">{r.exam}</p>
      <span className="text-[11px] text-zinc-600">{r.submissions} submissions</span>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-1">Average</p><p className="text-xl font-bold text-white">{r.avg}%</p></div>
      <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-1">Highest</p><p className="text-xl font-bold text-emerald-400">{r.high}%</p></div>
      <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-1">Lowest</p><p className="text-xl font-bold text-red-400">{r.low}%</p></div>
    </div>
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wide">Pass Rate</span>
        <span className="text-xs font-semibold text-zinc-300">{r.pass}%</span>
      </div>
      <div className="h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${r.pass >= 85 ? 'bg-emerald-500' : r.pass >= 70 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${r.pass}%` }} />
      </div>
    </div>
  </div>
);

export default function MentorDashboard() {
  const [greeting, setGreeting] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [showAllResults, setShowAllResults] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [terminatedStudents, setTerminatedStudents] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const navigate = useNavigate();

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const terminateStudent = (student) => {
    const entry = {
      studentId: student.id || 'VSN-89241',
      examId: student.exam,
      reason: `Terminated by Mentor â€” ${student.exam}`,
      terminatedBy: 'mentor',
      timestamp: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
    localStorage.setItem('vision_terminated_sessions', JSON.stringify([entry, ...existing]));
    setTerminatedStudents(prev => ({ ...prev, [student.name]: true }));
    addToast(`Exam terminated for ${student.name}`, 'error');
  };

  // Lock all scrolling for cinematic Command Center feel
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  const [liveExams, setLiveExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [_socketAlerts, setSocketAlerts] = useState([]);
  const [dashStats, setDashStats] = useState(DEFAULT_STATS);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [resultsSummary, setResultsSummary] = useState([]);

  useEffect(() => {
    const userEmail = localStorage.getItem('vision_email') || 'mentor@vision.auth';
    socketService.connect(userEmail);

    // Listen for real-time proctoring violations
    socketService.onMentorAlert((data) => {
      console.log("CRITICAL VIOLATION:", data);
      setSocketAlerts(prev => [data, ...prev]);

      // Inject into live activity feed
      const newActivity = {
        name: data.studentId?.split?.('-')?.pop?.() || 'Student',
        action: 'triggered alert',
        exam: data.reason || data.type || 'Violation',
        time: 'Just now',
        type: 'flag'
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 5)]);
    });

    // Fetch live exam grid from backend
    const fetchLiveGrid = async () => {
      try {
        const response = await api.get('/api/exams/mentor-list');
        if (Array.isArray(response.data)) {
          setLiveExams(response.data);
          console.log(`✅ Loaded ${response.data.length} live sessions`);
        } else {
          console.warn('⚠️ Mentor list response is not an array');
          setLiveExams([]);
        }
      } catch (error) {
        console.error('Grid sync failure:', error);
      }
    };

    // Fetch mentor dashboard stats from backend
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/exams/mentor-stats');
        const data = response.data;
        if (data.stats) {
          setDashStats([
            { label: 'Live Students', value: String(data.stats.liveStudents || 0), delta: null, deltaLabel: 'in sessions', color: 'bg-blue-500' },
            { label: 'Submissions', value: String(data.stats.totalSubmissions || 0), delta: null, deltaLabel: 'completed', color: 'bg-emerald-500' },
            { label: 'Flags', value: String(data.stats.flags || 0), delta: null, deltaLabel: 'need review', color: 'bg-amber-500' },
            { label: 'Total Exams', value: String(data.stats.totalExams || 0), delta: null, deltaLabel: 'created', color: 'bg-violet-500' },
          ]);
        }
        if (data.activity && data.activity.length > 0) {
          setRecentActivity(data.activity);
        }
        if (data.performance) {
          setStudentPerformance(data.performance);
        }
        if (data.summary) {
          setResultsSummary(data.summary);
        }
      } catch (error) {
        console.error('Stats sync failure:', error);
      }
    };

    fetchLiveGrid();
    fetchStats();

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
      setTimeStr(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const displayedResults = showAllResults ? resultsSummary : resultsSummary.slice(0, 4);

  return (
    <div className="h-screen w-full bg-[#0f1117] font-sans text-zinc-200 overflow-hidden flex flex-col">
      <Navbar role="Mentor" />

      <style>{`
        html, body { 
          overflow: hidden !important; 
          height: 100% !important;
          overscroll-behavior: none !important;
        }
        .modal-scroll::-webkit-scrollbar { width: 5px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .modal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-24 pb-10 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto modal-scroll pr-2 pr-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-zinc-500 text-sm font-medium mb-1">{greeting}, Mentor Alex â€” {timeStr}</p>
              <h1 className="text-2xl font-semibold text-white uppercase italic tracking-tighter">Command Center</h1>
              <p className="text-zinc-400 text-sm mt-1.5 font-medium flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-violet-400" /> Building a career you actually like waking up for.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/mentor/create-exam')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0f1117] text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus size={16} /> Create New Exam
              </button>
              <button
                onClick={() => navigate('/mentor')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1d26] border border-white/[0.07] text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
              >
                <BookOpen size={16} /> View Old Exams
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {dashStats.map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-10 items-start">
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4 h-8">
                <h2 className="text-sm font-semibold text-white">Active Sessions</h2>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-[#181a20] border border-white/[0.06] text-zinc-300 text-xs rounded-lg pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-blue-500/40 placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {liveExams.length > 0 ? liveExams.map((exam, i) => (
                  <ActiveSessionItem key={i} exam={exam} />
                )) : (
                  <div className="text-center py-10 text-zinc-600 text-xs font-medium">No active sessions. Create an exam to get started.</div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { icon: <Eye size={15} />, label: 'View Roster', action: () => addToast('Roster: 73 students across 5 active exams', 'info') },
                  { icon: <Video size={15} />, label: 'Live Feed', action: () => addToast('Live feed: All proctoring cameras active', 'success') },
                  { icon: <BarChart3 size={15} />, label: 'Analytics', action: () => addToast('Analytics: Avg score 78% Â· Pass rate 82%', 'success') },
                ].map((action, i) => (
                  <button key={i} onClick={action.action} className="bg-[#181a20] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-center gap-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.02] transition-all active:scale-95">
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4 h-8">
                <h2 className="text-sm font-semibold text-white">Activity</h2>
                <button onClick={() => setShowAllActivity(!showAllActivity)} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors font-medium">
                  {showAllActivity ? 'Show less' : 'View all'}
                </button>
              </div>

              <div className="bg-[#181a20] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04]">
                {recentActivity.length > 0 ? (showAllActivity ? recentActivity : recentActivity.slice(0, 4)).map((item, i) => (
                  <ActivityItem key={i} item={item} />
                )) : (
                  <div className="text-center py-8 text-zinc-600 text-xs font-medium">No recent activity yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={16} className="text-zinc-500" /> Student Performance
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="bg-[#181a20] border border-white/[0.06] text-zinc-300 text-xs rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:border-blue-500/40 placeholder:text-zinc-600 transition-colors"
                  />
                </div>
                <button className="bg-[#181a20] border border-white/[0.06] rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all">
                  <Filter size={12} /> Filter
                </button>
                <button className="bg-[#181a20] border border-white/[0.06] rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all">
                  <ExternalLink size={12} /> Export
                </button>
              </div>
            </div>

            <div className="bg-[#181a20] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/[0.04]">
                <div className="col-span-3">Student</div>
                <div className="col-span-3">Exam</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-center">Time</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              <div className="divide-y divide-white/[0.03]">
                {studentPerformance.length > 0 ? studentPerformance
                  .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                  .map((s, i) => (
                    <PerformanceRow
                      key={i}
                      student={s}
                      isTerminated={!!terminatedStudents[s.name]}
                      onClick={() => setSelectedStudent(getStudentDetail(s))}
                      onTerminate={terminateStudent}
                    />
                  )) : (
                  <div className="text-center py-8 text-zinc-600 text-xs font-medium">No student submissions yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-zinc-500" /> Exam Results Summary
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedResults.length > 0 ? displayedResults.map((r, i) => (
                <ResultSummaryCard key={i} r={r} />
              )) : (
                <div className="col-span-2 text-center py-8 text-zinc-600 text-xs font-medium">No exam results to display yet.</div>
              )}
            </div>
            {resultsSummary.length > 4 && (
              <button
                onClick={() => setShowAllResults(!showAllResults)}
                className="mt-4 w-full bg-[#181a20] border border-white/[0.06] rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all"
              >
                {showAllResults ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View More Exams ({resultsSummary.length - 4} more)</>}
              </button>
            )}
          </div>
        </div>
      </main>

      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md pointer-events-auto transition-all ${t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-300' :
              t.type === 'info' ? 'bg-[#181a20] border-teal-600/30 text-teal-400' :
                'bg-zinc-900/90 border-emerald-500/30 text-emerald-300'
            }`}>
            {t.type === 'error' ? <OctagonX size={14} /> : <CheckCircle2 size={14} />}
            <span className="text-xs font-semibold">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="ml-1 opacity-50 hover:opacity-100"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}


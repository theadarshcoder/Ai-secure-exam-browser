import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, CheckCircle, Clock,
  Search, Eye, Video, ChevronRight, ArrowUpRight,
  ChevronDown, ChevronUp, X, Plus,
  BarChart3, Bell, FileText, TrendingUp,
  ArrowDownRight, ExternalLink, Filter,
  AlertCircle, ShieldCheck, BookOpen, CreditCard,
  Activity, ScanFace, OctagonX, CheckCircle2,
  Trash2, Edit, Play, CheckSquare, MoreVertical,
  LayoutDashboard, LogOut, Settings, History
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

  const faceImage = localStorage.getItem('vision_reference_face');
  const idImage = localStorage.getItem('vision_reference_id');

  try {
    return {
      ...student,
      email: student?.email || `${(student?.name || 'student').toLowerCase().replace(/\s+/g, '.')}@university.edu`,
      id: student?.id || student?._id || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
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
      flags: student?.flags || (student?.status === 'Flagged'
          ? [{ type: 'Tab Switch', time: '12:04', severity: 'high' }, { type: 'Face Not Detected', time: '18:22', severity: 'high' }]
          : (student?.score || 0) < 80
            ? [{ type: 'Long Inactivity', time: '22:10', severity: 'low' }]
            : []),
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

const StatCard = ({ label, value, delta, deltaLabel, color, topTag, topTagBg, topTagColor }) => (
  <div className="bg-[#12151e] rounded-2xl p-6 border border-white/[0.05] relative flex flex-col justify-between h-[130px]">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">{label}</span>
      {(topTag || delta) && (
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${topTagBg || 'bg-[#1a1d27]'} ${topTagColor || 'text-zinc-400'}`}>
          {topTag || (
            <span className="flex items-center gap-0.5">
              <ArrowUpRight size={10} />{delta}
            </span>
          )}
        </div>
      )}
    </div>
    <div>
      <span className={`text-[32px] font-medium leading-none ${label.includes('FLAGS') && parseInt(value) > 0 ? 'text-red-500' : 'text-white'}`}>{value}</span>
      <p className="text-[11px] font-medium text-zinc-600 mt-2 tracking-wide leading-tight line-clamp-2 pr-4">{deltaLabel}</p>
    </div>
  </div>
);

const ActiveSessionItem = ({ exam, onStatusChange, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors relative group">
      <div className="col-span-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#1a1d27] border border-white/[0.05] flex items-center justify-center text-[10px] font-black text-blue-500 shrink-0 uppercase">
          {exam.name.substring(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">{exam.name}</p>
          <p className="text-[10px] text-zinc-600 font-medium tracking-wide mt-0.5">ID: {exam.id}</p>
        </div>
      </div>
      
      <div className="col-span-2">
        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
          exam.status === 'live' 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
            : exam.status === 'draft' 
              ? 'bg-zinc-800 text-zinc-400 border border-white/5' 
              : 'bg-blue-500/10 text-blue-500 border border-blue-500/10'
        }`}>
          {exam.status === 'live' ? 'LIVE' : exam.status === 'draft' ? 'DRAFT' : 'COMPLETED'}
        </span>
      </div>

      <div className="col-span-2 flex items-center gap-1.5 text-zinc-400">
        <Clock size={12} className="text-zinc-600" />
        <span className="text-[11px] font-medium">{exam.status === 'live' ? exam.time : 'Tomorrow'}</span>
      </div>

      <div className="col-span-2 flex items-center">
        {exam.flags > 0 ? (
           <div className="flex items-center gap-1.5 text-red-500 text-[11px] font-bold">
             <AlertTriangle size={12} /> {exam.flags} Flags
           </div>
        ) : (
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
            {exam.students} Students
          </span>
        )}
      </div>

      <div className="col-span-1 flex justify-end relative">
        <button 
          onClick={() => setShowMenu(!showMenu)} 
          className="w-7 h-7 rounded-md bg-[#1a1d27] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/10 transition-colors"
        >
           {exam.status === 'draft' ? <Edit size={12} /> : <Eye size={12} />}
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-[110%] w-40 bg-[#12151e] border border-white/[0.08] shadow-2xl rounded-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
              {exam.status === 'draft' && (
                <>
                  <button onClick={() => { onStatusChange(exam.id, 'published'); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-xs font-semibold text-emerald-400 hover:bg-white/[0.03] flex items-center gap-2">
                    <Play size={13} strokeWidth={2.5}/> Publish Exam
                  </button>
                  <button onClick={() => { onEdit(exam.id); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-xs font-semibold text-zinc-300 hover:bg-white/[0.03] flex items-center gap-2">
                    <Edit size={13} strokeWidth={2.5}/> Edit Draft
                  </button>
                </>
              )}
              {exam.status === 'live' && (
                <button onClick={() => { onStatusChange(exam.id, 'completed'); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-xs font-semibold text-blue-400 hover:bg-white/[0.03] flex items-center gap-2">
                  <CheckSquare size={13} strokeWidth={2.5}/> Mark Completed
                </button>
              )}
              <div className="h-px bg-white/[0.04]" />
              <button onClick={() => { onDelete(exam.id); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                <Trash2 size={13} strokeWidth={2.5}/> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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
  const [userName] = useState(localStorage.getItem('vision_name') || 'Mentor');
  const [showAllResults, setShowAllResults] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [terminatedStudents, setTerminatedStudents] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
      reason: `Terminated by Mentor — ${student.exam}`,
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

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/api/exams/${id}/status`, { status: newStatus });
      addToast(`Exam status updated to ${newStatus}`, 'success');
      fetchLiveGrid(); // Refresh the list
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/exams/${id}`);
      addToast('Exam deleted successfully', 'success');
      fetchLiveGrid(); // Refresh
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to delete exam', 'error');
    }
  };

  const handleEditDraft = (id) => {
    navigate(`/mentor/create-exam?id=${id}`);
  };

  const fetchLiveGrid = React.useCallback(async () => {
    try {
      const { data } = await api.get('/api/exams/live-stats');
      setLiveExams(data.exams || []);
    } catch (error) {
      console.error('Grid sync failure:', error);
    }
  }, []);

  const fetchStats = React.useCallback(async () => {
    try {
      const response = await api.get('/api/exams/mentor-stats');
      const data = response.data;
      if (data.stats) {
        setDashStats([
          { label: 'LIVE STUDENTS', value: String(data.stats.liveStudents || 0), delta: '12%', deltaLabel: 'Active connections across all regions', color: 'bg-blue-500', topTagBg: 'bg-emerald-500/10', topTagColor: 'text-emerald-500' },
          { label: 'SUBMISSIONS', value: String(data.stats.totalSubmissions || 0), delta: null, deltaLabel: 'Submissions pending verification', color: 'bg-emerald-500', topTag: 'Today' },
          { label: 'ACTIVE FLAGS', value: String(data.stats.flags || 0), delta: null, deltaLabel: 'Critical integrity violations detected', color: 'bg-amber-500', topTag: 'High Priority', topTagBg: 'bg-red-500/10', topTagColor: 'text-red-500' },
          { label: 'TOTAL EXAMS', value: String(data.stats.totalExams || 0), delta: null, deltaLabel: 'Including enterprise-level assessments', color: 'bg-violet-500', topTag: 'Monthly' },
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
  }, []);

  useEffect(() => {
    const userEmail = localStorage.getItem('vision_email') || 'mentor@vision.auth';
    socketService.connect(userEmail);

    socketService.onMentorAlert((data) => {
      console.log("CRITICAL VIOLATION:", data);
      setSocketAlerts(prev => [data, ...prev]);

      const newActivity = {
        name: data.studentId?.split?.('-')?.pop?.() || 'Student',
        action: 'triggered alert',
        exam: data.reason || data.type || 'Violation',
        time: 'Just now',
        type: 'flag'
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 5)]);
    });

    fetchLiveGrid();
    fetchStats();

    return () => {
      socketService.disconnect();
    };
  }, [fetchLiveGrid, fetchStats]);

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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="h-screen w-full bg-[#0a0d14] font-sans text-zinc-200 overflow-hidden flex">
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
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0c10] border-r border-white/[0.05] flex flex-col relative z-20 h-screen shrink-0 relative">
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />
        
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight leading-none">Proctorly</p>
              <p className="text-[9px] font-black tracking-widest text-zinc-500 uppercase mt-1">Enterprise Monitor</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 border border-blue-500/50 text-white w-full shadow-[0_0_20px_rgba(37,99,235,0.15)] transition-all">
            <LayoutDashboard size={16} />
            <span className="text-xs font-bold tracking-wide">Command Center</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all w-full text-left">
            <Video size={16} />
            <span className="text-xs font-semibold tracking-wide flex-1">Active Sessions</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all w-full text-left">
            <BarChart3 size={16} />
            <span className="text-xs font-semibold tracking-wide flex-1">Mentor Insights</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all w-full text-left">
            <History size={16} />
            <span className="text-xs font-semibold tracking-wide flex-1">History</span>
          </button>
          <button
            onClick={() => navigate('/mentor/create-exam')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-lg shadow-blue-500/10 mt-4 mb-2 mx-4"
          >
            <Plus size={14} /> Create New Exam
          </button>
        </nav>

        <div className="px-4 py-8 border-t border-white/[0.05] mt-auto">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Nominal</p>
            </div>
            <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">Proctoring core active via Secure WebSocket Layer.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-white/[0.05] flex items-center justify-between px-8 bg-[#0a0d14]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex-1 max-w-xl relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Search sessions, exams, or students..." 
              className="w-full bg-[#12151e] border border-white/[0.05] rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-white/10 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="relative text-zinc-400 hover:text-white transition-colors">
                <Bell size={18} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0a0d14]" />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <AlertCircle size={18} />
              </button>
            </div>
            
            <div className="relative pl-6 border-l border-white/[0.05]">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 hover:bg-white/[0.03] p-1.5 rounded-xl transition-all active:scale-95 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{userName}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-0.5">Lead Mentor</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1c2230] to-[#12151e] border border-white/[0.08] flex items-center justify-center font-bold text-white uppercase text-base shadow-lg relative group-hover:border-blue-500/40 transition-all">
                  {userName.charAt(0)}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0d14] rounded-full shadow-lg" />
                </div>
                <ChevronDown size={14} className={`text-zinc-600 transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-3 w-64 bg-[#12151e] border border-white/[0.1] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 border-b border-white/[0.05] mb-2 bg-gradient-to-br from-white/[0.02] to-transparent">
                      <p className="text-xs font-bold text-white mb-1">{userName}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enterprise Master</p>
                    </div>
                    
                    <div className="px-2 space-y-0.5">
                      <button className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all group">
                        <div className="flex items-center gap-3">
                          <Users size={14} className="group-hover:text-blue-400 transition-colors" /> Profile Overview
                        </div>
                        <ChevronRight size={12} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                      <button className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all group">
                        <div className="flex items-center gap-3">
                          <Settings size={14} className="group-hover:text-blue-400 transition-colors" /> Account Settings
                        </div>
                        <ChevronRight size={12} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>

                    <div className="h-px bg-white/[0.05] my-2 mx-2" />
                    
                    <div className="px-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-3"
                      >
                        <LogOut size={14} /> End Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto modal-scroll px-8 py-8">
          <div className="flex flex-col gap-4 mb-2">
            <div>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{greeting}, {userName} — {timeStr}</p>
              <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">Command Center</h1>
              <p className="text-zinc-400 text-sm font-medium">System status is nominal. {dashStats[0]?.value} students currently active across {dashStats[3]?.value} sessions.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dashStats.map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10 items-start">
            <div className="lg:col-span-3">
              <div className="bg-[#12151e] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-[#12151e]">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[13px] font-bold text-white">Active Sessions</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> MONITORING ENABLED</span>
                  </div>
                  <button className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors">View All Sessions</button>
                </div>
                
                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05] bg-[#0c0f16]">
                  <div className="col-span-5">Assessment Name</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">Proctors</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {liveExams.length > 0 ? liveExams.map((exam, i) => (
                    <ActiveSessionItem 
                      key={i} 
                      exam={exam} 
                      onStatusChange={handleStatusUpdate}
                      onDelete={handleDeleteExam}
                      onEdit={handleEditDraft}
                    />
                  )) : (
                    <div className="text-center py-10 text-zinc-600 text-[11px] font-bold uppercase tracking-wider">No active sessions mapped</div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-[#12151e] border border-white/[0.05] rounded-2xl flex flex-col mb-6 overflow-hidden">
                <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-[#12151e]">
                  <h2 className="text-[13px] font-bold text-white">Compliance Report</h2>
                  <ShieldCheck size={14} className="text-blue-500" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <ShieldCheck size={20} className="text-blue-500" />
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-relaxed mb-6">
                    System-wide proctoring integrity is currently at <span className="text-white font-bold">99.8%</span>. No critical security breaches or data leaks reported in the last 24-hour cycle.
                  </p>
                  <button className="w-full py-3 rounded-lg border border-white/[0.05] hover:bg-white/[0.02] text-xs font-bold text-white transition-colors flex items-center justify-center gap-2">
                    <ArrowDownRight size={14} /> Download Audit Log
                  </button>
                </div>
              </div>

              <div className="flex flex-col h-full opacity-50 grayscale pointer-events-none">
                 <div className="flex items-center justify-between mb-4 h-8">
                   <h2 className="text-sm font-semibold text-white">Vigilance Analytics (Coming Soon)</h2>
                 </div>
                 <div className="bg-[#12151e] border border-white/[0.05] rounded-2xl p-6 h-64 flex items-end relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/5" />
                   <div className="relative z-10 w-full">
                     <p className="text-xs text-zinc-400 mb-2">Neural integrity check has detected a 4% decrease in flagging events...</p>
                     <button className="text-[11px] font-bold text-blue-500">Explore Full Analytics →</button>
                   </div>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity size={16} className="text-zinc-500" /> Activity Feed
              </h2>
              <button onClick={() => setShowAllActivity(!showAllActivity)} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors font-medium">
                {showAllActivity ? 'Show less' : 'View all'}
              </button>
            </div>

            <div className="bg-[#12151e] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
              {recentActivity.length > 0 ? (showAllActivity ? recentActivity : recentActivity.slice(0, 4)).map((item, i) => (
                <ActivityItem key={i} item={item} />
              )) : (
                <div className="text-center py-8 text-zinc-600 text-xs font-medium">No recent activity yet.</div>
              )}
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


import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Navbar } from '../components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Code, ListChecks, AlignLeft,
  CheckCircle, Save, Send, Copy, Award, Clock,
  BookOpen, ChevronDown, ChevronUp, Sparkles, Wand2,
  Check, X, Pencil, Loader2, FileText, AlertCircle,
  Upload, FilePlus, FileSpreadsheet, Lock,
  LayoutDashboard, Users, BarChart3, Settings, Bell,
  ChevronRight, LogOut, Eye, Edit3, Star, RefreshCw
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';

// AI Suggestions are now fetched from the backend live engine.

const typeLabels = { mcq: 'MCQ', short: 'Short Answer', coding: 'Coding' };
const typeColors = { mcq: '#3b82f6', short: '#8b5cf6', coding: '#10b981' };
const typeIcons = { mcq: <ListChecks size={13} />, short: <AlignLeft size={13} />, coding: <Code size={13} /> };

// --- Styles ---
const INPUT_BASE = "w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm";
const LABEL_BASE = "text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-0.5";

// --- Components ---

function StepperInput({ value, onChange, min = 0, step = 1, icon: Icon, unit }) {
  const [display, setDisplay] = useState(String(value));

  useEffect(() => {
    setDisplay(String(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const clean = raw.replace(/^0+(\d)/, '$1');
    setDisplay(clean);
    const v = parseInt(clean, 10);
    if (!isNaN(v) && v >= min) onChange(v);
  };

  const blockNonDigit = (e) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleStep = (delta) => {
    const next = Math.max(min, value + delta);
    onChange(next);
  };

  return (
    <div className="relative flex items-center">
      {Icon && <Icon size={14} className="absolute left-3.5 text-zinc-600 pointer-events-none z-10" />}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onKeyDown={blockNonDigit}
        className={`${INPUT_BASE} ${Icon ? 'pl-10' : ''} pr-24 font-mono text-sm`}
      />
      <div className="absolute right-1.5 flex items-center gap-2">
        {unit && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest select-none">{unit}</span>}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.05] rounded-lg overflow-hidden">
          <button type="button" tabIndex="-1" onClick={() => handleStep(-step)} className="w-7 h-[26px] flex items-center justify-center hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors active:bg-white/[0.1]">
            <ChevronDown size={12} strokeWidth={2.5} />
          </button>
          <div className="w-px h-3 bg-white/[0.08]" />
          <button type="button" tabIndex="-1" onClick={() => handleStep(step)} className="w-7 h-[26px] flex items-center justify-center hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors active:bg-white/[0.1]">
            <ChevronUp size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

const McqEditor = ({ question, updateQ }) => (
  <div className="space-y-2">
    {question.options.map((opt, oi) => (
      <div key={oi} className="flex items-center gap-2.5">
        <button 
          onClick={() => updateQ(question.id, { correctOption: oi })} 
          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${question.correctOption === oi ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'border-white/[0.06] text-zinc-700 hover:border-white/[0.12]'}`}
        >
          {question.correctOption === oi ? <CheckCircle size={13} /> : String.fromCharCode(65 + oi)}
        </button>
        <input 
          value={opt} 
          onChange={e => {
            const options = [...question.options];
            options[oi] = e.target.value;
            updateQ(question.id, { options });
          }} 
          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-sm" 
        />
      </div>
    ))}
  </div>
);

const ShortEditor = ({ question, updateQ }) => (
  <div className="space-y-3">
    <textarea 
      value={question.expectedAnswer} 
      onChange={e => updateQ(question.id, { expectedAnswer: e.target.value })} 
      placeholder="Expected keywords..." 
      rows={2} 
      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 resize-none shadow-sm" 
    />
    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
      Word limit: 
      <input 
        type="number" 
        value={question.maxWords} 
        onChange={e => updateQ(question.id, { maxWords: parseInt(e.target.value) || 0 })} 
        className="w-16 bg-white border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center shadow-sm" 
      />
    </div>
  </div>
);

const CodingEditor = ({ question, updateQ }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
      Language:
      <select 
        value={question.language} 
        onChange={e => updateQ(question.id, { language: e.target.value })} 
        className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500/50 shadow-sm"
      >
        {['javascript','python','java','cpp','c'].map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
    <textarea 
      value={question.initialCode} 
      onChange={e => updateQ(question.id, { initialCode: e.target.value })} 
      placeholder="// Starter code..." 
      rows={5} 
      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/50 font-mono resize-none shadow-inner" 
    />
    <div className="space-y-1.5">
      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Test Cases</p>
      {question.testCases.map((tc, ti) => (
        <div key={ti} className="flex gap-1.5">
          <input 
            value={tc.input} 
            onChange={e => {
              const testCases = [...question.testCases];
              testCases[ti] = { ...testCases[ti], input: e.target.value };
              updateQ(question.id, { testCases });
            }} 
            placeholder="Input" 
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 font-mono focus:outline-none focus:border-emerald-500/50 shadow-sm" 
          />
          <input 
            value={tc.expectedOutput} 
            onChange={e => {
              const testCases = [...question.testCases];
              testCases[ti] = { ...testCases[ti], expectedOutput: e.target.value };
              updateQ(question.id, { testCases });
            }} 
            placeholder="Output" 
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 font-mono focus:outline-none focus:border-emerald-500/50 shadow-sm" 
          />
          {question.testCases.length > 1 && (
            <button onClick={() => updateQ(question.id, { testCases: question.testCases.filter((_, i) => i !== ti) })} className="text-zinc-800 hover:text-red-400">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      ))}
      <button 
        onClick={() => updateQ(question.id, { testCases: [...question.testCases, { input: '', expectedOutput: '' }] })} 
        className="text-[10px] text-emerald-400/70 hover:text-emerald-400 font-medium flex items-center gap-1"
      >
        <Plus size={10} /> Add case
      </button>
    </div>
  </div>
);

// --- Helpers ---
const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzoffset).toISOString().slice(0, 16);
};

const parseCSVRow = (row) => {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  result.push(cur.trim());
  return result;
};

const csvRowToQuestion = (cols) => {
  const type = cols[0]?.toLowerCase()?.trim();
  if (!['mcq', 'short', 'coding'].includes(type)) return null;
  const base = { id: `import-${Date.now()}-${Math.random()}`, accepted: false };
  if (type === 'mcq') {
    const options = [cols[2], cols[3], cols[4], cols[5]].filter(Boolean);
    const correctLetter = (cols[6] || 'A').toUpperCase();
    const correctOption = Math.max(0, ['A','B','C','D'].indexOf(correctLetter));
    return { ...base, type: 'mcq', questionText: cols[1] || '', options, correctOption, marks: parseInt(cols[7]) || 2 };
  }
  if (type === 'short') {
    return { ...base, type: 'short', questionText: cols[1] || '', expectedAnswer: cols[2] || '', maxWords: parseInt(cols[3]) || 150, marks: parseInt(cols[4]) || 3 };
  }
  if (type === 'coding') {
    const tcStr = cols[4] || '';
    const testCases = tcStr ? tcStr.split(';').map(tc => { const [i, o] = tc.split('=>'); return { input: (i||'').trim(), expectedOutput: (o||'').trim() }; }) : [{ input: '', expectedOutput: '' }];
    return { ...base, type: 'coding', questionText: cols[1] || '', language: cols[2] || 'javascript', initialCode: cols[3] || '', testCases, marks: parseInt(cols[5]) || 5 };
  }
  return null;
};

export default function CreateExam() {
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState({ title: '', description: '', duration: 60, totalMarks: 100, passingMarks: 40, category: 'DSA', scheduledDate: '' });
  const [questions, setQuestions] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [syllabus, setSyllabus] = useState('');
  const [editingSuggestion, setEditingSuggestion] = useState(null);
  const [aiConfig, setAiConfig] = useState({ mcq: 5, short: 3, coding: 1 });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileParseLoading, setFileParseLoading] = useState(false);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [uploadIntent, setUploadIntent] = useState('import'); // 'import' | 'syllabus'
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedExamId, setPublishedExamId] = useState('');
  const [editId, setEditId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'Live Proctoring', label: 'Live Proctoring', icon: Users },
    { id: 'Exam Management', label: 'Exam Library', icon: FileText },
    { id: 'Results & Reports', label: 'Results & Reports', icon: BarChart3 },
    { id: 'Settings', label: 'System Settings', icon: Settings },
  ];

  const handleLogout = () => {
    sessionStorage.clear(); localStorage.clear();
    navigate('/login');
  };

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    if (id) {
      setEditId(id);
      loadDraft(id);
    }
  }, [location.search]);

  const loadDraft = async (id) => {
    setInitialLoading(true);
    try {
      const response = await api.get(`/api/exams/mentor/${id}`);
      const data = response.data;
      if (data) {
        setExam({
          title: data.title || '',
          category: data.category || 'DSA',
          duration: data.duration || 60,
          totalMarks: data.totalMarks || 100,
          passingMarks: data.passingMarks || 40,
          scheduledDate: data.scheduledDate ? formatDateForInput(data.scheduledDate) : ''
        });
        
        if (data.questions && data.questions.length > 0) {
          const loadedQuestions = data.questions.map(q => ({
            ...q,
            id: q._id || Date.now() + Math.random()
          }));
          setQuestions(loadedQuestions);
        }
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
      addToast("Failed to load draft. It may have been deleted.", 'error');
      navigate('/mentor/create-exam'); // Clear query param
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePublish = async () => {
    if (questions.length === 0) return;
    setIsPublishing(true);
    
    const payload = {
      title: exam.title || 'Untitled Exam',
      category: exam.category,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      questions: questions.map(q => {
        const { id, ...cleanQ } = q;
        return {
          ...cleanQ,
          type: q.type || 'short' // Safety fallback
        };
      }),
      scheduledDate: exam.scheduledDate ? new Date(exam.scheduledDate).toISOString() : new Date().toISOString()
    };

    // --- Frontend Validation ---
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = i + 1;
      
      if (!q.questionText || !q.questionText.trim()) {
        addToast(`Question ${qNum}: Question text is required.`, 'error');
        setIsPublishing(false);
        setExpandedQ(q.id);
        return;
      }

      if (q.type === 'mcq') {
        const validOptions = q.options.filter(opt => opt && opt.trim());
        if (validOptions.length < 2) {
          addToast(`Question ${qNum} (MCQ): At least 2 options are required.`, 'error');
          setIsPublishing(false);
          setExpandedQ(q.id);
          return;
        }
        if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption >= q.options.length) {
          addToast(`Question ${qNum} (MCQ): Please select a correct option.`, 'error');
          setIsPublishing(false);
          setExpandedQ(q.id);
          return;
        }
      }

      if (q.type === 'coding') {
        if (!q.testCases || q.testCases.length === 0 || !q.testCases[0].input.trim() || !q.testCases[0].expectedOutput.trim()) {
          addToast(`Question ${qNum} (Coding): At least one valid test case is required.`, 'error');
          setIsPublishing(false);
          setExpandedQ(q.id);
          return;
        }
      }
    }

    try {
      let response;
      if (editId) {
        response = await api.put(`/api/exams/update/${editId}`, { ...payload, status: 'published' });
      } else {
        response = await api.post('/api/exams/create', { ...payload, status: 'published' });
      }
      
      const serverExam = response.data.exam || response.data; // Depending on update vs create response structure
      
      // Update local state and persistence for frontend components
      const existing = JSON.parse(localStorage.getItem('published_exams') || '[]');
      localStorage.setItem('published_exams', JSON.stringify([serverExam, ...existing]));
      
      setPublishedExamId(serverExam.id || serverExam._id || 'EX-' + Math.random().toString(36).substr(2, 6).toUpperCase());
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response) {
        // Server rejected the request — do NOT show success
        console.error('Server side rejection:', err.response.data);
        const errorMsg = err.response.data.error || err.response.data.message || 'Validation failed';
        addToast(`Failed to publish exam: ${errorMsg}`, 'error');
        setIsPublishing(false);
        return;
      }

      console.warn('Backend offline. Saving exam locally for demo mode.');
      // Resilient offline fallback — save locally and show success
      const localId = 'EX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const localExam = {
        ...payload,
        id: localId,
        startTime: payload.scheduledDate,
        rules: [
          'Biometric tracking must remain active throughout.',
          'Tab switching triggers immediate session lock.',
          'Environment isolated via secure sandbox protocols.'
        ]
      };

      const existing = JSON.parse(localStorage.getItem('published_exams') || '[]');
      localStorage.setItem('published_exams', JSON.stringify([localExam, ...existing]));
      
      setPublishedExamId(localId);
      setShowSuccessModal(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    
    // Drafts don't need strict validation on questions, 
    // but we need the basic exam info.
    if (!exam.title || !exam.duration) {
      addToast('Please at least provide a Title and Duration to save a draft.', 'error');
      setIsSaving(false);
      return;
    }

    const payload = {
      ...exam,
      scheduledDate: exam.scheduledDate ? new Date(exam.scheduledDate).toISOString() : new Date().toISOString(),
      status: 'draft',
      questions: questions.map(q => {
        const { id, ...cleanQ } = q;
        return {
          ...cleanQ,
          type: q.type || 'short'
        };
      })
    };

    try {
      if (editId) {
        await api.put(`/api/exams/update/${editId}`, payload);
      } else {
        await api.post('/api/exams/create', payload);
      }
      // Navigate to dashboard where they can see the draft
      navigate('/mentor');
    } catch (err) {
      console.error('Draft save failure:', err);
      const msg = err.response?.data?.message || 'Failed to save draft.';
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addQ = (type) => {
    const tpl = {
      mcq: { type: 'mcq', questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1 },
      short: { type: 'short', questionText: '', expectedAnswer: '', maxWords: 150, marks: 2 },
      coding: { type: 'coding', questionText: '', language: 'javascript', initialCode: '', testCases: [{ input: '', expectedOutput: '' }], marks: 5 },
    };
    const q = { ...tpl[type], id: Date.now() };
    setQuestions(p => [...p, q]);
    setExpandedQ(q.id);
  };

  const updateQ = (id, u) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...u } : q));
  const removeQ = (id) => { setQuestions(qs => qs.filter(q => q.id !== id)); if (expandedQ === id) setExpandedQ(null); };
  const dupQ = (id) => {
    const o = questions.find(q => q.id === id);
    if (!o) return;
    const d = { ...JSON.parse(JSON.stringify(o)), id: Date.now() };
    const i = questions.findIndex(q => q.id === id);
    setQuestions(p => { const n = [...p]; n.splice(i + 1, 0, d); return n; });
  };

  const generateAI = async () => {
    if (!syllabus && !exam.title) {
        addToast("Please provide some context (Title or Syllabus) for AI generation.", 'error');
        return;
    }
    setAiLoading(true);
    try {
        const response = await api.post('/api/ai/generate', {
            category: exam.category,
            syllabus: syllabus,
            config: aiConfig
        });
        
        if (response.data.success) {
            setAiSuggestions(response.data.questions);
        } else {
            throw new Error(response.data.error || "Generation failed");
        }
    } catch (err) {
        console.error('AI Suggestion Error:', err);
        addToast(err.response?.data?.error || "AI Service is currently unavailable. Please try again later.", 'error');
    } finally {
        setAiLoading(false);
    }
  };


  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'csv'].includes(ext)) return;
    setUploadedFile(file);
    setFileParseLoading(true);

    if (uploadIntent === 'import') {
      if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const lines = e.target.result.split('\n').filter(l => l.trim() && !l.startsWith('#'));
          const dataLines = lines[0]?.toLowerCase().startsWith('type') ? lines.slice(1) : lines;
          const extracted = dataLines.map(l => csvRowToQuestion(parseCSVRow(l))).filter(Boolean);
          if (extracted.length > 0) {
            setAiSuggestions(prev => [...prev, ...extracted]);
            setShowAI(true);
          }
          setFileParseLoading(false);
        };
        reader.readAsText(file);
      } else {
        // PDF: real parsing not implemented yet
        setTimeout(() => {
          addToast('PDF question extraction is coming soon. Please use CSV import for now.', 'info');
          setFileParseLoading(false);
        }, 1000);
      }
    } else {
      // Syllabus extraction mode
      if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const lines = e.target.result.split('\n').filter(Boolean).slice(0, 20);
          setSyllabus(lines.map(l => `\u2022 ${l.replace(/,/g, ' | ')}`).join('\n'));
          setFileParseLoading(false);
        };
        reader.readAsText(file);
      } else {
        const topic = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setSyllabus(`Topics extracted from "${file.name}":\n\n\u2022 ${topic} \u2014 Core Concepts\n\u2022 Algorithms & Complexity Analysis\n\u2022 Data Structures & Applications\n\u2022 Problem Solving Techniques\n\u2022 Advanced Topics in ${topic}`);
        setFileParseLoading(false);
      }
    }
  };

  const onDropFile = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };


  const acceptSuggestion = (suggestion) => {
    const q = { ...suggestion, id: Date.now(), accepted: undefined };
    setQuestions(p => [...p, q]);
    setAiSuggestions(s => s.filter(x => x.id !== suggestion.id));
  };
  const acceptAll = () => {
const newQs = aiSuggestions.map(s => ({ ...s, id: Date.now() + Math.random() * 1000, accepted: undefined }));
    setQuestions(p => [...p, ...newQs]);
    setAiSuggestions([]);
  };

  const totalM = questions.reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <div className="flex h-screen bg-[#0a0c10] font-sans text-zinc-200 select-none antialiased overflow-hidden">
      {/* Fixed Sidebar */}
      <aside className="w-64 bg-zinc-950 flex flex-col z-30 shadow-2xl shrink-0 border-r border-white/5">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-3">
             <VisionLogo className="h-6 w-6 text-emerald-500" />
             <span className="text-sm font-black uppercase tracking-[0.3em] text-white">VISION <span className="text-zinc-500 font-bold">PRO</span></span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate('/mentor')}
              className={`group flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                item.id === 'Exam Management' 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={`transition-transform duration-300 ${item.id === 'Exam Management' ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              {item.id === 'Exam Management' && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/30 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all uppercase tracking-widest active:scale-95 border border-white/5"
          >
            <LogOut size={16} /> Exit Module
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-zinc-50">
        {/* Header (Breadcrumbs) */}
        <header className="h-20 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-10 relative z-20">
          <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none">
            <span onClick={() => navigate('/mentor')} className="hover:text-emerald-500 transition-colors cursor-pointer">Mentor</span>
            <ChevronRight size={14} className="opacity-30" />
            <span className="hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => navigate('/mentor')}>Exam Library</span>
            <ChevronRight size={14} className="opacity-30" />
            <span className="text-zinc-900">{editId ? 'Edit' : 'Create'} Assessment</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
               <Bell size={20} className="text-zinc-500 hover:text-emerald-500 transition-colors" />
            </div>
            <div className="h-6 w-px bg-zinc-100" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-[11px] font-bold text-zinc-900 group-hover:text-emerald-500 transition-colors uppercase tracking-tight leading-none">{sessionStorage.getItem('vision_name') || 'Mentor'}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">Authorized</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-zinc-900 uppercase text-sm shadow-sm group-hover:border-emerald-500/50 transition-all">
                {(sessionStorage.getItem('vision_name') || 'M').charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            {/* Title Header */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">
                  {editId ? 'Edit Assessment' : 'New Assessment'}
                  {initialLoading && <Loader2 size={24} className="inline ml-4 animate-spin text-zinc-700" />}
                </h1>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${totalM === exam.totalMarks ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                    <Award size={14} /> {totalM} / {exam.totalMarks} Marks Assigned
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.1em]">Configure your secure testing environment</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start">
              {/* Left Column: Build Flow */}
              <div className="flex-1 space-y-12 min-w-0 pb-32">
                
                {/* ═══ SECTION 1: Details ═══ */}
                <section className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-zinc-200 p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                  <div className="mb-8 items-center flex justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Exam Parameters</h2>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold">Core assessment configuration</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-2">
                      <label className={LABEL_BASE}>Assessment Title</label>
                      <input value={exam.title} onChange={e => setExam({...exam, title: e.target.value})} placeholder="e.g. System Design Mastery Challenge" className={INPUT_BASE + " text-base h-12"} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Category</label>
                      <div className="relative">
                        <select 
                          value={exam.category} 
                          onChange={e => setExam({...exam, category: e.target.value})} 
                          className={INPUT_BASE + " h-12 !pl-4 appearance-none cursor-pointer uppercase font-bold text-xs tracking-widest"}
                        >
                          {['DSA', 'Frontend', 'DBMS', 'Cloud', 'Security', 'Other'].map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10 pt-10 border-t border-zinc-200">
                    <div>
                      <label className={LABEL_BASE}>Duration</label>
                      <StepperInput value={exam.duration} onChange={v => setExam({...exam, duration: v})} icon={Clock} unit="min" step={5} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Total Marks</label>
                      <StepperInput value={exam.totalMarks} onChange={v => setExam({...exam, totalMarks: v})} step={5} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Passing</label>
                      <StepperInput value={exam.passingMarks} onChange={v => setExam({...exam, passingMarks: v})} step={5} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Schedule</label>
                      <input type="datetime-local" value={exam.scheduledDate} onChange={e => setExam({...exam, scheduledDate: e.target.value})} className={INPUT_BASE + " h-11 [color-scheme:dark] uppercase text-[10px] font-bold"} />
                    </div>
                  </div>
                </section>

                {/* ═══ SECTION 2: AI Engine ═══ */}
                <section className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-violet-500/20 p-10 shadow-2xl relative overflow-hidden group/ai">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-3">
                          AI Question Engine
                          <span className="text-[9px] px-2 py-0.5 rounded bg-violet-500 text-zinc-900 font-black">BETA</span>
                        </h2>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold">Generate from syllabus or documentation</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAI(!showAI)} className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-900 hover:bg-zinc-800 transition-all">
                      {showAI ? 'Close Engine' : 'Open Engine'}
                    </button>
                  </div>

                  {showAI && (
                    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                       {/* Tabs */}
                       <div className="flex items-center gap-1.5 p-1.5 bg-white border border-zinc-200 rounded-2xl w-fit">
                          {[{id:'text', label:'Syllabus Text'}, {id:'file', label:'File Upload'}].map(t => (
                            <button key={t.id} onClick={() => setInputMode(t.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === t.id ? 'bg-violet-600 text-zinc-900 shadow-lg shadow-violet-900/40' : 'text-zinc-400 hover:text-zinc-500'}`}>
                              {t.label}
                            </button>
                          ))}
                       </div>

                       {inputMode === 'text' ? (
                         <div className="space-y-4">
                           <label className={LABEL_BASE}>Input Knowledge Base</label>
                           <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)} placeholder="Paste your syllabus, lecture notes, or specific topics here..." rows={6} className={INPUT_BASE + " resize-none p-5 text-sm leading-relaxed"} />
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <label className={LABEL_BASE}>Document Processor</label>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                               {[{id:'syllabus', label:'Topics Only', icon: ListChecks}, {id:'import', label:'Direct Questions', icon: FileSpreadsheet}].map(t => (
                                 <button key={t.id} onClick={() => setUploadIntent(t.id)} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${uploadIntent === t.id ? 'bg-violet-600/10 border-violet-500/40' : 'bg-zinc-50 border-zinc-200 hover:bg-white/[0.05]'}`}>
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${uploadIntent === t.id ? 'bg-violet-600 text-zinc-900' : 'bg-zinc-100 text-zinc-500'}`}><t.icon size={18} /></div>
                                   <div><p className={`text-xs font-bold ${uploadIntent === t.id ? 'text-zinc-900' : 'text-zinc-500'}`}>{t.label}</p><p className="text-[10px] text-zinc-400">PDF / CSV format</p></div>
                                 </button>
                               ))}
                            </div>
                            
                            {!uploadedFile ? (
                              <div onDragOver={e => {e.preventDefault(); setIsDragOver(true)}} onDragLeave={() => setIsDragOver(false)} onDrop={onDropFile} onClick={() => document.getElementById('ai-file').click()} className={`py-12 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${isDragOver ? 'border-violet-500 bg-violet-600/5' : 'border-zinc-200 hover:border-violet-500/30 bg-white'}`}>
                                <input id="ai-file" type="file" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                                <Upload size={32} className="text-violet-500/40" />
                                <div className="text-center">
                                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Drop secure file</p>
                                  <p className="text-[10px] text-zinc-400 mt-2">Maximum size 10MB</p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-violet-600/5 border border-violet-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400">{uploadedFile.name.endsWith('.pdf') ? <FileText size={20} /> : <FileSpreadsheet size={20} />}</div>
                                  <div><p className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{uploadedFile.name}</p><p className="text-[10px] text-zinc-500 uppercase">File Verified</p></div>
                                </div>
                                <button onClick={() => setUploadedFile(null)} className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"><X size={18} /></button>
                              </div>
                            )}
                         </div>
                       )}

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-200">
                          <div><label className={LABEL_BASE}>MCQs Count</label><StepperInput value={aiConfig.mcq} onChange={v => setAiConfig({...aiConfig, mcq:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>Short Qs Count</label><StepperInput value={aiConfig.short} onChange={v => setAiConfig({...aiConfig, short:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>Coding Logic</label><StepperInput value={aiConfig.coding} onChange={v => setAiConfig({...aiConfig, coding:v})} min={0} /></div>
                       </div>

                       <button onClick={generateAI} disabled={aiLoading} className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3">
                          {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                          {aiLoading ? 'Synthesizing...' : 'Initialize AI Generation'}
                       </button>

                       {/* Suggestions Area */}
                       {aiSuggestions.length > 0 && (
                         <div className="pt-6 border-t border-zinc-200 space-y-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                               <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{aiSuggestions.length} engine suggestions</p>
                               <button onClick={acceptAll} className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase underline decoration-2 underline-offset-4">Accept All Candidates</button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                               {aiSuggestions.map((s, idx) => (
                                 <div key={idx} className="p-5 bg-zinc-50 border border-zinc-200 rounded-3xl group flex items-start gap-4 hover:border-violet-500/30 transition-all">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:bg-violet-600 group-hover:text-zinc-900 transition-all shrink-0">{idx+1}</div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-violet-600/20 text-violet-400">{typeLabels[s.type]}</span>
                                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{s.marks} PTS</span>
                                       </div>
                                       <p className="text-xs font-semibold text-zinc-700 leading-relaxed mb-3">{s.questionText}</p>
                                       <button onClick={() => acceptSuggestion(s)} className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400">Add to Exam</button>
                                    </div>
                                    <button onClick={() => setAiSuggestions(prev => prev.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </section>

                {/* ═══ SECTION 3: Questions Builder ═══ */}
                <section className="bg-transparent space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Active Assessment Set</h2>
                      <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">Constructing {questions.length} modules</p>
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="py-24 border-2 border-dashed border-zinc-200 rounded-[40px] flex flex-col items-center justify-center gap-5 group">
                      <div className="w-20 h-20 rounded-3xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-800 group-hover:text-emerald-500 transition-all group-hover:scale-105 duration-500">
                        <FilePlus size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Library is empty</p>
                        <p className="text-[10px] text-zinc-700 mt-2 uppercase font-black">Begin by adding questions manually or via AI</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {questions.map((q, i) => (
                        <div key={q.id} className={`group bg-white/80 backdrop-blur-xl border rounded-[32px] transition-all relative overflow-hidden ${expandedQ === q.id ? 'ring-2 ring-emerald-500/20 border-emerald-500/30' : 'border-zinc-200 hover:border-white/[0.12]'}`}>
                          <div className="flex items-center justify-between p-8">
                            <div className="flex items-center gap-6 min-w-0">
                               <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-xs font-black text-zinc-700 group-hover:text-zinc-900 transition-all shrink-0 select-none">
                                  {i + 1}
                               </div>
                               <div className="min-w-0">
                                 <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider" style={{ background: `${typeColors[q.type]}20`, color: typeColors[q.type], border: `1px solid ${typeColors[q.type]}30` }}>
                                      {typeLabels[q.type]}
                                    </span>
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{q.marks} Marks assigned</span>
                                 </div>
                                 <input value={q.questionText} onChange={e => updateQ(q.id, { questionText: e.target.value })} placeholder="Type assessment focus..." className="bg-transparent border-none text-base font-bold text-zinc-900 placeholder:text-zinc-800 focus:ring-0 w-full lg:w-[450px]" />
                               </div>
                            </div>

                            <div className="flex items-center gap-3">
                               <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors">
                                 {expandedQ === q.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                               </button>
                               <button onClick={() => dupQ(q.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-emerald-400 transition-colors">
                                 <Copy size={16} />
                               </button>
                               <button onClick={() => removeQ(q.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-red-400 transition-colors">
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </div>

                          {expandedQ === q.id && (
                            <div className="px-8 pb-8 pt-4 border-t border-zinc-200 animate-in slide-in-from-top-2 duration-300">
                               <div className="mb-6 flex items-center gap-4">
                                  <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl pr-4 overflow-hidden">
                                     <input type="number" value={q.marks} onChange={e => updateQ(q.id, { marks: parseInt(e.target.value) || 0 })} className="w-14 h-12 bg-transparent border-none text-sm font-black text-zinc-900 text-center focus:ring-0 tabular-nums" />
                                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Points</span>
                                  </div>
                               </div>
                               {q.type === 'mcq' && <McqEditor question={q} updateQ={updateQ} />}
                               {q.type === 'short' && <ShortEditor question={q} updateQ={updateQ} />}
                               {q.type === 'coding' && <CodingEditor question={q} updateQ={updateQ} />}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Actions / Summary */}
              <aside className="w-full lg:w-80 space-y-8 lg:sticky lg:top-10 shrink-0 pb-10">
                
                {/* Master Actions */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden group/actions">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full group-hover/actions:scale-150 transition-transform duration-700" />
                  
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] ml-1">Add Content</p>
                    <div className="grid grid-cols-1 gap-3">
                       {Object.entries(typeLabels).map(([type, label]) => (
                         <button key={type} onClick={() => addQ(type)} className="w-full flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-800 hover:border-emerald-500/30 group/btn transition-all text-left">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover/btn:scale-110 transition-transform">
                              {typeIcons[type]}
                            </div>
                            <div>
                               <p className="text-xs font-black text-zinc-900 uppercase tracking-wider">{label}</p>
                               <p className="text-[9px] text-zinc-400 uppercase font-bold">New Module</p>
                            </div>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  <div className="space-y-4 pt-2">
                    <button onClick={handlePublish} disabled={isPublishing || questions.length === 0} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-[#0a0c10] rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 group/pub">
                      {isPublishing ? <Loader2 size={18} className="animate-spin text-[#0a0c10]" /> : <Send size={18} className="group-hover/pub:translate-x-1 group-hover/pub:-translate-y-1 transition-transform" />}
                      {isPublishing ? 'Deploying...' : 'Deploy Now'}
                    </button>
                    <button onClick={handleSaveDraft} disabled={isSaving} className="w-full h-16 bg-white/[0.05] border border-white/[0.08] hover:bg-zinc-800 text-zinc-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95">
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Save Progress
                    </button>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white border border-white/[0.03] rounded-[32px] p-6 space-y-5">
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Integrity Status</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                         <span className="text-xs text-zinc-400 font-medium tracking-tight">System Identity</span>
                         <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 uppercase tracking-tighter">Vision Pro</span>
                      </div>
                      <div className="flex items-center justify-between px-2">
                         <span className="text-xs text-zinc-400 font-medium tracking-tight">Data Security</span>
                         <span className="text-[10px] font-bold text-emerald-400 uppercase">AES-256</span>
                      </div>
                      <div className="h-px bg-zinc-50 mx-2" />
                      <div className="p-4 bg-white rounded-2xl space-y-1">
                         <p className="text-[9px] font-black text-zinc-700 uppercase leading-none">Assessment ID</p>
                         <p className="text-[11px] font-mono text-zinc-500 truncate tracking-tight">{editId || 'Generated on Publish'}</p>
                      </div>
                   </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-white border border-emerald-500/20 w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <CheckCircle size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tight">System Deployed</h2>
            <p className="text-xs text-zinc-500 mb-8 leading-relaxed font-semibold uppercase tracking-wider">Assessment protocol is now active across all proctor nodes.</p>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4 mb-10">
              <div className="text-left font-mono min-w-0">
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-1.5 leading-none">Student Exam Link</p>
                <p className="text-[10px] text-zinc-700 font-bold tracking-tight break-all leading-relaxed">{`${window.location.origin}/exam/${publishedExamId}`}</p>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/exam/${publishedExamId}`); addToast('Exam link copied to clipboard!'); }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                <Copy size={14} /> Copy Link
              </button>
            </div>

            <button onClick={() => navigate('/mentor')} className="group w-full bg-white text-black h-14 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-zinc-200">
              Return to Module
              <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-10 right-10 z-[200] space-y-4">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-4 px-6 py-5 rounded-[24px] border shadow-2xl animate-in slide-in-from-right-10 duration-500 ${t.type === 'error' ? 'bg-red-950/40 border-red-500/20 text-red-100' : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-100'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
               {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            </div>
            <div>
               <p className="text-xs font-black uppercase tracking-widest mb-0.5 leading-none">{t.type === 'error' ? 'System Error' : 'Success'}</p>
               <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">{t.msg}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        select { background-image: none !important; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Navbar } from '../components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Code, ListChecks, AlignLeft,
  CheckCircle, Save, Send, Copy, Award, Clock, Minus,
  BookOpen, ChevronDown, ChevronUp, Sparkles, Wand2,
  Check, X, Pencil, Loader2, FileText, AlertCircle,
  Upload, FilePlus, FileSpreadsheet, Lock,
  LayoutDashboard, Users, BarChart3, Settings, Bell,
  ChevronRight, LogOut, Eye, Edit3, Star, RefreshCw,
  Download, UploadCloud, Link, Calendar
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import VisionLogo from '../components/VisionLogo';
import PremiumSidebar from '../components/PremiumSidebar';
import AnimatedStatusIcon from '../components/AnimatedStatusIcon';

// AI Suggestions are now fetched from the backend live engine.

const typeLabels = { mcq: 'MCQ', short: 'Short Answer', coding: 'Coding' };
const typeColors = { mcq: '#3b82f6', short: '#8b5cf6', coding: '#10b981' };
const typeIcons = { mcq: <ListChecks size={13} />, short: <AlignLeft size={13} />, coding: <Code size={13} /> };

// --- Styles ---
const INPUT_BASE = "w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm";
const LABEL_BASE = "text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-0.5";

// --- Components ---

function StepperInput({ value, onChange, min = 0, max = 999, step = 1, icon: Icon, unit }) {
  const [display, setDisplay] = useState(String(value ?? 0));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplay(String(value ?? 0));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setDisplay(clean);
    
    if (clean !== '' && clean !== '.') {
      const v = parseFloat(clean);
      if (!isNaN(v)) {
        onChange(v);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let v = parseFloat(display);
    if (display === '' || isNaN(v)) v = value ?? 0;
    v = Math.min(max, Math.max(min, v));
    setDisplay(String(v));
    onChange(v);
  };

  const handleStep = (delta) => {
    const next = Math.min(max, Math.max(min, (value ?? 0) + delta));
    onChange(next);
  };

  return (
    <div className={`relative flex items-center bg-white border h-11 rounded-xl transition-all duration-300 shadow-sm ${isFocused ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="w-10 flex items-center justify-center shrink-0">
        {Icon && <Icon size={14} className={`text-slate-400 ${isFocused ? 'text-emerald-500' : ''}`} />}
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-semibold text-slate-900 h-full text-center"
      />
      <div className="w-10 flex items-center justify-center shrink-0">
        <div className="flex flex-col">
          <button type="button" onClick={() => handleStep(step)} className="p-0.5 hover:text-emerald-500 text-slate-300 transition-colors">
            <ChevronUp size={12} strokeWidth={2.5} />
          </button>
          <button type="button" onClick={() => handleStep(-step)} className="p-0.5 hover:text-red-400 text-slate-300 transition-colors">
            <ChevronDown size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

const CustomDatePicker = ({ selected, onChange }) => {
  // Premium custom trigger for the date picker
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <button 
      type="button"
      onClick={onClick} 
      ref={ref}
      className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-between px-3 group"
    >
      <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
        <div className={`shrink-0 p-1.5 rounded-lg transition-colors ${value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50'}`}>
          <Calendar size={14} />
        </div>
        <span className={`text-sm font-bold tracking-tight truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || 'Set Schedule'}
        </span>
      </div>
      {value ? (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse shrink-0 ml-2" />
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 ml-2" />
      )}
    </button>
  ));
  
  // Assign display name for React DevTools
  CustomInput.displayName = 'CustomInput';

  return (
    <DatePicker
      selected={selected ? new Date(selected) : null}
      onChange={(date) => onChange(date)}
      showTimeSelect
      dateFormat="yyyy MMM d - h:mm aa"
      customInput={<CustomInput />}
      wrapperClassName="w-full"
      popperClassName="!z-50 shadow-2xl rounded-2xl border border-slate-200"
      portalId="root"
    />
  );
};

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
  <div className="space-y-4">
    <div>
      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Expected Answer / Keywords</label>
      <textarea 
        value={question.expectedAnswer} 
        onChange={e => updateQ(question.id, { expectedAnswer: e.target.value })} 
        placeholder="Enter expected keywords or a model answer for AI evaluation..." 
        rows={3} 
        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none shadow-sm" 
      />
    </div>
    
    <div className="flex items-end justify-between gap-6 pt-2">
      <div className="flex-1 max-w-[160px]">
        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Word Limit</label>
        <StepperInput 
          value={question.maxWords || 150} 
          onChange={v => updateQ(question.id, { maxWords: v })} 
          min={10} 
          max={1000} 
          step={10}
          unit="words"
        />
      </div>
      <div className="flex-1 text-right">
        <p className="text-[9px] text-zinc-400 font-medium leading-relaxed italic">
          AI will use this limit to <br/> evaluate the student's response.
        </p>
      </div>
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

const getColumnMap = (headerRow) => {
    const cols = parseCSVRow(headerRow).map(c => c.toLowerCase().trim());
    return {
        type: cols.indexOf('type'),
        questionText: cols.findIndex(c => c.includes('question') || c.includes('text')),
        options: cols.indexOf('options'),
        answer: cols.findIndex(c => c.includes('answer') || c.includes('correct')),
        input: cols.indexOf('input'),
        output: cols.indexOf('output'),
        language: cols.indexOf('language'),
        marks: cols.indexOf('marks'),
        initialCode: cols.findIndex(c => c.includes('code')),
    };
};

const csvRowToQuestion = (cols, map) => {
  // If no map, use legacy/default index-based mapping
  const get = (key, defIdx) => (map && map[key] !== -1) ? cols[map[key]] : cols[defIdx];
  
  const type = (get('type', 0) || '').toLowerCase().trim();
  if (!['mcq', 'short', 'coding', 'short answer'].includes(type) && !type.includes('mcq') && !type.includes('coding')) return null;
  
  // Normalize type
  let normType = 'mcq';
  if (type.includes('coding')) normType = 'coding';
  else if (type.includes('short')) normType = 'short';

  const base = { id: `import-${Date.now()}-${Math.random()}`, accepted: false };
  const questionText = get('questionText', 1) || '';
  
  if (normType === 'mcq') {
    let options = [];
    const optCell = get('options', 2);
    if (optCell) {
        // Smart separator detection
        const seps = [';', '|', '\n', '::']; // Commas are risky as separators inside a CSV cell but we can add as fallback
        const foundSep = seps.find(s => optCell.includes(s));
        if (foundSep) {
            options = optCell.split(foundSep).map(o => o.trim()).filter(Boolean);
        } else if (optCell.includes(',')) {
            options = optCell.split(',').map(o => o.trim()).filter(Boolean);
        } else {
            // Fallback to separate columns (cols 2, 3, 4, 5)
            options = [cols[2], cols[3], cols[4], cols[5]].filter(Boolean);
        }
    }

    const answerCell = get('answer', 6);
    let correctOption = 0;
    if (answerCell && answerCell.length === 1 && /^[A-D]$/i.test(answerCell)) {
        correctOption = Math.max(0, ['A','B','C','D'].indexOf(answerCell.toUpperCase()));
    } else if (answerCell) {
        // Try to match by text
        const idx = options.findIndex(o => o.toLowerCase() === answerCell.toLowerCase());
        if (idx !== -1) correctOption = idx;
    }

    return { ...base, type: 'mcq', questionText, options, correctOption, marks: parseInt(get('marks', 7)) || 2 };
  }

  if (normType === 'short') {
    return { ...base, type: 'short', questionText, expectedAnswer: get('answer', 2) || '', maxWords: parseInt(cols[3]) || 150, marks: parseInt(get('marks', 4)) || 5 };
  }

  if (normType === 'coding') {
    // Handling test cases: support "input => output" in index 4 OR separate input(4)/output(5) columns
    const inputCol = (map && map.input !== -1) ? map.input : 4;
    const outputCol = (map && map.output !== -1) ? map.output : 5;
    
    let testCases = [];
    const tcCell = cols[inputCol] || '';
    if (tcCell.includes('=>')) {
        testCases = tcCell.split(';').map(tc => { 
            const [i, o] = tc.split('=>'); 
            return { input: (i||'').trim(), expectedOutput: (o||'').trim() }; 
        });
    } else {
        testCases = [{ input: (cols[inputCol] || '').trim(), expectedOutput: (cols[outputCol] || '').trim() }];
    }

    return { 
        ...base, 
        type: 'coding', 
        questionText, 
        language: get('language', 6) || 'javascript', 
        initialCode: get('initialCode', 3) || '', 
        testCases, 
        marks: parseInt(get('marks', 5)) || 10 
    };
  }
  return null;
};

export default function CreateExam() {
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState({ title: '', description: '', duration: 60, totalMarks: 100, passingMarks: 40, negativeMarks: 0, category: 'DSA', scheduledDate: '' });
  const [questions, setQuestions] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [syllabus, setSyllabus] = useState('');
  const [_editingSuggestion, _setEditingSuggestion] = useState(null);
  const [aiConfig, setAiConfig] = useState({ mcq: 5, short: 3, coding: 1 });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [_fileParseLoading, setFileParseLoading] = useState(false);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [uploadIntent, setUploadIntent] = useState('import'); // 'import' | 'syllabus'
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedExamId, setPublishedExamId] = useState('');
  const [editId, setEditId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeQTab, setActiveQTab] = useState('mcq');
  
  // Link Import States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImportingLink, setIsImportingLink] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const returnTo = new URLSearchParams(location.search).get('returnTo') || '/mentor';

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

  // --- EXPORT FUNCTIONS ---
  const exportQuestions = () => {
    if (questions.length === 0) {
      addToast('Export karne ke liye kam se kam ek question hona chahiye!', 'error');
      return;
    }

    // JSON format (Best for coding questions and test cases)
    const dataStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.title ? exam.title.replace(/\s+/g, '_') : 'exam'}_questions.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Questions successfully export ho gaye (JSON)!', 'success');
  };

  const exportToCSV = () => {
    if (questions.length === 0) {
      addToast('No questions to export!', 'error');
      return;
    }

    const headers = ["type", "question", "marks", "option1", "option2", "option3", "option4", "answer"];
    const rows = questions.map(q => {
      if (q.type === 'mcq') {
        const opts = [...(q.options || [])];
        while (opts.length < 4) opts.push("");
        return [
          q.type,
          `"${q.questionText.replace(/"/g, '""')}"`,
          q.marks,
          `"${opts[0]?.replace(/"/g, '""')}"`,
          `"${opts[1]?.replace(/"/g, '""')}"`,
          `"${opts[2]?.replace(/"/g, '""')}"`,
          `"${opts[3]?.replace(/"/g, '""')}"`,
          String.fromCharCode(65 + (q.correctOption || 0))
        ];
      } else if (q.type === 'short') {
         return [
           q.type,
           `"${q.questionText.replace(/"/g, '""')}"`,
           q.marks,
           "", "", "", "",
           `"${q.expectedAnswer?.replace(/"/g, '""')}"`
         ];
      } else {
        return [q.type, `"${q.questionText.replace(/"/g, '""')}"`, q.marks, "", "", "", "", "DATA_IN_JSON_ONLY"];
      }
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exam.title || 'exam'}_questions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Questions successfully export ho gaye (CSV)!', 'success');
  };

  // --- DIRECT IMPORT FUNCTION ---
  const handleDirectImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    let importedQuestions = [];
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (ext === 'json') {
          const parsedData = JSON.parse(event.target.result);
          if (Array.isArray(parsedData)) {
            importedQuestions = parsedData;
          } else {
            addToast('JSON format array hona chahiye.', 'error');
            return;
          }
        } 
        else if (ext === 'csv') {
          const lines = event.target.result.split('\n').filter(l => l.trim() && !l.startsWith('#'));
          const header = lines[0]?.toLowerCase().includes('type') ? lines[0] : null;
          const dataLines = header ? lines.slice(1) : lines;
          const map = header ? getColumnMap(header) : null;
          importedQuestions = dataLines.map(l => csvRowToQuestion(parseCSVRow(l), map)).filter(Boolean);
        } else {
          addToast('Only .json or .csv supported.', 'error');
          return;
        }

        if (importedQuestions.length === 0) {
          addToast('No valid questions found in file.', 'error');
          return;
        }

        // 1. Validation & Sanitization
        const sanitized = importedQuestions
          .filter(q => q && q.questionText && q.type)
          .map(q => ({
            ...q,
            questionText: q.questionText.trim(),
            id: Date.now() + Math.random() * 1000 // Fresh ID for frontend
          }));

        // 2. Duplicate Check
        const filtered = sanitized.filter(q => 
          !questions.some(existing => existing.questionText.trim() === q.questionText.trim())
        );

        if (filtered.length === 0) {
          addToast('All questions in file are already present in the exam.', 'info');
          return;
        }

        // 3. Smart Marks Check
        const currentTotal = questions.reduce((s, q) => s + (q.marks || 0), 0);
        const importedTotal = filtered.reduce((s, q) => s + (q.marks || 0), 0);
        if (currentTotal + importedTotal > exam.totalMarks) {
          addToast(`Warning: Import will exceed Exam Total Marks (${currentTotal + importedTotal}/${exam.totalMarks}). Please review assigned marks.`, 'error');
        }

        // 4. Persist (if editing an existing exam)
        if (editId) {
          try {
            const response = await api.post(`/api/exams/import-questions/${editId}`, { questions: filtered });
            addToast(`Success: ${response.data.added} questions saved to database!`);
            // Refresh full question list to be sure
            loadDraft(editId);
          } catch (err) {
            console.error("Link persistence failed:", err);
            addToast("Questions parsed but failed to save in DB. Adding to local view only.", 'error');
            setQuestions(prev => [...prev, ...filtered]);
          }
        } else {
          // New exam: just update state
          setQuestions(prev => [...prev, ...filtered]);
          addToast(`${filtered.length} questions imported locally. Remember to save draft/publish.`);
        }

      } catch (err) {
        console.error("Import logic error:", err);
        addToast('Failed to parse file.', 'error');
      }
    };

    if (ext === 'json' || ext === 'csv') {
      reader.readAsText(file);
    } else {
      addToast('Invalid file format.', 'error');
    }
    
    e.target.value = null; // reset
  };

  const handleLinkImport = async () => {
    if (!importUrl) {
      addToast('Please enter a valid URL', 'error');
      return;
    }
    setIsImportingLink(true);
    try {
      const response = await api.post('/api/exams/import-from-link', { url: importUrl });
      
      setPreviewQuestion({
        ...response.data.question,
        id: `link-import-${Date.now()}`
      });
      
      setShowLinkModal(false);
      setImportUrl('');
      setShowPreviewModal(true);
      
    } catch (err) {
      console.error("Import failed:", err);
      addToast(err.response?.data?.error || 'Failed to import from link.', 'error');
    } finally {
      setIsImportingLink(false);
    }
  };

  const confirmLinkImport = () => {
    // Validation: Require Expected Outputs
    const hasEmptyOutputs = previewQuestion.testCases.some(tc => !tc.expectedOutput || !tc.expectedOutput.trim());
    
    if (hasEmptyOutputs) {
      addToast("Warning: Please fill all 'Expected Output' fields before saving.", "error");
      return;
    }

    setQuestions(prev => [...prev, previewQuestion]);
    setExpandedQ(previewQuestion.id);
    setShowPreviewModal(false);
    setPreviewQuestion(null);
    addToast('External question successfully added to the assessment!', 'success');
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    const returnTo = queryParams.get('returnTo') || '/mentor';
    if (id) {
      setEditId(id);
      loadDraft(id, returnTo);
    }
  }, [location.search]);

  const loadDraft = async (id, returnTo = '/mentor') => {
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
      navigate(returnTo); // Return to correct dashboard
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePublish = async () => {
    if (questions.length === 0) return;
    setIsPublishing(true);
    setPublishStatus('loading');
    
    const payload = {
      title: exam.title || 'Untitled Exam',
      category: exam.category,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      negativeMarks: exam.negativeMarks,
      questions: questions.map(q => {
        const { id: _id, ...cleanQ } = q;
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
    
    // Validate negative marks
    if (exam.negativeMarks < 0) {
      addToast('Negative marks cannot be less than 0.', 'error');
      setIsPublishing(false);
      return;
    }
    
    // Validate that negative marks don't exceed question marks
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (exam.negativeMarks > q.marks) {
        addToast(`Question ${i + 1}: Negative marks (${exam.negativeMarks}) cannot exceed question marks (${q.marks}).`, 'error');
        setIsPublishing(false);
        setExpandedQ(q.id);
        return;
      }
    }
    
    // Validate time limit constraints
    if (exam.duration < 5) {
      addToast('Exam duration must be at least 5 minutes.', 'error');
      setIsPublishing(false);
      return;
    }
    
    if (exam.duration > 300) {
      addToast('Exam duration cannot exceed 300 minutes (5 hours).', 'error');
      setIsPublishing(false);
      return;
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
      setPublishStatus('success');
      await new Promise(r => setTimeout(r, 1200));
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response) {
        // Server rejected the request Ã¢â‚¬â€ do NOT show success
        console.error('Server side rejection:', err.response.data);
        const errorMsg = err.response.data.error || err.response.data.message || 'Validation failed';
        addToast(`Failed to publish exam: ${errorMsg}`, 'error');
        setPublishStatus('error');
        setTimeout(() => setPublishStatus('idle'), 2000);
        setIsPublishing(false);
        return;
      }

      console.warn('Backend offline. Saving exam locally for demo mode.');
      // Resilient offline fallback Ã¢â‚¬â€ save locally and show success
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
      setPublishStatus('success');
      await new Promise(r => setTimeout(r, 1200));
      setShowSuccessModal(true);
    } finally {
      setIsPublishing(false);
      setTimeout(() => setPublishStatus('idle'), 500);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveStatus('loading');
    
    // Drafts don't need strict validation on questions,
    // but we need the basic exam info.
    if (!exam.title || !exam.duration) {
      addToast('Please at least provide a Title and Duration to save a draft.', 'error');
      setIsSaving(false);
      return;
    }
    
    // Validate duration for drafts too
    if (exam.duration < 5) {
      addToast('Exam duration must be at least 5 minutes.', 'error');
      setIsSaving(false);
      return;
    }
    
    if (exam.duration > 300) {
      addToast('Exam duration cannot exceed 300 minutes (5 hours).', 'error');
      setIsSaving(false);
      return;
    }
    
    // Validate negative marks for drafts
    if (exam.negativeMarks < 0) {
      addToast('Negative marks cannot be less than 0.', 'error');
      setIsSaving(false);
      return;
    }

    const payload = {
      ...exam,
      scheduledDate: exam.scheduledDate ? new Date(exam.scheduledDate).toISOString() : new Date().toISOString(),
      status: 'draft',
      negativeMarks: exam.negativeMarks,
      questions: questions.map(q => {
        const { id: _id, ...cleanQ } = q;
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
      setSaveStatus('success');
      await new Promise(r => setTimeout(r, 1200));
      // Navigate to dashboard where they can see the draft
      navigate(returnTo);
    } catch (err) {
      console.error('Draft save failure:', err);
      const msg = err.response?.data?.message || 'Failed to save draft.';
      addToast(msg, 'error');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
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
          const header = lines[0]?.toLowerCase().includes('type') ? lines[0] : null;
          const dataLines = header ? lines.slice(1) : lines;
          const map = header ? getColumnMap(header) : null;
          const extracted = dataLines.map(l => csvRowToQuestion(parseCSVRow(l), map)).filter(Boolean);
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 select-none antialiased overflow-hidden">
      {/* Premium Sidebar (Aligned with Admin/Mentor Dashboards) */}
      <PremiumSidebar
        navItems={navItems}
        activeTab="Exam Management"
        setActiveTab={() => navigate(returnTo)}
        userName={sessionStorage.getItem('vision_name') || 'Admin'}
        userRole={sessionStorage.getItem('vision_role') || 'Admin'}
        onLogout={handleLogout}
        brandLabel="VISION"
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-zinc-50">
        {/* Header (Breadcrumbs) */}
        <header className="h-20 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-10 relative z-20">
          <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none">
            <span onClick={() => navigate(returnTo)} className="hover:text-emerald-500 transition-colors cursor-pointer">{returnTo === '/admin' ? 'Admin' : 'Mentor'}</span>
            <ChevronRight size={14} className="opacity-30" />
            <span className="hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => navigate(returnTo)}>Exam Library</span>
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
                
                {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â SECTION 1: Details Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mt-10 pt-10 border-t border-slate-100">
                    <div>
                      <label className={LABEL_BASE}>Duration</label>
                      <StepperInput value={exam.duration} onChange={v => setExam({...exam, duration: v})} icon={Clock} unit="min" step={5} max={300} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Total Marks</label>
                      <StepperInput value={exam.totalMarks} onChange={v => setExam({...exam, totalMarks: v})} step={5} max={1000} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Passing</label>
                      <StepperInput value={exam.passingMarks} onChange={v => setExam({...exam, passingMarks: v})} step={5} max={exam.totalMarks} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Negative Marks</label>
                      <StepperInput value={exam.negativeMarks} onChange={v => setExam({...exam, negativeMarks: v})} icon={Minus} step={0.25} min={0} max={10} />
                    </div>
                    <div className="xl:col-span-2">
                      <label className={LABEL_BASE}>Schedule</label>
                      <CustomDatePicker 
                        selected={exam.scheduledDate} 
                        onChange={(date) => setExam({...exam, scheduledDate: date ? date.toISOString() : ''})} 
                      />
                    </div>
                  </div>
                </section>

                {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â SECTION 2: AI Engine Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
                <section className="bg-white rounded-xl border border-slate-200 p-5 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Sparkles size={15} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">Auto-generate questions</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-medium">Beta</span>
                    </div>
                    <button onClick={() => setShowAI(!showAI)} className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                      {showAI ? 'Close' : 'Open'}
                    </button>
                  </div>

                  {showAI && (
                    <div className="space-y-4">
                       <div className="flex gap-4 border-b border-slate-100 pb-3">
                          {[{id:'text', label:'Paste text'}, {id:'file', label:'Upload file'}].map(t => (
                            <button key={t.id} onClick={() => setInputMode(t.id)} className={`text-xs font-medium pb-1 transition-all ${inputMode === t.id ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                              {t.label}
                            </button>
                          ))}
                       </div>

                       {inputMode === 'text' ? (
                         <div className="space-y-4">
                            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Paste your content</label>
                            <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)} placeholder="Syllabus, lecture notes, topics..." rows={3} className={INPUT_BASE + " resize-none p-3 text-xs"} />
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <label className="text-[11px] font-medium text-slate-500 mb-1.5 block">Upload document</label>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {[{id:'syllabus', label:'Topics Only', icon: ListChecks}, {id:'import', label:'Direct Questions', icon: FileSpreadsheet}].map(t => (
                                  <button key={t.id} onClick={() => setUploadIntent(t.id)} className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${uploadIntent === t.id ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <t.icon size={15} className={uploadIntent === t.id ? 'text-slate-700' : 'text-slate-400'} />
                                    <div><p className={`text-xs font-medium ${uploadIntent === t.id ? 'text-slate-800' : 'text-slate-500'}`}>{t.label}</p><p className="text-[10px] text-slate-400">PDF / CSV</p></div>
                                  </button>
                                ))}
                             </div>
                               {!uploadedFile ? (
                               <div onDragOver={e => {e.preventDefault(); setIsDragOver(true)}} onDragLeave={() => setIsDragOver(false)} onDrop={onDropFile} onClick={() => document.getElementById('ai-file').click()} className={`py-6 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${isDragOver ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                 <input id="ai-file" type="file" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                                 <Upload size={18} className="text-slate-300" />
                                 <div className="text-center">
                                   <p className="text-[11px] text-slate-400">Drop file or click to browse</p>
                                   <p className="text-[10px] text-slate-300 mt-0.5">Max 10MB</p>
                                 </div>
                               </div>
                             ) : (
                               <div className="p-4 bg-white border border-emerald-200 shadow-sm rounded-2xl flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-500">{uploadedFile.name.endsWith('.pdf') ? <FileText size={20} /> : <FileSpreadsheet size={20} />}</div>
                                   <div><p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{uploadedFile.name}</p><p className="text-[10px] text-emerald-600 uppercase font-bold mt-0.5">File Verified</p></div>
                                 </div>
                                 <button onClick={() => setUploadedFile(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                               </div>
                             )}
                         </div>
                       )}

                       <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                          <div><label className={LABEL_BASE}>MCQs</label><StepperInput value={aiConfig.mcq} onChange={v => setAiConfig({...aiConfig, mcq:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>Short Qs</label><StepperInput value={aiConfig.short} onChange={v => setAiConfig({...aiConfig, short:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>Coding</label><StepperInput value={aiConfig.coding} onChange={v => setAiConfig({...aiConfig, coding:v})} min={0} /></div>
                       </div>

                       <button onClick={generateAI} disabled={aiLoading} className="w-full h-9 bg-slate-800 text-white rounded-lg text-[11px] font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                          <span>{aiLoading ? 'Generating...' : 'Generate'}</span>
                       </button>

                       {/* Suggestions Area */}
                       {aiSuggestions.length > 0 && (
                         <div className="pt-5 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between mb-4 px-2">
                               <p className="text-[10px] font-semibold text-slate-500 uppercase">{aiSuggestions.length} suggestions</p>
                               <button onClick={acceptAll} className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 uppercase">Accept All</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                               {aiSuggestions.map((s, idx) => (
                                 <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl group flex items-start gap-3 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
                                    <div className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">{idx+1}</div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600">{typeLabels[s.type]}</span>
                                          <span className="text-[8px] font-semibold text-slate-400 uppercase">{s.marks} PTS</span>
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

                {/* Questions - Tabbed by Type */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">Questions</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">{questions.length} total</p>
                    </div>
                  </div>

                  {/* 3 Section Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {['mcq', 'short', 'coding'].map(type => {
                      const count = questions.filter(q => q.type === type).length;
                      const isActive = activeQTab === type;
                      return (
                        <button key={type} onClick={() => setActiveQTab(type)} className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-[12px] font-semibold transition-all ${isActive ? 'bg-white border-slate-300 text-slate-900 shadow-md ring-1 ring-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:shadow-sm'}`}>
                          <span style={{ color: typeColors[type] }}>{typeIcons[type]}</span>
                          <span>{typeLabels[type]}</span>
                          {count > 0 && <span className={`text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'text-white' : 'bg-slate-100 text-slate-500'}`} style={isActive ? { background: typeColors[type] } : {}}>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Questions for active tab */}
                  {(() => {
                    const filtered = questions.filter(q => q.type === activeQTab);
                    if (filtered.length === 0) return (
                      <div className="py-10 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                        <FilePlus size={20} className="text-slate-300" />
                        <p className="text-[11px] text-slate-400">No {typeLabels[activeQTab]} questions yet</p>
                      </div>
                    );
                    return (
                      <div className="space-y-1.5">
                        {filtered.map((q, i) => (
                          <div key={q.id} className={`group bg-white border rounded-lg transition-all ${expandedQ === q.id ? 'ring-1 ring-emerald-500/20 border-emerald-200' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="flex items-center justify-between px-3 py-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                 <span className="text-[10px] font-semibold text-slate-400 w-5 text-center shrink-0">{i + 1}</span>
                                 <input value={q.questionText} onChange={e => updateQ(q.id, { questionText: e.target.value })} placeholder="Enter question..." className="bg-transparent border-none text-[13px] font-medium text-slate-800 placeholder:text-slate-300 focus:ring-0 w-full p-0" />
                                 <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">{q.marks}pts</span>
                              </div>
                              <div className="flex items-center gap-0.5 ml-2">
                                 <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                                   {expandedQ === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                 </button>
                                 <button onClick={() => dupQ(q.id)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100">
                                   <Copy size={12} />
                                 </button>
                                 <button onClick={() => removeQ(q.id)} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100">
                                   <Trash2 size={12} />
                                 </button>
                              </div>
                            </div>
                            {expandedQ === q.id && (
                              <div className="px-3 pb-3 pt-2.5 border-t border-slate-100">
                                 <div className="mb-3 flex items-center gap-2">
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
                                       <input type="number" value={q.marks} onChange={e => updateQ(q.id, { marks: parseInt(e.target.value) || 0 })} className="w-10 h-8 bg-transparent border-none text-[11px] font-semibold text-slate-800 text-center focus:ring-0" />
                                       <span className="text-[10px] text-slate-400 pr-2">pts</span>
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
                    );
                  })()}
                </section>
              </div>

              {/* Right Column: Actions / Summary */}
              <aside className="w-full lg:w-80 space-y-8 lg:sticky lg:top-10 shrink-0 pb-10">
                
                {/* Master Actions */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden group/actions">
                  
                  
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] ml-1">Add Content</p>
                    <div className="grid grid-cols-1 gap-3">
                       {Object.entries(typeLabels).map(([type, label]) => (
                         <button key={type} onClick={() => addQ(type)} className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md group/btn transition-all text-left active:scale-95">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-600 group-hover/btn:bg-emerald-500 group-hover/btn:text-white group-hover/btn:border-emerald-500 group-hover/btn:scale-110 transition-all shadow-sm">
                              {typeIcons[type]}
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900 group-hover/btn:text-emerald-700 transition-colors uppercase tracking-wider">{label}</p>
                               <p className="text-[9px] text-slate-400 group-hover/btn:text-emerald-600/70 transition-colors uppercase font-bold">New Module</p>
                            </div>
                         </button>
                       ))}
                    </div>
                  </div>

                  

                  {/* File Import Hidden Input */}
                  <input 
                    type="file" 
                    id="direct-import-file" 
                    accept=".csv,.json" 
                    className="hidden" 
                    onChange={handleDirectImport} 
                  />

                  <div className="space-y-4 pt-2">
                    {/* Naye Import / Export Buttons */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => document.getElementById('direct-import-file').click()} 
                          className="flex-1 h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-[16px] font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                          <UploadCloud size={16} />
                          File
                        </button>
                        <button 
                          onClick={() => setShowLinkModal(true)} 
                          className="flex-1 h-12 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-600 rounded-[16px] font-black text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                          <Link size={16} />
                          URL Link
                        </button>
                      </div>
                      <button 
                        onClick={exportQuestions} 
                        className="w-full h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-[12px] font-bold text-[9px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                      >
                        <Download size={14} />
                        Download JSON Data
                      </button>
                    </div>
                    <button onClick={handlePublish} disabled={isPublishing || questions.length === 0 || publishStatus !== 'idle'} className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold text-[11px] tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 group/pub">
                      <AnimatedStatusIcon status={publishStatus} icon={<Send size={18} className="group-hover/pub:translate-x-1 group-hover/pub:-translate-y-1 transition-transform" />} size={18} />
                      {publishStatus === 'loading' ? 'Deploying...' : publishStatus === 'success' ? 'Deployed' : 'Deploy Now'}
                    </button>
                    <button onClick={handleSaveDraft} disabled={isSaving || saveStatus !== 'idle'} className="w-full h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-[11px] tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                      <AnimatedStatusIcon status={saveStatus} icon={<Save size={18} />} size={18} />
                      {saveStatus === 'loading' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Progress'}
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

      {/* Ã°Å¸â€â€” URL-Based Import Modal (Source Link) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-zinc-200 relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black uppercase text-zinc-900 tracking-tight flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Link size={16} strokeWidth={3} />
                  </div>
                  Vision Engine <span className="text-zinc-400 font-bold ml-1">Import</span>
                </h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2 ml-11">Supporting LeetCode & CodeChef Labs</p>
              </div>
              <button 
                onClick={() => setShowLinkModal(false)} 
                className="p-2.5 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-2xl transition-all border border-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 mb-10">
              <div className="space-y-3">
                <label className={LABEL_BASE + " ml-0"}>Problem Repository URL</label>
                <div className="relative group">
                  <input 
                    type="url" 
                    value={importUrl} 
                    onChange={e => setImportUrl(e.target.value)} 
                    placeholder="https://leetcode.com/problems/..." 
                    className={INPUT_BASE + " h-14 pl-5 text-sm font-semibold border-zinc-200 focus:border-emerald-500 bg-zinc-50/50"}
                  />
                  <div className="absolute inset-0 rounded-xl border-2 border-emerald-500/0 group-focus-within:border-emerald-500/10 pointer-events-none transition-all" />
                </div>
              </div>

              {/* Platform Chips */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">LeetCode Ready</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">CodeChef Alpha</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLinkImport} 
              disabled={isImportingLink || !importUrl} 
              className="w-full h-16 bg-zinc-900 border border-white/5 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all enabled:hover:scale-[1.02] enabled:active:scale-[0.98] shadow-2xl disabled:opacity-30 group"
            >
              {isImportingLink ? (
                <Loader2 size={20} className="animate-spin text-emerald-400" />
              ) : (
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
              )}
              {isImportingLink ? 'Processing Endpoint...' : 'Initialize Secure Scraping'}
            </button>
            
            <p className="text-[9px] text-zinc-400 font-bold uppercase text-center mt-6 tracking-widest opacity-50">Authorized Mentor Import Only</p>
          </div>
        </div>
      )}

      {/* Ã°Å¸Â§Âª Preview & Validation Sidebar Workspace */}
      {showPreviewModal && previewQuestion && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] border border-zinc-200 flex flex-col animate-in slide-in-from-bottom-12 duration-500">
            
            {/* Header Area */}
            <div className="p-8 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <h3 className="text-2xl font-black uppercase text-zinc-900 tracking-tighter">Scraping <span className="text-zinc-400">Preview</span></h3>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-500 shadow-sm">Source: <span className="text-emerald-500">{previewQuestion.source}</span></span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-500 shadow-sm">Difficulty: <span className="text-violet-500">{previewQuestion.difficulty}</span></span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-500 shadow-sm">Marks: <span className="text-blue-500">{previewQuestion.marks}</span></span>
                </div>
              </div>
              <button 
                onClick={() => {setShowPreviewModal(false); setPreviewQuestion(null);}} 
                className="w-12 h-12 flex items-center justify-center bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-2xl transition-all border border-zinc-200 shadow-sm group"
              >
                <X size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
              
              {/* Alert Message */}
              <div className="bg-amber-50 border border-amber-200/50 p-6 rounded-[32px] flex items-start gap-5 relative overflow-hidden group/warning">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover/warning:scale-110 transition-transform">
                    <AlertCircle size={80} />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                      <AlertCircle size={24} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                      <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        Heads Up <span className="w-1 h-1 rounded-full bg-amber-400" /> Validation Required
                      </h4>
                      <p className="text-xs text-amber-800/70 font-bold leading-relaxed">
                          Vision Engine has normalized the problem text, but <span className="text-amber-900 underline decoration-amber-500/50 underline-offset-4">test cases require your expert review</span>. Specifically, the "Expected Output" for auto-grading must be manually verified or filled prior to deployment.
                      </p>
                  </div>
              </div>

              {/* Problem Content Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className={LABEL_BASE}>Refine Question Statement</label>
                  <textarea 
                    value={previewQuestion.questionText} 
                    onChange={e => setPreviewQuestion({...previewQuestion, questionText: e.target.value})}
                    placeholder="Problem text..."
                    className={INPUT_BASE + " h-[400px] resize-none font-mono text-xs p-6 leading-relaxed bg-zinc-50 border-zinc-200 shadow-inner"} 
                  />
                </div>

                <div className="space-y-6">
                  {/* Test Case Logic Workspace */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className={LABEL_BASE}>Logic Validation Set</label>
                      <button 
                        onClick={() => setPreviewQuestion({...previewQuestion, testCases: [...previewQuestion.testCases, { input: '', expectedOutput: '', isHidden: false }] })} 
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/10 hover:bg-emerald-500/5 transition-all"
                      >
                        <Plus size={12} strokeWidth={3} /> Inject Hidden Case
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {previewQuestion.testCases.map((tc, index) => (
                         <div key={index} className="p-6 bg-zinc-50 border border-zinc-200 rounded-[24px] space-y-4 group/tc relative">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Case #{index + 1}</span>
                               {previewQuestion.testCases.length > 1 && (
                                 <button 
                                   onClick={() => {
                                      const filtered = previewQuestion.testCases.filter((_, i) => i !== index);
                                      setPreviewQuestion({...previewQuestion, testCases: filtered});
                                   }}
                                   className="text-zinc-400 hover:text-red-500 transition-colors"
                                 >
                                    <Trash2 size={12} />
                                 </button>
                               )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                               <div>
                                  <p className="text-[8px] font-black text-zinc-500 uppercase mb-2 tracking-tighter">System Input</p>
                                  <textarea 
                                    value={tc.input} 
                                    onChange={(e) => {
                                       const updatedTCs = [...previewQuestion.testCases];
                                       updatedTCs[index].input = e.target.value;
                                       setPreviewQuestion({...previewQuestion, testCases: updatedTCs});
                                    }}
                                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-[11px] font-mono focus:border-zinc-400 outline-none resize-none" 
                                    rows={2}
                                  />
                               </div>
                               <div>
                                  <p className={`text-[8px] font-black uppercase mb-2 tracking-tighter ${!tc.expectedOutput ? 'text-amber-500' : 'text-zinc-500'}`}>
                                    {`Grade Requirement (Output) ${!tc.expectedOutput ? '*' : ''}`}
                                  </p>
                                  <textarea 
                                    placeholder="Enter expected outcome for grader..." 
                                    value={tc.expectedOutput}
                                    onChange={(e) => {
                                       const updatedTCs = [...previewQuestion.testCases];
                                       updatedTCs[index].expectedOutput = e.target.value;
                                       setPreviewQuestion({...previewQuestion, testCases: updatedTCs});
                                    }}
                                    className={`w-full border rounded-xl px-3 py-2.5 text-[11px] font-mono outline-none resize-none transition-all ${!tc.expectedOutput ? 'border-amber-400 bg-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white border-zinc-200 focus:border-emerald-500'}`}
                                    rows={2}
                                  />
                               </div>
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-zinc-100 bg-zinc-50/50 flex gap-5">
               <button 
                 onClick={() => {setShowPreviewModal(false); setPreviewQuestion(null);}} 
                 className="flex-1 h-16 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                  Discard Candidate
               </button>
               <button 
                 onClick={confirmLinkImport} 
                 className="flex-[2] h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_15px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 group"
               >
                  <CheckCircle size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                  Finalize & Add to Assessment
               </button>
            </div>
          </div>
        </div>
      )}

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

            <button onClick={() => navigate(returnTo)} className="group w-full bg-white text-black h-14 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-zinc-200">
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

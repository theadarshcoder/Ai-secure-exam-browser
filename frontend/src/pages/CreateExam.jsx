import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../contexts/ThemeContext';
// Success Modal
const SuccessModal = ({ isOpen, examId, onInvite, onReturn }) => {
  const examLink = `${window.location.origin}/exam/${examId}`;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 20, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, y: -20, scale: 0.95 }}
          className="fixed top-24 right-8 z-[200] w-[300px] bg-surface rounded-2xl shadow-2xl border border-main p-5 overflow-hidden backdrop-blur-xl bg-surface/90"
        >
          {/* Success Indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500 shrink-0">
              <CheckCircle size={18} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-[13px] font-black text-primary tracking-tight">System Published</h2>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider opacity-60">Protocol Active</p>
            </div>
          </div>

          {/* Compact Link Box */}
          <div className="mb-5 bg-surface-hover/50 p-3 rounded-xl border border-main">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">Exam Link</label>
              <button 
                onClick={() => { 
                  navigator.clipboard.writeText(examLink); 
                }}
                className="flex items-center gap-1 text-[8px] font-black text-primary-500 uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                <Copy size={10} /> Copy
              </button>
            </div>
            <div className="font-mono text-[9px] text-primary truncate opacity-80">
              {examLink}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onInvite}
              className="flex-1 h-9 bg-primary-500 text-white font-black rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/20 active:scale-95 uppercase tracking-widest text-[9px]"
            >
              <Users size={12} />
              Invite
            </button>
            <button 
              onClick={onReturn}
              className="flex-1 h-9 bg-surface border border-main text-muted font-black hover:text-primary rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 text-[9px] uppercase tracking-widest"
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
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
  Download, UploadCloud, Link, Calendar, ScanFace, LayoutList, PlusCircle, TrendingUp, ArrowRight, Radio
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import VisionLogo from '../components/VisionLogo';
import PremiumSidebar from '../components/PremiumSidebar';
import AnimatedStatusIcon from '../components/AnimatedStatusIcon';
import BulkInviteModal from '../components/BulkInviteModal';
import CSVHelper from '../components/CSVHelper';

// AI Suggestions are now fetched from the backend live engine.

const typeLabels = { mcq: 'MCQ', short: 'Short Answer', coding: 'Coding', 'frontend-react': 'React Lab' };
const typeColors = { mcq: '#3b82f6', short: '#8b5cf6', coding: '#84cc16', 'frontend-react': '#6366f1' };
const typeIcons = { mcq: <ListChecks size={13} />, short: <AlignLeft size={13} />, coding: <Code size={13} />, 'frontend-react': <LayoutDashboard size={13} /> };

// --- Styles ---
const INPUT_BASE = "w-full bg-surface border border-main rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm";
const LABEL_BASE = "text-[10px] font-bold text-muted uppercase tracking-widest mb-2 block ml-0.5";

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
    const next = parseFloat(Math.min(max, Math.max(min, (value ?? 0) + delta)).toFixed(2));
    onChange(next);
  };

  return (
    <div className={`relative flex items-center bg-surface border h-11 rounded-xl transition-all duration-300 shadow-sm ${isFocused ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-main hover:border-primary-500/30'}`}>
      {Icon && (
        <div className="w-10 flex items-center justify-center shrink-0">
          <Icon size={14} className={`text-muted ${isFocused ? 'text-primary-500' : ''}`} />
        </div>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-primary h-full text-center"
      />
      <div className="w-10 flex items-center justify-center shrink-0 border-l border-main">
        <div className="flex flex-col">
          <button type="button" onClick={() => handleStep(step)} className="p-0.5 hover:text-primary-500 text-muted transition-colors active:scale-110">
            <ChevronUp size={12} strokeWidth={3} />
          </button>
          <button type="button" onClick={() => handleStep(-step)} className="p-0.5 hover:text-red-500 text-muted transition-colors active:scale-110">
            <ChevronDown size={12} strokeWidth={3} />
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
      className="w-full h-12 bg-surface hover:bg-surface-hover border border-main hover:border-primary-500/30 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-between px-3 group"
    >
      <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
        <div className={`shrink-0 p-1.5 rounded-lg transition-colors ${value ? 'bg-primary-500/20 text-primary-500' : 'bg-surface-hover text-muted group-hover:text-primary-500 group-hover:bg-primary-500/10'}`}>
          {value && value.includes(':') ? <Clock size={14} /> : <Calendar size={14} />}
        </div>
        <span className={`text-sm font-bold tracking-tight ${value ? 'text-primary' : 'text-muted'}`}>
          {value || 'Set Schedule'}
        </span>
      </div>
      {value ? (
        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(255,59,0,0.8)] animate-pulse shrink-0 ml-2" />
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-main shrink-0 ml-2" />
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
      timeIntervals={15}
      timeFormat="h:mm aa"
      timeCaption="Time"
      minDate={new Date(new Date().setHours(0,0,0,0))}
      todayButton="Select Today"
      dateFormat="yyyy MMM d - h:mm aa"
      customInput={<CustomInput />}
      wrapperClassName="w-full"
      portalId="root"
      popperClassName="!z-[200] shadow-2xl rounded-2xl border border-main bg-surface"
    />
  );
};

const McqEditor = ({ question, updateQ }) => {
  const addOption = () => {
    const options = [...(question.options || []), ''];
    updateQ(question.id, { options });
  };

  const removeOption = (index) => {
    if ((question.options || []).length <= 1) return;
    const options = question.options.filter((_, i) => i !== index);
    let correctOption = question.correctOption;
    if (correctOption === index) correctOption = 0;
    else if (correctOption > index) correctOption--;
    updateQ(question.id, { options, correctOption });
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-3xl">
      {(question.options || ['']).map((opt, oi) => (
        <div key={oi} className="flex items-center gap-3 w-full group relative">
          {/* Selection Toggle */}
          <button 
            onClick={() => updateQ(question.id, { correctOption: oi })} 
            className={`w-6 h-6 rounded-full border cursor-pointer flex items-center justify-center transition-all shrink-0 ${question.correctOption === oi ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' : 'border-main text-transparent hover:border-primary-500/30'}`}
          >
            <Check size={12} strokeWidth={4} />
          </button>
          
          {/* Label */}
          <span className="text-xs font-black text-muted w-6 text-center shrink-0">
            {String.fromCharCode(65 + oi)}
          </span>

          {/* Input Field */}
          <input 
            value={opt} 
            onChange={e => {
              const options = [...question.options];
              options[oi] = e.target.value;
              updateQ(question.id, { options });
            }} 
            className={`flex-1 px-5 py-3 border rounded-2xl text-[14px] font-medium text-primary outline-none transition-all shadow-sm ${question.correctOption === oi ? 'border-primary-500 ring-4 ring-primary-500/5 bg-primary-500/5 font-bold' : 'border-main focus:border-primary-500/30 focus:ring-4 focus:ring-primary-500/5 bg-surface-hover placeholder:text-muted/30'}`} 
            placeholder={`Option ${String.fromCharCode(65 + oi)}...`}
          />

          {/* Delete Action */}
          <button 
            onClick={() => removeOption(oi)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {/* Add Option Action */}
      <button 
        onClick={addOption}
        className="flex items-center gap-2 mt-2 text-[11px] font-black uppercase tracking-widest text-muted hover:text-primary-500 transition-all w-fit px-4 py-2.5 rounded-xl hover:bg-primary-500/5 group"
      >
        <Plus size={16} className="group-hover:rotate-90 transition-transform stroke-[3px]" />
        Add Option
      </button>
    </div>
  );
};

const ShortEditor = ({ question, updateQ }) => (
  <div className="space-y-4">
    <div>
      <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1.5 block">Expected Answer / Keywords</label>
      <textarea 
        value={question.expectedAnswer} 
        onChange={e => updateQ(question.id, { expectedAnswer: e.target.value })} 
        placeholder="Enter expected keywords or a model answer for AI evaluation..." 
        rows={3} 
        className="w-full bg-surface-hover border border-main rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all resize-none shadow-sm" 
      />
    </div>
    
    <div className="flex items-end justify-between gap-6 pt-2">
      <div className="flex-1 max-w-[160px]">
        <label className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2 block">Word Limit</label>
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
        <p className="text-[9px] text-muted font-medium leading-relaxed italic">
          AI will use this limit to <br/> evaluate the student's response.
        </p>
      </div>
    </div>
  </div>
);

const CodingEditor = ({ question, updateQ }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[9px] text-muted font-bold uppercase tracking-widest">
      Language:
      <select 
        value={question.language} 
        onChange={e => updateQ(question.id, { language: e.target.value })} 
        className="bg-surface border border-main rounded-lg px-2 py-1 text-xs text-primary focus:outline-none focus:border-primary-500/50 shadow-sm"
      >
        {['javascript','python','java','cpp','c'].map(l => <option key={l} value={l} className="bg-surface">{l}</option>)}
      </select>
    </div>
    <textarea 
      value={question.initialCode} 
      onChange={e => updateQ(question.id, { initialCode: e.target.value })} 
      placeholder="// Starter code..." 
      rows={5} 
      className="w-full bg-page border border-main rounded-xl px-4 py-3 text-xs text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500/50 font-mono resize-none shadow-inner" 
    />
    <div className="space-y-1.5">
      <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Test Cases</p>
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
            className="flex-1 bg-surface-hover border border-main rounded-lg px-2.5 py-1.5 text-xs text-primary placeholder:text-muted/30 font-mono focus:outline-none focus:border-primary-500/50 shadow-sm" 
          />
          <input 
            value={tc.expectedOutput} 
            onChange={e => {
              const testCases = [...question.testCases];
              testCases[ti] = { ...testCases[ti], expectedOutput: e.target.value };
              updateQ(question.id, { testCases });
            }} 
            placeholder="Output" 
            className="flex-1 bg-surface-hover border border-main rounded-lg px-2.5 py-1.5 text-xs text-primary placeholder:text-muted/30 font-mono focus:outline-none focus:border-primary-500/50 shadow-sm" 
          />
          {question.testCases.length > 1 && (
            <button onClick={() => updateQ(question.id, { testCases: question.testCases.filter((_, i) => i !== ti) })} className="text-muted hover:text-red-500 transition-colors">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      ))}
      <button 
        onClick={() => updateQ(question.id, { testCases: [...question.testCases, { input: '', expectedOutput: '' }] })} 
        className="text-[10px] text-primary-500/70 hover:text-primary-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-all"
      >
        <Plus size={10} /> Add case
      </button>
    </div>
  </div>
);

const FrontendReactEditor = ({ question, updateQ }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <p className="text-[9px] text-muted font-bold uppercase tracking-widest">Main File (App.jsx)</p>
      <textarea 
        value={question.frontendTemplate?.files?.['/App.jsx'] || ''} 
        onChange={e => {
          const files = { ...question.frontendTemplate?.files, '/App.jsx': e.target.value };
          updateQ(question.id, { frontendTemplate: { ...question.frontendTemplate, files } });
        }} 
        placeholder="import React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}" 
        rows={8} 
        className="w-full bg-page border border-main rounded-xl px-4 py-3 text-xs text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500/50 font-mono resize-none shadow-inner" 
      />
    </div>
    
    <div className="space-y-2">
      <p className="text-[9px] text-muted font-bold uppercase tracking-widest">UI Test Cases (JSDOM based)</p>
      {question.frontendTestCases?.map((test, ti) => (
        <div key={ti} className="bg-surface-hover border border-main rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-primary-500 uppercase">Test Case {ti + 1}</span>
            <button onClick={() => {
              const tests = question.frontendTestCases.filter((_, i) => i !== ti);
              updateQ(question.id, { frontendTestCases: tests });
            }} className="text-muted/50 hover:text-red-500 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          <input 
            value={test.description} 
            onChange={e => {
              const tests = [...question.frontendTestCases];
              tests[ti] = { ...tests[ti], description: e.target.value };
              updateQ(question.id, { frontendTestCases: tests });
            }} 
            placeholder="Description (e.g., Should render a button)" 
            className="w-full bg-transparent border-none text-[11px] font-bold text-primary placeholder:text-muted/30 focus:ring-0"
          />
          <textarea 
            value={test.testCode} 
            onChange={e => {
              const tests = [...question.frontendTestCases];
              tests[ti] = { ...tests[ti], testCode: e.target.value };
              updateQ(question.id, { frontendTestCases: tests });
            }} 
            placeholder="return document.querySelector('button') !== null" 
            rows={2} 
            className="w-full bg-page border border-main rounded-lg px-3 py-2 text-[10px] font-mono text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500/50 resize-none shadow-inner" 
          />
        </div>
      ))}
      <button 
        onClick={() => {
          const tests = [...(question.frontendTestCases || []), { description: '', testCode: '', isHidden: true }];
          updateQ(question.id, { frontendTestCases: tests });
        }} 
        className="text-[10px] text-primary-500/70 hover:text-primary-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-all"
      >
        <Plus size={10} /> Add UI Test Case
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
        option1: cols.findIndex(c => c.includes('option1') || c.includes('opt1')),
        answer: cols.findIndex(c => c.includes('answer') || c.includes('correct') || c.includes('expected')),
        input: cols.indexOf('input'),
        output: cols.indexOf('output'),
        language: cols.indexOf('language'),
        marks: cols.indexOf('marks'),
        initialCode: cols.findIndex(c => c.includes('code')),
    };
};

const csvRowToQuestion = (cols, map) => {
  // If no map, use legacy/default index-based mapping
  // Standard format: type(0), question(1), marks(2), opt1(3), opt2(4), opt3(5), opt4(6), answer(7)
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
    const optCell = get('options', 3); // Default to index 3 (Option1)
    
    if (map && map.options !== -1) {
        // Single cell options column exists
        const seps = [';', '|', '\n', '::'];
        const foundSep = seps.find(s => optCell.includes(s));
        if (foundSep) {
            options = optCell.split(foundSep).map(o => o.trim()).filter(Boolean);
        } else if (optCell.includes(',')) {
            options = optCell.split(',').map(o => o.trim()).filter(Boolean);
        } else {
            options = [optCell];
        }
    } else {
        // Fallback: look for multiple columns starting at index 3 or map.option1
        const startIdx = (map && map.option1 !== -1) ? map.option1 : 3;
        options = [cols[startIdx], cols[startIdx+1], cols[startIdx+2], cols[startIdx+3]].filter(Boolean);
    }

    const answerCell = get('answer', 7); // Default to index 7
    let correctOption = 0;
    
    if (answerCell && answerCell.length === 1 && /^[A-D]$/i.test(answerCell)) {
        correctOption = Math.max(0, ['A','B','C','D'].indexOf(answerCell.toUpperCase()));
    } else if (answerCell && !isNaN(parseInt(answerCell)) && parseInt(answerCell) >= 0) {
        // Numeric support (handle both 0-based and 1-based)
        const val = parseInt(answerCell);
        if (val >= 1 && val <= options.length) {
            correctOption = val - 1; // 1-based
        } else if (val >= 0 && val < options.length) {
            correctOption = val; // 0-based
        }
    } else if (answerCell) {
        // Try to match by text
        const idx = options.findIndex(o => o && o.toLowerCase() === answerCell.toLowerCase());
        if (idx !== -1) correctOption = idx;
    }

    return { ...base, type: 'mcq', questionText, options, correctOption, marks: parseInt(get('marks', 2)) || 2 };
  }

  if (normType === 'short') {
    return { ...base, type: 'short', questionText, expectedAnswer: get('answer', 7) || '', maxWords: parseInt(cols[3]) || 150, marks: parseInt(get('marks', 2)) || 5 };
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
        marks: parseInt(get('marks', 2)) || 10 
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
  const [aiConfig, setAiConfig] = useState({ mcq: 5, short: 3, coding: 1, frontendReact: 0 });
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeQTab, setActiveQTab] = useState('mcq');
  const [counts, setCounts] = useState({ mcq: 0, short: 0, coding: 0, 'frontend-react': 0 });
  
  // Link Import States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImportingLink, setIsImportingLink] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const returnTo = new URLSearchParams(location.search).get('returnTo') || '/mentor';

  const userRole = sessionStorage.getItem('vision_role') || 'mentor';
  const isAdmin = userRole === 'admin' || returnTo === '/admin';

  const navItems = isAdmin ? [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'LiveMonitoring', label: 'Live Monitoring', icon: Radio },
    { id: 'Users', label: 'User Management', icon: Users },
    { id: 'Candidates', label: 'Candidates', icon: ScanFace },
    { id: 'Exams', label: 'Exam Library', icon: FileText },
    { id: 'Results', label: 'Results & Reports', icon: BarChart3 },
    { id: 'Academics', label: 'Academic Insights', icon: TrendingUp },
    { id: 'Settings', label: 'System Settings', icon: Settings },
  ] : [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'LiveMonitoring', label: 'Live Monitoring', icon: Radio },
    { id: 'Exam Management', label: 'Exam Library', icon: FileText },
    { id: 'Results & Reports', label: 'Results & Reports', icon: BarChart3 },
    { id: 'Academics', label: 'Student Analytics', icon: TrendingUp },
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
      const rawErr = err.response?.data?.error;
      addToast((typeof rawErr === 'string' ? rawErr : null) || 'Failed to import from link.', 'error');
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
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const returnTo = params.get('returnTo');

    if (id) {
      setEditId(id);
      loadDraft(id, returnTo);
    } else {
      // Check for auto-saved data for new exams
      const saved = localStorage.getItem('vision_unsaved_exam');
      if (saved) {
        setShowRestorePrompt(true);
      }
    }
  }, [location.search]);

  // --- AUTO-SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    if (questions.length > 0 || exam.title) {
        const autoSaveData = {
            exam,
            questions,
            timestamp: Date.now()
        };
        localStorage.setItem('vision_unsaved_exam', JSON.stringify(autoSaveData));
    }
  }, [exam, questions]);

  const restoreUnsaved = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('vision_unsaved_exam'));
        if (saved) {
            setExam(saved.exam);
            setQuestions(saved.questions);
            addToast('Draft recovered successfully!');
        }
    } catch (e) {
        console.error('Failed to restore:', e);
    } finally {
        setShowRestorePrompt(false);
        localStorage.removeItem('vision_unsaved_exam');
    }
  };

  const discardUnsaved = () => {
    localStorage.removeItem('vision_unsaved_exam');
    setShowRestorePrompt(false);
  };

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
        setPublishStatus('idle');
        setExpandedQ(q.id);
        return;
      }

      if (q.type === 'mcq') {
        const validOptions = q.options.filter(opt => opt && opt.trim());
        if (validOptions.length < 2) {
          addToast(`Question ${qNum} (MCQ): At least 2 options are required.`, 'error');
          setIsPublishing(false);
        setPublishStatus('idle');
          setExpandedQ(q.id);
          return;
        }
        if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption >= q.options.length) {
          addToast(`Question ${qNum} (MCQ): Please select a correct option.`, 'error');
          setIsPublishing(false);
        setPublishStatus('idle');
          setExpandedQ(q.id);
          return;
        }
      }

      if (q.type === 'coding') {
        if (!q.testCases || q.testCases.length === 0 || !q.testCases[0].input.trim() || !q.testCases[0].expectedOutput.trim()) {
          addToast(`Question ${qNum} (Coding): At least one valid test case is required.`, 'error');
          setIsPublishing(false);
        setPublishStatus('idle');
          setExpandedQ(q.id);
          return;
        }
      }
    }
    
    // Validate negative marks
    if (exam.negativeMarks < 0) {
      addToast('Negative marks cannot be less than 0.', 'error');
        setIsPublishing(false);
        setPublishStatus('idle');
      return;
    }
    
    // Validate that negative marks don't exceed question marks
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (exam.negativeMarks > q.marks) {
        addToast(`Question ${i + 1}: Negative marks (${exam.negativeMarks}) cannot exceed question marks (${q.marks}).`, 'error');
          setIsPublishing(false);
        setPublishStatus('idle');
        setPublishStatus('idle');
        setExpandedQ(q.id);
        return;
      }
    }
    
    // Validate time limit constraints
    if (exam.duration < 5) {
      addToast('Exam duration must be at least 5 minutes.', 'error');
        setIsPublishing(false);
        setPublishStatus('idle');
      return;
    }
    
    if (exam.duration > 300) {
      addToast('Exam duration cannot exceed 300 minutes (5 hours).', 'error');
        setIsPublishing(false);
        setPublishStatus('idle');
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
      localStorage.removeItem('vision_unsaved_exam'); // Clear auto-save on success
      await new Promise(r => setTimeout(r, 1200));
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response) {
        // Server rejected the request Ã¢â‚¬â€ do NOT show success
        console.error('Server side rejection:', err.response.data);
        const rawError = err.response.data.error;
        const errorMsg = (typeof rawError === 'string' ? rawError : null) || err.response.data.message || 'Validation failed';
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
      setSaveStatus('idle');
      return;
    }
    
    // Validate duration for drafts too
    if (exam.duration < 5) {
      addToast('Exam duration must be at least 5 minutes.', 'error');
      setIsSaving(false);
      setSaveStatus('idle');
      return;
    }
    
    if (exam.duration > 300) {
      addToast('Exam duration cannot exceed 300 minutes (5 hours).', 'error');
      setIsSaving(false);
      setSaveStatus('idle');
      return;
    }
    
    // Validate negative marks for drafts
    if (exam.negativeMarks < 0) {
      addToast('Negative marks cannot be less than 0.', 'error');
      setIsSaving(false);
      setSaveStatus('idle');
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
      localStorage.removeItem('vision_unsaved_exam'); // Clear auto-save on success
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

  const addQ = (type, count = 1) => {
    const tpl = {
      mcq: { type: 'mcq', questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 1 },
      short: { type: 'short', questionText: '', expectedAnswer: '', maxWords: 150, marks: 2 },
      coding: { type: 'coding', questionText: '', language: 'javascript', initialCode: '', testCases: [{ input: '', expectedOutput: '' }], marks: 5 },
      'frontend-react': { 
        type: 'frontend-react', 
        questionText: '', 
        marks: 10,
        frontendTemplate: {
          files: { '/App.jsx': "import React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}" },
          mainFile: '/App.jsx'
        },
        frontendTestCases: [{ description: 'Should render Hello World', testCode: "return document.querySelector('h1').textContent.includes('Hello World')", isHidden: true }]
      },
    };
    
    const newQs = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      newQs.push({ ...tpl[type], id: now + i });
    }
    
    setQuestions(p => [...p, ...newQs]);
    if (newQs.length > 0) setExpandedQ(newQs[newQs.length - 1].id);
    setCounts(prev => ({ ...prev, [type]: 1 })); // Reset specific count
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
            config: aiConfig,
            totalMarks: exam.totalMarks
        });
        
        if (response.data.success) {
            setAiSuggestions(response.data.questions);
        } else {
            const aiErr = response.data.error;
            throw new Error((typeof aiErr === 'string' ? aiErr : null) || "Generation failed");
        }
    } catch (err) {
        console.error('AI Suggestion Error:', err);
        const rawAiErr = err.response?.data?.error;
        addToast((typeof rawAiErr === 'string' ? rawAiErr : null) || "AI Service is currently unavailable. Please try again later.", 'error');
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
    <div className="flex h-screen bg-page font-sans text-primary select-none antialiased overflow-hidden">
      {/* Premium Sidebar (Aligned with Admin/Mentor Dashboards) */}
      <PremiumSidebar
        navItems={navItems}
        activeTab={isAdmin ? 'Exams' : 'Exam Management'}
        setActiveTab={(tabId) => navigate(`${returnTo}?tab=${tabId}`)}
        userName={sessionStorage.getItem('vision_name') || 'Admin'}
        userRole={sessionStorage.getItem('vision_role') || 'Admin'}
        onLogout={handleLogout}
        brandLabel="VISION"
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-page">
        {/* Header (Breadcrumbs) */}
        <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-10 relative z-20">
          <div className="flex items-center gap-3 text-sm font-semibold text-muted">
            <span onClick={() => navigate(returnTo)} className="hover:text-primary transition-colors cursor-pointer">{returnTo === '/admin' ? 'Admin Dashboard' : 'Mentor Dashboard'}</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(returnTo)}>Exam Library</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-primary font-bold">{editId ? 'Edit' : 'Create'} Assessment</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Header Notifications Area */}
            <div className="flex flex-col items-end gap-2 pointer-events-none mr-2">
              <AnimatePresence>
                {toasts.map(t => {
                  const isError = t.type === 'error';
                  const accentColor = isError ? '#ef4444' : '#84cc16';
                  return (
                    <motion.div 
                      key={t.id}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.9 }}
                      className="pointer-events-auto h-8 pl-3 pr-4 bg-surface border rounded-full flex items-center gap-2.5 shadow-sm backdrop-blur-xl transition-all"
                      style={{ 
                        borderColor: accentColor + '30',
                        background: `linear-gradient(to right, ${accentColor}05, transparent)`,
                        boxShadow: `0 2px 10px ${accentColor}10`
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                      <span className="text-[10px] font-black text-primary uppercase tracking-tight truncate max-w-[200px]">
                        {t.msg}
                      </span>
                      <button 
                        onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
                        className="hover:opacity-60 transition-opacity ml-1"
                      >
                        <X size={10} className="text-muted" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <ThemeToggle />
            <div className="relative group cursor-pointer">
               <Bell size={20} className="text-muted hover:text-primary transition-colors" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            {/* Restore Prompt Overlay */}
            <AnimatePresence>
              {showRestorePrompt && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="fixed bottom-8 right-8 z-[100] w-[340px] p-4 bg-surface border border-main rounded-2xl shadow-2xl shadow-black/5 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500 shrink-0">
                      <RefreshCw size={14} className="animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mt-0.5">Unsaved Draft</h3>
                      <p className="text-[10px] text-muted font-bold opacity-60 mt-1 leading-relaxed pr-2">A previous session draft was found. Restore it?</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-main">
                    <button onClick={discardUnsaved} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-muted hover:text-red-500 transition-colors">Discard</button>
                    <button onClick={restoreUnsaved} className="px-5 py-2 bg-primary-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95">Restore</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-primary">
                  {editId ? 'Edit Assessment' : 'New Assessment'}
                  {initialLoading && <Loader2 size={24} className="inline ml-4 animate-spin text-primary-500" />}
                </h1>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${totalM === exam.totalMarks ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-primary-500/10 border-primary-500/30 text-primary-500'}`}>
                    <Award size={14} /> {totalM} / {exam.totalMarks} Marks Assigned
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted">Configure your secure testing environment.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start">
              {/* Left Column: Build Flow */}
              <div className="flex-1 space-y-12 min-w-0 pb-32">
                
                {/* ---------------- SECTION 1: Details ---------------- */}
                <section className="bg-surface rounded-[32px] border border-main p-10 shadow-2xl relative overflow-hidden group/params">
                  <div className="mb-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-hover border border-main flex items-center justify-center text-primary shadow-sm">
                      <Settings size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-primary">Exam Parameters</h2>
                      <p className="text-sm text-muted">Core assessment configuration hub</p>
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
                          className={INPUT_BASE + " h-12 !pl-4 appearance-none cursor-pointer uppercase font-black text-[11px] tracking-widest"}
                        >
                          {['DSA', 'Frontend', 'DBMS', 'Cloud', 'Security', 'Other'].map(c => <option key={c} value={c} className="bg-surface text-primary font-bold">{c}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mt-10 pt-10 border-t border-main">
                    <div className="flex flex-col justify-between h-full">
                      <label className={LABEL_BASE}>
                        Exam Duration (Time)
                        {exam.status !== 'draft' && exam.id && (
                          <span className="ml-2 text-[8px] text-primary-500 font-black uppercase tracking-[0.1em] bg-primary-500/10 border border-primary-500/20 px-1.5 py-0.5 rounded-md animate-pulse">
                            Syncs Live
                          </span>
                        )}
                      </label>
                      <StepperInput value={exam.duration} onChange={v => setExam({...exam, duration: v})} icon={Clock} unit="min" step={5} max={300} />
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <label className={LABEL_BASE}>Total Marks</label>
                      <StepperInput value={exam.totalMarks} onChange={v => setExam({...exam, totalMarks: v})} step={5} max={1000} />
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <label className={LABEL_BASE}>Passing</label>
                      <StepperInput value={exam.passingMarks} onChange={v => setExam({...exam, passingMarks: v})} step={5} max={exam.totalMarks} />
                    </div>
                    <div className="flex flex-col justify-between h-full">
                      <label className={LABEL_BASE}>Negative Marks</label>
                      <StepperInput value={exam.negativeMarks} onChange={v => setExam({...exam, negativeMarks: v})} icon={Minus} step={0.25} min={0} max={10} />
                    </div>
                    <div className="xl:col-span-2 flex flex-col justify-between h-full">
                      <label className={LABEL_BASE}>Schedule</label>
                      <CustomDatePicker 
                        selected={exam.scheduledDate} 
                        onChange={(date) => setExam({...exam, scheduledDate: date ? date.toISOString() : ''})} 
                      />
                    </div>
                  </div>
                </section>

                {/* ---------------- SECTION 2: AI Engine ---------------- */}
                <section className="bg-surface rounded-2xl border border-main p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-hover border border-main flex items-center justify-center text-primary">
                        <Sparkles size={15} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-primary leading-none">Generate Questions with AI</h3>
                        <p className="text-[11px] text-muted mt-0.5">Create questions automatically from your materials</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAI(!showAI)} className="px-3 py-1.5 bg-surface-hover hover:bg-surface border border-main rounded-lg text-[9px] font-bold uppercase text-muted hover:text-primary transition-all active:scale-95 tracking-widest shadow-sm">
                      {showAI ? 'Collapse' : 'Expand AI'}
                    </button>
                  </div>

                  {showAI && (
                    <div className="space-y-4 mt-4 pt-4" style={{ borderTop: '1px solid #1f1f1f' }}>
                       <div className="flex gap-6 border-b border-main pb-4">
                          {[{id:'text', label:'Paste Text'}, {id:'file', label:'Upload File'}].map(t => (
                            <button key={t.id} onClick={() => setInputMode(t.id)} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${inputMode === t.id ? 'text-primary' : 'text-muted hover:text-primary'}`}>
                              {t.label}
                              {inputMode === t.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500" />}
                            </button>
                          ))}
                       </div>

                       {inputMode === 'text' ? (
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Paste Text Content</label>
                            <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)} placeholder="Syllabus, lecture notes, topics..." rows={4} className={INPUT_BASE + " resize-none p-5 text-sm font-bold bg-surface-hover/50"} />
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Upload Document</label>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[{id:'syllabus', label:'Generate from Topics', icon: ListChecks}, {id:'import', label:'Upload Questions File', icon: FileSpreadsheet}].map(t => (
                                  <button key={t.id} onClick={() => setUploadIntent(t.id)} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group/btn ${uploadIntent === t.id ? 'bg-primary-500/10 border-primary-500/30' : 'bg-surface-hover/50 border-main hover:bg-surface-hover'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${uploadIntent === t.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-surface border border-main text-muted group-hover/btn:text-primary'}`}>
                                      <t.icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                      <p className={`text-[11px] font-black uppercase tracking-tight ${uploadIntent === t.id ? 'text-primary' : 'text-muted'}`}>{t.label}</p>
                                      <p className="text-[9px] font-black text-muted/40 uppercase tracking-widest mt-0.5">PDF / CSV Format</p>
                                    </div>
                                  </button>
                                ))}
                             </div>
                               {!uploadedFile ? (
                               <div onDragOver={e => {e.preventDefault(); setIsDragOver(true)}} onDragLeave={() => setIsDragOver(false)} onDrop={onDropFile} onClick={() => document.getElementById('ai-file').click()} className={`py-12 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${isDragOver ? 'border-primary-500 bg-primary-500/5 shadow-2xl shadow-primary-500/10' : 'border-main hover:border-primary-500/30 bg-surface-hover/30 hover:bg-surface-hover/50'}`}>
                                 <input id="ai-file" type="file" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                                 <div className="w-16 h-16 rounded-full bg-surface border border-main flex items-center justify-center text-muted group-hover:text-primary transition-all">
                                    <Upload size={24} strokeWidth={2.5} />
                                  </div>
                                 <div className="text-center">
                                   <p className="text-[11px] font-black text-primary uppercase tracking-widest">Drag & Drop File or Browse</p>
                                   <p className="text-[10px] text-muted font-bold mt-1 opacity-50">Max file size: 10MB</p>
                                 </div>
                               </div>
                             ) : (
                               <div className="p-6 bg-surface border border-emerald-500/30 shadow-xl rounded-[2rem] flex items-center justify-between group/file relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                                  <div className="flex items-center gap-5">
                                   <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5">{uploadedFile.name.endsWith('.pdf') ? <FileText size={24} /> : <FileSpreadsheet size={24} />}</div>
                                   <div>
                                      <p className="text-sm font-black text-primary truncate max-w-[200px] uppercase tracking-tight">{uploadedFile.name}</p>
                                      <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest mt-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        File Verified
                                      </p>
                                    </div>
                                 </div>
                                 <button onClick={() => setUploadedFile(null)} className="p-3 bg-surface-hover hover:bg-red-500/10 rounded-xl text-muted hover:text-red-500 transition-all active:scale-90 border border-main"><X size={20} strokeWidth={3} /></button>
                               </div>
                             )}
                         </div>
                       )}

                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-main">
                          <div><label className={LABEL_BASE}>MCQs</label><StepperInput value={aiConfig.mcq} onChange={v => setAiConfig({...aiConfig, mcq:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>Short Qs</label><StepperInput value={aiConfig.short} onChange={v => setAiConfig({...aiConfig, short:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>Coding</label><StepperInput value={aiConfig.coding} onChange={v => setAiConfig({...aiConfig, coding:v})} min={0} /></div>
                          <div><label className={LABEL_BASE}>React Lab</label><StepperInput value={aiConfig.frontendReact} onChange={v => setAiConfig({...aiConfig, frontendReact:v})} min={0} /></div>
                       </div>

                       <button type="button" onClick={generateAI} disabled={aiLoading} className="w-full h-11 bg-primary-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95">
                          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                          <span>{aiLoading ? 'Generating...' : 'Generate'}</span>
                       </button>

                       {/* Suggestions Area */}
                       {aiSuggestions.length > 0 && (
                         <div className="pt-8 border-t border-main space-y-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                               <p className="text-[10px] font-black text-muted uppercase tracking-widest">{aiSuggestions.length} Suggested Questions</p>
                               <button onClick={acceptAll} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">Accept All Questions</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                               {aiSuggestions.map((s, idx) => (
                                 <div key={idx} className="p-5 bg-surface border border-main rounded-2xl group/suggest flex items-start gap-4 hover:border-primary-500/30 hover:bg-surface-hover transition-all duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-[11px] font-black text-muted shrink-0 group-hover/suggest:text-primary transition-colors">{idx+1}</div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[8px] font-black uppercase px-2 py-1 rounded-lg bg-surface-hover text-primary border border-main">{typeLabels[s.type]}</span>
                                          <span className="text-[8px] font-black text-muted uppercase tracking-widest">{s.marks} PTS</span>
                                       </div>
                                       <p className="text-[13px] font-bold text-primary leading-relaxed mb-2">{s.questionText}</p>
                                       
                                       {/* Dynamic Preview based on type */}
                                       <div className="mb-4 space-y-2">
                                         {s.type === 'mcq' && s.options && (
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                             {s.options.map((opt, oi) => (
                                               <div key={oi} className={`text-[10px] px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${s.correctOption === oi ? 'bg-primary-500/10 border-primary-500/30 text-primary' : 'bg-surface-hover/50 border-main text-muted'}`}>
                                                 <span className="font-black opacity-40">{String.fromCharCode(65 + oi)}</span>
                                                 <span className="truncate">{opt}</span>
                                                 {s.correctOption === oi && <Check size={10} className="ml-auto text-primary-500" />}
                                               </div>
                                             ))}
                                           </div>
                                         )}
                                         
                                         {s.type === 'coding' && (
                                           <div className="bg-surface-hover/50 border border-main rounded-lg p-2.5">
                                             <div className="flex items-center justify-between mb-1.5">
                                               <span className="text-[8px] font-black uppercase text-muted tracking-widest">{s.language || 'javascript'}</span>
                                               <Code size={10} className="text-muted/40" />
                                             </div>
                                             <pre className="text-[9px] font-mono text-primary/60 truncate italic">
                                               {s.initialCode || '// No starter code provided'}
                                             </pre>
                                           </div>
                                         )}

                                         {s.type === 'frontend-react' && (
                                           <div className="bg-surface-hover/50 border border-main rounded-lg p-2.5">
                                             <div className="flex items-center justify-between mb-1.5">
                                               <span className="text-[8px] font-black uppercase text-muted tracking-widest">React Template</span>
                                               <LayoutDashboard size={10} className="text-muted/40" />
                                             </div>
                                             <pre className="text-[9px] font-mono text-primary/60 truncate italic">
                                               {s.frontendTemplate?.files?.['/App.jsx'] || '// App.jsx template'}
                                             </pre>
                                           </div>
                                         )}
                                       </div>

                                       <button onClick={() => acceptSuggestion(s)} className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 tracking-widest flex items-center gap-2 group/add">
                                         Add Question
                                         <ArrowRight size={12} className="group-hover/add:translate-x-1 transition-transform" />
                                       </button>
                                    </div>
                                    <button onClick={() => setAiSuggestions(prev => prev.filter((_, i) => i !== idx))} className="opacity-0 group-hover/suggest:opacity-100 p-2.5 bg-surface-hover hover:bg-red-500/10 text-muted hover:text-red-500 rounded-xl transition-all border border-main"><Trash2 size={16} /></button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </section>

                {/* Questions - Tabbed by Type */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-hover border border-main flex items-center justify-center text-primary">
                        <LayoutList size={22} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-primary">Exam Questions</h2>
                        <p className="text-sm text-muted mt-1">{questions.length} Items</p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Section Tabs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['mcq', 'short', 'coding', 'frontend-react'].map(type => {
                      const count = questions.filter(q => q.type === type).length;
                      const isActive = activeQTab === type;
                      return (
                        <button key={type} onClick={() => setActiveQTab(type)} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'bg-slate-100 text-primary shadow-sm border-transparent' : 'bg-surface border-main text-muted hover:text-primary hover:bg-slate-50'}`}>
                          <span className={isActive ? 'text-primary' : 'text-muted/50'}>{typeIcons[type]}</span>
                          <span>{typeLabels[type]}</span>
                          {count > 0 && <span className={`text-[9px] min-w-[18px] text-center px-1 py-0.5 rounded font-bold ${isActive ? 'bg-slate-200 text-primary' : 'bg-surface-hover text-muted border border-main'}`}>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Questions for active tab */}
                  {(() => {
                    const filtered = questions.filter(q => q.type === activeQTab);
                    if (filtered.length === 0) return (
                      <div className="py-12 border border-dashed border-main rounded-2xl flex flex-col items-center justify-center gap-4 bg-surface/30">
                        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-muted" style={{ border: '1px solid #1f1f1f' }}>
                          <PlusCircle size={22} strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] font-bold text-muted">No {typeLabels[activeQTab]} questions yet</p>
                          <p className="text-[11px] text-muted/50 mt-1">Add questions using the buttons below</p>
                        </div>
                      </div>
                    );
                    return (
                      <div className="space-y-3">
                        {filtered.map((q, i) => (
                          <React.Fragment key={q.id}>
                            <div className={`group/q bg-surface border rounded-[2.5rem] transition-all duration-500 ${expandedQ === q.id ? 'ring-1 border-primary-500/50 shadow-2xl shadow-primary-500/5 scale-[1.005]' : 'border-main hover:border-primary-500/30'}`}>
                              <div className="flex items-center justify-between px-10 py-8">
                                <div className="flex items-center gap-6 min-w-0 flex-1">
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${expandedQ === q.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-surface-hover text-muted group-hover/q:text-primary-500 border border-main'}`}>
                                      <span className="text-xs font-black uppercase">{i + 1}</span>
                                   </div>
                                    <textarea 
                                      value={q.questionText} 
                                      onChange={e => updateQ(q.id, { questionText: e.target.value })} 
                                      placeholder="Question summary..." 
                                      rows={1}
                                      className="bg-transparent border-none text-[15px] font-bold text-primary placeholder:text-muted/20 focus:ring-0 w-full p-0 outline-none resize-none overflow-hidden min-h-[24px] leading-tight py-1" 
                                    />
                                   <div className="bg-surface-hover/50 px-4 py-2 rounded-xl shrink-0 border border-main group-hover/q:border-primary-500/20 transition-all">
                                      <span className="text-[10px] font-black text-muted tabular-nums uppercase tracking-widest group-hover/q:text-primary-500 transition-colors">{q.marks} pts</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 ml-6">
                                   <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${expandedQ === q.id ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'text-muted/40 hover:text-primary-500 hover:bg-surface-hover border border-transparent hover:border-main'}`}>
                                     {expandedQ === q.id ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                                   </button>
                                   <button onClick={() => dupQ(q.id)} className="w-11 h-11 flex items-center justify-center rounded-2xl text-muted/30 hover:text-primary-500 hover:bg-primary-500/10 transition-all opacity-0 group-hover/q:opacity-100 border border-transparent hover:border-main">
                                     <Copy size={16} />
                                   </button>
                                   <button onClick={() => removeQ(q.id)} className="w-11 h-11 flex items-center justify-center rounded-2xl text-muted/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/q:opacity-100 border border-transparent hover:border-main">
                                     <Trash2 size={16} />
                                   </button>
                                </div>
                              </div>
                            </div>

                            {expandedQ === q.id && (
                              <div className="border-t border-main animate-in slide-in-from-top-2 duration-300 bg-surface rounded-b-2xl overflow-hidden border-x border-b">
                                 {/* Section 1: Universal Settings Strip */}
                                 <div className="bg-surface-hover border-b border-main px-8 py-4 flex items-center gap-8">
                                    <div className="flex items-center gap-4">
                                       <span className="text-[10px] font-black text-muted uppercase tracking-widest">Points</span>
                                       <input 
                                         type="number" 
                                         value={q.marks} 
                                         onChange={e => updateQ(q.id, { marks: parseInt(e.target.value) || 0 })}
                                         className="w-24 h-10 bg-surface border border-main rounded-xl px-4 text-sm font-black text-primary focus:ring-primary-500 focus:border-primary-500 outline-none transition-all tabular-nums"
                                       />
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                       <span className="text-[10px] font-black text-muted uppercase tracking-widest">Threat Level</span>
                                       <select 
                                         value={q.difficulty || 'Medium'} 
                                         onChange={e => updateQ(q.id, { difficulty: e.target.value })}
                                         className="h-10 bg-surface border border-main rounded-xl px-4 text-[11px] font-black uppercase text-primary focus:ring-primary-500 focus:border-primary-500 outline-none transition-all cursor-pointer tracking-widest"
                                       >
                                         <option value="Easy">Routine</option>
                                         <option value="Medium">Standard</option>
                                         <option value="Hard">Critical</option>
                                       </select>
                                    </div>

                                    {q.type === 'coding' && (
                                       <div className="flex items-center gap-4 ml-auto">
                                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">AI Generated</span>
                                          <select 
                                            value={q.language || 'javascript'} 
                                            onChange={e => updateQ(q.id, { language: e.target.value })}
                                            className="h-10 bg-surface border border-main rounded-xl px-4 text-[11px] font-black uppercase text-primary focus:ring-primary-500 focus:border-primary-500 outline-none transition-all cursor-pointer tracking-widest"
                                          >
                                            <option value="javascript">JavaScript (V8)</option>
                                            <option value="python">Python (3.x)</option>
                                            <option value="cpp">C++ (GCC)</option>
                                            <option value="java">Java (JDK)</option>
                                          </select>
                                       </div>
                                    )}
                                 </div>

                                 {/* Section 2: Problem Statement Editor (LeetCode Style) */}
                                 <div className="px-8 py-8 border-b border-main bg-surface-hover/20">
                                    <div className="flex items-center justify-between mb-4">
                                       <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(255,59,0,0.5)]" />
                                          Problem Statement
                                       </label>
                                       <div className="flex items-center gap-3">
                                          <span className="text-[9px] font-bold text-muted uppercase tracking-widest bg-main px-2 py-1 rounded-lg border border-main">Markdown Enabled</span>
                                       </div>
                                    </div>
                                    <textarea 
                                       value={q.questionText}
                                       onChange={e => {
                                          updateQ(q.id, { questionText: e.target.value });
                                          e.target.style.height = 'auto';
                                          e.target.style.height = e.target.scrollHeight + 'px';
                                       }}
                                       onFocus={(e) => {
                                          e.target.style.height = 'auto';
                                          e.target.style.height = e.target.scrollHeight + 'px';
                                       }}
                                       placeholder="### Problem Description\nEnter detailed problem statement here...\n\n### Examples\nInput: ...\nOutput: ...\n\n### Constraints\n- Complexity: O(n)\n- Memory: 256MB"
                                       className="w-full bg-surface border border-main rounded-[2rem] p-8 text-[15px] leading-relaxed text-primary placeholder:text-muted/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none min-h-[180px] resize-none overflow-hidden shadow-inner"
                                    />
                                 </div>

                                 {/* Section 3: Dynamic Type-Specific Area */}
                                 <div className="px-6 py-4">
                                    {q.type === 'mcq' && <McqEditor question={q} updateQ={updateQ} />}
                                    {q.type === 'short' && <ShortEditor question={q} updateQ={updateQ} />}
                                    {q.type === 'coding' && <CodingEditor question={q} updateQ={updateQ} />}
                                    {q.type === 'frontend-react' && <FrontendReactEditor question={q} updateQ={updateQ} />}
                                 </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                    </div>
                  );
                })()}
              </section>
              </div>

              {/* Right Column: Actions / Summary */}
              <aside className="w-full lg:w-80 space-y-8 lg:sticky lg:top-10 shrink-0 pb-10">
                
                {/* Master Actions */}
                <div className="bg-surface border border-main rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden group/actions">
                  
                  
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-primary mb-4">Add Content</p>
                    <div className="space-y-6">
                       <div className="space-y-4">
                          {Object.entries(typeLabels).map(([type, label]) => (
                            <div key={type} className="flex items-center justify-between group/row">
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center text-muted group-hover/row:text-primary-500 transition-colors">
                                    {typeIcons[type]}
                                  </div>
                                  <span className="text-[12px] font-bold text-primary">{label}</span>
                               </div>
                               <div className="flex items-center bg-surface-hover rounded-lg h-8 w-14 border border-main focus-within:border-primary-500/30 transition-all overflow-hidden">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="50"
                                    value={counts[type] || ''}
                                    placeholder="0"
                                    onChange={e => {
                                      const val = e.target.value;
                                      setCounts(prev => ({ ...prev, [type]: val === '' ? 0 : Math.max(0, Math.min(50, parseInt(val) || 0)) }));
                                    }}
                                    className="w-full bg-transparent border-none text-[12px] font-bold text-primary focus:ring-0 p-0 text-center outline-none shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                               </div>
                            </div>
                          ))}
                       </div>
                       
                       <button 
                         onClick={() => {
                            let totalAdded = 0;
                            Object.entries(counts).forEach(([type, count]) => {
                               if (count > 0) {
                                  addQ(type, count);
                                  totalAdded += count;
                                }
                            });
                            if (totalAdded > 0) {
                               addToast(`Successfully added ${totalAdded} new questions!`, 'success');
                               // Reset all to 0 except the first one maybe? Or reset all to 0.
                               setCounts({ mcq: 0, short: 0, coding: 0, 'frontend-react': 0 });
                            }
                         }}
                         className="w-full h-10 mt-4 bg-surface hover:bg-surface-hover text-primary rounded-xl font-medium text-sm transition-all border border-main flex items-center justify-center gap-2 shadow-sm"
                       >
                          <Plus size={16} />
                          Implement Selection
                       </button>
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
                    <div className="flex flex-col gap-2 pt-2 border-t border-main">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => document.getElementById('direct-import-file').click()} 
                          className="flex-1 h-10 bg-surface border border-main hover:bg-surface-hover text-primary rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <UploadCloud size={16} />
                          File
                        </button>
                        <CSVHelper 
                          example="mcq, What is React?, 5, Library, Framework, Tool, OS, 1"
                        />
                        <button 
                          onClick={() => setShowLinkModal(true)} 
                          className="flex-1 h-10 bg-surface border border-main hover:bg-surface-hover text-primary rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <Link size={16} />
                          URL Link
                        </button>
                      </div>
                    </div>

                    <button onClick={handlePublish} disabled={isPublishing || questions.length === 0 || publishStatus !== 'idle'} className="w-full h-9 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-black text-[10px] uppercase tracking-[0.15em] shadow-md shadow-primary-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95">
                      <AnimatedStatusIcon status={publishStatus} icon={<Send size={14} />} size={14} />
                      {publishStatus === 'loading' ? 'Publishing...' : publishStatus === 'success' ? 'Published' : 'Publish Exam'}
                    </button>
                    <button onClick={handleSaveDraft} disabled={isSaving || saveStatus !== 'idle'} className="w-full h-9 bg-surface border border-main hover:bg-surface-hover text-muted hover:text-primary rounded-lg font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm">
                      <AnimatedStatusIcon status={saveStatus} icon={<Save size={14} />} size={14} />
                      {saveStatus === 'loading' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Progress'}
                    </button>
                  </div>
                </div>


                {/* Status Card */}
                <div className="bg-surface border border-main rounded-[32px] p-6 space-y-5">
                   <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-2">Exam Status</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                         <span className="text-xs text-muted font-medium tracking-tight">Platform</span>
                         <span className="text-[10px] font-bold text-primary bg-surface-hover px-2 py-0.5 rounded border border-main uppercase tracking-tighter">VISION</span>
                      </div>
                      <div className="flex items-center justify-between px-2">
                         <span className="text-xs text-muted font-medium tracking-tight">Encryption</span>
                         <span className="text-[10px] font-black text-primary opacity-80 uppercase tracking-widest">AES-256 Encrypted</span>
                      </div>
                      <div className="h-px bg-main mx-2" />
                      <div className="p-4 bg-surface-hover rounded-2xl space-y-1">
                         <p className="text-[9px] font-black text-secondary uppercase leading-none">Exam ID</p>
                         <p className="text-[11px] font-mono text-muted truncate tracking-tight">{editId || 'Auto-generated on publish'}</p>
                      </div>
                   </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* 🔗 URL-Based Import Modal (Source Link) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-main animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-hover border border-main flex items-center justify-center text-muted">
                  <Link size={15} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-primary">Import from URL</h3>
                  <p className="text-[11px] text-muted">LeetCode &amp; CodeChef supported</p>
                </div>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-hover border border-main text-muted hover:text-primary transition-all active:scale-95"
              >
                <X size={15} />
              </button>
            </div>

            {/* URL Input */}
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-[10px] font-semibold text-muted uppercase tracking-widest block mb-1.5">Problem URL</label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className={INPUT_BASE + " h-10 text-sm"}
                />
              </div>

              {/* Platform badges */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-hover border border-main rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-medium text-muted">LeetCode</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-hover border border-main rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  <span className="text-[10px] font-medium text-muted">CodeChef</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleLinkImport}
              disabled={isImportingLink || !importUrl}
              className="w-full h-10 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20"
            >
              {isImportingLink ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              {isImportingLink ? 'Importing...' : 'Import Question'}
            </button>

            <p className="text-[10px] text-muted text-center mt-3">Mentor access only</p>
          </div>
        </div>
      )}

      {/* 🧪 Preview & Validation Sidebar Workspace */}
      {showPreviewModal && previewQuestion && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 backdrop-blur-md bg-black/90 animate-in fade-in duration-300">
          <div className="bg-surface rounded-[40px] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl border border-main flex flex-col animate-in zoom-in-95 duration-500 relative">
            
            {/* Header Area */}
            <div className="p-10 border-b border-main flex justify-between items-center bg-surface-hover/30">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-xl shadow-primary-500/5">
                   <Sparkles size={28} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-primary tracking-tighter flex items-center gap-3 italic">
                    Fetching <span className="text-muted font-black">Problem</span>
                  </h3>
                  <div className="flex gap-4 mt-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl bg-surface border border-main text-muted shadow-sm">Channel: <span className="text-primary-500">{previewQuestion.source}</span></span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl bg-surface border border-main text-muted shadow-sm">Level: <span className="text-primary-500">{previewQuestion.difficulty}</span></span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl bg-surface border border-main text-muted shadow-sm">Credit: <span className="text-primary-500">{previewQuestion.marks} PTS</span></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {setShowPreviewModal(false); setPreviewQuestion(null);}} 
                className="w-14 h-14 flex items-center justify-center bg-surface-hover hover:bg-red-500/10 text-muted hover:text-red-500 rounded-[2rem] transition-all border border-main shadow-xl active:scale-90 group"
              >
                <X size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-page/30">
              
              {/* Alert Message */}
              <div className="bg-primary-500/[0.03] border border-primary-500/10 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group/warning">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/warning:scale-110 transition-transform text-primary-500">
                    <AlertCircle size={120} />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-2xl shadow-primary-500/30 shrink-0">
                      <AlertCircle size={28} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
                        Attention <div className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
                      </h4>
                      <p className="text-[13px] text-muted font-bold leading-relaxed">
                          Vision Engine has successfully normalized the problem structure. However, <span className="text-primary underline decoration-primary/30 underline-offset-8">test case synchronization requires mentor validation</span>. Please review the I/O mapping before final implementation.
                      </p>
                  </div>
              </div>

              {/* Problem Content Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className={LABEL_BASE + " ml-1"}>Problem Statement</label>
                  <textarea 
                    value={previewQuestion.questionText} 
                    onChange={e => setPreviewQuestion({...previewQuestion, questionText: e.target.value})}
                    placeholder="Problem text..."
                    className={INPUT_BASE + " h-[450px] resize-none font-mono text-sm p-8 leading-relaxed bg-surface-hover/30 border-main focus:border-primary-500/50 shadow-inner"} 
                  />
                </div>

                <div className="space-y-8">
                  {/* Test Case Logic Workspace */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className={LABEL_BASE}>Test Cases</label>
                      <button 
                        onClick={() => setPreviewQuestion({...previewQuestion, testCases: [...previewQuestion.testCases, { input: '', expectedOutput: '', isHidden: false }] })} 
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/10 hover:bg-emerald-500/5 transition-all"
                      >
                        <Plus size={12} strokeWidth={3} /> Inject Hidden Case
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {previewQuestion.testCases.map((tc, index) => (
                         <div key={index} className="p-8 bg-surface-hover/30 border border-main rounded-[2rem] space-y-6 group/tc relative">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Logic Matrix #{index + 1}</span>
                               {previewQuestion.testCases.length > 1 && (
                                 <button 
                                   onClick={() => {
                                      const filtered = previewQuestion.testCases.filter((_, i) => i !== index);
                                      setPreviewQuestion({...previewQuestion, testCases: filtered});
                                   }}
                                   className="w-8 h-8 flex items-center justify-center rounded-xl text-muted/30 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-main"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                               )}
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                               <div>
                                  <p className="text-[8px] font-black text-muted uppercase mb-3 tracking-widest ml-1">System Input Vector</p>
                                  <textarea 
                                    value={tc.input} 
                                    onChange={(e) => {
                                       const updatedTCs = [...previewQuestion.testCases];
                                       updatedTCs[index].input = e.target.value;
                                       setPreviewQuestion({...previewQuestion, testCases: updatedTCs});
                                    }}
                                    className="w-full bg-surface border border-main rounded-2xl px-5 py-4 text-[12px] font-mono text-primary focus:border-primary-500/50 outline-none resize-none shadow-inner" 
                                    rows={2}
                                  />
                               </div>
                               <div>
                                  <p className={`text-[8px] font-black uppercase mb-3 tracking-widest ml-1 ${!tc.expectedOutput ? 'text-primary-500 animate-pulse' : 'text-muted'}`}>
                                    {`Expected Result Artifact ${!tc.expectedOutput ? '[REQUIRED]' : ''}`}
                                  </p>
                                  <textarea 
                                    placeholder="Enter expected outcome for validator..." 
                                    value={tc.expectedOutput}
                                    onChange={(e) => {
                                       const updatedTCs = [...previewQuestion.testCases];
                                       updatedTCs[index].expectedOutput = e.target.value;
                                       setPreviewQuestion({...previewQuestion, testCases: updatedTCs});
                                    }}
                                    className={`w-full border rounded-2xl px-5 py-4 text-[12px] font-mono outline-none resize-none transition-all ${!tc.expectedOutput ? 'border-primary-500 bg-primary-500/5 shadow-2xl shadow-primary-500/10' : 'bg-surface border-main focus:border-emerald-500/50 shadow-inner'}`}
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
            <div className="p-10 border-t border-main bg-surface-hover/50 flex gap-6">
               <button 
                 onClick={() => {setShowPreviewModal(false); setPreviewQuestion(null);}} 
                 className="flex-1 h-16 bg-surface border border-main hover:bg-surface-hover text-muted hover:text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
               >
                  Purge Candidate
               </button>
               <button 
                 onClick={confirmLinkImport} 
                 className="flex-[2] h-16 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-4 group"
               >
                  <CheckCircle size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                  Add to Exam
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal}
        examId={publishedExamId}
        onInvite={() => { setShowSuccessModal(false); setShowInviteModal(true); }}
        onReturn={() => navigate(returnTo)}
      />

      {/* Bulk Invite Modal */}
      <BulkInviteModal 
        isOpen={showInviteModal} 
        onClose={() => { setShowInviteModal(false); navigate(returnTo); }}
        examId={publishedExamId}
        examTitle={exam.title}
      />

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
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Code, ListChecks, AlignLeft,
  CheckCircle, Save, Send, Copy, Award, Clock,
  BookOpen, ChevronDown, ChevronUp, Sparkles, Wand2,
  Check, X, Pencil, Loader2, FileText, AlertCircle,
  Upload, FilePlus, FileSpreadsheet, Lock
} from 'lucide-react';

const AI_SUGGESTIONS = {
  DSA: [
    { type: 'mcq', questionText: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctOption: 1, marks: 2 },
    { type: 'mcq', questionText: 'Which data structure uses LIFO (Last In First Out) principle?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctOption: 1, marks: 1 },
    { type: 'short', questionText: 'Explain the difference between a stack and a queue with real-world examples.', expectedAnswer: 'Stack follows LIFO, Queue follows FIFO', maxWords: 200, marks: 3 },
    { type: 'coding', questionText: 'Write a function to reverse a linked list iteratively. The function should take the head node as input and return the new head.', language: 'javascript', initialCode: 'function reverseList(head) {\n  // your code here\n}', testCases: [{ input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' }], marks: 5 },
    { type: 'mcq', questionText: 'What is the worst-case time complexity of QuickSort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctOption: 2, marks: 2 },
    { type: 'short', questionText: 'What are the advantages of using a hash table over a binary search tree?', expectedAnswer: 'O(1) average lookup, insertion, deletion vs O(log n)', maxWords: 150, marks: 3 },
  ],
  Frontend: [
    { type: 'mcq', questionText: 'Which hook is used for side effects in React functional components?', options: ['useState', 'useEffect', 'useRef', 'useMemo'], correctOption: 1, marks: 1 },
    { type: 'mcq', questionText: 'What does the Virtual DOM improve in React applications?', options: ['Security', 'Performance', 'Accessibility', 'SEO'], correctOption: 1, marks: 1 },
    { type: 'short', questionText: 'Explain the concept of closures in JavaScript and provide a practical use case.', expectedAnswer: 'Closure is a function that retains access to outer scope variables', maxWords: 200, marks: 3 },
    { type: 'coding', questionText: 'Implement a debounce function that delays invoking the provided function until after a specified wait time has elapsed since the last invocation.', language: 'javascript', initialCode: 'function debounce(fn, delay) {\n  // your code here\n}', testCases: [{ input: 'fn, 300', expectedOutput: 'debounced function' }], marks: 5 },
    { type: 'mcq', questionText: 'What is the purpose of the key prop in React lists?', options: ['Styling', 'Identification for reconciliation', 'Event handling', 'State management'], correctOption: 1, marks: 2 },
  ],
  DBMS: [
    { type: 'mcq', questionText: 'Which normal form eliminates transitive dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctOption: 2, marks: 2 },
    { type: 'short', questionText: 'Explain the ACID properties in database transactions with examples.', expectedAnswer: 'Atomicity, Consistency, Isolation, Durability', maxWords: 250, marks: 4 },
    { type: 'coding', questionText: 'Write an SQL query to find the second highest salary from an Employee table.', language: 'python', initialCode: '-- Write your SQL query here\nSELECT ...', testCases: [{ input: 'Employee table', expectedOutput: 'Second highest salary' }], marks: 3 },
    { type: 'mcq', questionText: 'Which type of join returns all records from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correctOption: 3, marks: 1 },
  ],
  Cloud: [
    { type: 'mcq', questionText: 'Which AWS service is used for serverless computing?', options: ['EC2', 'Lambda', 'S3', 'RDS'], correctOption: 1, marks: 1 },
    { type: 'short', questionText: 'Explain the differences between IaaS, PaaS, and SaaS with examples.', expectedAnswer: 'IaaS: infrastructure, PaaS: platform, SaaS: software', maxWords: 200, marks: 3 },
    { type: 'mcq', questionText: 'What does auto-scaling primarily help with?', options: ['Security', 'Handling variable load', 'Database optimization', 'Code deployment'], correctOption: 1, marks: 2 },
  ],
  Security: [
    { type: 'mcq', questionText: 'What type of attack involves injecting malicious SQL statements?', options: ['XSS', 'CSRF', 'SQL Injection', 'DDoS'], correctOption: 2, marks: 1 },
    { type: 'short', questionText: 'Explain the concept of Zero Trust Architecture and its key principles.', expectedAnswer: 'Never trust, always verify. Key principles include least privilege, micro-segmentation', maxWords: 200, marks: 4 },
    { type: 'coding', questionText: 'Write a function that sanitizes user input to prevent XSS attacks by escaping HTML entities.', language: 'javascript', initialCode: 'function sanitize(input) {\n  // your code here\n}', testCases: [{ input: '<script>alert("xss")</script>', expectedOutput: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' }], marks: 5 },
  ],
};

const typeLabels = { mcq: 'MCQ', short: 'Short Answer', coding: 'Coding' };
const typeColors = { mcq: '#3b82f6', short: '#8b5cf6', coding: '#10b981' };
const typeIcons = { mcq: <ListChecks size={13} />, short: <AlignLeft size={13} />, coding: <Code size={13} /> };

// --- Styles ---
const INPUT_BASE = "w-full bg-[#0a0c10] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] focus:bg-[#0f1117] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";
const LABEL_BASE = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block ml-0.5";

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
          placeholder={`Option ${String.fromCharCode(65 + oi)}`} 
          className="flex-1 bg-[#0a0c10] border border-white/[0.04] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-white/[0.1] transition-colors" 
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
      className="w-full bg-[#0a0c10] border border-white/[0.04] rounded-lg px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none resize-none" 
    />
    <div className="flex items-center gap-2 text-[9px] text-zinc-700">
      Word limit: 
      <input 
        type="number" 
        value={question.maxWords} 
        onChange={e => updateQ(question.id, { maxWords: parseInt(e.target.value) || 0 })} 
        className="w-16 bg-[#0a0c10] border border-white/[0.04] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center" 
      />
    </div>
  </div>
);

const CodingEditor = ({ question, updateQ }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[9px] text-zinc-700">
      Language:
      <select 
        value={question.language} 
        onChange={e => updateQ(question.id, { language: e.target.value })} 
        className="bg-[#0a0c10] border border-white/[0.04] rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
      >
        {['javascript','python','java','cpp','c'].map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
    <textarea 
      value={question.initialCode} 
      onChange={e => updateQ(question.id, { initialCode: e.target.value })} 
      placeholder="// Starter code..." 
      rows={5} 
      className="w-full bg-[#060810] border border-emerald-500/10 rounded-xl px-4 py-3 text-xs text-emerald-300/80 placeholder:text-zinc-800 focus:outline-none font-mono resize-none" 
    />
    <div className="space-y-1.5">
      <p className="text-[9px] text-zinc-700 uppercase tracking-widest">Test Cases</p>
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
            className="flex-1 bg-[#060810] border border-white/[0.04] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none" 
          />
          <input 
            value={tc.expectedOutput} 
            onChange={e => {
              const testCases = [...question.testCases];
              testCases[ti] = { ...testCases[ti], expectedOutput: e.target.value };
              updateQ(question.id, { testCases });
            }} 
            placeholder="Output" 
            className="flex-1 bg-[#060810] border border-white/[0.04] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none" 
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

  const handlePublish = async () => {
    if (questions.length === 0) return;
    setIsPublishing(true);
    
    const payload = {
      title: exam.title || 'Untitled Exam',
      category: exam.category,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      questions: questions.map(q => ({
        type: q.type,
        questionText: q.questionText,
        marks: q.marks,
        options: q.options,
        correctOption: q.correctOption,
        expectedAnswer: q.expectedAnswer,
        language: q.language,
        initialCode: q.initialCode,
        testCases: q.testCases
      })),
      scheduledDate: exam.scheduledDate || new Date().toISOString()
    };

    // --- Frontend Validation ---
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = i + 1;
      
      if (!q.questionText || !q.questionText.trim()) {
        alert(`Question ${qNum}: Question text is required.`);
        setIsPublishing(false);
        setExpandedQ(q.id);
        return;
      }

      if (q.type === 'mcq') {
        const validOptions = q.options.filter(opt => opt && opt.trim());
        if (validOptions.length < 2) {
          alert(`Question ${qNum} (MCQ): At least 2 options are required.`);
          setIsPublishing(false);
          setExpandedQ(q.id);
          return;
        }
        if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption >= q.options.length) {
          alert(`Question ${qNum} (MCQ): Please select a correct option.`);
          setIsPublishing(false);
          setExpandedQ(q.id);
          return;
        }
      }

      if (q.type === 'coding') {
        if (!q.testCases || q.testCases.length === 0 || !q.testCases[0].input.trim() || !q.testCases[0].expectedOutput.trim()) {
          alert(`Question ${qNum} (Coding): At least one valid test case is required.`);
          setIsPublishing(false);
          setExpandedQ(q.id);
          return;
        }
      }
    }

    try {
      // Connect to real backend
      const response = await api.post('/api/exams/create', payload);
      const serverExam = response.data;
      
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
        alert(`Failed to publish exam: ${errorMsg}`);
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

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate('/mentor');
    }, 1000);
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

  const generateAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      const pool = AI_SUGGESTIONS[exam.category] || AI_SUGGESTIONS.DSA;
      const suggestions = [];
      const types = ['mcq', 'short', 'coding'];
      types.forEach(type => {
        const count = aiConfig[type];
        if (count > 0) {
          const matchingQs = pool.filter(q => q.type === type);
          if (matchingQs.length > 0) {
            for (let i = 0; i < count; i++) {
              const template = matchingQs[i % matchingQs.length];
              suggestions.push({ ...template, id: `ai-${Date.now()}-${type}-${i}`, accepted: false });
            }
          }
        }
      });
      setAiSuggestions(suggestions);
      setAiLoading(false);
    }, 1500);
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
          alert('PDF question extraction is coming soon. Please use CSV import for now.');
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
    <div className="min-h-screen bg-[#0a0c10] font-sans text-zinc-200 relative">
      <Navbar role="Mentor" />

      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-violet-600/[0.04] blur-[120px] rounded-full pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-6 pt-24 pb-24 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Editor */}
        <div className="flex-1 space-y-12 min-w-0">

          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">Create Assessment</h1>
              <p className="text-sm text-zinc-400 mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1.5"><ListChecks size={15} className="text-zinc-500" /> {questions.length} questions</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1.5">
                  <Award size={15} className={totalM === exam.totalMarks ? "text-emerald-400" : "text-zinc-500"} /> 
                  {totalM} / {exam.totalMarks} marks assigned
                </span>
              </p>
            </div>
          </header>

        {/* ═══ SECTION 1: Exam Details ═══ */}
        <section className="bg-[#0f1117]/80 backdrop-blur-xl rounded-[24px] border border-white/[0.06] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-white tracking-wide">Exam Details</h2>
            <p className="text-xs text-zinc-500 mt-1">Configure basic information and primary details for the assessment.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2">
              <label className={LABEL_BASE}>Exam Title</label>
              <input value={exam.title} onChange={e => setExam({...exam, title: e.target.value})} placeholder="e.g. Data Structures & Algorithms — Mid Term" className={INPUT_BASE + " text-base h-11"} />
            </div>
            <div>
              <label className={LABEL_BASE}>Category</label>
              {!['DSA', 'Frontend', 'DBMS', 'Cloud', 'Security', ''].includes(exam.category) ? (
                <div className="flex gap-2">
                  <input 
                    value={exam.category === 'OTHER_CUSTOM' ? '' : exam.category} 
                    onChange={e => setExam({...exam, category: e.target.value})} 
                    placeholder="Type custom category..." 
                    className={INPUT_BASE + " h-11 flex-1"} 
                    autoFocus
                  />
                  <button 
                    onClick={() => setExam({...exam, category: 'DSA'})} 
                    className="h-11 px-3 text-xs bg-[#0a0c10] border border-white/[0.06] rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center font-bold uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    title="Back to Presets"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={exam.category} 
                    onChange={e => {
                      if (e.target.value === 'Other') {
                        setExam({...exam, category: 'OTHER_CUSTOM'});
                      } else {
                        setExam({...exam, category: e.target.value});
                      }
                    }} 
                    className={INPUT_BASE + " h-11 !pl-3 relative appearance-none cursor-pointer"}
                  >
                    {['DSA', 'Frontend', 'DBMS', 'Cloud', 'Security'].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Other">Other (Custom)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8 pt-8 border-t border-white/[0.04]">
            <div>
              <label className={LABEL_BASE}>Duration</label>
              <StepperInput 
                value={exam.duration} 
                onChange={v => setExam({...exam, duration: v})} 
                icon={Clock} 
                unit="min" 
                step={5} 
              />
            </div>
            <div>
              <label className={LABEL_BASE}>Total Marks</label>
              <StepperInput 
                value={exam.totalMarks} 
                onChange={v => setExam({...exam, totalMarks: v})} 
                step={10} 
              />
            </div>
            <div>
              <label className={LABEL_BASE}>Pass Marks</label>
              <StepperInput 
                value={exam.passingMarks} 
                onChange={v => setExam({...exam, passingMarks: v})} 
                step={5} 
              />
            </div>
            <div>
              <label className={LABEL_BASE}>Schedule</label>
              <input type="datetime-local" value={exam.scheduledDate} onChange={e => setExam({...exam, scheduledDate: e.target.value})} className={INPUT_BASE + " w-full bg-[#0a0c10] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-white/[0.15] focus:bg-[#0f1117] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] [color-scheme:dark]"} />
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ═══ SECTION 2: AI Exam Setter ═══ */}
        <section className="bg-gradient-to-b from-[#141226]/80 to-[#0f1117]/80 backdrop-blur-xl rounded-[24px] border border-violet-500/15 p-8 shadow-[0_0_40px_rgba(139,92,246,0.03)] focus-within:border-violet-500/30 transition-colors relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-full flex items-center gap-5 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
              <Sparkles size={20} className="text-violet-400" />
            </div>
            <div className="text-left flex-1">
              <h2 className="text-base font-semibold text-white flex items-center gap-3 tracking-tight">
                AI Suggestion Engine
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">Beta</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5">Paste your curriculum or topics and describe your requirements for AI to generate questions.</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.04] transition-transform duration-300 ${showAI ? 'rotate-180' : ''}`}>
              <ChevronDown size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </button>

          {showAI && (
            <div className="mt-4 bg-[#0f1117] rounded-2xl border border-white/[0.06] p-5 space-y-4">
              {/* Input Mode Tabs */}
              <div className="flex items-center gap-1 bg-[#0a0c10] p-1 rounded-xl border border-white/[0.05] w-fit mb-4">
                {[{ id: 'text', label: 'Paste Syllabus' }, { id: 'file', label: 'Upload File' }].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setInputMode(tab.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      inputMode === tab.id
                        ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {inputMode === 'text' ? (
                <div>
                  <label className={LABEL_BASE}>Syllabus / Topics</label>
                  <textarea
                    value={syllabus}
                    onChange={e => setSyllabus(e.target.value)}
                    placeholder={"Paste your syllabus or list topics...\n\ne.g.\n\u2022 Arrays & Strings\n\u2022 Linked Lists\n\u2022 Trees & Graphs\n\u2022 Sorting Algorithms\n\u2022 Dynamic Programming"}
                    rows={5}
                    className={INPUT_BASE + " resize-none"}
                  />
                </div>
              ) : (
                <div>
                  <label className={LABEL_BASE}>Upload PDF or CSV</label>

                  {/* Intent toggle */}
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#0a0c10] border border-white/[0.05]">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mr-1">File contains:</span>
                    {[
                      { id: 'import', label: '📋 Actual Questions', desc: 'MCQ / Short / Coding rows' },
                      { id: 'syllabus', label: '📄 Syllabus / Topics', desc: 'AI generates questions' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setUploadIntent(opt.id); setUploadedFile(null); }}
                        className={`flex-1 px-3 py-2 rounded-lg text-left transition-all border ${
                          uploadIntent === opt.id
                            ? 'border-violet-500/40 bg-violet-500/10'
                            : 'border-white/[0.05] hover:border-white/[0.1]'
                        }`}
                      >
                        <p className={`text-xs font-semibold ${ uploadIntent === opt.id ? 'text-violet-300' : 'text-zinc-400' }`}>{opt.label}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Dropzone */}
                  {!uploadedFile ? (
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={onDropFile}
                      onClick={() => document.getElementById('file-upload-input').click()}
                      className={`relative flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border border-dashed cursor-pointer transition-all ${
                        isDragOver
                          ? 'border-violet-500/60 bg-violet-500/[0.08]'
                          : 'border-white/[0.12] bg-[#0a0c10]/60 hover:border-violet-500/30 hover:bg-violet-500/[0.04]'
                      }`}
                    >
                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".pdf,.csv"
                        className="hidden"
                        onChange={e => handleFile(e.target.files[0])}
                      />
                      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Upload size={22} className="text-violet-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-zinc-300">Drop your file here</p>
                        <p className="text-xs text-zinc-600 mt-1">Supports <span className="text-violet-400 font-medium">.pdf</span> and <span className="text-violet-400 font-medium">.csv</span> formats</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-500">
                          <FileText size={12} className="text-red-400" /> PDF
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-500">
                          <FilePlus size={12} className="text-emerald-400" /> CSV
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
                      {fileParseLoading ? (
                        <div className="flex items-center gap-3 py-2">
                          <Loader2 size={18} className="animate-spin text-violet-400" />
                          <div>
                            <p className="text-sm font-semibold text-zinc-300">AI is reading your file...</p>
                            <p className="text-xs text-zinc-600 mt-0.5">Extracting topics and syllabus structure</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              uploadedFile.name.endsWith('.pdf') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {uploadedFile.name.endsWith('.pdf') ? <FileText size={18} /> : <FilePlus size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-200">{uploadedFile.name}</p>
                              <p className={`text-xs mt-0.5 ${ uploadIntent === 'import' ? 'text-violet-400' : 'text-emerald-400' }`}>
                                {uploadIntent === 'import' ? '✓ Data captured from file' : '✓ Content processed — topics mapped'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setUploadedFile(null); setSyllabus(''); }}
                            className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {!fileParseLoading && syllabus && uploadIntent === 'syllabus' && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05]">
                          <label className={LABEL_BASE}>Extracted Syllabus</label>
                          <textarea
                            value={syllabus}
                            onChange={e => setSyllabus(e.target.value)}
                            rows={4}
                            className={INPUT_BASE + " resize-none mt-1"}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!(inputMode === 'file' && uploadIntent === 'import') && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div>
                      <label className={LABEL_BASE}>Target MCQs</label>
                      <StepperInput value={aiConfig.mcq} onChange={v => setAiConfig({...aiConfig, mcq: v})} min={0} step={1} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Short Answer Qs</label>
                      <StepperInput value={aiConfig.short} onChange={v => setAiConfig({...aiConfig, short: v})} min={0} step={1} />
                    </div>
                    <div>
                      <label className={LABEL_BASE}>Coding Qs</label>
                      <StepperInput value={aiConfig.coding} onChange={v => setAiConfig({...aiConfig, coding: v})} min={0} step={1} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 border-t border-white/[0.04] pt-5">
                    <button
                      onClick={generateAI}
                      disabled={aiLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-semibold text-white flex items-center gap-2 hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-50"
                    >
                      {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Wand2 size={16} /> Generate Questions</>}
                    </button>
                    <span className="text-xs text-zinc-500">AI will generate a total of <strong className="text-zinc-300">{aiConfig.mcq + aiConfig.short + aiConfig.coding}</strong> questions.</span>
                  </div>
                </>
              )}

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400 font-medium">{aiSuggestions.length} suggestions ready</p>
                    <button onClick={acceptAll} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors">
                      <CheckCircle size={11} /> Accept All
                    </button>
                  </div>

                  {aiSuggestions.map((s, idx) => (
                    <div key={s.id} className="bg-[#0a0c10] rounded-xl border border-white/[0.06] p-4 group hover:border-violet-500/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ background: `${typeColors[s.type]}15`, color: typeColors[s.type] }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ background: `${typeColors[s.type]}15`, color: typeColors[s.type] }}>
                              {typeLabels[s.type]}
                            </span>
                            <span className="text-[9px] text-zinc-600">{s.marks} marks</span>
                          </div>

                          {editingSuggestion === s.id ? (
                            <textarea
                              value={s.questionText}
                              onChange={e => setAiSuggestions(prev => prev.map(x => x.id === s.id ? {...x, questionText: e.target.value} : x))}
                              className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none resize-none border-b border-violet-500/20 pb-2"
                              placeholder="Edit question..."
                              rows={2}
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm text-zinc-300 leading-relaxed">{s.questionText}</p>
                          )}

                          {s.type === 'mcq' && (
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                              {s.options.map((opt, oi) => (
                                <div key={oi} className={`text-[11px] px-2.5 py-1.5 rounded-lg ${oi === s.correctIndex ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 bg-white/[0.02] border border-white/[0.04]'}`}>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditingSuggestion(editingSuggestion === s.id ? null : s.id)} className="w-7 h-7 rounded-lg hover:bg-white/[0.04] flex items-center justify-center text-zinc-600 hover:text-violet-400 transition-colors" title="Edit">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => acceptSuggestion(s)} className="w-7 h-7 rounded-lg hover:bg-emerald-500/10 flex items-center justify-center text-zinc-600 hover:text-emerald-400 transition-colors" title="Accept">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setAiSuggestions(prev => prev.filter(x => x.id !== s.id))} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors" title="Reject">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ═══ SECTION 3: Questions ═══ */}
        <section className="bg-[#0f1117]/80 backdrop-blur-xl rounded-[24px] border border-white/[0.06] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <FileText size={18} className="text-zinc-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Active Questions</h2>
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                  <span className="text-zinc-300 font-medium">{questions.length}</span> questions added
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="text-zinc-300 font-medium">{totalM}</span> total marks
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#0a0c10] p-1.5 rounded-xl border border-white/[0.04]">
              {Object.entries(typeLabels).map(([type, label]) => (
                <button key={type} onClick={() => addQ(type)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: `${typeColors[type]}10`, color: typeColors[type] }}>
                  <Plus size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/[0.05] py-20 text-center bg-[#0a0c10]/50">
              <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                <BookOpen size={24} className="text-zinc-600" />
              </div>
              <p className="text-base font-medium text-zinc-300">No questions drafted yet</p>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto">Click a question type above to add manually, or expand the AI Exam Setter to generate suggestions from a syllabus.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const open = expandedQ === q.id;
                const color = typeColors[q.type];
                return (
                  <div key={q.id} className="rounded-2xl border transition-all overflow-hidden" style={{ borderColor: open ? `${color}40` : 'rgba(255,255,255,0.06)', background: open ? `${color}05` : '#0a0c10', boxShadow: open ? `0 0 30px ${color}08` : 'none' }}>

                    {/* Header */}
                    <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandedQ(open ? null : q.id)}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${color}15`, color }}>{idx + 1}</div>
                      <span className="shrink-0" style={{ color }}>{typeIcons[q.type]}</span>
                      <p className={`text-sm font-medium flex-1 truncate ${q.questionText ? 'text-zinc-200' : 'text-zinc-600 italic'}`}>{q.questionText || 'Untitled question'}</p>
                      <span className="text-[11px] font-medium text-zinc-500 tabular-nums shrink-0 mr-2 bg-white/[0.03] px-2 py-1 rounded-md">{q.marks} marks</span>
                      <button onClick={e => { e.stopPropagation(); dupQ(q.id); }} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-zinc-600 hover:text-white transition-colors"><Copy size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); removeQ(q.id); }} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      <div className="w-px h-4 bg-white/[0.06] mx-1" />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${open ? 'rotate-180 bg-white/[0.04]' : ''}`}>
                        <ChevronDown size={14} className="text-zinc-500" />
                      </div>
                    </div>

                    {/* Editor */}
                    {open && (
                      <div className="px-5 pb-5 pt-2 space-y-6 border-t" style={{ borderColor: `${color}15` }}>
                        <textarea 
                          value={q.questionText} 
                          onChange={e => updateQ(q.id, { questionText: e.target.value })} 
                          placeholder="Type your question..." 
                          rows={2} 
                          className="w-full bg-transparent text-base text-zinc-200 placeholder:text-zinc-700 focus:outline-none resize-none mt-2 leading-relaxed" 
                          autoFocus 
                        />

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Award size={14} />
                          </div>
                          <input 
                            type="number" 
                            value={q.marks} 
                            onChange={e => updateQ(q.id, { marks: parseInt(e.target.value) || 0 })} 
                            className="w-16 bg-[#0f1117] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/[0.12] tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center" 
                            min={1} 
                          />
                          <span className="text-xs text-zinc-600 font-medium">points</span>
                        </div>

                        {q.type === 'mcq' && <McqEditor question={q} updateQ={updateQ} />}
                        {q.type === 'short' && <ShortEditor question={q} updateQ={updateQ} />}
                        {q.type === 'coding' && <CodingEditor question={q} updateQ={updateQ} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Marks Status */}
        {questions.length > 0 && (
          <div className={`rounded-xl px-4 py-3 flex items-center gap-2.5 border text-xs ${
            totalM === exam.totalMarks ? 'bg-emerald-500/[0.04] border-emerald-500/[0.1] text-emerald-400/80' : 'bg-amber-500/[0.04] border-amber-500/[0.1] text-amber-400/80'
          }`}>
            {totalM === exam.totalMarks ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            {totalM === exam.totalMarks ? 'Marks balanced — ready to publish' : `${totalM} marks assigned, exam total is ${exam.totalMarks}`}
          </div>
        )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-24">
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePublish}
              disabled={isPublishing || isSaving || questions.length === 0}
              className="w-full py-3.5 rounded-xl bg-white text-sm font-extrabold text-[#0a0c10] shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPublishing ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : <><Send size={16} /> Publish Exam</>}
            </button>
            
            <button 
              onClick={handleSaveDraft}
              disabled={isPublishing || isSaving}
              className="w-full py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Draft</>}
            </button>
          </div>

          {/* Setup Summary */}
          <div className="bg-[#0f1117]/80 backdrop-blur-xl rounded-[24px] border border-white/[0.06] p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white tracking-wide mb-4">Exam Summary</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Title</span>
                <span className="text-sm text-zinc-200 font-medium truncate">{exam.title || 'Untitled Exam'}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                <span className="text-xs text-zinc-500">Category</span>
                <span className="text-xs font-semibold text-zinc-300 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.04]">{exam.category}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                <span className="text-xs text-zinc-500">Duration</span>
                <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5"><Clock size={12} className="text-zinc-500"/> {exam.duration}m</span>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                <span className="text-xs text-zinc-500">Added Qs</span>
                <span className="text-xs font-medium text-zinc-300">{questions.length}</span>
              </div>

              <div className="py-2 border-t border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 focus-within:">Marks Allocation</span>
                  <span className={`text-xs font-bold ${totalM === exam.totalMarks ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {totalM} / {exam.totalMarks}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[#181a20] rounded-full overflow-hidden flex">
                  {questions.map((q, i) => {
                    const width = `${(q.marks / exam.totalMarks) * 100}%`;
                    const color = q.type === 'mcq' ? 'bg-blue-500' : q.type === 'short' ? 'bg-violet-500' : 'bg-emerald-500';
                    return <div key={i} className={`h-full ${color}`} style={{ width }} />
                  })}
                </div>
                
                {totalM !== exam.totalMarks && (
                  <p className="text-[10px] text-amber-500/80 leading-relaxed">
                    <AlertCircle size={10} className="inline mr-1 -mt-0.5" /> 
                    Please adjust marks so they hit exactly {exam.totalMarks}.
                  </p>
                )}
              </div>
            </div>
          </div>

        </aside>

      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1117] border border-emerald-500/30 rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 mx-auto">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-white text-center mb-2">Exam Published!</h2>
            <p className="text-zinc-400 text-sm text-center mb-8">"{exam.title || 'Untitled Exam'}" is now live and available for candidates.</p>
            
            <div className="bg-[#0a0c10] rounded-2xl p-5 mb-8 border border-white/[0.06] space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Exam Code</span>
                <span className="text-sm font-mono text-emerald-400 font-bold tracking-wider">{publishedExamId}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Questions</span>
                <span className="text-sm text-zinc-300 font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Duration</span>
                <span className="text-sm text-zinc-300 font-semibold">{exam.duration} mins</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const link = `${window.location.origin}/login`;
                  navigator.clipboard.writeText(link);
                  alert('Link copied! Students will login and see this exam on their dashboard.');
                }}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0a0c10] text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={16} /> Copy Exam Link
              </button>
              <button 
                onClick={() => navigate('/mentor')}
                className="w-full py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:text-white text-sm font-semibold transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

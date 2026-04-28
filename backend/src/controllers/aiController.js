const axios = require('axios');

/**
 * 🤖 AI Question Generator — Powered by Gemini
 * Generates MCQ, Short Answer, and Coding questions from syllabus/topics
 * 
 * POST /api/ai/generate
 * Body: { category, syllabus, config: { mcq, short, coding } }
 */
exports.generateQuestions = async (req, res) => {
    const { category, syllabus, config } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
        return res.status(503).json({
            success: false,
            error: 'AI Engine not configured. Please add GEMINI_API_KEY to your .env file.'
        });
    }

    if (!syllabus && !category) {
        return res.status(400).json({
            success: false,
            error: 'Please provide syllabus content or a category for question generation.'
        });
    }

    const mcqCount = Math.min(config?.mcq || 0, 20);
    const shortCount = Math.min(config?.short || 0, 15);
    const codingCount = Math.min(config?.coding || 0, 10);
    const reactCount = Math.min(config?.frontendReact || 0, 5);
    const totalCount = mcqCount + shortCount + codingCount + reactCount;
    const totalMarks = req.body.totalMarks || 100;

    if (totalCount === 0) {
        return res.status(400).json({
            success: false,
            error: 'Please specify at least one question type to generate.'
        });
    }

    try {
        const prompt = buildPrompt(category, syllabus, mcqCount, shortCount, codingCount, reactCount, totalMarks);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;

        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192
            }
        }, { timeout: 60000 });

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract JSON array from response (handle markdown wrapping)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('AI Response (no JSON found):', text.substring(0, 500));
            return res.status(500).json({
                success: false,
                error: 'AI generated a response but it could not be parsed. Please try again.'
            });
        }

        let questions;
        try {
            questions = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
            console.error('JSON Parse Error:', parseErr.message, '\nRaw:', jsonMatch[0].substring(0, 500));
            return res.status(500).json({
                success: false,
                error: 'AI response format was invalid. Please try again.'
            });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(500).json({
                success: false,
                error: 'AI returned empty results. Try providing more detailed syllabus content.'
            });
        }

        // Sanitize and normalize each question
        const sanitized = questions.map((q, i) => sanitizeQuestion(q, i)).filter(Boolean);

        console.log(`🤖 AI Generated ${sanitized.length} questions (MCQ: ${sanitized.filter(q => q.type === 'mcq').length}, Short: ${sanitized.filter(q => q.type === 'short').length}, Coding: ${sanitized.filter(q => q.type === 'coding').length}, React: ${sanitized.filter(q => q.type === 'frontend-react').length})`);

        res.json({
            success: true,
            questions: sanitized
        });

    } catch (error) {
        console.error('AI Generation Error:', error.response?.data || error.message);

        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                error: 'AI rate limit reached. Please wait a moment and try again.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to generate questions. AI service may be temporarily unavailable.'
        });
    }
};


// ─── Prompt Builder ────────────────────────────────────────

function buildPrompt(category, syllabus, mcqCount, shortCount, codingCount, reactCount, totalMarks) {
    const sections = [];

    if (mcqCount > 0) {
        sections.push(`
${mcqCount} MCQ questions. Each MCQ MUST have this exact structure:
{
  "type": "mcq",
  "questionText": "Clear, well-formed question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOption": 0,
  "marks": 1
}
- "correctOption" is the 0-based index of the correct answer (0=A, 1=B, 2=C, 3=D)
- Always provide exactly 4 options
- Make wrong options plausible but clearly incorrect
- Vary difficulty: some easy, some medium, some hard`);
    }

    if (shortCount > 0) {
        sections.push(`
${shortCount} Short Answer questions. Each MUST have this exact structure:
{
  "type": "short",
  "questionText": "Clear question requiring a brief written answer",
  "expectedAnswer": "Model answer or key concepts the student should mention",
  "maxWords": 150,
  "marks": 2
}
- expectedAnswer should be comprehensive enough for AI/keyword grading
- Questions should test understanding, not just recall`);
    }

    if (codingCount > 0) {
        sections.push(`
${codingCount} Coding questions. Each MUST have this exact structure:
{
  "type": "coding",
  "questionText": "Clear programming problem statement with input/output format",
  "language": "javascript",
  "initialCode": "// Write your solution here\\n",
  "testCases": [
    { "input": "sample input", "expectedOutput": "expected output", "isHidden": false },
    { "input": "hidden test input", "expectedOutput": "hidden expected output", "isHidden": true }
  ],
  "marks": 5
}
- Provide at least 2 test cases (1 visible, 1 hidden)
- Input/output should be string format (as if from stdin/stdout)
- Problems should be solvable in 15-30 minutes
- Cover edge cases in hidden test cases`);
    }

    if (reactCount > 0) {
        sections.push(`
${reactCount} React Lab (frontend-react) questions. Each MUST have this exact structure:
{
  "type": "frontend-react",
  "questionText": "Detailed UI/React problem statement",
  "frontendTemplate": {
    "files": {
      "/App.jsx": "import React from 'react';\\n\\nexport default function App() {\\n  return (\\n    <div>\\n      <h1>Hello World</h1>\\n    </div>\\n  );\\n}"
    },
    "mainFile": "/App.jsx"
  },
  "frontendTestCases": [
    { "description": "Should render Hello World", "testCode": "return document.querySelector('h1').textContent.includes('Hello World')", "isHidden": true }
  ],
  "marks": 10
}
- Focus on React hooks, component lifecycle, and state management
- Test cases should be JSDOM compatible`);
    }

    return `You are an expert exam question generator for a ${category || 'Computer Science'} assessment platform.

CONTEXT / SYLLABUS:
${syllabus || `General ${category || 'Computer Science'} topics`}

TASK: Generate the following questions based on the above syllabus/topics:
${sections.join('\n')}

CRITICAL RULES:
1. Respond ONLY with a valid JSON array of question objects. NO markdown, NO explanation, NO text outside the array.
2. Each question must follow the EXACT structure shown above for its type.
3. DISTRIBUTE MARKS: The total sum of "marks" across all generated questions MUST equal ${totalMarks}. Assign higher marks to Coding/React and lower to MCQs.
4. Questions must be directly relevant to the provided syllabus/topics.
5. Questions should vary in difficulty (easy, medium, hard).
6. Do NOT repeat similar questions.
7. All question text must be in English.
8. For MCQs, ensure correctOption is a valid index (0-3).
9. For coding, ensure test case inputs and outputs are realistic and consistent.

RESPOND WITH ONLY THE JSON ARRAY:`;
}


// ─── Question Sanitizer ───────────────────────────────────

function sanitizeQuestion(q, index) {
    if (!q || !q.type || !q.questionText) return null;

    const base = {
        id: `ai-${Date.now()}-${index}`,
        questionText: String(q.questionText).trim(),
        marks: Math.max(1, Number(q.marks) || 1),
        _aiGenerated: true
    };

    if (q.type === 'mcq') {
        const options = Array.isArray(q.options) ? q.options.map(String) : ['', '', '', ''];
        // Ensure exactly 4 options
        while (options.length < 4) options.push('');

        let correctOption = Number(q.correctOption);
        if (isNaN(correctOption) || correctOption < 0 || correctOption >= options.length) {
            correctOption = 0;
        }

        return {
            ...base,
            type: 'mcq',
            options: options.slice(0, 4),
            correctOption,
            marks: base.marks || 1
        };
    }

    if (q.type === 'short') {
        return {
            ...base,
            type: 'short',
            expectedAnswer: String(q.expectedAnswer || '').trim(),
            maxWords: Math.max(50, Number(q.maxWords) || 150),
            marks: base.marks || 2
        };
    }

    if (q.type === 'coding') {
        const testCases = Array.isArray(q.testCases)
            ? q.testCases.map(tc => ({
                input: String(tc.input || ''),
                expectedOutput: String(tc.expectedOutput || ''),
                isHidden: Boolean(tc.isHidden)
            }))
            : [{ input: '', expectedOutput: '', isHidden: false }];

        return {
            ...base,
            type: 'coding',
            language: q.language || 'javascript',
            initialCode: q.initialCode || '// Write your solution here\n',
            testCases,
            marks: base.marks || 5
        };
    }

    if (q.type === 'frontend-react') {
        const files = (q.frontendTemplate && q.frontendTemplate.files) || { '/App.jsx': '// React code\n' };
        const testCases = Array.isArray(q.frontendTestCases) ? q.frontendTestCases : [];

        return {
            ...base,
            type: 'frontend-react',
            frontendTemplate: {
                files,
                mainFile: q.frontendTemplate?.mainFile || '/App.jsx'
            },
            frontendTestCases: testCases.map(tc => ({
                description: String(tc.description || 'UI Test'),
                testCode: String(tc.testCode || ''),
                isHidden: tc.isHidden !== undefined ? Boolean(tc.isHidden) : true
            })),
            marks: base.marks || 10
        };
    }

    return null;
}

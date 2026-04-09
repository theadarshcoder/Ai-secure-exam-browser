// ─────────────────────────────────────────────────────────
// gradingService.js — Centralized Grading Logic
// Handles MCQ, Coding (Judge0), and Short Answer (AI/Keyword)
// ─────────────────────────────────────────────────────────

const { executeCode } = require('./judge0');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════
//  1. MCQ Grading — Instant, deterministic
// ═══════════════════════════════════════════════════════════
function gradeMCQ(question, studentAnswer) {
    const maxMarks = question.marks || 1;
    
    if (studentAnswer === undefined || studentAnswer === null) {
        return {
            marksObtained: 0,
            maxMarks,
            status: 'incorrect',
            studentChoice: null,
            correctChoice: question.correctOption
        };
    }

    const isCorrect = Number(studentAnswer) === Number(question.correctOption);
    
    return {
        marksObtained: isCorrect ? maxMarks : 0,
        maxMarks,
        status: isCorrect ? 'correct' : 'incorrect',
        studentChoice: Number(studentAnswer),
        correctChoice: question.correctOption
    };
}


// ═══════════════════════════════════════════════════════════
//  2. Coding Grading — Run code against test cases via Judge0
// ═══════════════════════════════════════════════════════════
async function gradeCoding(question, studentCode) {
    const maxMarks = question.marks || 1;
    const testCases = question.testCases || [];
    
    if (!studentCode || !studentCode.trim()) {
        return {
            marksObtained: 0,
            maxMarks,
            status: 'incorrect',
            testCaseResults: testCases.map((_, i) => ({
                testCaseIndex: i,
                passed: false,
                input: '',
                expectedOutput: '',
                actualOutput: '',
                error: 'No code submitted'
            }))
        };
    }

    if (testCases.length === 0) {
        // No test cases defined — give full marks (trust the submission)
        return {
            marksObtained: maxMarks,
            maxMarks,
            status: 'correct',
            testCaseResults: []
        };
    }

    const language = question.language || 'javascript';
    const testCaseResults = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        try {
            const result = await executeCode(studentCode, language, tc.input);

            if (result.success) {
                const passed = result.output.trim() === tc.expectedOutput.trim();
                if (passed) passedCount++;

                testCaseResults.push({
                    testCaseIndex: i,
                    passed,
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                    actualOutput: tc.isHidden ? 'Hidden' : result.output.trim(),
                    error: ''
                });
            } else {
                testCaseResults.push({
                    testCaseIndex: i,
                    passed: false,
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                    actualOutput: '',
                    error: result.error || result.status || 'Execution failed'
                });
                // Stop on first compilation error (don't waste API calls)
                if (result.error && result.error.includes('Compilation')) break;
            }
        } catch (err) {
            testCaseResults.push({
                testCaseIndex: i,
                passed: false,
                input: tc.isHidden ? 'Hidden' : tc.input,
                expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                actualOutput: '',
                error: err.message || 'Judge0 execution error'
            });
            break; // Stop on execution failure
        }
    }

    // Proportional marks based on test cases passed
    const proportion = testCases.length > 0 ? passedCount / testCases.length : 0;
    const marksObtained = Math.round(proportion * maxMarks);

    let status = 'incorrect';
    if (passedCount === testCases.length) status = 'correct';
    else if (passedCount > 0) status = 'partial';

    return {
        marksObtained,
        maxMarks,
        status,
        testCaseResults
    };
}


// ═══════════════════════════════════════════════════════════
//  3. Short Answer Grading — AI Suggestion + Pending Review
// ═══════════════════════════════════════════════════════════
async function gradeShortAnswer(question, studentAnswer) {
    const maxMarks = question.marks || 1;
    
    if (!studentAnswer || !studentAnswer.trim()) {
        return {
            marksObtained: 0,
            maxMarks,
            status: 'pending_review',
            aiSuggestedMarks: 0,
            aiReasoning: 'Student did not provide an answer.'
        };
    }

    const expectedAnswer = question.expectedAnswer || '';
    
    // Try AI grading first (Gemini or OpenAI)
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
        try {
            const aiResult = await gradeWithGemini(geminiKey, question.questionText, expectedAnswer, studentAnswer, maxMarks);
            return {
                marksObtained: 0, // AI suggests, mentor finalizes
                maxMarks,
                status: 'pending_review',
                aiSuggestedMarks: aiResult.suggestedMarks,
                aiReasoning: aiResult.reasoning
            };
        } catch (err) {
            console.error('Gemini AI grading failed, falling back to keyword match:', err.message);
        }
    }

    if (openaiKey) {
        try {
            const aiResult = await gradeWithOpenAI(openaiKey, question.questionText, expectedAnswer, studentAnswer, maxMarks);
            return {
                marksObtained: 0,
                maxMarks,
                status: 'pending_review',
                aiSuggestedMarks: aiResult.suggestedMarks,
                aiReasoning: aiResult.reasoning
            };
        } catch (err) {
            console.error('OpenAI grading failed, falling back to keyword match:', err.message);
        }
    }

    // Fallback: Keyword matching
    const keywordResult = gradeWithKeywords(expectedAnswer, studentAnswer, maxMarks);
    return {
        marksObtained: 0, // Still pending mentor review
        maxMarks,
        status: 'pending_review',
        aiSuggestedMarks: keywordResult.suggestedMarks,
        aiReasoning: keywordResult.reasoning
    };
}


// ─── AI Providers ────────────────────────────────────────

async function gradeWithGemini(apiKey, questionText, expectedAnswer, studentAnswer, maxMarks) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const prompt = `You are a strict exam evaluator. Compare the student's answer with the expected answer.

Question: ${questionText}
Expected Answer: ${expectedAnswer}
Student's Answer: ${studentAnswer}
Maximum Marks: ${maxMarks}

Evaluate the student's answer for conceptual accuracy, completeness, and relevance.
Respond ONLY in valid JSON format (no markdown):
{"suggestedMarks": <number between 0 and ${maxMarks}>, "reasoning": "<brief 1-2 line explanation>"}`;

    const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }]
    }, { timeout: 15000 });

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            suggestedMarks: Math.min(Math.max(Number(parsed.suggestedMarks) || 0, 0), maxMarks),
            reasoning: parsed.reasoning || 'AI evaluation completed.'
        };
    }
    throw new Error('Failed to parse Gemini response');
}

async function gradeWithOpenAI(apiKey, questionText, expectedAnswer, studentAnswer, maxMarks) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const prompt = `You are a strict exam evaluator. Compare the student's answer with the expected answer.

Question: ${questionText}
Expected Answer: ${expectedAnswer}
Student's Answer: ${studentAnswer}
Maximum Marks: ${maxMarks}

Evaluate the student's answer for conceptual accuracy, completeness, and relevance.
Respond ONLY in valid JSON format:
{"suggestedMarks": <number between 0 and ${maxMarks}>, "reasoning": "<brief 1-2 line explanation>"}`;

    const response = await axios.post(url, {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
    }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 15000
    });

    const text = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            suggestedMarks: Math.min(Math.max(Number(parsed.suggestedMarks) || 0, 0), maxMarks),
            reasoning: parsed.reasoning || 'AI evaluation completed.'
        };
    }
    throw new Error('Failed to parse OpenAI response');
}


// ─── Keyword Matching Fallback ───────────────────────────
function gradeWithKeywords(expectedAnswer, studentAnswer, maxMarks) {
    if (!expectedAnswer) {
        return {
            suggestedMarks: 0,
            reasoning: 'No expected answer configured for this question. Manual review required.'
        };
    }

    // Extract meaningful keywords (3+ chars, excluding common stop words)
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'not', 'from', 'by', 'as']);
    
    const extractKeywords = (text) => {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length >= 3 && !stopWords.has(w));
    };

    const expectedKeywords = [...new Set(extractKeywords(expectedAnswer))];
    const studentWords = new Set(extractKeywords(studentAnswer));

    if (expectedKeywords.length === 0) {
        return {
            suggestedMarks: 0,
            reasoning: 'Could not extract keywords from expected answer. Manual review required.'
        };
    }

    const matchedCount = expectedKeywords.filter(k => studentWords.has(k)).length;
    const matchRatio = matchedCount / expectedKeywords.length;
    const suggestedMarks = Math.round(matchRatio * maxMarks);

    return {
        suggestedMarks,
        reasoning: `Keyword match: ${matchedCount}/${expectedKeywords.length} keywords found (${Math.round(matchRatio * 100)}% match). Manual review recommended.`
    };
}


module.exports = { gradeMCQ, gradeCoding, gradeShortAnswer };

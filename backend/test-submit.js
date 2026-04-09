const mongoose = require('mongoose');
const ExamSession = require('./src/models/ExamSession');
const Exam = require('./src/models/Exam');
const { gradeMCQ, gradeCoding, gradeShortAnswer } = require('./src/services/gradingService');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const sessionId = "69d7eee413cd355e2a58efc6"; // from our previous dump
    const session = await ExamSession.findById(sessionId);
    if (!session) { console.log('Session not found'); return; }

    const examId = session.exam;
    const studentId = session.student;
    const finalAnswers = {}; // empty answers simulate what we saw
    
    const exam = await Exam.findById(examId);
    if (!exam) { console.log('Exam not found'); return; }

    const questionResults = [];
    let autoScore = 0;
    let hasShortAnswers = false;

    for (let index = 0; index < exam.questions.length; index++) {
        const q = exam.questions[index];
        const studentAnswer = finalAnswers[String(index)];

        if (q.type === 'mcq') {
            const result = gradeMCQ(q, studentAnswer);
            autoScore += result.marksObtained;
            questionResults.push({ questionIndex: index, type: 'mcq', ...result });
        } else if (q.type === 'coding') {
            try {
                const result = await gradeCoding(q, studentAnswer);
                autoScore += result.marksObtained;
                questionResults.push({ questionIndex: index, type: 'coding', ...result });
            } catch (err) {
                questionResults.push({
                    questionIndex: index, type: 'coding', marksObtained: 0,
                    maxMarks: q.marks || 1, status: 'pending_review', testCaseResults: [],
                    aiReasoning: 'Code execution service unavailable.'
                });
                hasShortAnswers = true;
            }
        } else if (q.type === 'short') {
            hasShortAnswers = true;
            try {
                const result = await gradeShortAnswer(q, studentAnswer);
                questionResults.push({ questionIndex: index, type: 'short', ...result });
            } catch (err) {
                questionResults.push({
                    questionIndex: index, type: 'short', marksObtained: 0,
                    maxMarks: q.marks || 1, status: 'pending_review', aiSuggestedMarks: null,
                    aiReasoning: 'AI evaluation unavailable.'
                });
            }
        }
    }

    const totalMarks = exam.totalMarks || 100;
    const finalStatus = hasShortAnswers ? 'pending_review' : 'submitted';
    const percentage = Math.round((autoScore / totalMarks) * 100);
    const passed = percentage >= (exam.passingMarks || 40);

    console.log("Updating session with:", { score: autoScore, percentage, passed, status: finalStatus, questionResultsCount: questionResults.length });

    const updatedSession = await ExamSession.findOneAndUpdate(
        { exam: examId, student: studentId },
        { 
            answers: finalAnswers, score: autoScore, totalMarks, percentage,
            passed: hasShortAnswers ? false : passed, status: finalStatus,
            requiresManualGrading: hasShortAnswers, questionResults,
            submittedAt: new Date()
        },
        { new: true }
    );
    
    console.log("Submit success!", updatedSession.status);

  } catch (err) {
    console.error("FATAL ERROR CAUGHT:", err);
  } finally {
    process.exit(0);
  }
}
run();

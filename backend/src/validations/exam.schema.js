const { z } = require('zod');

/**
 * 🎓 Exam Domain Schemas
 */

const startExamSchema = z.object({
    body: z.object({
        examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Exam ID format")
    }).strict()
});

const saveProgressSchema = z.object({
    body: z.object({
        examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Exam ID format"),
        answers: z.array(z.object({
            questionId: z.string(),
            answer: z.any(), // Can be string, number, or array depending on Q type
            type: z.enum(['mcq', 'short-answer', 'coding', 'frontend-react']),
            timeSpent: z.number().nonnegative().optional()
        })),
        currentQuestionIndex: z.number().nonnegative().optional(),
        timeRemaining: z.number().nonnegative().optional(),
        isAutoSave: z.boolean().optional()
    }).strict()
});

const submitExamSchema = z.object({
    body: z.object({
        examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Exam ID format"),
        finalAnswers: z.array(z.any()).optional() // Optional if already autosaved
    }).strict()
});

const incidentSchema = z.object({
    body: z.object({
        type: z.string().min(1),
        details: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
    }).strict()
});

module.exports = {
    startExamSchema,
    saveProgressSchema,
    submitExamSchema,
    incidentSchema
};

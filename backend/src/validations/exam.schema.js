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
        answers: z.record(z.any()).optional(),
        currentQuestionIndex: z.number().int().nonnegative().optional(),
        questionStates: z.record(z.any()).optional(),
        remainingTimeSeconds: z.number().int().nonnegative().optional(),
        lastUpdated: z.number().optional(),
        seq: z.number().optional()
    })
});

const submitExamSchema = z.object({
    body: z.object({
        examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Exam ID format"),
        answers: z.record(z.any()).optional(), // Changed from finalAnswers to answers to match frontend
        lastUpdated: z.number().optional()
    }) // Removed .strict() to resolve "Unrecognized key(s)" error
});

const exitExamSchema = z.object({
    body: z.object({
        examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Exam ID format"),
        exitPassword: z.string().min(1, "Password is required")
    }).strict()
});

const incidentSchema = z.object({
    body: z.object({
        examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Exam ID format"),
        type: z.string().min(1),
        details: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        studentId: z.string().optional(),
        studentName: z.string().optional(),
        id: z.string().optional(),
        timestamp: z.string().optional()
    })
});

module.exports = {
    startExamSchema,
    saveProgressSchema,
    submitExamSchema,
    exitExamSchema,
    incidentSchema
};

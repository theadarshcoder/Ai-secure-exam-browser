const { z } = require('zod');

/**
 * ⚙️ Queue Payload Schemas
 * Standardizes contracts between Controllers and Workers
 */

const codeGradingPayloadSchema = z.object({
    studentId: z.string().min(1),
    questionId: z.string().min(1),
    sourceCode: z.string().min(1),
    language: z.string().min(1),
    testCases: z.array(z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional()
    })),
    version: z.number().optional(),
    requestId: z.string().optional()
}).strict();

const frontendGradingPayloadSchema = z.object({
    studentId: z.string().min(1),
    questionId: z.string().min(1),
    codeFiles: z.record(z.string()), // Filename -> Content
    testCases: z.array(z.object({
        id: z.string(),
        description: z.string(),
        selector: z.string().optional(),
        expectedAction: z.string().optional(),
        expectedValue: z.string().optional(),
        type: z.string()
    })),
    version: z.number().optional(),
    requestId: z.string().optional()
}).strict();

module.exports = {
    codeGradingPayloadSchema,
    frontendGradingPayloadSchema
};

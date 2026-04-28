const { z } = require('zod');

/**
 * 🔐 Auth Domain Schemas
 * Enforces "No Garbage Policy" using .strict()
 */

const loginSchema = z.object({
    body: z.object({
        email: z.string().min(3, "Username/Email must be at least 3 characters").trim().toLowerCase(),
        password: z.string().min(4, "Password must be at least 4 characters"),
        role: z.enum(['student', 'mentor', 'admin']).optional(),
        deviceId: z.string().optional()
    }).strict()
});

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name is too short").trim(),
        email: z.string().email("Invalid email format").trim().toLowerCase(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(['student', 'mentor', 'super_mentor', 'admin']).optional()
    }).strict()
});

const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required")
    }).strict()
});

const inviteVerifySchema = z.object({
    body: z.object({
        token: z.string().min(1, "Invitation token is required")
    }).strict()
});

module.exports = {
    loginSchema,
    registerSchema,
    refreshSchema,
    inviteVerifySchema
};

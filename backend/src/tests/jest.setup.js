// 🛡️ Global Mocks for System Integrity Tests
jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('bullmq');

// Mock Rate Limiter to avoid Redis dependencies
jest.mock('../middlewares/rateLimiter', () => ({
    createRedisStore: jest.fn(),
    apiLimiter: (req, res, next) => next(),
    authLimiter: (req, res, next) => next(),
    examLimiter: (req, res, next) => next(),
    codeExecutionLimiter: (req, res, next) => next(),
    telemetryLimiter: (req, res, next) => next(),
    importLimiter: (req, res, next) => next(),
    autosaveLimiter: (req, res, next) => next(),
    secureActionLimiter: (req, res, next) => next(),
    inviteVerifyLimiter: (req, res, next) => next()
}));

// Mock JSDOM dependent services
jest.mock('../services/frontendGradingService', () => ({
    evaluateFrontendCode: jest.fn()
}));

// Mock uuid to avoid ESM issues
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-v4'
}));

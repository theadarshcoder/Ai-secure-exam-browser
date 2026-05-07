const pino = require('pino');

/**
 * Pino Logger Configuration
 * - Redacts sensitive data for security & compliance
 * - Uses JSON format in production for observability
 * - Uses pino-pretty in development for readability
 * - Standardizes error and request serialization
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // 🛡️ SECURITY: Redact sensitive fields from ALL logs
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'jwt',
      'refreshToken',
      'accessToken',
      'webhookSignature',
      'cardData',
      'set-cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'body.password',
      'body.token',
      '*.password',
      '*.token',
      '*.authorization'
    ],
    remove: true // Completely remove instead of replacing with [REDACTED] for tighter security
  },

  // 🔍 SERIALIZERS: Standardize how objects are logged
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      requestId: req.requestId
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },

  // 🌍 BASE FIELDS: Included in every log entry
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'vision-backend'
  },

  timestamp: pino.stdTimeFunctions.isoTime
}, 
// 🎨 TRANSPORT: Only use pino-pretty in non-production environments
process.env.NODE_ENV !== 'production' ? pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss Z',
    ignore: 'pid,hostname,env,service'
  }
}) : undefined);

module.exports = logger;

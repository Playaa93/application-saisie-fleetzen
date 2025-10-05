import winston from 'winston';

/**
 * Logger professionnel Winston (recommandé par Vercel pour Next.js 15)
 *
 * Utilisation:
 * ```typescript
 * logger.info({ userId: '123', action: 'login' }, 'User logged in');
 * logger.error({ error: err }, 'Failed to save intervention');
 * ```
 */

// Format personnalisé pour masquer les données sensibles
const redactFormat = winston.format((info) => {
  const redactPaths = [
    'password', 'token', 'accessToken', 'refreshToken',
    'email', 'ssn', 'creditCard', 'apiKey', 'secret',
    'session', 'sessionId',
  ];

  const redact = (obj: any, path = ''): any => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;

      // Vérifier si cette clé doit être redacted
      if (redactPaths.some(p => key.includes(p) || currentPath.includes(p))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redact(obj[key], currentPath);
      }
    }
    return obj;
  };

  return redact(info);
});

// Configuration par environnement
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    redactFormat(),
    winston.format.metadata({ fillWith: ['timestamp', 'service'] }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'fleetzen',
    env: process.env.NODE_ENV,
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        : winston.format.json(),
    }),
  ],
});

/**
 * Helper pour logger les erreurs avec contexte
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorObj = error instanceof Error
    ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    : { error: String(error) };

  logger.error({ ...errorObj, ...context });
}

/**
 * Helper pour logger les requêtes HTTP
 */
export function logRequest(method: string, url: string, statusCode: number, duration: number) {
  logger.info({
    method,
    url,
    statusCode,
    duration,
    type: 'http',
  });
}

/**
 * Helper pour logger les actions utilisateur
 */
export function logUserAction(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  logger.info({
    userId,
    action,
    ...metadata,
    type: 'user-action',
  });
}

export default logger;

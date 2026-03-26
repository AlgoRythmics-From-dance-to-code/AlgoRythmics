import pino, { Logger } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const createLogger = (): Logger => {
  return pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  });
};

// Use a global variable to persist the logger instance in development
// to avoid "MaxListenersExceededWarning" caused by HMR
const globalForLogger = global as unknown as { logger: Logger | undefined };

const logger = globalForLogger.logger || createLogger();

if (isDevelopment) {
  globalForLogger.logger = logger;
}

export default logger;

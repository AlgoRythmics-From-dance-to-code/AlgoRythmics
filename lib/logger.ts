import pino, { Logger } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

const createLogger = (): Logger => {
  if (isServer) {
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
  } else {
    // Fallback for browser-side usage (though we should avoid it)
    return {
      info: (...args: any[]) => console.log(...args),
      warn: (...args: any[]) => console.warn(...args),
      error: (...args: any[]) => console.error(...args),
      debug: (...args: any[]) => console.debug(...args),
      level: 'info',
    } as unknown as Logger;
  }
};

// Use a global variable to persist the logger instance in development
// to avoid "MaxListenersExceededWarning" caused by HMR
const globalForLogger = global as unknown as { logger: Logger | undefined };

const logger = (isServer ? (globalForLogger.logger || createLogger()) : createLogger());

if (isDevelopment && isServer) {
  globalForLogger.logger = logger;
}

export default logger;

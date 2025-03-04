import pino from 'pino';

// Define log levels
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Configure the logger
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV === 'test'
      ? undefined
      : process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname',
            },
          },
});

// Create a logger instance for each module
export const createLogger = (moduleName: string): any => {
  return logger.child({ module: moduleName });
};

// Default logger
export default logger;

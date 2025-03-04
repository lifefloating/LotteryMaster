import pino, { Logger, LoggerOptions } from 'pino';
import config from '../config';

// 日志级别
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// 设置某个级别后，只有该级别及更高级别的日志会被记录
const getLogLevel = (): LogLevel => {
  // 确保 LOG_LEVEL 存在且不为空
  if (config.LOG_LEVEL) {
    const configLogLevel = config.LOG_LEVEL.toLowerCase() as LogLevel;
    if (Object.values(LogLevel).includes(configLogLevel)) {
      return configLogLevel;
    }
  }

  // 默认值基于环境
  return config.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
};

// 创建日志选项
const getLoggerOptions = (): LoggerOptions => {
  // 基本配置
  const baseOptions: LoggerOptions = {
    level: getLogLevel(),
  };

  // 测试环境使用最简单的配置
  if (config.NODE_ENV === 'test') {
    return {
      ...baseOptions,
      enabled: true,
    };
  }

  // 开发环境使用美化输出
  if (config.NODE_ENV === 'development') {
    return {
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
    };
  }

  // 生产环境使用基本配置
  return baseOptions;
};

const rootLogger: Logger = pino(getLoggerOptions());

export const createLogger = (moduleName: string): Logger => {
  return rootLogger.child({ module: moduleName });
};

// 导出默认日志实例
export default rootLogger;

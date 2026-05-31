// utils/logger.ts
type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment: boolean;
  private prefix: string;

  constructor(prefix: string = '') {
    // Next.js compatible environment check
    this.isDevelopment = 
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_APP_ENV === "development";
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log in development
    if (this.isDevelopment) return true;
    
    // In production, only log errors and warnings
    const productionLogLevels: LogLevel[] = ['error', 'warn'];
    return productionLogLevels.includes(level);
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const timestamp = new Date().toISOString();
    const levelPrefix = `[${level.toUpperCase().padEnd(5)}]`;
    const prefix = this.prefix ? `${this.prefix} ` : '';
    
    return [`${timestamp} ${levelPrefix} ${prefix}`, ...args];
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', ...args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', ...args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', ...args));
    }
  }

  // Method for HTTP requests
  http(method: string, url: string, status?: number, data?: any): void {
    if (this.shouldLog('info')) {
      const statusText = status ? ` ${status}` : '';
      const statusEmoji = status && status >= 400 ? '❌' : '✅';
      console.info(...this.formatMessage('info', `${statusEmoji} ${method} ${url}${statusText}`, data || ''));
    }
  }

  // Method for authentication events
  auth(event: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', `🔐 ${event}`, ...args));
    }
  }

  // Method for performance tracking
  perf(operation: string, duration: number): void {
    if (this.shouldLog('debug')) {
      const emoji = duration > 1000 ? '🐢' : duration > 500 ? '⚠️' : '⚡';
      console.debug(...this.formatMessage('debug', `${emoji} ${operation} took ${duration}ms`));
    }
  }

  // Method for e-commerce specific events
  ecommerce(event: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', `🛒 ${event}`, data || ''));
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create named loggers for different parts of your app
export const createLogger = (prefix: string) => new Logger(prefix);

// Specific loggers for different modules
export const authLogger = createLogger('AUTH');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('DB');
export const cartLogger = createLogger('CART');
export const checkoutLogger = createLogger('CHECKOUT');
export const adminLogger = createLogger('ADMIN');
export const themeLogger = createLogger('THEME');
export const uiLogger = createLogger('UI');
export const stateLogger = createLogger('STATE');
export const proxyLogger = createLogger('PROXY')
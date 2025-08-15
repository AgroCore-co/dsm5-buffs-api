import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogContext {
  module?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private formatMessage(message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `${timestamp}${contextStr} ${message}`;
  }

  log(message: string, context?: LogContext) {
    console.log(this.formatMessage(`[INFO] ${message}`, context));
  }

  error(message: string, trace?: string, context?: LogContext) {
    console.error(this.formatMessage(`[ERROR] ${message}`, context));
    if (trace) {
      console.error(`[STACK] ${trace}`);
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage(`[WARN] ${message}`, context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(`[DEBUG] ${message}`, context));
    }
  }

  verbose(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage(`[VERBOSE] ${message}`, context));
    }
  }

  // Métodos específicos para diferentes tipos de logs
  logDatabaseOperation(operation: string, table: string, context?: LogContext) {
    this.log(`Database ${operation} on table ${table}`, context);
  }

  logApiRequest(method: string, url: string, userId?: string, context?: LogContext) {
    this.log(`API ${method} ${url}`, { ...context, userId });
  }

  logError(error: Error, context?: LogContext) {
    this.error(error.message, error.stack, context);
  }
}

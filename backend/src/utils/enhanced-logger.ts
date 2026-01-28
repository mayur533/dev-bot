/**
 * Enhanced Logger Utility
 * Provides advanced logging capabilities with structured output and multiple levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class EnhancedLogger {
  private static instance: EnhancedLogger;
  private logs: LogEntry[] = [];
  private maxLogSize: number = 10000;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  public static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setMaxLogSize(size: number): void {
    this.maxLogSize = size;
  }

  private createLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: {
        hostname: process.env.HOSTNAME || 'unknown',
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  public debug(message: string, context?: any): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(entry);
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  public info(message: string, context?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(entry);
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  public warn(message: string, context?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(entry);
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  public error(message: string, context?: any): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context);
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(entry);
      console.error(`[ERROR] ${message}`, context || '');
    }
  }

  public fatal(message: string, context?: any): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context);
    if (this.shouldLog(LogLevel.FATAL)) {
      this.addLog(entry);
      console.error(`[FATAL] ${message}`, context || '');
    }
  }

  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  public getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      const headers = ['timestamp', 'level', 'message', 'context'];
      const csvRows = [headers.join(',')];
      
      this.logs.forEach(log => {
        const row = [
          log.timestamp,
          LogLevel[log.level],
          `"${log.message.replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.context || {}).replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  public getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    oldestLog?: string;
    newestLog?: string;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : undefined,
      newestLog: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : undefined
    };

    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'number') {
        stats.byLevel[LogLevel[level]] = this.logs.filter(log => log.level === level).length;
      }
    });

    return stats;
  }
}

export const logger = EnhancedLogger.getInstance();

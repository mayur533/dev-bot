/**
 * Error Handler Utility
 * Centralized error handling and error reporting
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  timestamp: string;
  error: Error;
  context: ErrorContext;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReports: ErrorReport[] = [];
  private maxReports: number = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error, context: ErrorContext = {}, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      error,
      context,
      stackTrace: error.stack,
      severity
    };

    this.errorReports.push(report);
    this.maintainReportSize();

    // Log the error
    console.error(`[${severity.toUpperCase()}] ${error.message}`, {
      context,
      stackTrace: error.stack
    });
  }

  public getErrorReports(severity?: string, limit?: number): ErrorReport[] {
    let filteredReports = this.errorReports;

    if (severity) {
      filteredReports = this.errorReports.filter(report => report.severity === severity);
    }

    if (limit) {
      filteredReports = filteredReports.slice(-limit);
    }

    return filteredReports;
  }

  public getErrorStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    recent: number;
  } {
    const stats = {
      total: this.errorReports.length,
      bySeverity: {} as Record<string, number>,
      recent: 0
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.errorReports.forEach(report => {
      // Count by severity
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;

      // Count recent errors
      if (new Date(report.timestamp) > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  public clearErrorReports(): void {
    this.errorReports = [];
  }

  private maintainReportSize(): void {
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();

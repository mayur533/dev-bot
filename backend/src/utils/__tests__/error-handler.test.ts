/**
 * Tests for Error Handler Utility
 */

import { ErrorHandler, errorHandler } from '../error-handler';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = ErrorHandler.getInstance();
    handler.clearErrorReports();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors correctly', () => {
      const error = new Error('Test error');
      const context = { component: 'test', action: 'testing' };

      handler.handleError(error, context, 'high');

      const reports = handler.getErrorReports();
      expect(reports).toHaveLength(1);
      
      const report = reports[0];
      expect(report.error).toBe(error);
      expect(report.context).toEqual(context);
      expect(report.severity).toBe('high');
      expect(report.timestamp).toBeDefined();
    });

    it('should use default severity when not specified', () => {
      const error = new Error('Test error');
      
      handler.handleError(error);

      const reports = handler.getErrorReports();
      expect(reports[0].severity).toBe('medium');
    });
  });

  describe('Error Retrieval', () => {
    beforeEach(() => {
      handler.handleError(new Error('Low error'), {}, 'low');
      handler.handleError(new Error('High error'), {}, 'high');
      handler.handleError(new Error('Medium error'), {}, 'medium');
    });

    it('should filter errors by severity', () => {
      const highErrors = handler.getErrorReports('high');
      expect(highErrors).toHaveLength(1);
      expect(highErrors[0].error.message).toBe('High error');
    });

    it('should limit number of returned reports', () => {
      const limitedReports = handler.getErrorReports(undefined, 2);
      expect(limitedReports).toHaveLength(2);
    });
  });

  describe('Error Statistics', () => {
    it('should provide correct statistics', () => {
      handler.handleError(new Error('Error 1'), {}, 'low');
      handler.handleError(new Error('Error 2'), {}, 'high');
      handler.handleError(new Error('Error 3'), {}, 'high');

      const stats = handler.getErrorStatistics();

      expect(stats.total).toBe(3);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.bySeverity.high).toBe(2);
      expect(stats.bySeverity.medium || 0).toBe(0);
    });
  });

  describe('Clear Reports', () => {
    it('should clear all error reports', () => {
      handler.handleError(new Error('Test error'));
      expect(handler.getErrorReports()).toHaveLength(1);

      handler.clearErrorReports();
      expect(handler.getErrorReports()).toHaveLength(0);
    });
  });
});

describe('Global Error Handler Instance', () => {
  it('should provide a global error handler instance', () => {
    expect(errorHandler).toBeInstanceOf(ErrorHandler);
  });
});

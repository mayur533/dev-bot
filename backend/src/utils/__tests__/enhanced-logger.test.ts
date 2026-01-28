/**
 * Tests for Enhanced Logger Utility
 */

import { EnhancedLogger, logger, LogLevel } from '../enhanced-logger';

describe('EnhancedLogger', () => {
  let testLogger: EnhancedLogger;

  beforeEach(() => {
    testLogger = EnhancedLogger.getInstance();
    testLogger.clearLogs();
    testLogger.setLogLevel(LogLevel.DEBUG);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EnhancedLogger.getInstance();
      const instance2 = EnhancedLogger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Log Levels', () => {
    it('should respect log level settings', () => {
      testLogger.setLogLevel(LogLevel.ERROR);
      
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log messages at or above the set level', () => {
      testLogger.setLogLevel(LogLevel.WARN);
      
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      testLogger.error('Error message');
      testLogger.warn('Warning message');
      testLogger.info('Info message');
      
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('Log Entry Creation', () => {
    it('should create log entries with correct structure', () => {
      testLogger.info('Test message', { key: 'value' });
      
      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level', LogLevel.INFO);
      expect(log).toHaveProperty('message', 'Test message');
      expect(log).toHaveProperty('context', { key: 'value' });
      expect(log).toHaveProperty('metadata');
    });

    it('should include metadata in log entries', () => {
      testLogger.debug('Test message');
      
      const logs = testLogger.getLogs();
      const log = logs[0];
      
      expect(log.metadata).toHaveProperty('hostname');
      expect(log.metadata).toHaveProperty('pid');
      expect(log.metadata).toHaveProperty('memory');
      expect(log.metadata).toHaveProperty('uptime');
    });
  });

  describe('Log Retrieval', () => {
    beforeEach(() => {
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');
    });

    it('should retrieve all logs', () => {
      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(4);
    });

    it('should filter logs by level', () => {
      const warnAndAbove = testLogger.getLogs(LogLevel.WARN);
      expect(warnAndAbove).toHaveLength(2); // WARN and ERROR
    });

    it('should limit number of returned logs', () => {
      const limitedLogs = testLogger.getLogs(undefined, 2);
      expect(limitedLogs).toHaveLength(2);
    });
  });

  describe('Log Statistics', () => {
    it('should provide correct statistics', () => {
      testLogger.debug('Debug 1');
      testLogger.debug('Debug 2');
      testLogger.info('Info 1');
      testLogger.error('Error 1');
      
      const stats = testLogger.getLogStats();
      
      expect(stats.total).toBe(4);
      expect(stats.byLevel.DEBUG).toBe(2);
      expect(stats.byLevel.INFO).toBe(1);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.byLevel.WARN).toBe(0);
      expect(stats.oldestLog).toBeDefined();
      expect(stats.newestLog).toBeDefined();
    });
  });

  describe('Log Export', () => {
    beforeEach(() => {
      testLogger.info('Test message', { key: 'value' });
    });

    it('should export logs as JSON', () => {
      const jsonExport = testLogger.exportLogs('json');
      const parsed = JSON.parse(jsonExport);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toHaveProperty('message', 'Test message');
    });

    it('should export logs as CSV', () => {
      const csvExport = testLogger.exportLogs('csv');
      
      expect(csvExport).toContain('timestamp,level,message,context');
      expect(csvExport).toContain('INFO');
      expect(csvExport).toContain('Test message');
    });
  });

  describe('Clear Logs', () => {
    it('should clear all logs', () => {
      testLogger.info('Test message');
      expect(testLogger.getLogs()).toHaveLength(1);
      
      testLogger.clearLogs();
      expect(testLogger.getLogs()).toHaveLength(0);
    });
  });
});

describe('Global Logger Instance', () => {
  it('should provide a global logger instance', () => {
    expect(logger).toBeInstanceOf(EnhancedLogger);
  });
});

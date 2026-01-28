/**
 * Tests for Performance Monitor Utility
 */

import { PerformanceMonitor, performanceMonitor } from '../performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance();
    monitor.clearMetrics();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Metric Recording', () => {
    it('should record metrics correctly', () => {
      monitor.recordMetric('test_metric', 100, 'ms');
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      
      const metric = metrics[0];
      expect(metric.name).toBe('test_metric');
      expect(metric.value).toBe(100);
      expect(metric.unit).toBe('ms');
      expect(metric.timestamp).toBeDefined();
    });

    it('should record metrics with tags', () => {
      const tags = { source: 'test', type: 'performance' };
      monitor.recordMetric('test_metric', 100, 'ms', tags);
      
      const metrics = monitor.getMetrics();
      expect(metrics[0].tags).toEqual(tags);
    });
  });

  describe('Timer Functionality', () => {
    it('should start and end timers correctly', (done) => {
      const timerId = monitor.startTimer('test_timer');
      
      setTimeout(() => {
        const duration = monitor.endTimer(timerId);
        expect(duration).toBeGreaterThan(90); // Should be at least 100ms
        expect(duration).toBeLessThan(200); // But not too much more
        
        const metrics = monitor.getMetrics('test_timer_duration');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(duration);
        done();
      }, 100);
    });

    it('should return null for non-existent timer', () => {
      const duration = monitor.endTimer('non_existent_timer');
      expect(duration).toBeNull();
    });
  });

  describe('Function Measurement', () => {
    it('should measure synchronous function execution', () => {
      const result = monitor.measureFunction('test_function', () => {
        // Add a small delay to ensure measurable duration
        const start = Date.now();
        while (Date.now() - start < 1) {
          // Busy wait for at least 1ms
        }
        return 42;
      });
      
      expect(result).toBe(42);
      
      const metrics = monitor.getMetrics('test_function_duration');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('should measure async function execution', async () => {
      const result = await monitor.measureAsyncFunction('test_async_function', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async_result';
      });
      
      expect(result).toBe('async_result');
      
      const metrics = monitor.getMetrics('test_async_function_duration');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(9); // At least 10ms
    });

    it('should record errors for failed functions', () => {
      expect(() => {
        monitor.measureFunction('failing_function', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
      
      const errorMetrics = monitor.getMetrics('failing_function_error');
      expect(errorMetrics).toHaveLength(1);
      expect(errorMetrics[0].value).toBe(1);
    });
  });

  describe('Metric Retrieval', () => {
    beforeEach(() => {
      monitor.recordMetric('metric1', 10, 'ms');
      monitor.recordMetric('metric2', 20, 'ms');
      monitor.recordMetric('metric1', 15, 'ms');
    });

    it('should filter metrics by name', () => {
      const metric1Metrics = monitor.getMetrics('metric1');
      expect(metric1Metrics).toHaveLength(2);
      expect(metric1Metrics.every(m => m.name === 'metric1')).toBe(true);
    });

    it('should limit number of returned metrics', () => {
      const limitedMetrics = monitor.getMetrics(undefined, 2);
      expect(limitedMetrics).toHaveLength(2);
    });
  });

  describe('Time Range Filtering', () => {
    it('should filter metrics by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      monitor.recordMetric('time_test', 100, 'ms');
      
      const metricsInRange = monitor.getMetricsByTimeRange(oneHourAgo, oneHourFromNow);
      expect(metricsInRange).toHaveLength(1);
      
      const futureMetrics = monitor.getMetricsByTimeRange(oneHourFromNow, new Date(now.getTime() + 2 * 60 * 60 * 1000));
      expect(futureMetrics).toHaveLength(0);
    });
  });

  describe('Metric Statistics', () => {
    it('should calculate correct statistics', () => {
      monitor.recordMetric('stats_test', 10, 'ms');
      monitor.recordMetric('stats_test', 20, 'ms');
      monitor.recordMetric('stats_test', 30, 'ms');
      
      const stats = monitor.getMetricStatistics('stats_test');
      
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(3);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(30);
      expect(stats!.avg).toBe(20);
      expect(stats!.sum).toBe(60);
      expect(stats!.latest).toBe(30);
    });

    it('should return null for non-existent metric', () => {
      const stats = monitor.getMetricStatistics('non_existent');
      expect(stats).toBeNull();
    });
  });

  describe('Top Metrics', () => {
    it('should return top metrics by count', () => {
      monitor.recordMetric('frequent', 1, 'count');
      monitor.recordMetric('frequent', 2, 'count');
      monitor.recordMetric('frequent', 3, 'count');
      monitor.recordMetric('rare', 1, 'count');
      
      const topMetrics = monitor.getTopMetrics(2);
      
      expect(topMetrics).toHaveLength(2);
      expect(topMetrics[0].name).toBe('frequent');
      expect(topMetrics[0].count).toBe(3);
      expect(topMetrics[1].name).toBe('rare');
      expect(topMetrics[1].count).toBe(1);
    });
  });

  describe('System Metrics', () => {
    it('should provide system metrics', () => {
      const systemMetrics = monitor.getSystemMetrics();
      
      expect(systemMetrics).toHaveLength(5);
      expect(systemMetrics[0].name).toBe('system_memory_rss');
      expect(systemMetrics[1].name).toBe('system_memory_heap_used');
      expect(systemMetrics[2].name).toBe('system_memory_heap_total');
      expect(systemMetrics[3].name).toBe('system_memory_external');
      expect(systemMetrics[4].name).toBe('system_uptime');
      
      systemMetrics.forEach(metric => {
        expect(metric.value).toBeGreaterThan(0);
        expect(metric.timestamp).toBeDefined();
      });
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      monitor.recordMetric('export_test', 100, 'ms', { tag: 'value' });
    });

    it('should export metrics as JSON', () => {
      const jsonExport = monitor.exportMetrics('json');
      const parsed = JSON.parse(jsonExport);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toHaveProperty('name', 'export_test');
    });

    it('should export metrics as CSV', () => {
      const csvExport = monitor.exportMetrics('csv');
      
      expect(csvExport).toContain('timestamp,name,value,unit,tags');
      expect(csvExport).toContain('export_test');
      expect(csvExport).toContain('100');
      expect(csvExport).toContain('ms');
    });
  });

  describe('Clear Functions', () => {
    it('should clear all metrics', () => {
      monitor.recordMetric('test1', 1, 'count');
      monitor.recordMetric('test2', 2, 'count');
      
      expect(monitor.getMetrics()).toHaveLength(2);
      
      monitor.clearMetrics();
      expect(monitor.getMetrics()).toHaveLength(0);
    });

    it('should clear metrics by name', () => {
      monitor.recordMetric('keep', 1, 'count');
      monitor.recordMetric('remove', 2, 'count');
      
      monitor.clearMetricsByName('remove');
      
      const remaining = monitor.getMetrics();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('keep');
    });
  });

  describe('Active Timers', () => {
    it('should track active timers', () => {
      const timerId1 = monitor.startTimer('timer1');
      const timerId2 = monitor.startTimer('timer2');
      
      const activeTimers = monitor.getActiveTimers();
      expect(activeTimers).toHaveLength(2);
      
      monitor.endTimer(timerId1);
      
      const remainingTimers = monitor.getActiveTimers();
      expect(remainingTimers).toHaveLength(1);
      expect(remainingTimers[0].name).toBe('timer2');
      
      monitor.endTimer(timerId2);
      
      const noTimers = monitor.getActiveTimers();
      expect(noTimers).toHaveLength(0);
    });
  });
});

describe('Performance Decorators', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance();
    monitor.clearMetrics();
  });

  describe('measurePerformance', () => {
    it('should measure function performance directly', () => {
      const result = monitor.measureFunction('direct_test', () => {
        // Add a small delay to ensure measurable duration
        const start = Date.now();
        while (Date.now() - start < 1) {
          // Busy wait for at least 1ms
        }
        return 42;
      });

      expect(result).toBe(42);
      
      const metrics = monitor.getMetrics('direct_test_duration');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });
  });

  describe('measureAsyncPerformance', () => {
    it('should measure async function performance directly', async () => {
      const result = await monitor.measureAsyncFunction('direct_async_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async_result';
      });

      expect(result).toBe('async_result');
      
      const metrics = monitor.getMetrics('direct_async_test_duration');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(9);
    });
  });
});

describe('Global Performance Monitor Instance', () => {
  it('should provide a global performance monitor instance', () => {
    expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });
});

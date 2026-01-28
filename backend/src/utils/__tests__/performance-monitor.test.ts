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
        expect(duration).toBeGreaterThan(90);
        
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
      expect(metrics[0].value).toBeGreaterThan(9);
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
  });

  describe('System Metrics', () => {
    it('should provide system metrics', () => {
      const systemMetrics = monitor.getSystemMetrics();
      
      expect(systemMetrics).toHaveLength(3);
      expect(systemMetrics[0].name).toBe('system_memory_rss');
      expect(systemMetrics[1].name).toBe('system_memory_heap_used');
      expect(systemMetrics[2].name).toBe('system_uptime');
      
      systemMetrics.forEach(metric => {
        expect(metric.value).toBeGreaterThan(0);
        expect(metric.timestamp).toBeDefined();
      });
    });
  });

  describe('Clear Metrics', () => {
    it('should clear all metrics', () => {
      monitor.recordMetric('test1', 1, 'count');
      monitor.recordMetric('test2', 2, 'count');
      
      expect(monitor.getMetrics()).toHaveLength(2);
      
      monitor.clearMetrics();
      expect(monitor.getMetrics()).toHaveLength(0);
    });
  });
});

describe('Global Performance Monitor Instance', () => {
  it('should provide a global performance monitor instance', () => {
    expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });
});

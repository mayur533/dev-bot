/**
 * Performance Monitoring Utility
 * Provides performance tracking and metrics collection for the application
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface PerformanceTimer {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, PerformanceTimer> = new Map();
  private maxMetrics: number = 10000;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public setMaxMetrics(max: number): void {
    this.maxMetrics = max;
  }

  public recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    };

    this.metrics.push(metric);
    this.maintainMetricsSize();
  }

  public startTimer(name: string, tags?: Record<string, string>): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timer: PerformanceTimer = {
      name,
      startTime: Date.now(),
      tags
    };

    this.timers.set(timerId, timer);
    return timerId;
  }

  public endTimer(timerId: string): number | null {
    const timer = this.timers.get(timerId);
    if (!timer) {
      return null;
    }

    timer.endTime = Date.now();
    timer.duration = timer.endTime - timer.startTime;

    this.recordMetric(
      `${timer.name}_duration`,
      timer.duration,
      'ms',
      timer.tags
    );

    this.timers.delete(timerId);
    return timer.duration;
  }

  public measureFunction<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const timerId = this.startTimer(name, tags);
    try {
      const result = fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      this.recordMetric(`${name}_error`, 1, 'count', tags);
      throw error;
    }
  }

  public async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const timerId = this.startTimer(name, tags);
    try {
      const result = await fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      this.recordMetric(`${name}_error`, 1, 'count', tags);
      throw error;
    }
  }

  public getMetrics(name?: string, limit?: number): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = this.metrics.filter(metric => metric.name === name);
    }

    if (limit) {
      filteredMetrics = filteredMetrics.slice(-limit);
    }

    return filteredMetrics;
  }

  public getMetricsByTimeRange(
    startTime: Date,
    endTime: Date,
    name?: string
  ): PerformanceMetric[] {
    return this.metrics.filter(metric => {
      const metricTime = new Date(metric.timestamp);
      const inTimeRange = metricTime >= startTime && metricTime <= endTime;
      const matchesName = !name || metric.name === name;
      return inTimeRange && matchesName;
    });
  }

  public getMetricStatistics(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
    latest: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      sum,
      latest: values[values.length - 1]
    };
  }

  public getTopMetrics(limit: number = 10): Array<{
    name: string;
    count: number;
    avg: number;
    latest: number;
  }> {
    const metricGroups = new Map<string, PerformanceMetric[]>();

    this.metrics.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric);
    });

    const results = Array.from(metricGroups.entries()).map(([name, metrics]) => {
      const values = metrics.map(m => m.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      
      return {
        name,
        count: metrics.length,
        avg: sum / values.length,
        latest: values[values.length - 1]
      };
    });

    return results
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public clearMetricsByName(name: string): void {
    this.metrics = this.metrics.filter(metric => metric.name !== name);
  }

  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    } else {
      const headers = ['timestamp', 'name', 'value', 'unit', 'tags'];
      const csvRows = [headers.join(',')];
      
      this.metrics.forEach(metric => {
        const row = [
          metric.timestamp,
          metric.name,
          metric.value.toString(),
          metric.unit,
          `"${JSON.stringify(metric.tags || {}).replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  public getActiveTimers(): PerformanceTimer[] {
    return Array.from(this.timers.values());
  }

  public getSystemMetrics(): PerformanceMetric[] {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return [
      {
        name: 'system_memory_rss',
        value: memUsage.rss,
        unit: 'bytes',
        timestamp: new Date().toISOString()
      },
      {
        name: 'system_memory_heap_used',
        value: memUsage.heapUsed,
        unit: 'bytes',
        timestamp: new Date().toISOString()
      },
      {
        name: 'system_memory_heap_total',
        value: memUsage.heapTotal,
        unit: 'bytes',
        timestamp: new Date().toISOString()
      },
      {
        name: 'system_memory_external',
        value: memUsage.external,
        unit: 'bytes',
        timestamp: new Date().toISOString()
      },
      {
        name: 'system_uptime',
        value: uptime,
        unit: 'seconds',
        timestamp: new Date().toISOString()
      }
    ];
  }

  private maintainMetricsSize(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorator for measuring function performance
export function measurePerformance(name?: string, tags?: Record<string, string>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureFunction(metricName, () => originalMethod.apply(this, args), tags);
    };

    return descriptor;
  };
}

// Decorator for measuring async function performance
export function measureAsyncPerformance(name?: string, tags?: Record<string, string>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return await performanceMonitor.measureAsyncFunction(metricName, () => originalMethod.apply(this, args), tags);
    };

    return descriptor;
  };
}

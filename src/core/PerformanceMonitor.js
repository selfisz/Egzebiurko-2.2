/**
 * PerformanceMonitor - Monitor app performance and memory usage
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            moduleLoadTimes: new Map(),
            renderTimes: new Map(),
            memorySnapshots: [],
            errors: []
        };
        
        this.isEnabled = true;
    }

    /**
     * Start timing a module load
     */
    startModuleLoad(moduleName) {
        if (!this.isEnabled) return;
        
        this.metrics.moduleLoadTimes.set(moduleName, {
            start: performance.now(),
            end: null,
            duration: null
        });
    }

    /**
     * End timing a module load
     */
    endModuleLoad(moduleName) {
        if (!this.isEnabled) return;
        
        const metric = this.metrics.moduleLoadTimes.get(moduleName);
        if (metric) {
            metric.end = performance.now();
            metric.duration = metric.end - metric.start;
            
            console.log(`[Performance] ${moduleName} loaded in ${metric.duration.toFixed(2)}ms`);
        }
    }

    /**
     * Start timing a render
     */
    startRender(componentName) {
        if (!this.isEnabled) return;
        
        return performance.now();
    }

    /**
     * End timing a render
     */
    endRender(componentName, startTime) {
        if (!this.isEnabled || !startTime) return;
        
        const duration = performance.now() - startTime;
        
        if (!this.metrics.renderTimes.has(componentName)) {
            this.metrics.renderTimes.set(componentName, []);
        }
        
        this.metrics.renderTimes.get(componentName).push({
            timestamp: Date.now(),
            duration
        });
        
        // Warn if render is slow
        if (duration > 100) {
            console.warn(`[Performance] Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Take memory snapshot
     */
    takeMemorySnapshot() {
        if (!this.isEnabled || !performance.memory) return;
        
        const snapshot = {
            timestamp: Date.now(),
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
        
        this.metrics.memorySnapshots.push(snapshot);
        
        // Keep only last 100 snapshots
        if (this.metrics.memorySnapshots.length > 100) {
            this.metrics.memorySnapshots.shift();
        }
        
        // Warn if memory usage is high
        const usagePercent = (snapshot.usedJSHeapSize / snapshot.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
            console.warn(`[Performance] High memory usage: ${usagePercent.toFixed(1)}%`);
        }
    }

    /**
     * Log error
     */
    logError(error, context = {}) {
        this.metrics.errors.push({
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            context
        });
        
        // Keep only last 50 errors
        if (this.metrics.errors.length > 50) {
            this.metrics.errors.shift();
        }
    }

    /**
     * Get performance report
     */
    getReport() {
        const report = {
            moduleLoadTimes: {},
            renderTimes: {},
            memory: null,
            errors: this.metrics.errors.length
        };
        
        // Module load times
        this.metrics.moduleLoadTimes.forEach((metric, name) => {
            if (metric.duration !== null) {
                report.moduleLoadTimes[name] = `${metric.duration.toFixed(2)}ms`;
            }
        });
        
        // Average render times
        this.metrics.renderTimes.forEach((renders, name) => {
            if (renders.length > 0) {
                const avg = renders.reduce((sum, r) => sum + r.duration, 0) / renders.length;
                const max = Math.max(...renders.map(r => r.duration));
                report.renderTimes[name] = {
                    average: `${avg.toFixed(2)}ms`,
                    max: `${max.toFixed(2)}ms`,
                    count: renders.length
                };
            }
        });
        
        // Current memory
        if (performance.memory) {
            const current = this.metrics.memorySnapshots[this.metrics.memorySnapshots.length - 1];
            if (current) {
                report.memory = {
                    used: `${(current.usedJSHeapSize / 1048576).toFixed(2)} MB`,
                    total: `${(current.totalJSHeapSize / 1048576).toFixed(2)} MB`,
                    limit: `${(current.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
                    usage: `${((current.usedJSHeapSize / current.jsHeapSizeLimit) * 100).toFixed(1)}%`
                };
            }
        }
        
        return report;
    }

    /**
     * Start automatic monitoring
     */
    startMonitoring(interval = 30000) {
        if (this.monitoringInterval) return;
        
        // Take initial snapshot
        this.takeMemorySnapshot();
        
        // Schedule periodic snapshots
        this.monitoringInterval = setInterval(() => {
            this.takeMemorySnapshot();
        }, interval);
        
        console.log('[Performance] Monitoring started');
    }

    /**
     * Stop automatic monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('[Performance] Monitoring stopped');
        }
    }

    /**
     * Enable monitoring
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disable monitoring
     */
    disable() {
        this.isEnabled = false;
    }

    /**
     * Clear metrics
     */
    clear() {
        this.metrics.moduleLoadTimes.clear();
        this.metrics.renderTimes.clear();
        this.metrics.memorySnapshots = [];
        this.metrics.errors = [];
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Make globally available for debugging
if (typeof window !== 'undefined') {
    window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;

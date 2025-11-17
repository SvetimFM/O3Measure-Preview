/**
 * Performance Monitor for O3Measure
 * Tracks and optimizes performance for Meta Quest devices
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memory: {},
      sessionStart: Date.now()
    };

    this.fpsHistory = [];
    this.maxHistoryLength = 60; // Keep 60 frames of history
    this.isProduction = typeof __IS_PRODUCTION__ !== 'undefined' ? __IS_PRODUCTION__ : false;
    this.warningThresholds = {
      fps: 60, // Warn if FPS drops below 60
      frameTime: 16.67, // Warn if frame time exceeds 16.67ms (60 FPS)
      memory: 512 * 1024 * 1024 // Warn if memory exceeds 512MB
    };

    this.init();
  }

  init() {
    // Start monitoring when A-Frame scene is ready
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');

      if (scene) {
        scene.addEventListener('renderstart', () => {
          this.startMonitoring();
        });
      }
    });

    // Performance API monitoring
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        this.updateMemoryMetrics();
      }, 5000); // Update every 5 seconds
    }
  }

  startMonitoring() {
    const scene = document.querySelector('a-scene');
    if (!scene || !scene.renderer) return;

    let lastTime = performance.now();
    let frames = 0;
    let lastFpsUpdate = performance.now();

    const monitorFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      frames++;

      // Update FPS every second
      if (currentTime - lastFpsUpdate >= 1000) {
        this.metrics.fps = Math.round(frames);
        this.metrics.frameTime = deltaTime;

        this.fpsHistory.push(this.metrics.fps);
        if (this.fpsHistory.length > this.maxHistoryLength) {
          this.fpsHistory.shift();
        }

        // Check for performance issues
        this.checkPerformance();

        frames = 0;
        lastFpsUpdate = currentTime;
      }

      // Update rendering metrics
      if (scene.renderer && scene.renderer.info) {
        const info = scene.renderer.info;
        this.metrics.drawCalls = info.render?.calls || 0;
        this.metrics.triangles = info.render?.triangles || 0;
      }

      requestAnimationFrame(monitorFrame);
    };

    requestAnimationFrame(monitorFrame);
  }

  updateMemoryMetrics() {
    if (window.performance && window.performance.memory) {
      this.metrics.memory = {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit
      };
    }
  }

  checkPerformance() {
    const avgFps = this.getAverageFPS();

    // Warn about low FPS
    if (avgFps < this.warningThresholds.fps && !this.isProduction) {
      console.warn(`[Performance] Low FPS detected: ${avgFps.toFixed(1)} FPS`);
      this.suggestOptimizations();
    }

    // Warn about high memory usage
    if (this.metrics.memory.used && this.metrics.memory.used > this.warningThresholds.memory) {
      if (!this.isProduction) {
        console.warn('[Performance] High memory usage:',
          `${(this.metrics.memory.used / 1024 / 1024).toFixed(1)} MB`);
      }
    }
  }

  suggestOptimizations() {
    const suggestions = [];

    if (this.metrics.drawCalls > 100) {
      suggestions.push('High draw calls detected. Consider merging geometries.');
    }

    if (this.metrics.triangles > 100000) {
      suggestions.push('High triangle count. Consider using lower poly models.');
    }

    if (suggestions.length > 0 && !this.isProduction) {
      console.log('[Performance] Optimization suggestions:', suggestions);
    }
  }

  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageFps: this.getAverageFPS(),
      sessionDuration: Date.now() - this.metrics.sessionStart
    };
  }

  logMetrics() {
    const metrics = this.getMetrics();
    console.log('[Performance Metrics]', {
      fps: `${metrics.fps} FPS (avg: ${metrics.averageFps.toFixed(1)})`,
      frameTime: `${metrics.frameTime.toFixed(2)}ms`,
      drawCalls: metrics.drawCalls,
      triangles: metrics.triangles,
      memory: metrics.memory.used ?
        `${(metrics.memory.used / 1024 / 1024).toFixed(1)} MB` :
        'N/A',
      sessionDuration: `${(metrics.sessionDuration / 1000 / 60).toFixed(1)} minutes`
    });
  }

  // WebXR specific performance tracking
  trackXRPerformance(session) {
    if (!session) return;

    session.requestAnimationFrame(function logXRFrame(time, frame) {
      if (frame) {
        // Track XR-specific metrics
        // This is a placeholder for XR performance tracking
      }

      session.requestAnimationFrame(logXRFrame);
    });
  }

  // Export metrics for analytics
  exportMetrics() {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Expose globally for debugging (only in development)
if (typeof __IS_PRODUCTION__ !== 'undefined' && !__IS_PRODUCTION__) {
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;

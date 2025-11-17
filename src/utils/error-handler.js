/**
 * Global Error Handler for O3Measure
 * Production-ready error handling and logging for Meta Quest devices
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 50; // Limit stored errors to prevent memory issues
    this.isProduction = typeof __IS_PRODUCTION__ !== 'undefined' ? __IS_PRODUCTION__ : false;

    this.init();
  }

  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'JavaScript Error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // WebXR-specific error handling
    this.setupWebXRErrorHandling();

    // A-Frame error handling
    this.setupAFrameErrorHandling();
  }

  setupWebXRErrorHandling() {
    // Monitor WebXR session errors
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');

      if (scene) {
        scene.addEventListener('enter-vr', () => {
          if (scene.xrSession) {
            scene.xrSession.addEventListener('end', (event) => {
              console.log('[WebXR] Session ended');
            });
          }
        });

        // Monitor for WebXR not supported
        if (!navigator.xr) {
          this.handleError({
            type: 'WebXR Not Supported',
            message: 'WebXR is not available in this browser',
            severity: 'warning',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  setupAFrameErrorHandling() {
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');

      if (scene) {
        scene.addEventListener('renderstart', () => {
          console.log('[A-Frame] Rendering started');
        });

        scene.addEventListener('loaded', () => {
          console.log('[A-Frame] Scene loaded successfully');
        });
      }
    });
  }

  handleError(errorInfo) {
    // Store error
    this.errors.push(errorInfo);

    // Limit stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log error
    if (!this.isProduction) {
      console.error('[Error Handler]', errorInfo);
    }

    // In production, you might want to send errors to a logging service
    if (this.isProduction) {
      this.sendToLoggingService(errorInfo);
    }

    // Update UI if needed
    this.updateErrorUI(errorInfo);
  }

  sendToLoggingService(errorInfo) {
    // Placeholder for production error logging
    // Examples:
    // - Sentry: Sentry.captureException(errorInfo)
    // - Custom backend: fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorInfo) })
    // - Google Analytics: ga('send', 'exception', { exDescription: errorInfo.message })

    console.log('[Error Logging] Would send to logging service:', errorInfo);
  }

  updateErrorUI(errorInfo) {
    // Only show critical errors to users in production
    if (this.isProduction && errorInfo.severity !== 'critical') {
      return;
    }

    const statusElement = document.getElementById('status');
    if (statusElement && errorInfo.severity === 'critical') {
      statusElement.textContent = 'An error occurred. Please refresh the page.';
      statusElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  // Helper method to manually report errors
  report(message, severity = 'error', metadata = {}) {
    this.handleError({
      type: 'Manual Report',
      message,
      severity,
      metadata,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;

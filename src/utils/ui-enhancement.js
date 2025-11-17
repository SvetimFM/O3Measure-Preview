/**
 * UI/UX Enhancement System for O3Measure
 * Provides loading states, feedback, animations, and user guidance
 */

class UIEnhancement {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 3;
    this.loadingState = false;
    this.init();
  }

  init() {
    this.createNotificationContainer();
    this.createLoadingOverlay();
    this.createTooltipSystem();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create notification system for user feedback
   */
  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  /**
   * Show a notification to the user
   */
  notify(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const colors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#15ACCF'
    };

    notification.style.cssText = `
      background: linear-gradient(135deg, ${colors[type]}dd, ${colors[type]}cc);
      color: white;
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      animation: slideInRight 0.3s ease, fadeOut 0.3s ease ${duration - 300}ms forwards;
      pointer-events: auto;
      max-width: 300px;
      word-wrap: break-word;
    `;

    // Add icon based on type
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    notification.innerHTML = `
      <span style="font-size: 18px; margin-right: 8px;">${icons[type]}</span>
      <span>${message}</span>
    `;

    const container = document.getElementById('notification-container');
    if (container) {
      container.appendChild(notification);
      this.notifications.push(notification);

      // Limit number of notifications
      if (this.notifications.length > this.maxNotifications) {
        const old = this.notifications.shift();
        if (old && old.parentNode) {
          old.parentNode.removeChild(old);
        }
      }

      // Remove after duration
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
          const index = this.notifications.indexOf(notification);
          if (index > -1) {
            this.notifications.splice(index, 1);
          }
        }
      }, duration);
    }
  }

  /**
   * Create loading overlay with progress
   */
  createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #000000ee, #111111dd);
      z-index: 9999;
      display: none;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      backdrop-filter: blur(10px);
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div id="loading-spinner" style="
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid #15ACCF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <div id="loading-text" style="
          color: white;
          font-family: Arial, sans-serif;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        ">Loading...</div>
        <div id="loading-progress" style="
          color: rgba(255, 255, 255, 0.7);
          font-family: Arial, sans-serif;
          font-size: 14px;
        "></div>
        <div id="loading-bar-container" style="
          width: 300px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin: 20px auto 0;
          overflow: hidden;
        ">
          <div id="loading-bar" style="
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #15ACCF, #10B981);
            border-radius: 2px;
            transition: width 0.3s ease;
          "></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show loading screen
   */
  showLoading(message = 'Loading...', progress = null) {
    this.loadingState = true;
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    const progressText = document.getElementById('loading-progress');
    const progressBar = document.getElementById('loading-bar');

    if (overlay) {
      overlay.style.display = 'flex';
      if (text) text.textContent = message;

      if (progress !== null) {
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;
        if (progressBar) progressBar.style.width = `${progress}%`;
      } else {
        if (progressText) progressText.textContent = '';
      }
    }
  }

  /**
   * Hide loading screen
   */
  hideLoading() {
    this.loadingState = false;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(progress, message = null) {
    const progressText = document.getElementById('loading-progress');
    const progressBar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-text');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    if (message && text) text.textContent = message;
  }

  /**
   * Create tooltip system
   */
  createTooltipSystem() {
    const tooltip = document.createElement('div');
    tooltip.id = 'ui-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 13px;
      pointer-events: none;
      z-index: 10000;
      display: none;
      max-width: 250px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(tooltip);
  }

  /**
   * Show tooltip
   */
  showTooltip(text, x, y) {
    const tooltip = document.getElementById('ui-tooltip');
    if (tooltip) {
      tooltip.textContent = text;
      tooltip.style.display = 'block';
      tooltip.style.left = `${x + 10}px`;
      tooltip.style.top = `${y + 10}px`;
    }
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('ui-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  /**
   * Setup keyboard shortcuts for debugging (development only)
   */
  setupKeyboardShortcuts() {
    if (typeof __IS_PRODUCTION__ !== 'undefined' && __IS_PRODUCTION__) {
      return; // Skip in production
    }

    document.addEventListener('keydown', (e) => {
      // Alt+D = Toggle debug info
      if (e.altKey && e.key === 'd') {
        this.toggleDebugInfo();
      }
      // Alt+P = Show performance metrics
      if (e.altKey && e.key === 'p') {
        this.showPerformanceInfo();
      }
    });
  }

  /**
   * Toggle debug information
   */
  toggleDebugInfo() {
    let debugPanel = document.getElementById('debug-panel');

    if (debugPanel) {
      debugPanel.remove();
      return;
    }

    debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid #0f0;
    `;

    const updateDebugInfo = () => {
      if (!document.getElementById('debug-panel')) return;

      const scene = document.querySelector('a-scene');
      const info = {
        'Renderer': scene?.renderer ? 'Active' : 'Inactive',
        'XR Session': scene?.xrSession ? 'Active' : 'Inactive',
        'FPS': scene?.renderer?.info?.render?.frame || 'N/A',
        'Draw Calls': scene?.renderer?.info?.render?.calls || 'N/A',
        'Triangles': scene?.renderer?.info?.render?.triangles || 'N/A',
        'Memory': window.performance?.memory ?
          `${(window.performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB` :
          'N/A'
      };

      debugPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #15ACCF;">Debug Info</div>
        ${Object.entries(info).map(([key, value]) =>
          `<div><span style="color: #888;">${key}:</span> ${value}</div>`
        ).join('')}
        <div style="margin-top: 10px; font-size: 10px; color: #666;">Alt+D to close</div>
      `;

      requestAnimationFrame(updateDebugInfo);
    };

    document.body.appendChild(debugPanel);
    updateDebugInfo();
  }

  /**
   * Show performance information
   */
  showPerformanceInfo() {
    if (window.performanceMonitor) {
      const metrics = window.performanceMonitor.getMetrics();
      this.notify(
        `FPS: ${metrics.fps} | Avg: ${metrics.averageFps.toFixed(1)} | Calls: ${metrics.drawCalls}`,
        'info',
        5000
      );
    }
  }

  /**
   * Create a confirmation dialog
   */
  confirm(message, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a1aee, #2a2a2add);
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 10001;
      min-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    dialog.innerHTML = `
      <div style="color: white; font-family: Arial, sans-serif; margin-bottom: 20px; font-size: 16px;">
        ${message}
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="confirm-cancel" style="
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Cancel</button>
        <button id="confirm-ok" style="
          background: linear-gradient(135deg, #15ACCF, #10B981);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Confirm</button>
      </div>
    `;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      backdrop-filter: blur(2px);
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);

    const cleanup = () => {
      dialog.remove();
      backdrop.remove();
    };

    document.getElementById('confirm-ok')?.addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });

    document.getElementById('confirm-cancel')?.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });

    backdrop.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });
  }
}

// Create singleton instance
const uiEnhancement = new UIEnhancement();

// Expose globally
window.uiEnhancement = uiEnhancement;

export default uiEnhancement;

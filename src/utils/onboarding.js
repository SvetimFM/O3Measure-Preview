/**
 * Onboarding System for O3Measure
 * Guides first-time users through the application
 */

class Onboarding {
  constructor() {
    this.currentStep = 0;
    this.completed = false;
    this.active = false;
    this.storageKey = 'o3measure_onboarding_completed';

    this.steps = [
      {
        title: 'Welcome to O3Measure! 👋',
        message: 'A hand tracking AR measuring tool for Meta Quest devices. Let\'s get started!',
        duration: 4000,
        position: 'center'
      },
      {
        title: 'Hand Tracking Required',
        message: 'Make sure hand tracking is enabled in your Quest settings. Raise your hands into view when you\'re ready.',
        duration: 6000,
        position: 'center',
        checkHands: true
      },
      {
        title: 'Main Menu',
        message: 'This is your main menu. You can grab and move it by pinching the panel. Try it now!',
        duration: 5000,
        position: 'top',
        highlightElement: '#menuManager'
      },
      {
        title: 'Wall Calibration',
        message: 'Start by calibrating a wall. Point to three corners of a wall to create a reference plane.',
        duration: 5000,
        position: 'center'
      },
      {
        title: 'Object Definition',
        message: 'Once calibrated, you can define objects by drawing rectangles on the wall.',
        duration: 4000,
        position: 'center'
      },
      {
        title: 'You\'re Ready!',
        message: 'You\'re all set! Explore the features and start measuring. You can revisit this tutorial from the settings menu.',
        duration: 4000,
        position: 'center'
      }
    ];
  }

  /**
   * Check if onboarding should be shown
   */
  shouldShow() {
    const completed = localStorage.getItem(this.storageKey);
    return !completed;
  }

  /**
   * Start the onboarding process
   */
  start() {
    if (!this.shouldShow()) {
      console.log('[Onboarding] Already completed');
      return;
    }

    this.active = true;
    this.currentStep = 0;
    this.showStep(0);
  }

  /**
   * Force start (for testing or reset)
   */
  forceStart() {
    this.active = true;
    this.currentStep = 0;
    this.showStep(0);
  }

  /**
   * Show a specific step
   */
  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[stepIndex];
    this.currentStep = stepIndex;

    // Create overlay
    this.createOverlay();

    // Create tutorial card
    this.createTutorialCard(step);

    // Highlight element if specified
    if (step.highlightElement) {
      this.highlightElement(step.highlightElement);
    }

    // Check for hands if required
    if (step.checkHands) {
      this.waitForHands();
    }

    // Auto-advance after duration
    setTimeout(() => {
      if (this.active && this.currentStep === stepIndex) {
        this.nextStep();
      }
    }, step.duration);
  }

  /**
   * Create dark overlay
   */
  createOverlay() {
    // Remove existing overlay
    const existing = document.getElementById('onboarding-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      backdrop-filter: blur(3px);
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(overlay);
  }

  /**
   * Create tutorial card
   */
  createTutorialCard(step) {
    // Remove existing card
    const existing = document.getElementById('tutorial-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'tutorial-card';

    const positions = {
      center: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      top: 'top: 100px; left: 50%; transform: translateX(-50%);',
      bottom: 'bottom: 100px; left: 50%; transform: translateX(-50%);'
    };

    card.style.cssText = `
      position: fixed;
      ${positions[step.position] || positions.center}
      background: linear-gradient(135deg, #1a1a1aee, #2a2a2add);
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
      z-index: 9999;
      min-width: 400px;
      max-width: 500px;
      backdrop-filter: blur(20px);
      border: 2px solid rgba(21, 172, 207, 0.3);
      animation: slideIn 0.4s ease;
    `;

    card.innerHTML = `
      <div style="
        color: #15ACCF;
        font-family: Arial, sans-serif;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 15px;
      ">${step.title}</div>

      <div style="
        color: rgba(255, 255, 255, 0.9);
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 25px;
      ">${step.message}</div>

      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="
          display: flex;
          gap: 8px;
        ">
          ${this.steps.map((_, i) => `
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${i === this.currentStep ? '#15ACCF' : 'rgba(255, 255, 255, 0.3)'};
              transition: all 0.3s ease;
            "></div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 10px;">
          ${this.currentStep > 0 ? `
            <button id="tutorial-back" style="
              background: rgba(255, 255, 255, 0.1);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease;
            ">Back</button>
          ` : ''}

          <button id="tutorial-skip" style="
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          ">Skip</button>

          <button id="tutorial-next" style="
            background: linear-gradient(135deg, #15ACCF, #10B981);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          ">${this.currentStep === this.steps.length - 1 ? 'Get Started' : 'Next'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(card);

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -45%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      #tutorial-next:hover, #tutorial-skip:hover, #tutorial-back:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    document.getElementById('tutorial-next')?.addEventListener('click', () => this.nextStep());
    document.getElementById('tutorial-skip')?.addEventListener('click', () => this.skip());
    document.getElementById('tutorial-back')?.addEventListener('click', () => this.previousStep());
  }

  /**
   * Highlight an element
   */
  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;

    const highlight = document.createElement('div');
    highlight.id = 'element-highlight';
    highlight.style.cssText = `
      position: fixed;
      border: 3px solid #15ACCF;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(21, 172, 207, 0.5);
      pointer-events: none;
      z-index: 9997;
      animation: pulse 2s ease-in-out infinite;
    `;

    const rect = element.getBoundingClientRect();
    highlight.style.top = `${rect.top - 5}px`;
    highlight.style.left = `${rect.left - 5}px`;
    highlight.style.width = `${rect.width + 10}px`;
    highlight.style.height = `${rect.height + 10}px`;

    document.body.appendChild(highlight);
  }

  /**
   * Wait for hands to be detected
   */
  waitForHands() {
    const checkInterval = setInterval(() => {
      const leftHand = document.getElementById('leftHand');
      const rightHand = document.getElementById('rightHand');

      if ((leftHand && leftHand.object3D.visible) ||
          (rightHand && rightHand.object3D.visible)) {
        clearInterval(checkInterval);
        if (window.uiEnhancement) {
          window.uiEnhancement.notify('Hands detected! ✓', 'success');
        }
      }
    }, 500);

    // Clear interval after step duration
    setTimeout(() => clearInterval(checkInterval), this.steps[this.currentStep].duration);
  }

  /**
   * Go to next step
   */
  nextStep() {
    this.cleanup();
    this.showStep(this.currentStep + 1);
  }

  /**
   * Go to previous step
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.cleanup();
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Skip onboarding
   */
  skip() {
    this.cleanup();
    this.complete();
  }

  /**
   * Complete onboarding
   */
  complete() {
    this.cleanup();
    this.active = false;
    this.completed = true;
    localStorage.setItem(this.storageKey, 'true');

    if (window.uiEnhancement) {
      window.uiEnhancement.notify('Onboarding complete! Happy measuring! 🎉', 'success', 4000);
    }

    console.log('[Onboarding] Completed');
  }

  /**
   * Reset onboarding (for development/testing)
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    this.cleanup();
    this.currentStep = 0;
    this.completed = false;
    this.active = false;
    console.log('[Onboarding] Reset');
  }

  /**
   * Cleanup overlay and cards
   */
  cleanup() {
    const overlay = document.getElementById('onboarding-overlay');
    const card = document.getElementById('tutorial-card');
    const highlight = document.getElementById('element-highlight');

    if (overlay) overlay.remove();
    if (card) card.remove();
    if (highlight) highlight.remove();
  }
}

// Create singleton instance
const onboarding = new Onboarding();

// Expose globally for debugging
window.onboarding = onboarding;

export default onboarding;

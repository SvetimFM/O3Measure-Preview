/**
 * Haptic Feedback System for O3Measure
 * Provides tactile feedback for hand interactions on Meta Quest devices
 */

class HapticFeedback {
  constructor() {
    this.enabled = true;
    this.intensity = 0.7; // Default intensity (0-1)
    this.gamepads = [];
    this.lastUpdate = 0;
    this.init();
  }

  init() {
    // Listen for gamepad connections (Quest controllers use Gamepad API)
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[Haptics] Gamepad connected:', e.gamepad.id);
      this.updateGamepads();
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('[Haptics] Gamepad disconnected:', e.gamepad.id);
      this.updateGamepads();
    });

    // Start polling for gamepads
    this.startPolling();
  }

  /**
   * Start polling for gamepad updates
   */
  startPolling() {
    const poll = () => {
      this.updateGamepads();
      requestAnimationFrame(poll);
    };
    poll();
  }

  /**
   * Update gamepad list
   */
  updateGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.gamepads = Array.from(gamepads).filter(gp => gp !== null);
  }

  /**
   * Check if haptics are supported
   */
  isSupported() {
    return 'vibrationActuator' in Gamepad.prototype || 'hapticActuators' in Gamepad.prototype;
  }

  /**
   * Enable haptic feedback
   */
  enable() {
    this.enabled = true;
    console.log('[Haptics] Enabled');
  }

  /**
   * Disable haptic feedback
   */
  disable() {
    this.enabled = false;
    console.log('[Haptics] Disabled');
  }

  /**
   * Set haptic intensity
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, Math.min(1, intensity));
    console.log('[Haptics] Intensity set to:', this.intensity);
  }

  /**
   * Trigger haptic feedback
   */
  pulse(hand = 'both', duration = 100, intensity = null) {
    if (!this.enabled) return;

    const actualIntensity = intensity !== null ? intensity : this.intensity;
    const hands = hand === 'both' ? ['left', 'right'] : [hand];

    hands.forEach(h => {
      this.pulseHand(h, duration, actualIntensity);
    });
  }

  /**
   * Pulse a specific hand
   */
  pulseHand(hand, duration, intensity) {
    this.updateGamepads();

    this.gamepads.forEach(gamepad => {
      // Check if this is the correct hand
      // Quest hand tracking uses specific gamepad IDs
      const isLeftHand = gamepad.hand === 'left' || gamepad.id.toLowerCase().includes('left');
      const isRightHand = gamepad.hand === 'right' || gamepad.id.toLowerCase().includes('right');

      if ((hand === 'left' && isLeftHand) || (hand === 'right' && isRightHand)) {
        this.triggerGamepadVibration(gamepad, duration, intensity);
      }
    });
  }

  /**
   * Trigger vibration on a gamepad
   */
  triggerGamepadVibration(gamepad, duration, intensity) {
    // Modern API
    if (gamepad.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration: duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5
      }).catch(err => {
        console.warn('[Haptics] Vibration failed:', err);
      });
    }
    // Legacy API
    else if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
      gamepad.hapticActuators[0].pulse(intensity, duration).catch(err => {
        console.warn('[Haptics] Vibration failed:', err);
      });
    }
  }

  /**
   * Predefined haptic patterns
   */

  // Light tap (e.g., button hover)
  tap(hand = 'both') {
    this.pulse(hand, 20, 0.3);
  }

  // Click feedback (e.g., button press)
  click(hand = 'both') {
    this.pulse(hand, 50, 0.5);
  }

  // Strong feedback (e.g., selection confirmed)
  strong(hand = 'both') {
    this.pulse(hand, 100, 0.8);
  }

  // Error feedback (double pulse)
  error(hand = 'both') {
    this.pulse(hand, 50, 0.6);
    setTimeout(() => this.pulse(hand, 50, 0.6), 100);
  }

  // Success feedback (gentle pulse)
  success(hand = 'both') {
    this.pulse(hand, 80, 0.4);
    setTimeout(() => this.pulse(hand, 60, 0.3), 120);
  }

  // Grab feedback
  grab(hand = 'both') {
    this.pulse(hand, 70, 0.6);
  }

  // Release feedback
  release(hand = 'both') {
    this.pulse(hand, 40, 0.3);
  }

  // Long press feedback
  longPress(hand = 'both') {
    this.pulse(hand, 200, 0.5);
  }

  // Custom pattern
  pattern(hand = 'both', pulses = []) {
    pulses.forEach((pulse, index) => {
      setTimeout(() => {
        this.pulse(hand, pulse.duration || 50, pulse.intensity || 0.5);
      }, pulse.delay || index * 100);
    });
  }

  /**
   * Vibrate on collision (for physics interactions)
   */
  onCollision(hand = 'both', velocity = 1.0) {
    // Scale feedback based on collision velocity
    const intensity = Math.min(0.3 + velocity * 0.5, 1.0);
    const duration = Math.min(30 + velocity * 50, 150);
    this.pulse(hand, duration, intensity);
  }

  /**
   * Subtle continuous feedback (e.g., dragging)
   */
  startContinuous(hand = 'both', interval = 100) {
    this.stopContinuous(); // Clear any existing

    this.continuousInterval = setInterval(() => {
      this.pulse(hand, 30, 0.2);
    }, interval);
  }

  /**
   * Stop continuous feedback
   */
  stopContinuous() {
    if (this.continuousInterval) {
      clearInterval(this.continuousInterval);
      this.continuousInterval = null;
    }
  }

  /**
   * Get haptic status info
   */
  getStatus() {
    return {
      enabled: this.enabled,
      intensity: this.intensity,
      supported: this.isSupported(),
      gamepadsConnected: this.gamepads.length,
      gamepads: this.gamepads.map(gp => ({
        id: gp.id,
        hand: gp.hand,
        hasVibration: !!(gp.vibrationActuator || (gp.hapticActuators && gp.hapticActuators.length > 0))
      }))
    };
  }
}

// Create singleton instance
const haptics = new HapticFeedback();

// Expose globally
window.haptics = haptics;

export default haptics;

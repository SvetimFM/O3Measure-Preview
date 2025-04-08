/**
 * Events Utility
 * 
 * Provides standardized event names to ensure consistency across the application.
 * A focused utility with only what's needed for clear event handling.
 */

/**
 * Standard event names used throughout the application.
 * Using constants helps prevent typos and maintain consistency.
 */
const EVENTS = {
  // Object-related events
  OBJECT: {
    CREATED: 'object-created',
    DELETED: 'object-deleted',
    UPDATED: 'object-updated',
    ACTION: 'object-action',
    STATUS: 'object-status'
  },
  
  // Wall-related events
  WALL: {
    RESET: 'wall-reset',
    ADJUST_START: 'wall-adjust-start',
    CALIBRATION_COMPLETE: 'wall-calibration-complete',
    ACTION: 'wall-calibration-action'
  },
  
  // State management events
  STATE: {
    CHANGED: 'scene-state-changed',
    UPDATE: 'scene-state-update'
  },
  
  // Interaction events (standard A-Frame names)
  INTERACTION: {
    PINCH_STARTED: 'pinchstarted',
    PINCH_ENDED: 'pinchended',
    PRESSED_STARTED: 'pressedstarted',
    PRESSED_ENDED: 'pressedended'
  },
  
  // Menu events
  MENU: {
    ACTION: 'menu-action'
  },
  
  // Button events
  BUTTON: {
    PRESS_STARTED: 'button-press-started',
    PRESS_ENDED: 'button-press-ended'
  },
  
  // Anchor events
  ANCHOR: {
    ACTION: 'anchor-action',
    STATUS: 'anchor-status',
    COMPLETED: 'anchor-completed'
  }
};

/**
 * Simple helper for emitting events with consistent structure
 * @param {HTMLElement} element - Element to emit event from
 * @param {String} eventName - Event name (use EVENTS constants)
 * @param {Object} data - Event data
 */
function emitEvent(element, eventName, data = {}) {
  if (!element || !element.emit) {
    console.error('Events: Cannot emit event, invalid element');
    return;
  }
  
  element.emit(eventName, data);
}


/**
 * Emit a standardized status update event
 * @param {HTMLElement} element - Element to emit event from
 * @param {String} statusType - Type of status event (EVENTS.OBJECT.STATUS, EVENTS.ANCHOR.STATUS, etc.)
 * @param {String} status - Status code (started, in-progress, completed, etc.)
 * @param {String} message - Human-readable status message
 * @param {Object} additionalData - Any additional data to include
 */
function emitStatus(element, statusType, status, message, additionalData = {}) {
  emitEvent(element, statusType, {
    status,
    message,
    ...additionalData
  });
}

// Export event utilities
export {
  EVENTS,
  emitEvent,
  emitStatus
};
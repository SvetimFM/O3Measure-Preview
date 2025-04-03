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
 * Adds an event listener with automatic binding
 * @param {HTMLElement} element - Element to add listener to
 * @param {String} eventName - Event name (use EVENTS constants)
 * @param {Function} handler - Event handler function
 * @param {Object} context - Context to bind handler to
 * @returns {Function} Bound handler function (for removal)
 */
function addListener(element, eventName, handler, context) {
  if (!element || !element.addEventListener) {
    console.error('Events: Cannot add listener, invalid element');
    return null;
  }
  
  // Bind handler to context if provided
  const boundHandler = context ? handler.bind(context) : handler;
  
  // Add event listener
  element.addEventListener(eventName, boundHandler);
  
  // Return the bound handler for later removal
  return boundHandler;
}

/**
 * Removes an event listener
 * @param {HTMLElement} element - Element to remove listener from
 * @param {String} eventName - Event name
 * @param {Function} boundHandler - Bound handler function
 */
function removeListener(element, eventName, boundHandler) {
  if (!element || !element.removeEventListener) {
    console.error('Events: Cannot remove listener, invalid element');
    return;
  }
  
  element.removeEventListener(eventName, boundHandler);
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
  addListener,
  removeListener,
  emitStatus
};
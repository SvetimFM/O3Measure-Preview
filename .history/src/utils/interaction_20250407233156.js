/**
 * Interaction Utilities
 * 
 * Provides common utilities for handling user interactions
 * with VR/AR controllers and hand tracking.
 */

// Ensure THREE is accessible in this module
const THREE = window.THREE;

/**
 * Process a pinch event to get the world position
 * @param {Object} event - The pinch event
 * @returns {THREE.Vector3|null} World position or null if not found
 */
function getPinchPosition(event) {
  // Get position from pinch event
  let worldPosition;
  
  if (event.detail && event.detail.position) {
    // Get position directly from event
    const position = event.detail.position;
    worldPosition = new THREE.Vector3(position.x, position.y, position.z);
  } else {
    // Get position from hand entity if position not in event
    const hand = event.detail.hand === 'left' ? 'leftHand' : 'rightHand';
    const handEls = document.querySelectorAll(`#${hand}`);
    
    if (handEls.length > 0) {
      const handEl = handEls[0];
      const position = handEl.getAttribute('position');
      worldPosition = new THREE.Vector3(position.x, position.y, position.z);
    } else {
      console.error('Could not find hand entity');
      return null;
    }
  }
  
  return worldPosition;
}

/**
 * Prevent multiple interactions in quick succession
 * @param {Number} lastInteractionTime - Last interaction timestamp
 * @param {Number} minInterval - Minimum interval in ms between interactions
 * @returns {Number|Boolean} New timestamp or false if debounced
 */
function debounceInteraction(lastInteractionTime, minInterval = 1000) {
  const now = Date.now();
  if (lastInteractionTime && (now - lastInteractionTime < minInterval)) {
    return false;
  }
  return now;
}

/**
 * Get hand entity by hand type
 * @param {String} hand - Hand type ('left' or 'right')
 * @returns {HTMLElement|null} Hand entity or null if not found
 */
function getHandEntity(hand) {
  const handId = hand === 'left' ? 'leftHand' : 'rightHand';
  const handEls = document.querySelectorAll(`#${handId}`);
  
  if (handEls.length > 0) {
    return handEls[0];
  }
  
  console.error(`Could not find ${hand} hand entity`);
  return null;
}




// Export utility functions
export {
  getPinchPosition,
  debounceInteraction,
  getHandEntity,
};
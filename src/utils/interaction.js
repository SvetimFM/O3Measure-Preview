/**
 * Interaction Utilities
 * 
 * Provides common utilities for handling user interactions
 * with VR/AR controllers and hand tracking.
 */

// Ensure THREE is accessible in this module
const THREE = window.THREE;

// Process a pinch event to get the world position
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

// Prevent multiple interactions in quick succession
function debounceInteraction(lastInteractionTime, minInterval = 1000) {
  const now = Date.now();
  if (lastInteractionTime && (now - lastInteractionTime < minInterval)) {
    return false;
  }
  return now;
}

// Export utility functions
export {
  getPinchPosition,
  debounceInteraction
};
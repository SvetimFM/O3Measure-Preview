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

/**
 * Get the position of a hand in world space
 * @param {String} hand - Hand type ('left' or 'right')
 * @returns {THREE.Vector3|null} Hand position or null if not found
 */
function getHandPosition(hand) {
  const handEntity = getHandEntity(hand);
  
  if (!handEntity) {
    return null;
  }
  
  const position = handEntity.getAttribute('position');
  return new THREE.Vector3(position.x, position.y, position.z);
}

/**
 * Check if a point intersects with a plane
 * @param {THREE.Vector3} point - Point to check
 * @param {HTMLElement} planeEl - A-Frame plane element
 * @param {Number} threshold - Distance threshold
 * @returns {Boolean} True if point intersects with plane
 */
function pointIntersectsPlane(point, planeEl, threshold = 0.1) {
  if (!planeEl) return false;
  
  // Get plane position and normal
  const planePos = new THREE.Vector3();
  planePos.copy(planeEl.object3D.position);
  
  // Get plane normal
  const normal = new THREE.Vector3(0, 0, 1);
  planeEl.object3D.getWorldQuaternion(new THREE.Quaternion()).normalize();
  planeEl.object3D.localToWorld(normal);
  
  // Calculate distance from point to plane
  const distance = new THREE.Vector3().subVectors(point, planePos).dot(normal);
  
  return Math.abs(distance) <= threshold;
}

/**
 * Calculate ray intersection with plane
 * @param {THREE.Vector3} origin - Ray origin
 * @param {THREE.Vector3} direction - Ray direction
 * @param {HTMLElement} planeEl - A-Frame plane element
 * @returns {THREE.Vector3|null} Intersection point or null
 */
function rayPlaneIntersection(origin, direction, planeEl) {
  if (!planeEl) return null;
  
  // Get plane position
  const planePos = new THREE.Vector3();
  planePos.copy(planeEl.object3D.position);
  
  // Get plane normal
  const normal = new THREE.Vector3(0, 0, 1);
  const planeQuat = new THREE.Quaternion();
  planeEl.object3D.getWorldQuaternion(planeQuat);
  normal.applyQuaternion(planeQuat);
  
  // Create ray
  const ray = new THREE.Ray(origin, direction.normalize());
  
  // Create plane
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, planePos);
  
  // Calculate intersection
  const intersectionPoint = new THREE.Vector3();
  const intersected = ray.intersectPlane(plane, intersectionPoint);
  
  return intersected ? intersectionPoint : null;
}

// Export utility functions
export {
  getPinchPosition,
  debounceInteraction,
  getHandEntity,
  getHandPosition,
  pointIntersectsPlane,
  rayPlaneIntersection
};
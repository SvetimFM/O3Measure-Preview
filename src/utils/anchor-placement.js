/**
 * Anchor Placement Utility
 * 
 * Provides reusable functions for placing anchor points in 3D space
 * and creating visual markers for those points.
 */

// Ensure THREE is accessible in this module
const THREE = window.THREE;

// Create a marker at the selected point
function createMarker(position, index, color, scene) {
  // Create a visual marker at the selected point
  const marker = document.createElement('a-entity');
  marker.setAttribute('class', 'point-marker');
  
  // Create sphere for the marker
  const sphere = document.createElement('a-sphere');
  sphere.setAttribute('radius', 0.02);
  sphere.setAttribute('color', color || '#4285F4');
  sphere.setAttribute('shader', 'flat');
  marker.appendChild(sphere);
  
  // Create label
  const label = document.createElement('a-text');
  label.setAttribute('value', `${index || ''}`);
  label.setAttribute('align', 'center');
  label.setAttribute('position', '0 0.05 0');
  label.setAttribute('scale', '0.1 0.1 0.1');
  label.setAttribute('color', '#FFFFFF');
  label.setAttribute('look-at', '[camera]');
  marker.appendChild(label);
  
  // Position marker
  marker.setAttribute('position', position);
  
  // Add to scene
  scene.appendChild(marker);
  
  return marker;
}

// Remove markers from the scene
function removeMarkers(markers) {
  // Remove all point markers from scene
  markers.forEach(marker => {
    if (marker.parentNode) {
      marker.parentNode.removeChild(marker);
    }
  });
  return [];
}

// Calculate a plane from three points
function calculatePlaneFromPoints(p1, p2, p3) {
  // Calculate two vectors on the plane
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  
  // Calculate normal vector using cross product
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  
  // Ensure normal is pointing towards the user (positive Z)
  if (normal.z < 0) {
    normal.negate();
  }
  
  // Get rotation from normal vector
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), // Default normal (facing user)
    normal
  );
  rotation.setFromQuaternion(quaternion);
  
  return {
    normal: normal,
    rotation: rotation,
    point: p1
  };
}

// Calculate rectangle dimensions from corner points
function calculateRectangleDimensions(points) {
  if (points.length < 4) {
    console.error('Not enough points to calculate rectangle dimensions');
    return null;
  }
  
  // Calculate width (distance between p1 and p2)
  const width = points[0].distanceTo(points[1]);
  
  // Calculate height (distance between p1 and p3)
  const height = points[0].distanceTo(points[2]);
  
  // Calculate center point
  const center = new THREE.Vector3()
    .add(points[0])
    .add(points[1])
    .add(points[2])
    .add(points[3])
    .divideScalar(4);
  
  return {
    width: width,
    height: height,
    center: center,
    area: width * height
  };
}

// Export utility functions
export {
  createMarker,
  removeMarkers,
  calculatePlaneFromPoints,
  calculateRectangleDimensions
};
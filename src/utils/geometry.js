/**
 * 3D Geometry Utilities
 * 
 * Provides standardized functions for 3D geometry calculations used across the application.
 * Centralizes common vector operations, plane calculations, and rotation conversions.
 */

// Ensure THREE is accessible in this module
const THREE = window.THREE;

/**
 * Convert a position object to THREE.Vector3
 * @param {Object|THREE.Vector3} position - Position object {x,y,z} or Vector3
 * @returns {THREE.Vector3} THREE.Vector3 instance
 */
function toVector3(position) {
  if (position instanceof THREE.Vector3) {
    return position.clone();
  }
  
  return new THREE.Vector3(
    position.x || 0,
    position.y || 0,
    position.z || 0
  );
}

/**
 * Calculate a plane from three points
 * @param {THREE.Vector3} p1 - First point
 * @param {THREE.Vector3} p2 - Second point
 * @param {THREE.Vector3} p3 - Third point
 * @returns {Object} Plane information (normal, rotation, point)
 */
function calculatePlaneFromPoints(p1, p2, p3) {
  // Ensure inputs are Vector3
  p1 = toVector3(p1);
  p2 = toVector3(p2);
  p3 = toVector3(p3);
  
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

/**
 * Calculates the fourth point of a rectangle given three corners
 * @param {THREE.Vector3} p1 - Top-left point
 * @param {THREE.Vector3} p2 - Top-right point
 * @param {THREE.Vector3} p3 - Bottom-right point
 * @returns {THREE.Vector3} p4 - Bottom-left point
 */
function calculateFourthCorner(p1, p2, p3) {
  // Ensure inputs are Vector3
  p1 = toVector3(p1);
  p2 = toVector3(p2);
  p3 = toVector3(p3);
  
  // Calculate the fourth point (bottom-left) to complete the rectangle
  // p4 = p1 + (p3 - p2)
  const p4Vector = new THREE.Vector3().subVectors(p3, p2);
  return new THREE.Vector3().addVectors(p1, p4Vector);
}

/**
 * Calculate rectangle dimensions and properties from corner points
 * @param {Array<THREE.Vector3>} points - Array of corner points (Vector3)
 * @returns {Object} Rectangle properties (width, height, center, area)
 */
function calculateRectangleDimensions(points) {
  if (points.length < 3) {
    console.error('Not enough points to calculate rectangle dimensions');
    return null;
  }
  
  // Ensure inputs are Vector3
  points = points.map(p => toVector3(p));
  
  let width, height, center;
  
  if (points.length === 3) {
    // For 3 points (top-left, top-right, bottom-right)
    const p1 = points[0]; // top-left
    const p2 = points[1]; // top-right
    const p3 = points[2]; // bottom-right
    
    // Calculate width and height
    width = p1.distanceTo(p2);
    height = p2.distanceTo(p3);
    
    // Calculate the fourth point (bottom-left)
    const p4 = calculateFourthCorner(p1, p2, p3);
    
    // Calculate center of rectangle
    center = new THREE.Vector3()
      .add(p1).add(p2).add(p3).add(p4)
      .divideScalar(4);
      
  } else if (points.length >= 4) {
    // For 4+ points, use the first 4
    width = points[0].distanceTo(points[1]);
    height = points[1].distanceTo(points[2]);
    
    // Calculate center from 4 points
    center = new THREE.Vector3()
      .add(points[0])
      .add(points[1])
      .add(points[2])
      .add(points[3])
      .divideScalar(4);
  }
  
  return {
    width,
    height,
    center,
    area: width * height
  };
}

/**
 * Calculate the orientation for a rectangle defined by 3 points
 * @param {THREE.Vector3} p1 - Top-left point
 * @param {THREE.Vector3} p2 - Top-right point
 * @param {THREE.Vector3} p3 - Bottom-right point
 * @returns {Object} Rotation as Euler angles in degrees
 */
function calculateRectangleOrientation(p1, p2, p3) {
  // Ensure inputs are Vector3
  p1 = toVector3(p1);
  p2 = toVector3(p2);
  p3 = toVector3(p3);
  
  // Calculate the fourth point (bottom-left)
  const p4 = calculateFourthCorner(p1, p2, p3);
  
  // Calculate basis vectors for the rectangle's orientation
  const rightVector = new THREE.Vector3().subVectors(p2, p1).normalize();
  const upVector = new THREE.Vector3().subVectors(p1, p4).normalize();
  const forwardVector = new THREE.Vector3().crossVectors(rightVector, upVector).normalize();
  
  // Create a rotation matrix from these basis vectors
  const rotMatrix = new THREE.Matrix4().makeBasis(rightVector, upVector, forwardVector);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);
  
  // Convert to degrees for A-Frame
  return {
    x: THREE.MathUtils.radToDeg(euler.x),
    y: THREE.MathUtils.radToDeg(euler.y),
    z: THREE.MathUtils.radToDeg(euler.z)
  };
}

/**
 * Convert Euler angles from radians to degrees
 * @param {THREE.Euler} euler - Euler angles in radians
 * @returns {Object} Rotation angles in degrees
 */
function eulerToDegrees(euler) {
  return {
    x: THREE.MathUtils.radToDeg(euler.x),
    y: THREE.MathUtils.radToDeg(euler.y),
    z: THREE.MathUtils.radToDeg(euler.z)
  };
}

/**
 * Convert Euler angles from degrees to radians
 * @param {Object} degrees - Rotation angles in degrees
 * @returns {THREE.Euler} Euler angles in radians
 */
function degreesToEuler(degrees) {
  return new THREE.Euler(
    THREE.MathUtils.degToRad(degrees.x || 0),
    THREE.MathUtils.degToRad(degrees.y || 0),
    THREE.MathUtils.degToRad(degrees.z || 0)
  );
}

/**
 * Calculate the center point of multiple points
 * @param {Array<THREE.Vector3>} points - Array of points
 * @returns {THREE.Vector3} Center point
 */
function calculateCentroid(points) {
  if (!points || points.length === 0) {
    return new THREE.Vector3();
  }
  
  // Ensure inputs are Vector3
  points = points.map(p => toVector3(p));
  
  const center = new THREE.Vector3();
  points.forEach(point => center.add(point));
  return center.divideScalar(points.length);
}

/**
 * Converts measurement in meters to centimeters with specified precision
 * @param {Number} meters - Measurement in meters
 * @param {Number} precision - Number of decimal places (default: 1)
 * @returns {String} Formatted string with cm units
 */
function metersToFormattedCm(meters, precision = 1) {
  return (meters * 100).toFixed(precision);
}

// Export utility functions
export {
  toVector3,
  calculatePlaneFromPoints,
  calculateFourthCorner,
  calculateRectangleDimensions,
  calculateRectangleOrientation,
  eulerToDegrees,
  degreesToEuler,
  calculateCentroid,
  metersToFormattedCm
};
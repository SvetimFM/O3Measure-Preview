/**
 * 3D Geometry Utilities
 * 
 * Core geometric functions used across the application.
 * This module focuses on 3D math and coordinate operations.
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
 * @param {THREE.Vector3|Object} p1 - First point
 * @param {THREE.Vector3|Object} p2 - Second point
 * @param {THREE.Vector3|Object} p3 - Third point
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
  
  // Get rotation from normal vector
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), // Default normal
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
 * Calculate the fourth corner of a rectangle defined by three points
 * @param {THREE.Vector3|Object} p1 - Top-left point
 * @param {THREE.Vector3|Object} p2 - Top-right point
 * @param {THREE.Vector3|Object} p3 - Bottom-right point
 * @returns {THREE.Vector3} Bottom-left point (p4)
 */
function calculateFourthCorner(p1, p2, p3) {
  // Ensure inputs are Vector3
  p1 = toVector3(p1);
  p2 = toVector3(p2);
  p3 = toVector3(p3);
  
  // Calculate the fourth point (bottom-left)
  // p4 = p1 + (p3 - p2)
  const p4Vector = new THREE.Vector3().subVectors(p3, p2);
  return new THREE.Vector3().addVectors(p1, p4Vector);
}

/**
 * Calculate rectangle dimensions from corner points
 * @param {Array<THREE.Vector3|Object>} points - Array of corner points
 * @returns {Object} Rectangle properties (width, height, center, area)
 */
function calculateRectangleDimensions(points) {
  if (points.length < 3) {
    console.error('Not enough points to calculate rectangle dimensions');
    return null;
  }
  
  // Ensure inputs are Vector3
  points = points.map(p => toVector3(p));
  
  // For 3 points (top-left, top-right, bottom-right)
  const p1 = points[0]; // top-left
  const p2 = points[1]; // top-right
  const p3 = points[2]; // bottom-right
  
  // Calculate width and height
  const width = p1.distanceTo(p2);
  const height = p2.distanceTo(p3);
  
  // Calculate the fourth point (bottom-left) if needed
  let p4;
  if (points.length === 3) {
    p4 = calculateFourthCorner(p1, p2, p3);
  } else {
    p4 = points[3];
  }
  
  // Calculate center of rectangle
  const center = new THREE.Vector3()
    .add(p1).add(p2).add(p3).add(p4)
    .divideScalar(4);
  
  return {
    width,
    height,
    center,
    area: width * height
  };
}

/**
 * Calculate the orientation for a rectangle defined by 3 points
 * @param {THREE.Vector3|Object} p1 - Top-left point
 * @param {THREE.Vector3|Object} p2 - Top-right point
 * @param {THREE.Vector3|Object} p3 - Bottom-right point
 * @returns {Object} Rotation in degrees for use with A-Frame
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
 * Test if a point is inside or on the boundary of a rectangle defined by 4 points
 * @param {THREE.Vector3|Object} point - Point to test
 * @param {Array<THREE.Vector3|Object>} rectPoints - Rectangle corner points
 * @returns {Boolean} True if point is inside or on the rectangle
 */
function pointInRectangle(point, rectPoints) {
  if (rectPoints.length !== 4) {
    console.error('Rectangle must be defined by exactly 4 points');
    return false;
  }
  
  // Convert to Vector3
  point = toVector3(point);
  const points = rectPoints.map(p => toVector3(p));
  
  // Calculate plane from first 3 points
  const plane = calculatePlaneFromPoints(points[0], points[1], points[2]);
  
  // Project point onto plane
  const projectedPoint = projectPointOntoPlane(point, plane);
  
  // Test if projected point is within rectangle bounds
  const v0 = new THREE.Vector3().subVectors(points[3], points[0]);
  const v1 = new THREE.Vector3().subVectors(points[1], points[0]);
  const v2 = new THREE.Vector3().subVectors(projectedPoint, points[0]);
  
  const dot00 = v0.dot(v0);
  const dot01 = v0.dot(v1);
  const dot02 = v0.dot(v2);
  const dot11 = v1.dot(v1);
  const dot12 = v1.dot(v2);
  
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  
  return (u >= 0) && (v >= 0) && (u <= 1) && (v <= 1);
}

/**
 * Project a point onto a plane
 * @param {THREE.Vector3} point - Point to project
 * @param {Object} plane - Plane object with normal and point properties
 * @returns {THREE.Vector3} Projected point
 */
function projectPointOntoPlane(point, plane) {
  // Calculate distance from point to plane
  const v = new THREE.Vector3().subVectors(point, plane.point);
  const dist = v.dot(plane.normal);
  
  // Project point onto plane by subtracting the normal component
  return new THREE.Vector3().copy(point).sub(
    plane.normal.clone().multiplyScalar(dist)
  );
}

/**
 * Converts measurement in meters to formatted centimeters string
 * @param {Number} meters - Measurement in meters
 * @param {Number} precision - Number of decimal places (default: 1)
 * @returns {String} Formatted centimeter value
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
  pointInRectangle,
  projectPointOntoPlane,
  metersToFormattedCm
};
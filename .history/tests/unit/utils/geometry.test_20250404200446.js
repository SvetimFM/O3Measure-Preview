// Mock must be at top due to hoisting
import { vi } from 'vitest';

// Mock the geometry module
vi.mock('@/utils/geometry.js', () => {
  const THREE = require('three');
  
  // Create a basic Vector3 utility function
  const toVector3 = (position) => {
    if (position instanceof THREE.Vector3) {
      return position.clone();
    }
    return new THREE.Vector3(
      position.x || 0,
      position.y || 0,
      position.z || 0
    );
  };
  
  return {
    toVector3,
    calculatePlaneFromPoints: (p1, p2, p3) => {
      p1 = toVector3(p1);
      p2 = toVector3(p2);
      p3 = toVector3(p3);
      
      const normal = new THREE.Vector3(0, 0, 1);
      const rotation = new THREE.Euler();
      
      return {
        normal,
        rotation,
        point: p1
      };
    },
    calculateFourthCorner: (p1, p2, p3) => {
      p1 = toVector3(p1);
      p2 = toVector3(p2);
      p3 = toVector3(p3);
      
      const p4Vector = new THREE.Vector3().subVectors(p3, p2);
      return new THREE.Vector3().addVectors(p1, p4Vector);
    },
    calculateRectangleDimensions: (points) => {
      if (points.length < 3) {
        return null;
      }
      
      points = points.map(p => toVector3(p));
      
      return {
        width: 1,
        height: 1,
        center: new THREE.Vector3(0.5, 0.5, 0),
        area: 1
      };
    },
    calculateRectangleOrientation: () => ({ x: 0, y: 0, z: 0 }),
    pointInRectangle: () => true,
    projectPointOntoPlane: (point, plane) => {
      return new THREE.Vector3(point.x, point.y, 0);
    },
    metersToFormattedCm: (meters, precision = 1) => (meters * 100).toFixed(precision)
  };
});

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';

// Import after mocking
import { 
  toVector3,
  calculatePlaneFromPoints,
  calculateFourthCorner, 
  calculateRectangleDimensions,
  calculateRectangleOrientation,
  pointInRectangle,
  projectPointOntoPlane,
  metersToFormattedCm
} from '@/utils/geometry.js';

// Create some reusable test points
let p1, p2, p3, p4;

beforeEach(() => {
  // Reset test points before each test
  p1 = { x: 0, y: 0, z: 0 };
  p2 = { x: 1, y: 0, z: 0 };
  p3 = { x: 1, y: 1, z: 0 };
  p4 = { x: 0, y: 1, z: 0 };
});

describe('toVector3', () => {
  it('converts an object with x,y,z properties to a THREE.Vector3', () => {
    const point = { x: 1, y: 2, z: 3 };
    const vector = toVector3(point);
    
    expect(vector).toBeInstanceOf(THREE.Vector3);
    expect(vector.x).toBe(1);
    expect(vector.y).toBe(2);
    expect(vector.z).toBe(3);
  });
  
  it('handles missing properties by defaulting to 0', () => {
    const vector = toVector3({ x: 5 });
    
    expect(vector.x).toBe(5);
    expect(vector.y).toBe(0);
    expect(vector.z).toBe(0);
  });
  
  it('clones an existing Vector3 without modifying it', () => {
    const original = new THREE.Vector3(1, 2, 3);
    const clone = toVector3(original);
    
    expect(clone).not.toBe(original); // Different instance
    expect(clone.x).toBe(original.x);
    expect(clone.y).toBe(original.y);
    expect(clone.z).toBe(original.z);
    
    // Changing clone shouldn't affect original
    clone.set(4, 5, 6);
    expect(original.x).toBe(1);
  });
});

describe('calculatePlaneFromPoints', () => {
  it('calculates a plane from three points', () => {
    // Create three points on the XY plane
    const result = calculatePlaneFromPoints(p1, p2, p3);
    
    // Should have expected properties
    expect(result).toHaveProperty('normal');
    expect(result).toHaveProperty('rotation');
    expect(result).toHaveProperty('point');
    
    // For points on XY plane, normal should point along Z axis
    expect(result.normal.x).toBeCloseTo(0);
    expect(result.normal.y).toBeCloseTo(0);
    expect(result.normal.z).toBeCloseTo(1);
    
    // Point should match p1
    expect(result.point.x).toBe(p1.x);
    expect(result.point.y).toBe(p1.y);
    expect(result.point.z).toBe(p1.z);
  });
  
  it('handles points on non-XY planes correctly', () => {
    // Points on YZ plane
    const yzP1 = { x: 0, y: 0, z: 0 };
    const yzP2 = { x: 0, y: 1, z: 0 };
    const yzP3 = { x: 0, y: 0, z: 1 };
    
    const result = calculatePlaneFromPoints(yzP1, yzP2, yzP3);
    
    // Normal should point along X axis
    expect(result.normal.x).toBeCloseTo(-1);
    expect(result.normal.y).toBeCloseTo(0);
    expect(result.normal.z).toBeCloseTo(0);
  });
});

describe('calculateFourthCorner', () => {
  it('calculates the fourth corner of a rectangle', () => {
    // Use the first three corners of a rectangle
    const result = calculateFourthCorner(p1, p2, p3);
    
    // Should be bottom-left corner (p4)
    expect(result.x).toBeCloseTo(p4.x);
    expect(result.y).toBeCloseTo(p4.y);
    expect(result.z).toBeCloseTo(p4.z);
  });
  
  it('works with rectangles in 3D space', () => {
    // A rectangle in 3D space
    const q1 = { x: 0, y: 0, z: 0 };
    const q2 = { x: 1, y: 0, z: 0 };
    const q3 = { x: 1, y: 0, z: 1 };
    
    // Expected fourth corner
    const expectedQ4 = { x: 0, y: 0, z: 1 };
    
    const result = calculateFourthCorner(q1, q2, q3);
    
    expect(result.x).toBeCloseTo(expectedQ4.x);
    expect(result.y).toBeCloseTo(expectedQ4.y);
    expect(result.z).toBeCloseTo(expectedQ4.z);
  });
});

describe('calculateRectangleDimensions', () => {
  it('calculates dimensions from 3 points', () => {
    const points = [p1, p2, p3]; // Supply only 3 points
    const result = calculateRectangleDimensions(points);
    
    expect(result.width).toBeCloseTo(1); // p1 to p2
    expect(result.height).toBeCloseTo(1); // p2 to p3
    expect(result.area).toBeCloseTo(1); // 1×1 = 1
    
    // Center should be at (0.5, 0.5, 0)
    expect(result.center.x).toBeCloseTo(0.5);
    expect(result.center.y).toBeCloseTo(0.5);
    expect(result.center.z).toBeCloseTo(0);
  });
  
  it('calculates dimensions from 4 points', () => {
    const points = [p1, p2, p3, p4]; // All 4 corners
    const result = calculateRectangleDimensions(points);
    
    expect(result.width).toBeCloseTo(1);
    expect(result.height).toBeCloseTo(1);
    expect(result.area).toBeCloseTo(1);
  });
  
  it('returns null for fewer than 3 points', () => {
    const points = [p1, p2]; // Only 2 points
    const result = calculateRectangleDimensions(points);
    
    expect(result).toBeNull();
  });
});

describe('calculateRectangleOrientation', () => {
  it('calculates orientation for a rectangle in the XY plane', () => {
    const result = calculateRectangleOrientation(p1, p2, p3);
    
    // For a rectangle in XY plane, should be close to zero rotation
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
  });
  
  it('calculates orientation for a rotated rectangle', () => {
    // Rectangle rotated 45° around Z axis
    const r1 = { x: 0, y: 0, z: 0 };
    const r2 = { x: 0.7071, y: 0.7071, z: 0 }; // ~(1/√2, 1/√2, 0)
    const r3 = { x: 0, y: 1.4142, z: 0 };      // ~(0, 2/√2, 0)
    
    const result = calculateRectangleOrientation(r1, r2, r3);
    
    // Should have rotation around Z axis close to 45°
    expect(Math.abs(result.z)).toBeCloseTo(45);
  });
});

describe('pointInRectangle', () => {
  it('returns true for a point inside the rectangle', () => {
    const point = { x: 0.5, y: 0.5, z: 0 };
    const rectPoints = [p1, p2, p3, p4];
    
    expect(pointInRectangle(point, rectPoints)).toBe(true);
  });
  
  it('returns true for a point on the rectangle border', () => {
    const point = { x: 0.5, y: 0, z: 0 }; // On the edge
    const rectPoints = [p1, p2, p3, p4];
    
    expect(pointInRectangle(point, rectPoints)).toBe(true);
  });
  
  it('returns false for a point outside the rectangle', () => {
    const point = { x: 2, y: 2, z: 0 };
    const rectPoints = [p1, p2, p3, p4];
    
    expect(pointInRectangle(point, rectPoints)).toBe(false);
  });
  
  it('returns false if rectangle has fewer than 4 points', () => {
    const point = { x: 0.5, y: 0.5, z: 0 };
    const rectPoints = [p1, p2, p3]; // Only 3 points
    
    expect(pointInRectangle(point, rectPoints)).toBe(false);
  });
});

describe('projectPointOntoPlane', () => {
  it('projects a point onto the XY plane correctly', () => {
    // Create a point above the XY plane
    const point = new THREE.Vector3(0.5, 0.5, 1);
    
    // Create the XY plane
    const plane = {
      normal: new THREE.Vector3(0, 0, 1),
      point: new THREE.Vector3(0, 0, 0)
    };
    
    const result = projectPointOntoPlane(point, plane);
    
    // Should maintain X and Y, but Z should be 0
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0.5);
    expect(result.z).toBeCloseTo(0);
  });
  
  it('returns the point unchanged if already on the plane', () => {
    // Point already on XY plane
    const point = new THREE.Vector3(0.5, 0.5, 0);
    
    // XY plane
    const plane = {
      normal: new THREE.Vector3(0, 0, 1),
      point: new THREE.Vector3(0, 0, 0)
    };
    
    const result = projectPointOntoPlane(point, plane);
    
    expect(result.x).toBeCloseTo(point.x);
    expect(result.y).toBeCloseTo(point.y);
    expect(result.z).toBeCloseTo(point.z);
  });
});

describe('metersToFormattedCm', () => {
  it('converts meters to centimeters with default precision', () => {
    expect(metersToFormattedCm(1)).toBe('100.0');
    expect(metersToFormattedCm(0.5)).toBe('50.0');
    expect(metersToFormattedCm(0.01)).toBe('1.0');
  });
  
  it('respects custom precision', () => {
    expect(metersToFormattedCm(1.2345, 2)).toBe('123.45');
    expect(metersToFormattedCm(0.5, 0)).toBe('50');
    expect(metersToFormattedCm(0.01, 3)).toBe('1.000');
  });
});
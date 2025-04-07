/**
 * HangableObject Class
 * 
 * Represents a rectangular object that can be hung on a wall,
 * including dimensions, position, and anchor points.
 */

import { 
  calculateFourthCorner, 
  calculateRectangleDimensions, 
  calculateRectangleOrientation,
  metersToFormattedCm
} from './geometry.js';

import { THREE, toVector3 } from './three-utils.js';

export class HangableObject {
  /**
   * Create a new HangableObject
   * @param {Object} options - Object initialization options
   */
  constructor(options = {}) {
    this.id = options.id || 'object_' + Date.now();
    this.type = 'rectangle'; // Currently only supporting rectangles
    this.points = options.points || [];
    this.anchors = options.anchors || [];
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.center = options.center || { x: 0, y: 0, z: 0 };
    this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
    this.visible = options.visible !== undefined ? options.visible : true;
    this.locked = options.locked || false;
    this.createdAt = options.createdAt || new Date().toISOString();
    
    // Calculate missing properties if we have points but not dimensions
    if (this.points.length >= 3 && (!this.width || !this.height)) {
      this.calculateFromPoints();
    }
  }
  
  /**
   * Calculate dimensions and properties from corner points
   * @returns {Boolean} Whether calculation was successful
   */
  calculateFromPoints() {
    if (this.points.length < 3) {
      console.error('HangableObject: Not enough points to calculate dimensions');
      return false;
    }
    
    // Convert to Vector3 objects if they're not already
    const points = this.points.map(p => toVector3(p));
    
    // Use centralized calculation functions from geometry module
    const dimensions = calculateRectangleDimensions(points);
    if (!dimensions) return false;
    
    // Update dimensions
    this.width = dimensions.width;
    this.height = dimensions.height;
    
    // Update center
    this.center = {
      x: dimensions.center.x,
      y: dimensions.center.y,
      z: dimensions.center.z
    };
    
    // Update rotation (the centralized function already expects 3 points)
    this.rotation = calculateRectangleOrientation(points[0], points[1], points[2]);
    
    return true;
  }
  
  /**
   * Add an anchor point to the object
   * @param {Object} anchor - Anchor point data
   * @returns {String} ID of the new anchor
   */
  addAnchor(anchor) {
    // Ensure the anchor has an ID
    const anchorId = anchor.id || `anchor_${Date.now()}_${this.anchors.length}`;
    
    // Create a complete anchor object
    const newAnchor = {
      id: anchorId,
      objectId: this.id,
      position: anchor.position || { x: 0, y: 0, z: 0.001 },
      color: anchor.color || '#F4B400',
      label: anchor.label || `${this.anchors.length + 1}`
    };
    
    // Add to anchors array
    this.anchors.push(newAnchor);
    
    return anchorId;
  }
  
  /**
   * Clear all anchors from the object
   */
  clearAnchors() {
    this.anchors = [];
  }
  
  /**
   * Set auto-positioned anchors based on count
   * @param {Number} count - Number of anchors to create (1-4)
   */
  autoPlaceAnchors(count) {
    // Clear existing anchors
    this.clearAnchors();
    
    // Get default positions based on count
    const positions = this.getDefaultAnchorPositions(count);
    
    // Add each anchor
    positions.forEach((pos, index) => {
      // Convert from normalized to local coordinates
      const localPos = {
        x: (pos.x - 0.5) * this.width,
        y: (pos.y - 0.5) * this.height,
        z: 0.001 // Small offset
      };
      
      // Add anchor with appropriate color
      const colors = ['#F4B400', '#DB4437', '#4285F4', '#0F9D58']; // Google colors
      this.addAnchor({
        position: localPos,
        color: colors[index % colors.length],
        label: `${index + 1}`
      });
    });
    
    return this.anchors;
  }
  
  /**
   * Get default positions for anchors based on count
   * @param {Number} count - Number of anchors (1-4)
   * @returns {Array} Array of {x,y} positions (normalized 0-1)
   */
  getDefaultAnchorPositions(count) {
    switch(count) {
      case 1:
        // Center
        return [{ x: 0.5, y: 0.5 }];
      case 2:
        // Top center and bottom center
        return [
          { x: 0.5, y: 0.25 },
          { x: 0.5, y: 0.75 }
        ];
      case 3:
        // Triangle pattern
        return [
          { x: 0.5, y: 0.2 },
          { x: 0.2, y: 0.8 },
          { x: 0.8, y: 0.8 }
        ];
      case 4:
        // Near the corners
        return [
          { x: 0.2, y: 0.2 },
          { x: 0.8, y: 0.2 },
          { x: 0.8, y: 0.8 },
          { x: 0.2, y: 0.8 }
        ];
      default:
        return [{ x: 0.5, y: 0.5 }];
    }
  }
  
  /**
   * Calculate fourth corner point from the three existing corners
   * @returns {Object} Position of fourth corner
   */
  calculateFourthCorner() {
    if (this.points.length < 3) {
      console.error('HangableObject: Not enough points to calculate fourth corner');
      return null;
    }
    
    const p1 = toVector3(this.points[0]); // top-left
    const p2 = toVector3(this.points[1]); // top-right
    const p3 = toVector3(this.points[2]); // bottom-right
    
    // Use geometry utility to calculate fourth point
    const p4 = calculateFourthCorner(p1, p2, p3);
    
    return {
      x: p4.x,
      y: p4.y, 
      z: p4.z
    };
  }
  
  /**
   * Get formatted dimensions in centimeters
   * @param {Number} precision - Decimal places for formatting
   * @returns {Object} Formatted dimensions
   */
  getFormattedDimensions(precision = 1) {
    return {
      widthCm: metersToFormattedCm(this.width, precision),
      heightCm: metersToFormattedCm(this.height, precision),
      areaCm2: (this.width * this.height * 10000).toFixed(0)
    };
  }
  
  /**
   * Toggle visibility of the object
   * @returns {Boolean} New visibility state
   */
  toggleVisibility() {
    this.visible = !this.visible;
    return this.visible;
  }
  
  /**
   * Serialize the object to JSON
   * @returns {Object} Plain JavaScript object for storage/transmission
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      points: this.points,
      anchors: this.anchors,
      width: this.width,
      height: this.height,
      center: this.center,
      rotation: this.rotation,
      visible: this.visible,
      locked: this.locked,
      createdAt: this.createdAt
    };
  }
  
  /**
   * Create a HangableObject from JSON data
   * @param {Object} data - Serialized object data
   * @returns {HangableObject} New HangableObject instance
   */
  static fromJSON(data) {
    return new HangableObject(data);
  }
}

export default HangableObject;
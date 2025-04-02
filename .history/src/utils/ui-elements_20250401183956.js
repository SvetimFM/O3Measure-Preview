/**
 * UI Elements Utilities
 * 
 * Provides standardized functions for creating common UI elements
 * in A-Frame to maintain consistency and reduce boilerplate.
 */

// Ensure THREE is accessible in this module
const THREE = window.THREE;

/**
 * Creates an A-Frame entity with specified attributes
 * @param {Object} attributes - Key-value pairs of attributes
 * @param {Array} children - Child entities to append
 * @returns {HTMLElement} The created entity
 */
function createEntity(attributes = {}, children = []) {
  const entity = document.createElement('a-entity');
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    entity.setAttribute(key, value);
  });
  
  // Add children
  children.forEach(child => {
    if (child) entity.appendChild(child);
  });
  
  return entity;
}

/**
 * Creates a marker at a point in 3D space
 * @param {THREE.Vector3} position - Position for the marker
 * @param {Number|String} index - Index number or label
 * @param {String} color - Color for the marker
 * @param {HTMLElement} scene - A-Frame scene to add marker to
 * @returns {HTMLElement} The created marker
 */
function createMarker(position, index, color, scene) {
  // Create a visual marker at the selected point
  const marker = document.createElement('a-entity');
  marker.setAttribute('class', 'point-marker');
  
  // Create sphere for the marker
  const sphere = document.createElement('a-sphere');
  sphere.setAttribute('radius', 0.01);
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
  if (scene) {
    scene.appendChild(marker);
  }
  
  return marker;
}

/**
 * Remove markers from the scene
 * @param {Array} markers - Array of marker entities to remove
 * @returns {Array} Empty array
 */
function removeMarkers(markers) {
  // Remove all point markers from scene
  markers.forEach(marker => {
    if (marker && marker.parentNode) {
      marker.parentNode.removeChild(marker);
    }
  });
  return [];
}

/**
 * Creates a line between two points
 * @param {THREE.Vector3} start - Start position
 * @param {THREE.Vector3} end - End position
 * @param {String} color - Color for the line
 * @param {Boolean} dashed - Whether line should be dashed
 * @returns {HTMLElement} A-Frame entity with line component
 */
function createLine(start, end, color = '#FFFFFF', dashed = false) {
  const line = document.createElement('a-entity');
  const lineAttr = {
    start: start,
    end: end,
    color: color,
    opacity: 0.8,
    visible: true
  };
  
  if (dashed) {
    lineAttr.dashed = true;
  }
  
  line.setAttribute('line', lineAttr);
  return line;
}

/**
 * Creates a text entity that faces the camera
 * @param {String} value - Text to display
 * @param {THREE.Vector3} position - Position in 3D space
 * @param {Object} options - Additional options (color, scale, etc)
 * @returns {HTMLElement} A-Frame text entity
 */
function createFloatingText(value, position, options = {}) {
  const defaults = {
    color: '#FFFFFF',
    scale: '0.1 0.1 0.1',
    align: 'center',
    lookAt: '[camera]'
  };
  
  const settings = {...defaults, ...options};
  
  const text = document.createElement('a-text');
  text.setAttribute('value', value);
  text.setAttribute('position', position);
  text.setAttribute('color', settings.color);
  text.setAttribute('scale', settings.scale);
  text.setAttribute('align', settings.align);
  
  if (settings.lookAt) {
    text.setAttribute('look-at', settings.lookAt);
  }
  
  return text;
}

/**
 * Creates measurement text for an object dimension
 * @param {Number} measurement - Measurement in meters
 * @param {THREE.Vector3} position - Position for the text
 * @param {String} unit - Unit to display (default: 'cm')
 * @param {Object} options - Additional options
 * @returns {HTMLElement} A-Frame text entity
 */
function createMeasurementText(measurement, position, unit = 'cm', options = {}) {
  // Format the measurement (convert to cm by default)
  const formattedValue = unit === 'cm' 
    ? `${(measurement * 100).toFixed(1)} ${unit}`
    : `${measurement.toFixed(2)} ${unit}`;
  
  return createFloatingText(formattedValue, position, options);
}

/**
 * Creates a simple plane
 * @param {Object} attributes - Attributes for the plane
 * @returns {HTMLElement} A-Frame plane entity
 */
function createPlane(attributes = {}) {
  const defaults = {
    width: 1,
    height: 1, 
    color: '#CCCCCC',
    opacity: 0.5,
    side: 'double'
  };
  
  const settings = {...defaults, ...attributes};
  
  const plane = document.createElement('a-plane');
  
  Object.entries(settings).forEach(([key, value]) => {
    plane.setAttribute(key, value);
  });
  
  return plane;
}

/**
 * Creates a rectangle visualization with corners and edges
 * @param {Array<THREE.Vector3>} points - Corner points
 * @param {Object} options - Additional options
 * @returns {HTMLElement} Container entity with rectangle visualization
 */
function createRectangleOutline(points, options = {}) {
  const defaults = {
    colors: ['#4285F4', '#0F9D58', '#F4B400', '#DB4437'], // Google colors
    lineWidth: 0.005,
    container: null
  };
  
  const settings = {...defaults, ...options};
  
  // Create container if not provided
  const container = settings.container || document.createElement('a-entity');
  container.setAttribute('class', 'rectangle-outline');
  
  // Draw lines between points
  const numPoints = points.length;
  if (numPoints < 3) return container;
  
  for (let i = 0; i < numPoints; i++) {
    const start = points[i];
    const end = points[(i + 1) % numPoints];
    const color = settings.colors[i % settings.colors.length];
    
    const line = createLine(start, end, color);
    container.appendChild(line);
  }
  
  return container;
}

// Export utility functions
export {
  createEntity,
  createMarker,
  removeMarkers,
  createLine,
  createFloatingText,
  createMeasurementText,
  createPlane,
  createRectangleOutline
};
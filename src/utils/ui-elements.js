/**
 * UI Elements Utility Library
 * 
 * Provides reusable functions for creating common UI elements in A-Frame.
 * These utilities help maintain consistency and reduce boilerplate code.
 */

// Ensure THREE is accessible in this module
const THREE = window.THREE;

/**
 * Creates a marker at a point in 3D space
 * @param {Object|THREE.Vector3} position - Position for the marker
 * @param {Number|String} label - Text label for the marker
 * @param {String} color - Color for the marker (hex format)
 * @param {HTMLElement} [parent] - Optional parent to add marker to
 * @returns {HTMLElement} The created marker entity
 */
function createMarker(position, label, color = '#4285F4', parent = null) {
  // Create a visual marker at the specified point
  const marker = document.createElement('a-entity');
  marker.setAttribute('class', 'marker');
  
  // Create sphere for the marker
  const sphere = document.createElement('a-sphere');
  sphere.setAttribute('radius', 0.01);
  sphere.setAttribute('color', color);
  sphere.setAttribute('shader', 'flat');
  marker.appendChild(sphere);
  
  // Add label if provided
  if (label) {
    const labelEntity = document.createElement('a-text');
    labelEntity.setAttribute('value', `${label}`);
    labelEntity.setAttribute('align', 'center');
    labelEntity.setAttribute('position', '0 0.05 0');
    labelEntity.setAttribute('scale', '0.1 0.1 0.1');
    labelEntity.setAttribute('color', '#FFFFFF');
    labelEntity.setAttribute('look-at', '[camera]');
    marker.appendChild(labelEntity);
  }
  
  // Set position
  if (position instanceof THREE.Vector3) {
    marker.setAttribute('position', position);
  } else {
    marker.setAttribute('position', position);
  }
  
  // Add to parent if provided
  if (parent) {
    parent.appendChild(marker);
  }
  
  return marker;
}

/**
 * Remove markers from the scene
 * @param {Array} markers - Array of marker entities to remove
 * @returns {Array} Empty array
 */
function removeMarkers(markers) {
  if (!markers || !Array.isArray(markers)) return [];
  
  // Remove all markers from their parents
  markers.forEach(marker => {
    if (marker && marker.parentNode) {
      marker.parentNode.removeChild(marker);
    }
  });
  
  return [];
}

/**
 * Creates a line between two points
 * @param {Object|THREE.Vector3} start - Start position
 * @param {Object|THREE.Vector3} end - End position
 * @param {String} color - Color for the line
 * @param {Boolean} dashed - Whether line should be dashed
 * @param {HTMLElement} [parent] - Optional parent to add line to
 * @returns {HTMLElement} A-Frame entity with line component
 */
function createLine(start, end, color = '#FFFFFF', dashed = false, parent = null) {
  const line = document.createElement('a-entity');
  const lineAttr = {
    start: start,
    end: end,
    color: color,
    opacity: 0.8
  };
  
  if (dashed) {
    lineAttr.dashed = true;
  }
  
  line.setAttribute('line', lineAttr);
  
  // Add to parent if provided
  if (parent) {
    parent.appendChild(line);
  }
  
  return line;
}

/**
 * Creates a text entity that faces the camera
 * @param {String} value - Text to display
 * @param {Object|THREE.Vector3} position - Position in 3D space
 * @param {Object} options - Additional options (color, scale, etc)
 * @param {HTMLElement} [parent] - Optional parent to add text to
 * @returns {HTMLElement} A-Frame text entity
 */
function createFloatingText(value, position, options = {}, parent = null) {
  const defaults = {
    color: '#FFFFFF',
    scale: '0.1 0.1 0.1',
    align: 'center',
    lookAt: '[camera]',
    className: null // Optional CSS class for the text
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
  
  // Add CSS class if provided
  if (settings.className) {
    text.classList.add(settings.className);
  }
  
  // Add to parent if provided
  if (parent) {
    parent.appendChild(text);
  }
  
  return text;
}

/**
 * Creates measurement text for an object dimension
 * @param {Number} measurement - Measurement in meters
 * @param {Object|THREE.Vector3} position - Position for the text
 * @param {String} unit - Unit to display (default: 'cm')
 * @param {Object} options - Additional options
 * @param {HTMLElement} [parent] - Optional parent to add text to
 * @returns {HTMLElement} A-Frame text entity
 */
function createMeasurementText(measurement, position, unit = 'cm', options = {}, parent = null) {
  // Format the measurement (convert to cm by default)
  const formattedValue = unit === 'cm' 
    ? `${(measurement * 100).toFixed(1)} ${unit}`
    : `${measurement.toFixed(2)} ${unit}`;
  
  // Add default className for measurement texts if not specified
  if (!options.className) {
    options.className = 'dimension-text';
  }
  
  return createFloatingText(formattedValue, position, options, parent);
}

/**
 * Creates a simple plane
 * @param {Object} attributes - Attributes for the plane
 * @param {HTMLElement} [parent] - Optional parent to add plane to
 * @returns {HTMLElement} A-Frame plane entity
 */
function createPlane(attributes = {}, parent = null) {
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
  
  // Add to parent if provided
  if (parent) {
    parent.appendChild(plane);
  }
  
  return plane;
}

/**
 * Create and manage a visualization entity with cleanup support
 * @param {HTMLElement} oldVisual - Existing visualization to clean up (if any)
 * @param {HTMLElement} parent - Parent element to attach visualization to
 * @param {String} className - Class name for the visualization
 * @returns {HTMLElement} The new visualization entity
 */
function createVisualizationEntity(oldVisual, parent, className = 'visualization') {
  // Clean up old visualization if it exists
  if (oldVisual && oldVisual.parentNode) {
    oldVisual.parentNode.removeChild(oldVisual);
  }
  
  // Create container for new visualization
  const visualization = document.createElement('a-entity');
  visualization.setAttribute('class', className);
  
  // Add to parent if provided
  if (parent) {
    parent.appendChild(visualization);
  }
  
  return visualization;
}

// Export utility functions
export {
  createMarker,
  removeMarkers,
  createLine,
  createFloatingText,
  createMeasurementText,
  createPlane,
  createVisualizationEntity
};
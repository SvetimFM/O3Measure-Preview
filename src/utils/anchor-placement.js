/**
 * DEPRECATED: This file is no longer used.
 * 
 * Similar functionality has been migrated to:
 * - utils/geometry.js (calculatePlaneFromPoints, calculateRectangleDimensions)
 * - utils/ui-elements.js (createMarker, removeMarkers)
 *
 * This file is kept temporarily for reference but will be removed in future updates.
 */

// Ensure code continues to work if legacy imports exist
export { 
  createMarker, 
  removeMarkers 
} from './ui-elements.js';

export {
  calculatePlaneFromPoints,
  calculateRectangleDimensions
} from './geometry.js';
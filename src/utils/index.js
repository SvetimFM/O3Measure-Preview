/**
 * Utils Index
 * 
 * Central export point for all utility modules to simplify imports.
 */

// Export utility modules
export * from './constants.js';
export * from './events.js';
export * from './geometry.js';
export * from './interaction.js';
export * from './ui-elements.js';
export * from './anchor-placement.js';

// Add named exports if needed
import * as constants from './constants.js';
import * as events from './events.js';
import * as geometry from './geometry.js';
import * as interaction from './interaction.js';
import * as uiElements from './ui-elements.js';

// Export namespaces for grouped imports
export {
  constants,
  events,
  geometry,
  interaction,
  uiElements
};
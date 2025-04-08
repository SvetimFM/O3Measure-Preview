/**
 * Utils Index
 * 
 * Central export point for all utility modules to simplify imports.
 * This makes it easier to access utility functions throughout the app.
 */

// Re-export named exports from utility modules
export * from './constants.js';
export * from './events.js';
export * from './geometry.js';
export * from './interaction.js';
export * from './ui-elements.js';

// Import full modules for namespace exports
import * as constants from './constants.js';
import * as events from './events.js';
import * as geometry from './geometry.js';
import * as interaction from './interaction.js';
import * as uiElements from './ui-elements.js';

// Constants that are useful across components
export const Colors = {
  PRIMARY: '#4285F4',   // Google Blue
  SECONDARY: '#0F9D58', // Google Green
  WARNING: '#F4B400',   // Google Yellow
  ERROR: '#DB4437',     // Google Red
  DISABLED: '#888888'   // Gray for disabled elements
};

// Export namespaces for grouped imports
export {
  constants,
  events,
  geometry,
  interaction,
  uiElements
};
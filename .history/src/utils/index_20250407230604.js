/**
 * Utils Index
 * 
 * Central export point for all utility modules to simplify imports.
 * This makes it easier to access utility functions throughout the app.
 */

// Import full modules for namespace exports
import * as events from './events.js';
import * as geometry from './geometry.js';
import * as interaction from './interaction.js';
import * as uiElements from './ui-elements.js';

// Export namespaces for grouped imports
export {
  events,
  geometry,
  interaction,
  uiElements
};
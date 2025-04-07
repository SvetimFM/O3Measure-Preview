/**
 * Menu System Index
 * 
 * Imports all menu components and exports the menu registry
 */

// Import UI components
import './button.js';
import './pressable.js';

// Import base modules
import MenuRegistry from './menu-registry.js';
import BaseMenu from './base-menu.js';

// Import all menu modules
import './main-menu.js';
import './wall-calibration-menu.js';
import './wall-adjustment-menu.js';
import './wall-point-selection-menu.js';
import './object-definition-menu.js';
import './anchor-placement-menu.js';
import './view-items-menu.js';

// Export for use by the menu manager
export { MenuRegistry, BaseMenu };

console.log('Menu System: All menus registered', MenuRegistry.getMenuIds());
/**
 * Main Menu Component
 * 
 * Provides the primary application menu
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';
import { events, Colors } from '../../../utils/index.js';

const { EVENTS, emitEvent } = events;

// Main menu implementation
const MainMenu = Object.create(BaseMenu);

// Override render method with main menu content
MainMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title
  const title = this.createTitle('O3Measure', height);
  this.container.appendChild(title);
  
  // Add subtitle
  const subtitle = this.createSubtitle('Menu', height);
  this.container.appendChild(subtitle);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Add menu buttons
  this.createMenuButtons();
};

// Create main menu buttons
MainMenu.createMenuButtons = function() {
  const { height } = this.data;
  
  // Calculate starting Y position based on panel height
  const startY = height/2 - 0.07; 
  const spacing = 0.0325;
  
  // Button config - defines labels, colors and positions
  const buttons = [
    { 
      label: 'Object Definition', 
      color: Colors.PRIMARY, 
      position: `0 ${startY} 0`,
      handler: () => this.handleButtonPress('object-definition')
    },
    { 
      label: 'View Objects', 
      color: Colors.SECONDARY, 
      position: `0 ${startY - spacing} 0`,
      handler: () => this.handleButtonPress('view-items')
    },
    { 
      label: 'Wall Calibration', 
      color: Colors.WARNING, 
      position: `0 ${startY - spacing*2} 0`,
      handler: () => this.handleButtonPress('wall-calibration')
    }
  ];
  
  // Create all buttons in a column
  buttons.forEach((config) => {
    const button = this.createButton(config);
    this.container.appendChild(button);
  });
};

// Handle button press events
MainMenu.handleButtonPress = function(action) {
  console.log('Main Menu: Button pressed -', action);
  
  // Emit menu action event
  this.emitMenuAction(action);
};

// Register this menu with the registry
MenuRegistry.register('main', MainMenu);

export default MainMenu;

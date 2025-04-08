/**
 * Wall Calibration Menu Component
 * 
 * Provides menu options for wall calibration
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';
import { events } from '../../../utils/index.js';

const { EVENTS, emitEvent } = events;

// Wall calibration menu implementation
const WallCalibrationMenu = Object.create(BaseMenu);

// Override render method with wall calibration menu content
WallCalibrationMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title
  const title = this.createTitle('Wall Calibration', height);
  this.container.appendChild(title);
  
  // Add subtitle
  const subtitle = this.createSubtitle('Wall Configuration', height);
  this.container.appendChild(subtitle);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Add wall calibration options
  this.createCalibrationButtons();
  
  // Create back button
  this.createBackButton();
};

// Create calibration buttons
WallCalibrationMenu.createCalibrationButtons = function() {
  const { height } = this.data;
  
  // Get wall calibration state
  const sceneState = this.sceneEl.systems['scene-state'];
  const wallState = sceneState ? sceneState.getState('calibration.wall') : null;
  
  // Calculate starting Y position based on panel height
  const startY = height/2 - 0.07;
  const spacing = 0.035;
  
  // Button config - defines calibration options
  const buttons = [
    { 
      label: 'Adjust Wall', 
      color: '#4285F4', 
      position: `0 ${startY} 0`,
      width: 0.2,
      height: 0.03,
      handler: (event) => this.handleButtonPress('adjust-wall', event)
    },
    { 
      label: 'Reset Wall Calibration', 
      color: '#DB4437', 
      position: `0 ${startY - spacing} 0`,
      width: 0.2,
      height: 0.03,
      handler: (event) => this.handleButtonPress('reset-wall-calibration', event)
    }
  ];
  
  // Create calibration buttons
  buttons.forEach(config => {
    const button = this.createButton(config);
    this.container.appendChild(button);
  });
};

// Create back button
WallCalibrationMenu.createBackButton = function() {
  const { height } = this.data;
  
  // Back button at the bottom of the menu
  const button = this.createButton({
    label: 'Back to Main Menu',
    color: '#999999',
    position: `0 ${-height/2 + 0.03} 0`,
    width: 0.2,
    height: 0.03,
    handler: (event) => this.handleButtonPress('back-to-main-menu', event)
  });
  
  this.container.appendChild(button);
};

// Handle button press events
WallCalibrationMenu.handleButtonPress = function(action, event) {
  console.log('Wall Calibration Menu: Button pressed -', action);
  
  switch(action) {
    case 'adjust-wall':
      // Also emit wall calibration action
      emitEvent(this.sceneEl, EVENTS.WALL.ADJUST_START, { action });
      break;
    case 'reset-wall-calibration':
      // Also emit wall calibration action
      emitEvent(this.sceneEl, EVENTS.WALL.RESET, { action });
      break;
  }
  
  // Emit menu action event
  this.emitMenuAction(action);
};

// Register this menu with the registry
MenuRegistry.register('wall-calibration', WallCalibrationMenu);

export default WallCalibrationMenu;

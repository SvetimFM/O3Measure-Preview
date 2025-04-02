/**
 * Wall Adjustment Menu Component
 * 
 * Provides controls for adjusting wall position
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';
import { EVENTS, emitEvent } from '../../../utils/events.js';

// Wall adjustment menu implementation
const WallAdjustmentMenu = Object.create(BaseMenu);

// Override render method with wall adjustment menu content
WallAdjustmentMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title
  const title = this.createTitle('Wall Adjustment', height);
  this.container.appendChild(title);
  
  // Add subtitle
  const subtitle = this.createSubtitle('Move wall closer or farther', height);
  this.container.appendChild(subtitle);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Create adjustment controls
  this.createAdjustmentControls();
  
  // Create back button
  this.createBackButton();
};

// Create adjustment controls
WallAdjustmentMenu.createAdjustmentControls = function() {
  const { height } = this.data;
  
  // Calculate button positions
  const startY = height/2 - 0.08;
  
  // Create Move Closer button
  const closerButton = this.createButton({
    label: 'Move -Z',
    width: 0.04,
    height: 0.04,
    color: '#4285F4',
    position: `0 ${startY} 0`,
    handler: () => this.handleMoveCloser()
  });
  this.container.appendChild(closerButton);
  
  // Create Move Farther button
  const fartherButton = this.createButton({
    label: 'Move +Z',
    width: 0.04,
    height: 0.04,
    color: '#0F9D58',
    position: `0 ${startY - 0.05} 0`,
    handler: () => this.handleMoveFarther()
  });
  this.container.appendChild(fartherButton);
};

// Create back button
WallAdjustmentMenu.createBackButton = function() {
  const { height } = this.data;
  
  // Back button
  const backButton = this.createButton({
    label: 'Back',
    width: 0.14,
    height: 0.04,
    color: '#DB4437',
    position: `0 ${-height/2 + 0.05} 0`,
    handler: () => this.handleBack()
  });
  this.container.appendChild(backButton);
};

// Handle move closer button
WallAdjustmentMenu.handleMoveCloser = function() {
  console.log('Wall Adjustment: Moving wall closer');
  
  // Emit wall calibration action using standardized event
  emitEvent(this.sceneEl, EVENTS.WALL.ADJUST_START, {
    action: 'move-wall-closer'
  });
};

// Handle move farther button
WallAdjustmentMenu.handleMoveFarther = function() {
  console.log('Wall Adjustment: Moving wall farther');
  
  // Emit wall calibration action using standardized event
  emitEvent(this.sceneEl, EVENTS.WALL.ADJUST_START, {
    action: 'move-wall-farther'
  });
};

// Handle back button
WallAdjustmentMenu.handleBack = function() {
  console.log('Wall Adjustment: Back to wall calibration menu');
  
  // Emit menu action to go back
  this.emitMenuAction('back-to-previous-menu');
};

// Register this menu with the registry
MenuRegistry.register('wall-adjustment', WallAdjustmentMenu);

export default WallAdjustmentMenu;
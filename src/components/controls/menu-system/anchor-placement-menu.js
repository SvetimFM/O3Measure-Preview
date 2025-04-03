/**
 * Anchor Placement Menu Component
 * 
 * Provides UI for placing anchors on objects with simplified implementation.
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';

// Direct definition of colors for clarity
const Colors = {
  PRIMARY: '#4285F4',
  SECONDARY: '#0F9D58',
  WARNING: '#F4B400',
  ERROR: '#DB4437',
  DISABLED: '#888888'
};

// Anchor placement menu implementation
const AnchorPlacementMenu = Object.create(BaseMenu);

// Override init to activate the anchor placement component
AnchorPlacementMenu.init = function(container, data, sceneEl) {
  // Call parent init
  BaseMenu.init.call(this, container, data, sceneEl);
  
  // Store anchor count
  this.anchorCount = 2; // Default to 2 anchors
  
  // Bind event handlers
  this.onAnchorStatus = this.onAnchorStatus.bind(this);
  
  // Listen for anchor status events with direct event name
  this.sceneEl.addEventListener('anchor-status', this.onAnchorStatus);
  
  // Activate anchor placement component when this menu is shown
  const anchorPlacement = document.getElementById('anchorPlacement');
  if (anchorPlacement) {
    anchorPlacement.setAttribute('anchor-placement', {
      active: true,
      anchorCount: this.anchorCount
    });
  }
};

// Override render method with anchor placement menu content
AnchorPlacementMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title
  const title = this.createTitle('Anchor Placement', height);
  this.container.appendChild(title);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Add instructions text
  const instructions = this.createElement('a-text');
  instructions.setAttribute('value', 'Define mounting points for your object');
  instructions.setAttribute('align', 'center');
  instructions.setAttribute('position', `0 ${height/2 - 0.04} 0`);
  instructions.setAttribute('color', '#FFFFFF');
  instructions.setAttribute('scale', '0.03 0.03 0.03');
  instructions.setAttribute('id', 'anchor-instructions');
  this.container.appendChild(instructions);
  
  // Add status text
  const status = this.createElement('a-text');
  status.setAttribute('value', 'Select number of anchors below');
  status.setAttribute('align', 'center');
  status.setAttribute('position', `0 ${height/2 - 0.08} 0`);
  status.setAttribute('color', Colors.WARNING);
  status.setAttribute('scale', '0.035 0.035 0.035');
  status.setAttribute('id', 'anchor-status');
  this.container.appendChild(status);
  
  // Add anchor count selector
  this.createAnchorCountSelector();
  
  // Add action buttons
  this.createActionButtons();
};

// Create anchor count selector (1-4)
AnchorPlacementMenu.createAnchorCountSelector = function() {
  const { height } = this.data;
  
  // Create label
  const label = this.createElement('a-text');
  label.setAttribute('value', 'Number of anchors:');
  label.setAttribute('align', 'center');
  label.setAttribute('position', `0 ${height/2 - 0.12} 0`);
  label.setAttribute('color', '#FFFFFF');
  label.setAttribute('scale', '0.03 0.03 0.03');
  this.container.appendChild(label);
  
  // Create number buttons with better spacing
  const buttonWidth = 0.035;
  const spacing = 0.05;  // Increased spacing between buttons
  const yPos = height/2 - 0.15;
  
  // Calculate total width and starting position
  const totalWidth = spacing * 3;  // 3 spaces between 4 buttons
  const startX = -totalWidth / 2;
  
  for (let i = 1; i <= 4; i++) {
    const isActive = i === this.anchorCount;
    const xPos = startX + (i-1) * spacing;
    
    const btn = this.createButton({
      label: `${i}`,
      width: buttonWidth,
      height: buttonWidth,
      color: isActive ? Colors.PRIMARY : Colors.SECONDARY,
      position: `${xPos} ${yPos} 0`,
      id: `anchor-count-${i}`,
      handler: () => this.handleAnchorCountChange(i)
    });
    
    this.container.appendChild(btn);
  }
};

// Handle anchor count change
AnchorPlacementMenu.handleAnchorCountChange = function(count) {
  // Update local state
  this.anchorCount = count;
  
  // Update button colors
  for (let i = 1; i <= 4; i++) {
    const btn = document.getElementById(`anchor-count-${i}`);
    if (btn) {
      btn.setAttribute('button', {
        color: i === count ? Colors.PRIMARY : Colors.SECONDARY
      });
    }
  }
  
  // Emit direct anchor action event
  this.sceneEl.emit('anchor-action', { 
    action: 'set-anchor-count',
    count: count
  });
};

// Create action buttons (Auto-place, Reset, Complete)
AnchorPlacementMenu.createActionButtons = function() {
  const { height } = this.data;
  
  // Auto-place anchors button
  const autoPlaceBtn = this.createButton({
    label: 'Auto-Place',
    width: 0.11,
    height: 0.035,
    color: Colors.SECONDARY,
    position: '0 -0.05 0',
    id: 'auto-place-button',
    handler: () => this.handleAutoPlaceAnchors()
  });
  this.container.appendChild(autoPlaceBtn);
  
  // Reset button
  const resetBtn = this.createButton({
    label: 'Reset',
    width: 0.07,
    height: 0.04,
    color: Colors.WARNING,
    position: '-0.08 -0.11 0',
    id: 'reset-button',
    handler: () => this.handleResetButton()
  });
  this.container.appendChild(resetBtn);
  
  // Complete button - start disabled until preview state
  const completeBtn = this.createButton({
    label: 'Complete',
    width: 0.07,
    height: 0.04,
    color: Colors.DISABLED, // Start with disabled color
    position: '0.08 -0.11 0',
    id: 'complete-button',
    enabled: false, // Start disabled
    handler: () => this.handleCompleteButton()
  });
  this.container.appendChild(completeBtn);
  
  // Back button
  const backBtn = this.createButton({
    label: 'Back',
    color: '#999999',
    position: `0 ${-height/2 + 0.035} 0`,
    width: 0.08,
    height: 0.03,
    handler: () => this.handleBackButton()
  });
  this.container.appendChild(backBtn);
};

// Handle Auto-place button
AnchorPlacementMenu.handleAutoPlaceAnchors = function() {
  // Emit auto-place anchors event directly
  this.sceneEl.emit('anchor-action', { action: 'auto-place-anchors' });
};

// Handle reset button
AnchorPlacementMenu.handleResetButton = function() {
  // Emit reset event directly
  this.sceneEl.emit('anchor-action', { action: 'reset-anchors' });
};

// Handle complete button
AnchorPlacementMenu.handleCompleteButton = function() {
  // Check if button is enabled
  const completeBtn = document.getElementById('complete-button');
  if (completeBtn && completeBtn.getAttribute('button').enabled === false) {
    return;
  }
  
  // Emit complete event directly
  this.sceneEl.emit('anchor-action', { action: 'complete-anchor-placement' });
  
  // Return to previous menu
  this.emitMenuAction('anchor-placement-completed');
};

// Handle back button
AnchorPlacementMenu.handleBackButton = function() {
  // Clean up first
  this.sceneEl.emit('anchor-action', { action: 'cancel-anchor-placement' });
  
  // Go back to object definition menu
  this.emitMenuAction('back-to-object-definition');
};

// Handle anchor status updates
AnchorPlacementMenu.onAnchorStatus = function(event) {
  const { status, message } = event.detail;
  
  // Update status text
  const statusElement = document.getElementById('anchor-status');
  if (statusElement && message) {
    statusElement.setAttribute('value', message);
  }
  
  // Update complete button based on status
  const completeBtn = document.getElementById('complete-button');
  if (completeBtn) {
    // Only enable the complete button when in preview state
    const isEnabled = status === 'preview';
    completeBtn.setAttribute('button', {
      enabled: isEnabled,
      color: isEnabled ? Colors.PRIMARY : Colors.DISABLED
    });
  }
};

// Emit menu action event - simplified helper
AnchorPlacementMenu.emitMenuAction = function(action, data = {}) {
  this.sceneEl.emit('menu-action', {
    menu: 'anchor-placement',
    action: action,
    ...data
  });
};

// Override cleanup to remove event listeners and deactivate component
AnchorPlacementMenu.cleanup = function() {
  // Call parent cleanup
  BaseMenu.cleanup.call(this);
  
  // Remove event listeners
  this.sceneEl.removeEventListener('anchor-status', this.onAnchorStatus);
  
  // Deactivate anchor placement component when this menu is closed
  const anchorPlacement = document.getElementById('anchorPlacement');
  if (anchorPlacement) {
    anchorPlacement.setAttribute('anchor-placement', 'active', false);
  }
};

// Register this menu with the registry
MenuRegistry.register('anchor-placement', AnchorPlacementMenu);

export default AnchorPlacementMenu;
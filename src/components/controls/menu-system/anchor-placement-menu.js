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
  // Call parent init with modified dimensions for taller anchor placement menu
  const modifiedData = { ...data };
  modifiedData.height = 0.42; // Increase height for this menu only (default is ~0.3)
  BaseMenu.init.call(this, container, modifiedData, sceneEl);
  
  // Store anchor count
  this.anchorCount = 2; // Default to 2 anchors
  
  // Store current objectId from navigation parameters
  this.objectId = null;
  
  // Try to retrieve current objectId from menu transfer data
  if (data && data.params && data.params.objectId) {
    this.objectId = data.params.objectId;
    console.log('Anchor Placement Menu: Received objectId:', this.objectId);
  }
  
  // Bind event handlers
  this.onAnchorStatus = this.onAnchorStatus.bind(this);
  
  // Listen for anchor status events with direct event name
  this.sceneEl.addEventListener('anchor-status', this.onAnchorStatus);
  
  // Activate anchor placement component when this menu is shown
  const anchorPlacement = document.getElementById('anchorPlacement');
  if (anchorPlacement) {
    anchorPlacement.setAttribute('anchor-placement', {
      active: true,
      anchorCount: this.anchorCount,
      objectId: this.objectId || '' // Pass objectId to keep stateless communication
    });
  }
};

// Override render method with anchor placement menu content
AnchorPlacementMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title - include object ID if available
  const titleText = this.objectId ? 'Edit Object Anchors' : 'Anchor Placement';
  const title = this.createTitle(titleText, height);
  this.container.appendChild(title);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Add instructions text - different for new vs edit
  const instructionsText = this.objectId 
    ? 'Edit mounting points for selected object' 
    : 'Define mounting points for your object';
  
  const instructions = this.createElement('a-text');
  instructions.setAttribute('value', instructionsText);
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
  status.setAttribute('position', `0 ${height/2 - 0.09} 0`); // Adjusted position
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
  label.setAttribute('position', `0 ${height/2 - 0.14} 0`); // Adjusted position
  label.setAttribute('color', '#FFFFFF');
  label.setAttribute('scale', '0.03 0.03 0.03');
  this.container.appendChild(label);
  
  // Create number buttons with better spacing
  const buttonWidth = 0.035;
  const spacing = 0.05;  // Increased spacing between buttons
  const yPos = height/2 - 0.19; // Adjusted position
  
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
    count: count,
    objectId: this.objectId // Always include the objectId
  });
};

// Create action buttons (Auto-place, Save, Reset, Cancel)
AnchorPlacementMenu.createActionButtons = function() {
  const { width, height } = this.data;
  
  // Auto-place anchors button - significantly lower position
  const autoPlaceBtn = this.createButton({
    label: 'Auto-Place',
    width: 0.15, // Slightly wider
    height: 0.04,
    color: Colors.SECONDARY,
    position: '0 -0.03 0', // Higher position
    id: 'auto-place-button',
    handler: () => this.handleAutoPlaceAnchors()
  });
  this.container.appendChild(autoPlaceBtn);
  
  // Button row moved further down with matching layout to object definition menu
  // Save button (left) - same as Complete but renamed
  const saveBtn = this.createButton({
    label: 'Save & Exit',
    width: 0.08,
    height: 0.04,
    color: Colors.DISABLED, // Start with disabled color
    position: '-0.08 -0.14 0', // Left position
    id: 'complete-button', // Keep same ID for consistent handling
    enabled: false, // Start disabled
    handler: () => this.handleCompleteButton()
  });
  this.container.appendChild(saveBtn);
  
  // Reset button (center)
  const resetBtn = this.createButton({
    label: 'Reset',
    width: 0.07,
    height: 0.04,
    color: Colors.WARNING,
    position: '0 -0.14 0', // Center position
    id: 'reset-button',
    handler: () => this.handleResetButton()
  });
  this.container.appendChild(resetBtn);
  
  // Cancel button (right)
  const cancelBtn = this.createButton({
    label: 'Cancel',
    width: 0.07,
    height: 0.04,
    color: Colors.ERROR, // Red for cancel
    position: '0.08 -0.14 0', // Right position
    id: 'cancel-button',
    handler: () => this.handleBackButton() // Use back button handler for cancel
  });
  this.container.appendChild(cancelBtn);
  
  // Back button at top left corner (modern app style)
  const backBtn = this.createButton({
    label: '\u2190',  // Left arrow unicode escape
    color: '#999999',
    position: `${-width/2 + 0.025} ${height/2 - 0.025} 0`,
    width: 0.04,
    height: 0.04,
    handler: () => this.handleBackButton()
  });
  this.container.appendChild(backBtn);
};

// Handle Auto-place button
AnchorPlacementMenu.handleAutoPlaceAnchors = function() {
  console.log('Anchor Placement Menu: Auto-place button clicked, emitting event with objectId:', this.objectId);
  
  // Emit auto-place anchors event directly, including objectId
  this.sceneEl.emit('anchor-action', { 
    action: 'auto-place-anchors',
    objectId: this.objectId
  });
  
  // DEBUG: Force anchor status update to verify the UI is working
  this.sceneEl.emit('anchor-status', {
    status: 'debug',
    message: 'Auto-place was clicked! If you see this, the UI is working',
    anchorCount: this.anchorCount,
    objectId: this.objectId
  });
};

// Handle reset button
AnchorPlacementMenu.handleResetButton = function() {
  // Emit reset event directly, including objectId
  this.sceneEl.emit('anchor-action', { 
    action: 'reset-anchors',
    objectId: this.objectId
  });
};

// Handle complete button
AnchorPlacementMenu.handleCompleteButton = function() {
  // Check if button is enabled
  const completeBtn = document.getElementById('complete-button');
  if (completeBtn && completeBtn.getAttribute('button').enabled === false) {
    return;
  }
  
  // Emit complete event directly, including objectId
  this.sceneEl.emit('anchor-action', { 
    action: 'complete-anchor-placement',
    objectId: this.objectId
  });
  
  // Return to previous menu with objectId as parameter
  this.emitMenuAction('anchor-placement-completed', { objectId: this.objectId });
};

// Handle back button
AnchorPlacementMenu.handleBackButton = function() {
  // Clean up first, including objectId
  this.sceneEl.emit('anchor-action', { 
    action: 'cancel-anchor-placement',
    objectId: this.objectId
  });
  
  // Go back to object definition menu with objectId parameter
  this.emitMenuAction('back-to-object-definition', { objectId: this.objectId });
};

// Handle anchor status updates
AnchorPlacementMenu.onAnchorStatus = function(event) {
  const { status, message, anchorCount } = event.detail;
  
  // Update status text if a message is provided
  const statusElement = document.getElementById('anchor-status');
  if (statusElement && message) {
    statusElement.setAttribute('value', message);
  }
  
  // Update the Complete button state based on anchor count
  const completeBtn = document.getElementById('complete-button');
  if (completeBtn) {
    // Get current button state to preserve other properties
    const currentButtonState = completeBtn.getAttribute('button');
    
    // On reset, explicitly make non-interactable
    if (status === 'reset') {
      completeBtn.setAttribute('button', {
        ...currentButtonState,
        enabled: false,
        color: Colors.DISABLED
      });
      console.log('Anchor UI: Reset received - Save & Exit button explicitly disabled');
    } else {
      // Simple rule: Button is enabled only when we have the right number of anchors placed
      const hasCorrectAnchorCount = anchorCount === this.anchorCount;
      
      completeBtn.setAttribute('button', {
        ...currentButtonState,
        enabled: hasCorrectAnchorCount,
        color: hasCorrectAnchorCount ? Colors.PRIMARY : Colors.DISABLED
      });
      
      console.log(`Anchor UI: Save & Exit button ${hasCorrectAnchorCount ? 'enabled' : 'disabled'}, anchorCount=${anchorCount}, required=${this.anchorCount}`);
    }
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
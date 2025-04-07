/**
 * Object Definition Menu Component
 * 
 * Provides UI for defining objects through corner point placement
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';
import { events, Colors } from '../../../utils/index.js';

const { EVENTS, emitEvent } = events;

// Object definition menu implementation
const ObjectDefinitionMenu = Object.create(BaseMenu);

// Override init to activate the object definition component
ObjectDefinitionMenu.init = function(container, data, sceneEl) {
  // Call parent init
  BaseMenu.init.call(this, container, data, sceneEl);
  
  // Activate object definition component when this menu is shown
  const objectDef = document.getElementById('objectDefinition');
  if (objectDef) {
    objectDef.setAttribute('object-definition', 'active', true);
    console.log('Object Definition Menu: Activated object definition component');
  }
};

// Override render method with object definition menu content
ObjectDefinitionMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title
  const title = this.createTitle('Object Definition', height);
  this.container.appendChild(title);
  
  // Add subtitle
  // const subtitle = this.createSubtitle('Define Object on Wall', height);
  // this.container.appendChild(subtitle);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Add instructions text
  const instructions = this.createElement('a-text');
  instructions.setAttribute('value', 'Define an object by placing three corner points');
  instructions.setAttribute('align', 'center');
  instructions.setAttribute('position', `0 ${height/2 - 0.04} 0`);
  instructions.setAttribute('color', '#FFFFFF');
  instructions.setAttribute('scale', '0.03 0.03 0.03');
  instructions.setAttribute('id', 'object-instructions');
  this.container.appendChild(instructions);
  
  // Add status text
  const status = this.createElement('a-text');
  status.setAttribute('value', 'Press Start to begin');
  status.setAttribute('align', 'center');
  status.setAttribute('position', `0 ${height/2 - 0.08} 0`);
  status.setAttribute('color', '#4285F4');
  status.setAttribute('scale', '0.035 0.035 0.035');
  status.setAttribute('id', 'object-status');
  this.container.appendChild(status);
  
  // Add object definition controls
  this.createObjectButtons();
  
  // Initially don't create the reset button - we'll add it only when needed
  // Store a reference to the container for later button creation
  this.resetButtonContainer = document.createElement('a-entity');
  this.resetButtonContainer.setAttribute('position', '0 -0.03 0');
  this.container.appendChild(this.resetButtonContainer);
  
  // Set up event listeners for object status updates
  this.setupStatusListener();
  
  // Create side panel with object list
  this.createSidePanel();
};

// Create object definition buttons
ObjectDefinitionMenu.createObjectButtons = function() {
  const { width, height } = this.data;
  
  // Calculate starting Y position based on panel height
  const startY = height/2 - 0.07;
  const spacing = 0.035;
  
  // Add back button at top left corner
  const backBtn = this.createButton({
    label: '\u2190',  // Left arrow unicode escape
    color: '#999999',
    position: `${-width/2 + 0.025} ${height/2 - 0.025} 0`,
    width: 0.04,
    height: 0.04,
    handler: () => this.handleBackButton()
  });
  this.container.appendChild(backBtn);
  
  // Button config for start/create button
  const startBtn = this.createButton({
    label: 'Start',
    width: 0.08, // Slightly wider to accommodate "Save & Exit" text
    height: 0.04,
    color: '#4285F4',
    position: '-0.08 -0.03 0',
    id: 'object-start-button',
    handler: () => this.handleStartButton()
  });
  this.container.appendChild(startBtn);
  
  // Add cancel button
  const cancelBtn = this.createButton({
    label: 'Cancel',
    width: 0.08,
    height: 0.04,
    color: '#DB4437',
    position: '0.08 -0.03 0',
    handler: () => this.handleCancelButton()
  });
  this.container.appendChild(cancelBtn);
};

// Create a reset button to clear current object definition
ObjectDefinitionMenu.createResetButton = function() {
  // Only create the button if it doesn't already exist
  if (document.getElementById('object-reset-button')) {
    return document.getElementById('object-reset-button');
  }
  
  // Add a reset button that clears current object
  const resetBtn = this.createButton({
    label: 'Reset',
    width: 0.05,
    height: 0.03,
    color: '#F4B400', // Yellow/orange warning color
    position: '0 0 0', // Position is relative to parent
    handler: () => this.handleResetButton(),
    id: 'object-reset-button'
  });
  
  // Add to the designated container
  this.resetButtonContainer.appendChild(resetBtn);
  
  return resetBtn;
};

// Handle reset button - clear current object
ObjectDefinitionMenu.handleResetButton = function() {
  console.log('Object Definition Menu: Reset current object');
  
  // Emit reset event - this will only reset the current point selection without exiting object creation mode
  emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { action: 'reset-current-object' });
  
  // Update status text to indicate we're still in object creation mode
  const statusElement = document.getElementById('object-status');
  if (statusElement) {
    statusElement.setAttribute('value', 'Object reset. Place the first corner point (top left).');
  }
  
  // Also reset the Save & Exit button to disabled
  const startButton = document.getElementById('object-start-button');
  if (startButton) {
    startButton.setAttribute('button', {
      label: 'Save & Exit',
      color: '#888888', // Grey (disabled initially)
      enabled: false
    });
  }
  
  // Remove the anchor placement button as we're back to zero points
  this.removeAnchorPlacementButton();
  
  // Update instructions text
  const instructionsElement = document.getElementById('object-instructions');
  if (instructionsElement) {
    instructionsElement.setAttribute('value', 'Define an object by placing three corner points');
  }
  
  // Update side panel to make sure it's current
  this.updateObjectList();
};

// Create a wide anchor placement button
ObjectDefinitionMenu.createAnchorPlacementButton = function() {
  // Only create the button if it doesn't already exist
  if (document.getElementById('anchor-placement-button')) {
    return document.getElementById('anchor-placement-button');
  }
  
  // Add a wide anchor placement button
  const anchorBtn = this.createButton({
    label: 'Continue to Anchor Placement',
    width: 0.2, // Wider button - increased from 0.16
    height: 0.03, // Slightly shorter
    color: '#4285F4', // Primary blue color
    position: '0 -0.08 0', // Position slightly lower
    handler: () => this.handleAnchorPlacementButton(),
    id: 'anchor-placement-button'
  });
  
  // Create a container for the button
  const anchorBtnContainer = document.createElement('a-entity');
  anchorBtnContainer.setAttribute('id', 'anchor-button-container');
  anchorBtnContainer.appendChild(anchorBtn);
  this.container.appendChild(anchorBtnContainer);
  
  return anchorBtn;
};

// Remove the anchor placement button
ObjectDefinitionMenu.removeAnchorPlacementButton = function() {
  const anchorBtnContainer = document.getElementById('anchor-button-container');
  if (anchorBtnContainer && anchorBtnContainer.parentNode) {
    anchorBtnContainer.parentNode.removeChild(anchorBtnContainer);
  }
};

// Handle anchor placement button click
ObjectDefinitionMenu.handleAnchorPlacementButton = function() {
  console.log('Object Definition Menu: Opening anchor placement');
  
  // First, save the current object to make it permanent
  emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { action: 'complete-object-definition' });
  
  // Get scene state to get the permanently saved object ID
  const sceneState = this.sceneEl.systems['scene-state'];
  const savedObjectId = sceneState ? sceneState.getState('currentObjectId') : null;
  
  console.log('Object Definition Menu: Using saved object ID for anchors:', savedObjectId);
  
  // Get object definition component
  const objectDef = document.getElementById('objectDefinition');
  
  // Important: Tell the object-definition component to preserve the object visualization
  // before navigating to the anchor placement menu
  if (objectDef && objectDef.components['object-definition']) {
    objectDef.setAttribute('object-definition', 'active', true);
    // Prevent cleanup from hiding the object during menu transition
    objectDef.components['object-definition'].preserveForAnchoring = true;
  }
  
  // Navigate to anchor placement menu
  emitEvent(this.sceneEl, EVENTS.ANCHOR.ACTION, { 
    action: 'start-anchor-placement',
    objectId: savedObjectId
  });
  
  // Navigate to anchor placement menu with objectId as parameter
  this.emitMenuAction('anchor-placement', { objectId: savedObjectId });
};

// Handle start button click
ObjectDefinitionMenu.handleStartButton = function() {
  const startButton = document.getElementById('object-start-button');
  const currentLabel = startButton.getAttribute('button').label;
  const isEnabled = startButton.getAttribute('button').enabled !== false;
  
  if (currentLabel === 'Start') {
    // Remove any existing anchor placement button
    this.removeAnchorPlacementButton();
    
    // Emit start object definition event
    emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { action: 'start-object-definition' });
    
    // Update button to "Save & Exit" for finishing the object
    startButton.setAttribute('button', {
      label: 'Save & Exit',
      color: '#888888', // Grey (disabled initially)
      enabled: false
    });
    
    // Create the reset button now that we're in object creation mode
    this.createResetButton();
  } else if (currentLabel === 'Save & Exit' && isEnabled) {
    // Only process if button is enabled (all points set)
    
    // Emit complete object definition event
    emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { action: 'complete-object-definition' });
    
    // Remove the anchor placement button after completion
    this.removeAnchorPlacementButton();
    
    // Reset button back to Start for next object
    startButton.setAttribute('button', {
      label: 'Start',
      color: '#4285F4', // Blue
      enabled: true
    });
    
    // Remove the reset button completely from the DOM
    const resetButton = document.getElementById('object-reset-button');
    if (resetButton && resetButton.parentNode) {
      resetButton.parentNode.removeChild(resetButton);
    }
  }
};

// Handle cancel button click
ObjectDefinitionMenu.handleCancelButton = function() {
  // Reset start button
  const startButton = document.getElementById('object-start-button');
  startButton.setAttribute('button', {
    label: 'Start',
    color: '#4285F4', // Blue
    enabled: true
  });
  
  // Remove the reset button completely from the DOM
  const resetButton = document.getElementById('object-reset-button');
  if (resetButton && resetButton.parentNode) {
    resetButton.parentNode.removeChild(resetButton);
  }
  
  // Remove the anchor placement button if it exists
  this.removeAnchorPlacementButton();
  
  // Emit cancel object definition event
  emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { action: 'cancel-object-definition' });
};

// Handle back button click
ObjectDefinitionMenu.handleBackButton = function() {
  // Clean up first
  this.sceneEl.emit('object-action', { action: 'cancel-object-definition' });
  
  // Return to main menu
  this.emitMenuAction('back-to-main-menu');
};

// Emit menu action event
ObjectDefinitionMenu.emitMenuAction = function(action, data = {}) {
  this.sceneEl.emit('menu-action', {
    menu: 'object-definition',
    action: action,
    ...data
  });
};

// Set up listener for object status updates
ObjectDefinitionMenu.setupStatusListener = function() {
  // Bind event handler
  this.onObjectStatus = this.onObjectStatus.bind(this);
  
  // Listen for object status events
  this.sceneEl.addEventListener(EVENTS.OBJECT.STATUS, this.onObjectStatus);
};

// Handle object status updates
ObjectDefinitionMenu.onObjectStatus = function(event) {
  const { status, message, pointCount, dimensions } = event.detail;
  
  // Update status text
  const statusElement = document.getElementById('object-status');
  if (statusElement) {
    statusElement.setAttribute('value', message);
  }
  
  // Get the start/complete button
  const startButton = document.getElementById('object-start-button');
  
  // Update button enabled state based on point count
  if (startButton && startButton.getAttribute('button').label === 'Save & Exit') {
    // Enable Save & Exit button only when all three points are placed
    const isComplete = pointCount >= 3;
    startButton.setAttribute('button', {
      label: 'Save & Exit',
      color: isComplete ? '#0F9D58' : '#888888', // Green if complete, grey if not
      enabled: isComplete
    });
    
    // Show the anchor placement button when object is ready to complete
    if (isComplete) {
      this.createAnchorPlacementButton();
    } else {
      this.removeAnchorPlacementButton();
    }
  }
  
  // Update button states if needed
  if (status === 'completed') {
    if (startButton) {
      startButton.setAttribute('button', {
        label: 'Start',
        color: '#4285F4', // Blue
        enabled: true
      });
    }
    
    // Remove the reset button completely from the DOM
    const resetButton = document.getElementById('object-reset-button');
    if (resetButton && resetButton.parentNode) {
      resetButton.parentNode.removeChild(resetButton);
    }
    
    // Remove the anchor placement button after completion
    this.removeAnchorPlacementButton();
    
    // If we have dimensions, display them
    if (dimensions) {
      const instructionsElement = document.getElementById('object-instructions');
      if (instructionsElement) {
        instructionsElement.setAttribute('value', 
          `Object saved! Width: ${dimensions.widthCm} cm, Height: ${dimensions.heightCm} cm`
        );
      }
    }
    
    // Update the objects list in the side panel
    this.updateObjectList();
  } else if (status === 'cancelled') {
    // Clean up all buttons
    if (startButton) {
      startButton.setAttribute('button', {
        label: 'Start',
        color: '#4285F4', // Blue
        enabled: true
      });
    }
    
    // Remove the reset button completely from the DOM
    const resetButton = document.getElementById('object-reset-button');
    if (resetButton && resetButton.parentNode) {
      resetButton.parentNode.removeChild(resetButton);
    }
    
    // Remove the anchor placement button if it exists
    this.removeAnchorPlacementButton();
  }
};

// Create side panel for object list
ObjectDefinitionMenu.createSidePanel = function() {
  const { width, height, borderColor } = this.data;
  
  // Create side panel container (to the right of the main menu)
  this.sidePanel = document.createElement('a-entity');
  this.sidePanel.setAttribute('position', `${width/2 + 0.16} 0 0`); // Positioned to the right
  this.sidePanel.setAttribute('id', 'object-side-panel');
  
  // Create panel background
  const panelBg = document.createElement('a-plane');
  panelBg.setAttribute('width', 0.25); // Narrower than main panel
  panelBg.setAttribute('height', height);
  panelBg.setAttribute('color', '#333333');
  panelBg.setAttribute('shader', 'flat');
  panelBg.setAttribute('side', 'double');
  this.sidePanel.appendChild(panelBg);
  
  // Create panel border
  const panelBorder = document.createElement('a-plane');
  panelBorder.setAttribute('width', 0.25 + 0.004);
  panelBorder.setAttribute('height', height + 0.004);
  panelBorder.setAttribute('color', borderColor);
  panelBorder.setAttribute('shader', 'flat');
  panelBorder.setAttribute('side', 'double');
  panelBorder.setAttribute('position', '0 0 -0.001');
  this.sidePanel.appendChild(panelBorder);
  
  // Add panel title
  const panelTitle = this.createElement('a-text');
  panelTitle.setAttribute('value', 'Objects List');
  panelTitle.setAttribute('align', 'center');
  panelTitle.setAttribute('position', `0 ${height/2 - 0.04} 0.001`);
  panelTitle.setAttribute('color', '#FFFFFF');
  panelTitle.setAttribute('scale', '0.04 0.04 0.04');
  this.sidePanel.appendChild(panelTitle);
  
  // Create the scrollable list container
  this.objectListContainer = document.createElement('a-entity');
  this.objectListContainer.setAttribute('position', `0 ${height/2 - 0.08} 0.001`);
  this.objectListContainer.setAttribute('id', 'object-list-container');
  this.sidePanel.appendChild(this.objectListContainer);
  
  // Add to the main container
  this.container.appendChild(this.sidePanel);
  
  // Initial population of object list
  this.updateObjectList();
};

// Update object list in side panel
ObjectDefinitionMenu.updateObjectList = function() {
  // Clear current list
  while (this.objectListContainer.firstChild) {
    this.objectListContainer.removeChild(this.objectListContainer.firstChild);
  }
  
  // Get objects from state
  const sceneState = this.sceneEl.systems['scene-state'];
  let objects = [];
  
  if (sceneState) {
    objects = sceneState.getState('objects') || [];
  }
  
  if (objects.length === 0) {
    // Show "No objects" message
    const noObjectsMsg = this.createElement('a-text');
    noObjectsMsg.setAttribute('value', 'No objects defined yet');
    noObjectsMsg.setAttribute('align', 'center');
    noObjectsMsg.setAttribute('position', '0 0 0');
    noObjectsMsg.setAttribute('color', '#AAAAAA');
    noObjectsMsg.setAttribute('scale', '0.035 0.035 0.035');
    this.objectListContainer.appendChild(noObjectsMsg);
    return;
  }
  
  // Create list items for each object
  let yOffset = 0;
  const rowHeight = 0.06;
  
  objects.forEach((object, index) => {
    // Create container for this row
    const rowContainer = document.createElement('a-entity');
    rowContainer.setAttribute('position', `0 ${-yOffset} 0`);
    
    // Object info text
    const dimensions = `${(object.width * 100).toFixed(1)}×${(object.height * 100).toFixed(1)} cm`;
    const objectText = this.createElement('a-text');
    objectText.setAttribute('value', `${index + 1}. ${dimensions}`);
    objectText.setAttribute('align', 'left');
    objectText.setAttribute('position', '-0.11 0 0');
    objectText.setAttribute('color', object.visible ? '#FFFFFF' : '#888888'); // Dim text if hidden
    objectText.setAttribute('scale', '0.035 0.035 0.035');
    rowContainer.appendChild(objectText);
    
    // Anchor edit button - left of visibility toggle
    const anchorEditBtn = this.createElement('a-entity');
    anchorEditBtn.setAttribute('button', {
      label: '\u2693', // Anchor symbol (U+2693)
      width: 0.035,
      height: 0.035,
      color: '#F4B400', // Yellow/amber color
      textColor: '#FFFFFF'
    });
    anchorEditBtn.setAttribute('position', '0.005 0 0');
    anchorEditBtn.setAttribute('data-object-id', object.id);
    
    // Add event listener for anchor edit button
    anchorEditBtn.addEventListener('button-press-ended', () => {
      console.log('Anchor edit button pressed for object:', object.id);
      this.editObjectAnchors(object.id);
    });
    rowContainer.appendChild(anchorEditBtn);
    
    // Visibility toggle button
    const visibilityBtn = this.createElement('a-entity');
    visibilityBtn.setAttribute('button', {
      label: object.visible ? '\ud83d\udc41' : '\ud83d\udeab',  // Eye (U+1F441) or No Entry (U+1F6AB) unicode escapes
      width: 0.035,
      height: 0.035,
      color: object.visible ? '#4285F4' : '#888888', // Blue when visible, gray when hidden
      textColor: '#FFFFFF'
    });
    visibilityBtn.setAttribute('position', '0.05 0 0');
    visibilityBtn.setAttribute('data-object-id', object.id);
    
    // Add event listener for visibility toggle
    visibilityBtn.addEventListener('button-press-ended', () => {
      console.log('Visibility toggle pressed for object:', object.id);
      this.toggleObjectVisibility(object.id);
    });
    rowContainer.appendChild(visibilityBtn);
    
    // Delete button using the button component
    const deleteBtn = this.createElement('a-entity');
    deleteBtn.setAttribute('button', {
      label: 'X',
      width: 0.035,
      height: 0.035,
      color: '#DB4437',  // Red color for delete
      textColor: '#FFFFFF'
    });
    deleteBtn.setAttribute('position', '0.095 0 0');
    deleteBtn.setAttribute('data-object-id', object.id);
    
    // Add event listener for button press
    deleteBtn.addEventListener('button-press-ended', () => {
      console.log('Delete button pressed for object:', object.id);
      this.deleteObject(object.id);
    });
    
    rowContainer.appendChild(deleteBtn);
    this.objectListContainer.appendChild(rowContainer);
    
    // Increase offset for next row
    yOffset += rowHeight;
  });
};

// Handle object deletion
ObjectDefinitionMenu.deleteObject = function(objectId) {
  console.log('Object Definition Menu: Deleting object', objectId);
  
  // Emit delete event
  emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { 
    action: 'delete-object',
    objectId: objectId
  });
  
  // Update list
  this.updateObjectList();
};

// Toggle object visibility
ObjectDefinitionMenu.toggleObjectVisibility = function(objectId) {
  console.log('Object Definition Menu: Toggling visibility for object', objectId);
  
  // Emit toggle visibility event
  emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, { 
    action: 'toggle-object-visibility',
    objectId: objectId
  });
  
  // Update list to reflect new visibility state
  this.updateObjectList();
};

// Navigate to anchor placement menu for specific object
ObjectDefinitionMenu.editObjectAnchors = function(objectId) {
  console.log('Object Definition Menu: Editing anchors for object', objectId);
  
  // Get scene state to verify object exists
  const sceneState = this.sceneEl.systems['scene-state'];
  if (!sceneState) {
    console.error('Object Definition Menu: Scene state not available');
    return;
  }
  
  const objects = sceneState.getState('objects') || [];
  const object = objects.find(obj => obj.id === objectId);
  
  if (!object) {
    console.error('Object Definition Menu: Object not found for anchor editing:', objectId);
    return;
  }
  
  // Important: Tell the object-definition component to preserve the object visualization
  // before navigating to the anchor placement menu
  const objectDef = document.getElementById('objectDefinition');
  if (objectDef && objectDef.components['object-definition']) {
    objectDef.setAttribute('object-definition', 'active', true);
    // Prevent cleanup from hiding the object during menu transition
    objectDef.components['object-definition'].preserveForAnchoring = true;
  }
  
  // Tell the anchor placement component to start with this object
  emitEvent(this.sceneEl, EVENTS.ANCHOR.ACTION, { 
    action: 'start-anchor-placement',
    objectId: objectId
  });
  
  // Navigate to anchor placement menu
  this.emitMenuAction('anchor-placement', { objectId: objectId });
};

// Override cleanup to remove event listeners and deactivate component
ObjectDefinitionMenu.cleanup = function() {
  // Call parent cleanup
  BaseMenu.cleanup.call(this);
  
  // Remove event listeners
  this.sceneEl.removeEventListener(EVENTS.OBJECT.STATUS, this.onObjectStatus);
  
  // Deactivate object definition component when this menu is closed
  const objectDef = document.getElementById('objectDefinition');
  if (objectDef && objectDef.components['object-definition']) {
    // Only deactivate the component if we're not transitioning to anchor placement
    if (!objectDef.components['object-definition'].preserveForAnchoring) {
      objectDef.setAttribute('object-definition', 'active', false);
      console.log('Object Definition Menu: Deactivated object definition component');
    } else {
      console.log('Object Definition Menu: Keeping object definition active for anchoring');
      // Reset the flag so it doesn't persist indefinitely
      objectDef.components['object-definition'].preserveForAnchoring = false;
    }
  }
};

// Register this menu with the registry
MenuRegistry.register('object-definition', ObjectDefinitionMenu);

export default ObjectDefinitionMenu;
/**
 * Object Definition Menu Component
 * 
 * Provides UI for defining objects through corner point placement
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';

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
  const subtitle = this.createSubtitle('Define Object on Wall', height);
  this.container.appendChild(subtitle);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Add instructions text
  const instructions = this.createElement('a-text');
  instructions.setAttribute('value', 'Define an object by placing three corner points');
  instructions.setAttribute('align', 'center');
  instructions.setAttribute('position', `0 ${height/2 - 0.05} 0`);
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
  
  // Add reset button
  this.createResetButton();
  
  // Set up event listeners for object status updates
  this.setupStatusListener();
  
  // Create side panel with object list
  this.createSidePanel();
};

// Create object definition buttons
ObjectDefinitionMenu.createObjectButtons = function() {
  const { height } = this.data;
  
  // Calculate starting Y position based on panel height
  const startY = height/2 - 0.07;
  const spacing = 0.035;
  
  // Button config for start/create button
  const startBtn = this.createButton({
    label: 'Start',
    width: 0.07,
    height: 0.04,
    color: '#4285F4',
    position: '-0.06 -0.06 0',
    id: 'object-start-button',
    handler: () => this.handleStartButton()
  });
  this.container.appendChild(startBtn);
  
  // Add cancel button
  const cancelBtn = this.createButton({
    label: 'Cancel',
    width: 0.07,
    height: 0.04,
    color: '#DB4437',
    position: '0.06 -0.06 0',
    handler: () => this.handleCancelButton()
  });
  this.container.appendChild(cancelBtn);
  
  // Add back button
  const backBtn = this.createButton({
    label: 'Back',
    color: '#999999',
    position: `0 ${-height/2 + 0.03} 0`,
    width: 0.06,
    height: 0.03,
    handler: () => this.handleBackButton()
  });
  this.container.appendChild(backBtn);
};

// Create a reset button to clear current object definition
ObjectDefinitionMenu.createResetButton = function() {
  const { height } = this.data;
  
  // Add a reset button that clears current object
  const resetBtn = this.createButton({
    label: 'Reset',
    width: 0.07,
    height: 0.04,
    color: '#F4B400', // Yellow/orange warning color
    position: '0 -0.12 0', // Position below other buttons
    handler: () => this.handleResetButton()
  });
  this.container.appendChild(resetBtn);
};

// Handle reset button - clear current object
ObjectDefinitionMenu.handleResetButton = function() {
  console.log('Object Definition Menu: Reset current object');
  
  // Emit reset event - this will only reset the current point selection
  this.sceneEl.emit('object-action', { action: 'reset-current-object' });
  
  // Update status text
  const statusElement = document.getElementById('object-status');
  if (statusElement) {
    statusElement.setAttribute('value', 'Current object reset');
  }
  
  // Reset start button to initial state
  const startButton = document.getElementById('object-start-button');
  if (startButton) {
    startButton.setAttribute('button', {
      label: 'Start',
      color: '#4285F4' // Blue
    });
  }
  
  // Reset instructions to initial state
  const instructionsElement = document.getElementById('object-instructions');
  if (instructionsElement) {
    instructionsElement.setAttribute('value', 'Define an object by placing three corner points');
  }
  
  // Update side panel to make sure it's current
  this.updateObjectList();
};

// Handle start button click
ObjectDefinitionMenu.handleStartButton = function() {
  const startButton = document.getElementById('object-start-button');
  const currentLabel = startButton.getAttribute('button').label;
  
  if (currentLabel === 'Start') {
    // Emit start object definition event
    this.sceneEl.emit('object-action', { action: 'start-object-definition' });
    
    // Update button to "Complete" for finishing the object
    startButton.setAttribute('button', {
      label: 'Complete',
      color: '#0F9D58' // Green
    });
  } else if (currentLabel === 'Complete') {
    // Emit complete object definition event
    this.sceneEl.emit('object-action', { action: 'complete-object-definition' });
    
    // Reset button back to Start for next object
    startButton.setAttribute('button', {
      label: 'Start',
      color: '#4285F4' // Blue
    });
  }
};

// Handle cancel button click
ObjectDefinitionMenu.handleCancelButton = function() {
  // Reset start button
  const startButton = document.getElementById('object-start-button');
  startButton.setAttribute('button', {
    label: 'Start',
    color: '#4285F4' // Blue
  });
  
  // Emit cancel object definition event
  this.sceneEl.emit('object-action', { action: 'cancel-object-definition' });
};

// Handle back button click
ObjectDefinitionMenu.handleBackButton = function() {
  // Clean up first
  this.sceneEl.emit('object-action', { action: 'cancel-object-definition' });
  
  // Return to main menu
  this.emitMenuAction('back-to-main-menu');
};

// Set up listener for object status updates
ObjectDefinitionMenu.setupStatusListener = function() {
  // Bind event handler
  this.onObjectStatus = this.onObjectStatus.bind(this);
  
  // Listen for object status events
  this.sceneEl.addEventListener('object-status', this.onObjectStatus);
};

// Handle object status updates
ObjectDefinitionMenu.onObjectStatus = function(event) {
  const { status, message, pointCount, dimensions } = event.detail;
  
  // Update status text
  const statusElement = document.getElementById('object-status');
  if (statusElement) {
    statusElement.setAttribute('value', message);
  }
  
  // Update button states if needed
  if (status === 'completed') {
    const startButton = document.getElementById('object-start-button');
    startButton.setAttribute('button', {
      label: 'Start',
      color: '#4285F4' // Blue
    });
    
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
  }
};

// Create side panel for object list
ObjectDefinitionMenu.createSidePanel = function() {
  const { width, height, borderColor } = this.data;
  
  // Create side panel container (to the right of the main menu)
  this.sidePanel = document.createElement('a-entity');
  this.sidePanel.setAttribute('position', `${width/2 + 0.05} 0 0`); // Positioned to the right
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
    objectText.setAttribute('color', '#FFFFFF');
    objectText.setAttribute('scale', '0.035 0.035 0.035');
    rowContainer.appendChild(objectText);
    
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
  this.sceneEl.emit('object-action', { 
    action: 'delete-object',
    objectId: objectId
  });
  
  // Update list
  this.updateObjectList();
};

// Override cleanup to remove event listeners and deactivate component
ObjectDefinitionMenu.cleanup = function() {
  // Call parent cleanup
  BaseMenu.cleanup.call(this);
  
  // Remove event listeners
  this.sceneEl.removeEventListener('object-status', this.onObjectStatus);
  
  // Deactivate object definition component when this menu is closed
  const objectDef = document.getElementById('objectDefinition');
  if (objectDef) {
    objectDef.setAttribute('object-definition', 'active', false);
    console.log('Object Definition Menu: Deactivated object definition component');
  }
};

// Register this menu with the registry
MenuRegistry.register('object-definition', ObjectDefinitionMenu);

export default ObjectDefinitionMenu;
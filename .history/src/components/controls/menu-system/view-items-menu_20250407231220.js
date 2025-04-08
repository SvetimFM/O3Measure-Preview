/**
 * View Items Menu Component
 * 
 * Provides a grid interface to view and select saved objects
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';
import { events, Colors } from '../../../utils/index.js';

const { EVENTS, emitEvent } = events;

// View Items menu implementation
const ViewItemsMenu = Object.create(BaseMenu);

// Override render method with view items menu content
ViewItemsMenu.render = function() {
  const { width, height, borderColor } = this.data;
  
  // Add title
  const title = this.createTitle('View Items', height);
  this.container.appendChild(title);
  
  // Add subtitle
  const subtitle = this.createSubtitle('Saved Objects', height);
  this.container.appendChild(subtitle);
  
  // Add divider
  const divider = this.createDivider(width, height, borderColor);
  this.container.appendChild(divider);
  
  // Check if wall is calibrated
  const sceneState = this.sceneEl.systems['scene-state'];
  const wallState = sceneState ? sceneState.getState('calibration.wall') : null;
  const isWallCalibrated = wallState ? wallState.isCalibrated : false;
  
  if (!isWallCalibrated) {
    // Show calibration required message
    this.showCalibrationRequired();
  } else {
    // Show object grid
    this.showObjectGrid();
  }
  
  // Create back button
  this.createBackButton();
};

// Show message that wall calibration is required
ViewItemsMenu.showCalibrationRequired = function() {
  const { height } = this.data;
  
  // Create message text
  const message = this.createElement('a-text');
  message.setAttribute('value', 'Wall calibration required\nbefore viewing items.');
  message.setAttribute('align', 'center');
  message.setAttribute('position', `0 ${height/2 - 0.1} 0.001`);
  message.setAttribute('color', '#FFFFFF');
  message.setAttribute('scale', '0.03 0.03 0.03');
  message.setAttribute('wrap-count', 25);
  this.container.appendChild(message);
  
  // Add calibration button with more vertical spacing
  const button = this.createButton({
    label: 'Calibrate Wall',
    color: Colors.WARNING,
    position: `0 ${height/2 - 0.135} 0`, // Adjusted vertical position
    width: 0.2,
    height: 0.03,
    handler: (event) => this.handleButtonPress('wall-calibration', event)
  });
  
  this.container.appendChild(button);
};

// Show grid of objects
ViewItemsMenu.showObjectGrid = function() {
  const { height } = this.data;
  
  // Create scrollable container
  this.scrollContainer = this.createElement('a-entity');
  this.scrollContainer.setAttribute('class', 'scrollable-container');
  this.scrollContainer.setAttribute('position', `0 ${height/2 - 0.1} 0.001`);
  this.container.appendChild(this.scrollContainer);
  
  // Get objects from scene state
  const sceneState = this.sceneEl.systems['scene-state'];
  const objects = sceneState ? sceneState.getState('objects') : [];
  
  console.log('View Items Menu: Found', objects ? objects.length : 0, 'objects in scene state');
  
  // Log anchor information for debugging
  if (objects && objects.length > 0) {
    objects.forEach(obj => {
      console.log(`Object ${obj.id} has ${obj.anchors ? obj.anchors.length : 0} anchors`);
    });
  }
  
  if (!objects || objects.length === 0) {
    // Show no objects message
    const message = this.createElement('a-text');
    message.setAttribute('value', 'No objects saved yet.\nCreate objects using the\nObject Definition tool.');
    message.setAttribute('align', 'center');
    message.setAttribute('position', `0 0 0.001`);
    message.setAttribute('color', '#FFFFFF');
    message.setAttribute('scale', '0.03 0.03 0.03');
    message.setAttribute('wrap-count', 25);
    this.scrollContainer.appendChild(message);
    return;
  }
  
  // Create 2x grid of object items
  const itemWidth = 0.085;
  const itemHeight = 0.085;
  const itemMargin = 0.01;
  const itemsPerRow = 2;
  
  objects.forEach((object, index) => {
    // Calculate grid position
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const xPos = (col - 0.5) * (itemWidth + itemMargin);
    const yPos = -row * (itemHeight + itemMargin);
    
    // Create item container
    const item = this.createElement('a-entity');
    item.setAttribute('position', `${xPos} ${yPos} 0`);
    item.setAttribute('data-object-id', object.id);
    
    // Create a proper button using our button component
    const buttonEl = this.createElement('a-entity');
    buttonEl.setAttribute('button', {
      width: itemWidth,
      height: itemHeight,
      color: '#444444',
      hoverColor: '#555555',
      pressColor: '#666666',
      label: ' ', // Space character instead of empty string to override default "Button" text
      textColor: 'transparent', // Make text invisible
      toggleable: false
    });
    buttonEl.setAttribute('id', `button-${object.id}`);
    item.appendChild(buttonEl);
    
    // Create object preview (simplified rectangle) inside the button
    const preview = this.createElement('a-plane');
    const previewWidth = (itemWidth - 0.02) * (object.width / Math.max(object.width, object.height));
    const previewHeight = (itemHeight - 0.02) * (object.height / Math.max(object.width, object.height));
    preview.setAttribute('width', previewWidth);
    preview.setAttribute('height', previewHeight);
    preview.setAttribute('color', '#42D544');
    preview.setAttribute('opacity', 0.8);
    preview.setAttribute('position', `0 0 0.001`);
    buttonEl.appendChild(preview);
    
    // Create item label (dimensions)
    const widthCm = (object.width * 100).toFixed(0);
    const heightCm = (object.height * 100).toFixed(0);
    const label = this.createElement('a-text');
    label.setAttribute('value', `${widthCm}×${heightCm} cm`);
    label.setAttribute('align', 'center');
    label.setAttribute('position', `0 ${-itemHeight/2 + 0.015} 0.002`);
    label.setAttribute('color', '#FFFFFF');
    label.setAttribute('scale', '0.025 0.025 0.025');
    buttonEl.appendChild(label);
    
    // Add button press handler
    this.addEventListener(buttonEl, EVENTS.BUTTON.PRESS_ENDED, () => this.onItemClick(object));
    
    // Add to container
    this.scrollContainer.appendChild(item);
  });
  
  // Adjust container position based on number of rows
  const rows = Math.ceil(objects.length / itemsPerRow);
  
  // Enable scrolling laser controls
  this.setupScrollingControls();
};

// Set up special angled laser controls for menu scrolling
ViewItemsMenu.setupScrollingControls = function() {
  // Create separate raycaster entities for menu interaction
  ['left', 'right'].forEach(hand => {
    const handId = `${hand}Hand`;
    const handEntity = document.getElementById(handId);
    
    if (!handEntity) {
      console.warn(`View Items Menu: ${hand} hand entity not found`);
      return;
    }
    
    // Create or update raycaster entity
    const rayId = `menu-laser-${hand}`;
    
    // Remove existing ray if present
    const existingRay = document.getElementById(rayId);
    if (existingRay) {
      existingRay.parentNode.removeChild(existingRay);
    }
    
    // Create new ray entity
    const rayEntity = document.createElement('a-entity');
    rayEntity.id = rayId;
    rayEntity.setAttribute('position', '0 0 0');
    
    // Set up raycaster targeting our menu items - angled downward 30 degrees
    rayEntity.setAttribute('raycaster', {
      objects: '.clickable, [button], .interactive',
      direction: '0 -0.5 -0.866', // Angled down 30 degrees
      far: 2,
      lineColor: hand === 'left' ? '#4285F4' : '#F4B400',
      lineOpacity: 0.7,
      showLine: true
    });
    
    // Add to hand entity
    handEntity.appendChild(rayEntity);
    
    // Store reference for cleanup
    this.elements.push(rayEntity);
    
    // Add event listeners for interaction
    this.addEventListener(handEntity, 'triggerdown', () => {
      // Only process if we have active raycaster intersections
      if (rayEntity.components.raycaster.intersections.length > 0) {
        // Get the intersected element
        const intersectedEl = rayEntity.components.raycaster.intersections[0].object.el;
        // Trigger a click event on the element
        intersectedEl.dispatchEvent(new Event('click'));
      }
    });
    
    // Also support pinch gestures for hand tracking
    this.addEventListener(handEntity, 'pinchstarted', () => {
      // Only process if we have active raycaster intersections
      if (rayEntity.components.raycaster.intersections.length > 0) {
        // Get the intersected element
        const intersectedEl = rayEntity.components.raycaster.intersections[0].object.el;
        // Trigger a click event on the element
        intersectedEl.dispatchEvent(new Event('click'));
      }
    });
    
    // Track pinch moves for dragging and scrolling
    this.addEventListener(handEntity, 'pinchmoved', (evt) => {
      // Only process if we have active raycaster intersections
      if (rayEntity.components.raycaster.intersections.length > 0) {
        // Get the intersected element
        const intersectedEl = rayEntity.components.raycaster.intersections[0].object.el;
        
        // Get movement data from event
        const detail = evt.detail;
        if (detail && detail.position) {
          // Create a custom drag event with the movement data
          intersectedEl.dispatchEvent(new CustomEvent('drag-move', { 
            detail: {
              position: detail.position,
              hand: hand
            }
          }));
        }
      }
    });
  });
  
  console.log('View Items Menu: Laser controls set up for menu interaction with drag support');
};

// Handle item click
ViewItemsMenu.onItemClick = function(object) {
  console.log('View Items Menu: Object clicked -', object.id);
  
  // Emit event to display object on wall
  emitEvent(this.sceneEl, EVENTS.OBJECT.ACTION, {
    action: 'project-on-wall',
    objectId: object.id,
    object: object
  });
  
  // Close menu
  // this.emitMenuAction('back-to-main-menu');
};

// Create back button
ViewItemsMenu.createBackButton = function() {
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
ViewItemsMenu.handleButtonPress = function(action) {
  console.log('View Items Menu: Button pressed -', action);
  
  // Emit menu action event
  this.emitMenuAction(action);
};

// Clean up - remove custom raycasters
ViewItemsMenu.cleanup = function() {
  // Call the parent cleanup method which will clean up our elements array
  // including the raycaster entities we created
  BaseMenu.cleanup.call(this);
  
  // Extra cleanup for raycaster entities
  ['left', 'right'].forEach(hand => {
    const rayId = `menu-laser-${hand}`;
    const rayEntity = document.getElementById(rayId);
    
    if (rayEntity && rayEntity.parentNode) {
      // First make sure we remove all event listeners
      // (though the BaseMenu.cleanup should handle elements we tracked)
      rayEntity.parentNode.removeChild(rayEntity);
    }
    
    // Also remove event listeners from hand entities
    const handEntity = document.getElementById(`${hand}Hand`);
    if (handEntity) {
      // BaseMenu.cleanup should handle removing event listeners we added with addEventListener
      // but just to be sure, we'll check for any we might have missed
      if (handEntity._eventListeners) {
        if (handEntity._eventListeners.triggerdown) {
          handEntity._eventListeners.triggerdown.forEach(handler => {
            handEntity.removeEventListener('triggerdown', handler);
          });
        }
        if (handEntity._eventListeners.pinchstarted) {
          handEntity._eventListeners.pinchstarted.forEach(handler => {
            handEntity.removeEventListener('pinchstarted', handler);
          });
        }
        if (handEntity._eventListeners.pinchmoved) {
          handEntity._eventListeners.pinchmoved.forEach(handler => {
            handEntity.removeEventListener('pinchmoved', handler);
          });
        }
      }
    }
  });
};

// Register this menu with the registry
MenuRegistry.register('view-items', ViewItemsMenu);

export default ViewItemsMenu;
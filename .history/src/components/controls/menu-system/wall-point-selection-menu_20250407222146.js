/**
 * Wall Point Selection Menu Component
 * 
 * Provides UI for wall calibration point selection process
 */

import BaseMenu from './base-menu.js';
import MenuRegistry from './menu-registry.js';
import { events } from '../../../utils/index.js';

const { EVENTS, emitEvent } = events;

// Wall point selection menu implementation
const WallPointSelectionMenu = Object.create(BaseMenu);

// Override init to set up additional state
WallPointSelectionMenu.init = function(container, data, sceneEl) {
  // Call parent init
  BaseMenu.init.call(this, container, data, sceneEl);
  
  // Point selection state
  this.points = [];
  this.markers = [];
  this.step = 0;
  this.lastPinchTime = 0;
  
  // Bind methods that will be used as event handlers
  this.onPinchStarted = this.onPinchStarted.bind(this);
  
  // Set up pinch event listener
  this.sceneEl.addEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
};

// Override render method with wall point selection menu content
WallPointSelectionMenu.render = function() {
  
  // Add title
  const title = this.createTitle('Wall Calibration', this.data.height);
  this.container.appendChild(title);
  
  // Add instructions text
  const instructions = this.createElement('a-text');
  instructions.setAttribute('value', 'Press Start to begin calibration');
  instructions.setAttribute('align', 'center');
  instructions.setAttribute('position', `0 ${height/2 - 0.05} 0`);
  instructions.setAttribute('color', '#FFFFFF');
  instructions.setAttribute('scale', '0.03 0.03 0.03');
  instructions.setAttribute('id', 'calibration-instructions');
  this.container.appendChild(instructions);
  
  // Add progress indicator
  const progress = this.createElement('a-text');
  progress.setAttribute('value', '0 / 3 points selected');
  progress.setAttribute('align', 'center');
  progress.setAttribute('position', `0 ${height/2 - 0.08} 0`);
  progress.setAttribute('color', '#4285F4');
  progress.setAttribute('scale', '0.035 0.035 0.035');
  progress.setAttribute('id', 'calibration-progress');
  this.container.appendChild(progress);
  
  // Add start button
  const startButton = this.createButton({
    label: 'Start',
    width: 0.07,
    height: 0.04,
    color: '#4285F4',
    position: '-0.06 -0.06 0',
    id: 'calibration-start-button',
    handler: () => this.handleStartButton()
  });
  this.container.appendChild(startButton);
  
  // Add cancel button
  const cancelButton = this.createButton({
    label: 'Cancel',
    width: 0.07,
    height: 0.04,
    color: '#DB4437',
    position: '0.06 -0.06 0',
    handler: () => this.handleCancelButton()
  });
  this.container.appendChild(cancelButton);
};

// Handle start button click
WallPointSelectionMenu.handleStartButton = function() {
  const startButton = document.getElementById('calibration-start-button');
  const instructions = document.getElementById('calibration-instructions');
  
  // Check if we're in "Done" state
  if (startButton.getAttribute('button').label === 'Done') {
    console.log('Wall Point Selection: Complete, returning to menu');
    
    // Clean up
    this.removeMarkers();
    this.sceneEl.removeEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
    
    // Return to wall calibration menu
    this.emitMenuAction('back-to-previous-menu');
    return;
  }
  
  // Begin calibration
  this.step = 1;
  
  // Update UI
  instructions.setAttribute('value', 'Pinch on the first point of the wall (top left)');
  
  // Grey out start button
  startButton.setAttribute('button', {
    label: 'Started',
    color: '#888888' // Grey color
  });
  
  console.log('Wall Point Selection: Started point selection');
};

// Handle cancel button click
WallPointSelectionMenu.handleCancelButton = function() {
  console.log('Wall Point Selection: Cancelled');
  
  // Clean up
  this.removeMarkers();
  this.sceneEl.removeEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
  
  // Return to wall calibration menu
  this.emitMenuAction('back-to-previous-menu');
};

// Handle pinch events for point selection
WallPointSelectionMenu.onPinchStarted = function(event) {
  // Only process pinch events when in active calibration step
  if (this.step < 1 || this.step > 3) {
    return;
  }
  
  console.log('Wall Point Selection: Pinch detected in step:', this.step);
  
  // Prevent multiple pinches from being processed too quickly
  const now = Date.now();
  if (this.lastPinchTime && (now - this.lastPinchTime < 1000)) {
    console.log('Wall Point Selection: Ignoring pinch, too soon after last pinch');
    return;
  }
  this.lastPinchTime = now;
  
  // Get position from pinch event
  let worldPosition;
  
  if (event.detail && event.detail.position) {
    // Get position directly from event
    const position = event.detail.position;
    worldPosition = new THREE.Vector3(position.x, position.y, position.z);
  } else {
    // Get position from hand entity if position not in event
    const hand = event.detail.hand === 'left' ? 'leftHand' : 'rightHand';
    const handEls = document.querySelectorAll(`#${hand}`);
    
    if (handEls.length > 0) {
      const handEl = handEls[0];
      const position = handEl.getAttribute('position');
      worldPosition = new THREE.Vector3(position.x, position.y, position.z);
    } else {
      console.error('Wall Point Selection: Could not find hand entity');
      return;
    }
  }
  
  // Process this pinch point
  this.processPoint(worldPosition);
};

// Process a selected point
WallPointSelectionMenu.processPoint = function(position) {
  // Store point
  this.points.push(position);
  
  // Create visual marker at point
  this.createMarker(position, this.step);
  
  // Update progress indicator
  const progress = document.getElementById('calibration-progress');
  progress.setAttribute('value', `${this.points.length} / 3 points selected`);
  
  // Update instructions for next point
  const instructions = document.getElementById('calibration-instructions');
  
  if (this.step === 1) {
    instructions.setAttribute('value', 'Pinch on the second point of the wall (top right)');
    this.step = 2;
  } else if (this.step === 2) {
    instructions.setAttribute('value', 'Pinch on the third point of the wall (bottom left or right)');
    this.step = 3;
  } else if (this.step === 3) {
    // All points collected, process the calibration
    this.finalizeCalibration();
  }
};

// Create a marker at the selected point
WallPointSelectionMenu.createMarker = function(position, index) {
  // Create a visual marker at the selected point
  const marker = document.createElement('a-entity');
  
  // Create sphere for the marker
  const sphere = document.createElement('a-sphere');
  sphere.setAttribute('radius', 0.02);
  sphere.setAttribute('color', index === 1 ? '#4285F4' : (index === 2 ? '#0F9D58' : '#F4B400'));
  sphere.setAttribute('shader', 'flat');
  marker.appendChild(sphere);
  
  // Create label
  const label = document.createElement('a-text');
  label.setAttribute('value', `${index}`);
  label.setAttribute('align', 'center');
  label.setAttribute('position', '0 0.05 0');
  label.setAttribute('scale', '0.1 0.1 0.1');
  label.setAttribute('color', '#FFFFFF');
  label.setAttribute('look-at', '[camera]');
  marker.appendChild(label);
  
  // Position marker
  marker.setAttribute('position', position);
  
  // Add to scene
  this.sceneEl.appendChild(marker);
  
  // Store reference to marker
  this.markers.push(marker);
};

// Remove all markers
WallPointSelectionMenu.removeMarkers = function() {
  // Remove all point markers from scene
  this.markers.forEach(marker => {
    if (marker.parentNode) {
      marker.parentNode.removeChild(marker);
    }
  });
  this.markers = [];
};

// Finalize the calibration process
WallPointSelectionMenu.finalizeCalibration = function() {
  if (this.points.length !== 3) {
    console.error('Wall Point Selection: Not enough points for calibration');
    return;
  }
  
  // Calculate wall plane from three points
  const plane = this.calculatePlaneFromPoints(
    this.points[0],
    this.points[1],
    this.points[2]
  );
  
  if (!plane) {
    console.error('Wall Point Selection: Failed to calculate plane');
    return;
  }
  
  // Update UI
  const instructions = document.getElementById('calibration-instructions');
  instructions.setAttribute('value', 'Calibration complete! Wall created successfully.');
  
  const progress = document.getElementById('calibration-progress');
  progress.setAttribute('value', '3 / 3 points - Complete!');
  
  // Reset start button to active state with Done label
  const startButton = document.getElementById('calibration-start-button');
  startButton.setAttribute('button', {
    label: 'Done',
    width: 0.08,
    height: 0.04,
    color: '#42D544' // Active green color
  });
  
  // Get scene state system
  const sceneState = this.sceneEl.systems['scene-state'];
  if (sceneState) {
    // Calculate the center point of the triangle
    const center = new THREE.Vector3()
      .add(this.points[0])
      .add(this.points[1])
      .add(this.points[2])
      .divideScalar(3);
    
    // Update wall state
    sceneState.updateState('calibration.wall.position', {
      x: center.x,
      y: center.y,
      z: center.z
    });
    
    sceneState.updateState('calibration.wall.rotation', {
      x: THREE.MathUtils.radToDeg(plane.rotation.x),
      y: THREE.MathUtils.radToDeg(plane.rotation.y),
      z: THREE.MathUtils.radToDeg(plane.rotation.z)
    });
    
    // Calculate width and height based on points
    const width = this.points[0].distanceTo(this.points[1]);
    const height = this.points[0].distanceTo(this.points[2]);
    
    sceneState.updateState('calibration.wall.width', width);
    sceneState.updateState('calibration.wall.height', height);
    sceneState.updateState('calibration.wall.isCalibrated', true);
    sceneState.updateState('calibration.wall.visible', true);
    
    console.log('Wall Point Selection: Wall calibrated', {
      position: center,
      rotation: plane.rotation,
      width: width,
      height: height
    });
    
    // Emit calibration complete event
    emitEvent(this.sceneEl, EVENTS.WALL.CALIBRATION_COMPLETE, {
      position: center,
      rotation: {
        x: THREE.MathUtils.radToDeg(plane.rotation.x),
        y: THREE.MathUtils.radToDeg(plane.rotation.y),
        z: THREE.MathUtils.radToDeg(plane.rotation.z)
      },
      width: width,
      height: height
    });
  }
  
  // Reset step to indicate completion
  this.step = 0;
};

// Calculate plane from three points
WallPointSelectionMenu.calculatePlaneFromPoints = function(p1, p2, p3) {
  // Calculate two vectors on the plane
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  
  // Calculate normal vector using cross product
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  
  // Ensure normal is pointing towards the user (positive Z)
  if (normal.z < 0) {
    normal.negate();
  }
  
  // Get rotation from normal vector
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), // Default normal (facing user)
    normal
  );
  rotation.setFromQuaternion(quaternion);
  
  return {
    normal: normal,
    rotation: rotation,
    point: p1
  };
};

// Override cleanup to remove pinch listener and markers
WallPointSelectionMenu.cleanup = function() {
  // Call parent cleanup
  BaseMenu.cleanup.call(this);
  
  // Remove pinch event listener
  this.sceneEl.removeEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
  
  // Remove all markers
  this.removeMarkers();
  
  // Reset state
  this.points = [];
  this.step = 0;
};

// Register this menu with the registry
MenuRegistry.register('wall-point-selection', WallPointSelectionMenu);

export default WallPointSelectionMenu;

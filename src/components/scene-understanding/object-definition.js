/**
 * Object Definition Component
 * 
 * Creates and manages the process of defining rectangular objects on walls
 * by placing corner points and calculating dimensions.
 */

import { createMarker, removeMarkers, calculatePlaneFromPoints, calculateRectangleDimensions } from '../../utils/anchor-placement.js';
import { getPinchPosition, debounceInteraction } from '../../utils/interaction.js';

AFRAME.registerComponent('object-definition', {
  schema: {
    active: { type: 'boolean', default: false },
    wallId: { type: 'string', default: 'wallPlane' },
    visible: { type: 'boolean', default: true }
  },
  
  init: function() {
    console.log('Object Definition: Initializing');
    
    // Object definition state
    this.objects = [];
    this.currentObject = null;
    this.pointColors = ['#4285F4', '#0F9D58', '#F4B400']; // Google colors - only need 3 colors for 3 points
    
    // Point selection state
    this.points = [];
    this.markers = [];
    this.visualObject = null;
    this.step = 0;
    this.lastPinchTime = 0;
    
    // Note: We only need 3 points to define an object (top-left, top-right, bottom-right)
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Bind event handlers
    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.onObjectActionReceived = this.onObjectActionReceived.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize component state
    this.setVisibility(this.data.visible && this.data.active);
    
    console.log('Object Definition: Initialized');
  },
  
  setupEventListeners: function() {
    // Add event listeners
    this.el.sceneEl.addEventListener('pinchstarted', this.onPinchStarted);
    this.el.sceneEl.addEventListener('object-action', this.onObjectActionReceived);
  },
  
  onObjectActionReceived: function(event) {
    const action = event.detail.action;
    
    console.log('Object Definition: Action received -', action);
    
    switch(action) {
      case 'start-object-definition':
        this.startObjectDefinition();
        break;
        
      case 'cancel-object-definition':
        this.cancelObjectDefinition();
        break;
        
      case 'complete-object-definition':
        this.completeObjectDefinition();
        break;
        
      case 'reset-current-object':
        this.reset(); // Use the existing reset method
        // Emit status update
        this.el.emit('object-status', {
          status: 'reset',
          message: 'Object definition reset'
        });
        break;
        
      case 'delete-object':
        this.deleteObject(event.detail.objectId);
        break;
    }
  },
  
  startObjectDefinition: function() {
    console.log('Object Definition: Starting new object definition');
    
    // Reset state
    this.reset();
    
    // Set active step
    this.step = 1;
    
    // Show component
    this.setVisibility(true);
    
    // Emit status update
    this.el.emit('object-status', {
      status: 'started',
      message: 'Place the first corner point (top left)'
    });
  },
  
  cancelObjectDefinition: function() {
    console.log('Object Definition: Cancelling object definition');
    
    // Reset and clean up
    this.reset();
    
    // Emit status update
    this.el.emit('object-status', {
      status: 'cancelled',
      message: 'Object definition cancelled'
    });
  },
  
  completeObjectDefinition: function() {
    console.log('Object Definition: Completing current object definition');
    
    if (this.points.length === 3 && this.step === 4) {
      // We're in the preview step (after 3 points placed), finalize the object
      this.finalizeObject();
    } else if (this.points.length === 3) {
      // We have 3 points but aren't in preview mode yet
      this.finalizeObject();
    } else {
      console.warn('Object Definition: Cannot complete, not enough points defined');
      
      // Emit status update
      this.el.emit('object-status', {
        status: 'error',
        message: `Need 3 corner points, only have ${this.points.length}`
      });
    }
  },
  
  // Handle pinch events for point selection
  onPinchStarted: function(event) {
    // Only process pinch events when component is active and in point selection mode (steps 1-3)
    // Step 4 is the "preview" step after all 3 points have been placed
    if (!this.data.active || this.step < 1 || this.step >= 4 || this.points.length >= 3) {
      return;
    }
    
    console.log('Object Definition: Data active:', this.data.active, 'Step:', this.step, 'Points:', this.points.length);
    
    console.log('Object Definition: Pinch detected in step:', this.step);
    
    // Prevent multiple pinches from being processed too quickly
    const now = Date.now();
    if (this.lastPinchTime && (now - this.lastPinchTime < 1000)) {
      console.log('Object Definition: Ignoring pinch, too soon after last pinch');
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
        console.error('Object Definition: Could not find hand entity');
        return;
      }
    }
    
    // Process this pinch point
    this.processPoint(worldPosition);
  },
  
  // Process a selected point
  processPoint: function(position) {
    // Store point
    this.points.push(position);
    
    // Create visual marker at point
    const marker = createMarker(
      position, 
      this.step, 
      this.pointColors[this.step - 1], 
      this.el.sceneEl
    );
    this.markers.push(marker);
    
    // Update object visualization if we have at least 2 points
    if (this.points.length >= 2) {
      this.updateObjectVisualization();
    }
    
    // Emit status update
    let statusMessage = '';
    
    if (this.step === 1) {
      statusMessage = 'Place the second corner point (top right)';
      this.step = 2;
    } else if (this.step === 2) {
      statusMessage = 'Place the third corner point (bottom right)';
      this.step = 3;
    } else if (this.step === 3) {
      // All three points collected, render the preview but don't finalize yet
      
      // Calculate dimensions to show in status message
      const width = this.points[0].distanceTo(this.points[1]);
      const height = this.points[1].distanceTo(this.points[2]);
      const widthCm = (width * 100).toFixed(1);
      const heightCm = (height * 100).toFixed(1);
      
      // Update status with dimensions
      statusMessage = `OBJECT READY! ${widthCm}×${heightCm} cm. Click "Complete" to save or "Reset" to start over.`;
      
      // Force an update to the visualization to show the object
      this.updateObjectVisualization();
      
      // Also send an update to the UI
      this.el.emit('object-status', {
        status: 'preview',
        message: statusMessage,
        dimensions: {
          widthCm: widthCm,
          heightCm: heightCm
        }
      });
      
      // Stay in step 3, allowing reset or complete actions
      this.step = 4; // Move to a "preview" step
      return;
    }
    
    this.el.emit('object-status', {
      status: 'in-progress',
      message: statusMessage,
      pointCount: this.points.length
    });
  },
  
  // Update the visual representation of the rectangle
  updateObjectVisualization: function() {
    // Remove previous visualization
    if (this.visualObject && this.visualObject.parentNode) {
      this.visualObject.parentNode.removeChild(this.visualObject);
    }
    
    // Create new visualization entity
    this.visualObject = document.createElement('a-entity');
    this.visualObject.setAttribute('class', 'object-visualization');
    
    // Draw lines between points
    const linePoints = [...this.points];
    
    // Create lines based on number of points
    if (linePoints.length === 2) {
      // For 2 points, create a simple line
      this.createLine(linePoints[0], linePoints[1], '#4285F4');
    } else if (linePoints.length === 3) {
      // For 3 points, create a complete triangle and render the plane
      this.createLine(linePoints[0], linePoints[1], '#4285F4'); // Top edge
      this.createLine(linePoints[1], linePoints[2], '#0F9D58'); // Right edge
      this.createLine(linePoints[2], linePoints[0], '#DB4437'); // Closing edge
      
      // Calculate and render the object plane
      this.renderObjectPlane(linePoints[0], linePoints[1], linePoints[2]);
      
      // Add dimensions text
      this.addDimensionsText();
    }
    
    // Add to scene
    this.el.sceneEl.appendChild(this.visualObject);
  },
  
  // Render a plane with the correct orientation
  renderObjectPlane: function(p1, p2, p3) {
    // Points: p1 = top-left, p2 = top-right, p3 = bottom-right
    
    // Calculate width and height from points
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate the fourth point (bottom-left) to complete the rectangle
    // p4 = p1 + (p3 - p2)
    const p4Vector = new THREE.Vector3().subVectors(p3, p2);
    const p4 = new THREE.Vector3().addVectors(p1, p4Vector);
    
    // Calculate rectangle center as average of all four corners
    const center = new THREE.Vector3()
      .add(p1).add(p2).add(p3).add(p4)
      .divideScalar(4);
    
    // For a wall-mounted rectangle, we need the following vectors:
    // 1. Forward vector: normal to the wall (perpendicular to rectangle plane)
    // 2. Up vector: points up along the wall
    // 3. Right vector: points right along the wall
    
    // Calculate right vector (normalized top edge)
    const rightVector = new THREE.Vector3().subVectors(p2, p1).normalize();
    
    // Calculate up vector (normalized negative of the right edge)
    const upVector = new THREE.Vector3().subVectors(p1, p4).normalize();
    
    // Calculate forward vector (normal to the plane)
    const forwardVector = new THREE.Vector3().crossVectors(rightVector, upVector).normalize();
    
    // Create a rotation matrix from these basis vectors
    const rotMatrix = new THREE.Matrix4().makeBasis(rightVector, upVector, forwardVector);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    // Convert to degrees for A-Frame
    const rotation = {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z)
    };
    
    // Create a plane visualization
    const objectPlane = document.createElement('a-plane');
    objectPlane.setAttribute('width', width);
    objectPlane.setAttribute('height', height);
    objectPlane.setAttribute('position', center);
    objectPlane.setAttribute('rotation', rotation);
    objectPlane.setAttribute('color', '#42D544');
    objectPlane.setAttribute('opacity', 0.2);
    objectPlane.setAttribute('side', 'double');
    
    this.visualObject.appendChild(objectPlane);
  },
  
  // Create a line between two points
  createLine: function(start, end, color, dashed = false) {
    if (!this.visualObject) return;
    
    // Create line entity
    const line = document.createElement('a-entity');
    line.setAttribute('line', {
      start: start,
      end: end,
      color: color,
      opacity: 0.8,
      visible: true
    });
    
    if (dashed) {
      line.setAttribute('line', 'dashed', true);
    }
    
    this.visualObject.appendChild(line);
    return line;
  },
  
  // Add dimensions text to the visualization
  addDimensionsText: function() {
    if (this.points.length < 3 || !this.visualObject) return;
    
    // We only need 3 points - calculate width and height directly
    const width = this.points[0].distanceTo(this.points[1]);
    const height = this.points[1].distanceTo(this.points[2]);
    const center = new THREE.Vector3()
      .add(this.points[0])
      .add(this.points[1])
      .add(this.points[2])
      .divideScalar(3);
    
    // Format dimensions - show in centimeters (more intuitive for most users)
    const widthCm = (width * 100).toFixed(1);
    const heightCm = (height * 100).toFixed(1);
    
    // Create width text at top of rectangle
    const widthTextPos = new THREE.Vector3()
      .add(this.points[0])
      .add(this.points[1])
      .divideScalar(2)
      .add(new THREE.Vector3(0, 0.05, 0));
    
    const widthText = document.createElement('a-text');
    widthText.setAttribute('value', `${widthCm} cm`);
    widthText.setAttribute('align', 'center');
    widthText.setAttribute('position', widthTextPos);
    widthText.setAttribute('scale', '0.1 0.1 0.1');
    widthText.setAttribute('color', '#FFFFFF');
    widthText.setAttribute('look-at', '[camera]');
    this.visualObject.appendChild(widthText);
    
    // Create height text at right side of rectangle
    const heightTextPos = new THREE.Vector3()
      .add(this.points[1])
      .add(this.points[2])
      .divideScalar(2)
      .add(new THREE.Vector3(0.05, 0, 0));
    
    const heightText = document.createElement('a-text');
    heightText.setAttribute('value', `${heightCm} cm`);
    heightText.setAttribute('align', 'center');
    heightText.setAttribute('position', heightTextPos);
    heightText.setAttribute('scale', '0.1 0.1 0.1');
    heightText.setAttribute('color', '#FFFFFF');
    heightText.setAttribute('look-at', '[camera]');
    this.visualObject.appendChild(heightText);
    
    // Create area text in center of rectangle
    const areaTextPos = center;
    const areaCmSq = (width * height * 10000).toFixed(0); // cm²
    
    const areaText = document.createElement('a-text');
    areaText.setAttribute('value', `${areaCmSq} cm²`);
    areaText.setAttribute('align', 'center');
    areaText.setAttribute('position', areaTextPos);
    areaText.setAttribute('scale', '0.1 0.1 0.1');
    areaText.setAttribute('color', '#FFFFFF');
    areaText.setAttribute('look-at', '[camera]');
    this.visualObject.appendChild(areaText);
  },
  
  // Finalize and save the defined object
  finalizeObject: function() {
    if (this.points.length !== 3) {
      console.error('Object Definition: Not enough points for object definition');
      return;
    }
    
    // Calculate dimensions directly from 3 points
    const p1 = this.points[0]; // top-left
    const p2 = this.points[1]; // top-right
    const p3 = this.points[2]; // bottom-right
    
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate the fourth point (bottom-left) to complete the rectangle
    // p4 = p1 + (p3 - p2)
    const p4Vector = new THREE.Vector3().subVectors(p3, p2);
    const p4 = new THREE.Vector3().addVectors(p1, p4Vector);
    
    // Calculate rectangle center as average of all four corners
    const center = new THREE.Vector3()
      .add(p1).add(p2).add(p3).add(p4)
      .divideScalar(4);
    
    // Calculate basis vectors for the plane orientation
    const rightVector = new THREE.Vector3().subVectors(p2, p1).normalize();
    const upVector = new THREE.Vector3().subVectors(p1, p4).normalize();
    const forwardVector = new THREE.Vector3().crossVectors(rightVector, upVector).normalize();
    
    // Create a rotation matrix from these basis vectors
    const rotMatrix = new THREE.Matrix4().makeBasis(rightVector, upVector, forwardVector);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    // Create object data
    const objectData = {
      id: 'object_' + Date.now(),
      type: 'rectangle',
      points: this.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
      width: width,
      height: height,
      center: {
        x: center.x,
        y: center.y,
        z: center.z
      },
      rotation: {
        x: THREE.MathUtils.radToDeg(euler.x),
        y: THREE.MathUtils.radToDeg(euler.y),
        z: THREE.MathUtils.radToDeg(euler.z)
      },
      visible: true,
      locked: false,
      createdAt: new Date().toISOString()
    };
    
    // Add to objects array
    this.objects.push(objectData);
    
    // Update scene state if available
    if (this.sceneState) {
      this.sceneState.updateState('objects', this.objects);
    }
    
    // Emit object created event
    this.el.emit('object-created', {
      object: objectData
    });
    
    // Emit status update
    this.el.emit('object-status', {
      status: 'completed',
      message: 'Object defined successfully',
      dimensions: {
        width: width,
        height: height,
        widthCm: (width * 100).toFixed(1),
        heightCm: (height * 100).toFixed(1),
        areaCmSq: (width * height * 10000).toFixed(0)
      },
      object: objectData
    });
    
    // Reset state for next object
    this.reset();
  },
  
  // Reset state and clean up
  reset: function() {
    // Remove all point markers
    removeMarkers(this.markers);
    this.markers = [];
    
    // Remove visualization
    if (this.visualObject && this.visualObject.parentNode) {
      this.visualObject.parentNode.removeChild(this.visualObject);
    }
    this.visualObject = null;
    
    // Reset state
    this.points = [];
    this.step = 0; // Reset to initial step
    
    console.log('Object Definition: Reset complete, step reset to', this.step);
  },
  
  // Delete an object by ID
  deleteObject: function(objectId) {
    if (!objectId) return;
    
    console.log('Object Definition: Deleting object', objectId);
    
    // Filter out the object with the given ID
    this.objects = this.objects.filter(obj => obj.id !== objectId);
    
    // Update state if available
    if (this.sceneState) {
      this.sceneState.updateState('objects', this.objects);
    }
    
    // Emit object deleted event
    this.el.emit('object-deleted', {
      objectId: objectId
    });
    
    // Emit status update
    this.el.emit('object-status', {
      status: 'deleted',
      message: 'Object deleted'
    });
  },
  
  // Set visibility of the component
  setVisibility: function(visible) {
    this.el.setAttribute('visible', visible);
  },
  
  update: function(oldData) {
    // Handle changes to component properties
    if (oldData.active !== this.data.active) {
      // Reset when deactivated
      if (!this.data.active) {
        this.reset();
      }
      
      // Update visibility based on active state
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.visible !== this.data.visible) {
      // Update visibility
      this.setVisibility(this.data.visible && this.data.active);
    }
  },
  
  remove: function() {
    // Clean up all event listeners
    this.el.sceneEl.removeEventListener('pinchstarted', this.onPinchStarted);
    this.el.sceneEl.removeEventListener('object-action', this.onObjectActionReceived);
    
    // Clean up visual elements
    this.reset();
  }
});

// Register the component
console.log('Object Definition component registered');
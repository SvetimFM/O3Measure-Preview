/**
 * Object Definition Component
 * 
 * Creates and manages the process of defining rectangular objects on walls
 * by placing corner points and calculating dimensions.
 * 
 * This implementation uses a state machine pattern for clearer state management.
 */

// Import utility modules
import { 
  geometry, 
  uiElements, 
  events, 
  interaction 
} from '../../utils/index.js';

const {
  toVector3, calculatePlaneFromPoints, calculateFourthCorner,
  calculateRectangleDimensions, calculateRectangleOrientation
} = geometry;

const {
  createMarker, removeMarkers, createLine, createFloatingText,
  createMeasurementText
} = uiElements;

const { EVENTS, emitEvent } = events;
const { getPinchPosition, debounceInteraction } = interaction;

// Define states as constants
const STATES = {
  IDLE: 'idle',               // Not currently defining an object
  PLACING_POINT_1: 'point_1', // Placing the first point (top-left)
  PLACING_POINT_2: 'point_2', // Placing the second point (top-right)
  PLACING_POINT_3: 'point_3', // Placing the third point (bottom-right)
  PREVIEW: 'preview'          // All points placed, ready to finalize
};

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
    this.pointColors = ['#4285F4', '#0F9D58', '#F4B400']; // Google colors for 3 points
    
    // Point selection state
    this.state = STATES.IDLE;
    this.points = [];
    this.markers = [];
    this.visualObject = null;
    this.lastPinchTime = 0;
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Bind event handlers
    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.onObjectActionReceived = this.onObjectActionReceived.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize component state
    this.setVisibility(this.data.visible && this.data.active);
    
    console.log('Object Definition: Initialized in state:', this.state);
  },
  
  /**
   * State transition function - centralizes all state changes
   * @param {String} newState - New state to transition to
   */
  setState: function(newState) {
    const oldState = this.state;
    console.log(`Object Definition: State transition ${oldState} -> ${newState}`);
    
    // Pre-transition cleanup
    if (newState === STATES.IDLE && oldState !== STATES.IDLE) {
      this.reset();
    }
    
    // Update state
    this.state = newState;
    
    // Post-transition setup
    switch(newState) {
      case STATES.IDLE:
        // Nothing specific to do
        break;
        
      case STATES.PLACING_POINT_1:
        this.emitStatus('started', 'Place the first corner point (top left)');
        break;
        
      case STATES.PLACING_POINT_2:
        this.emitStatus('in-progress', 'Place the second corner point (top right)');
        break;
        
      case STATES.PLACING_POINT_3:
        this.emitStatus('in-progress', 'Place the third corner point (bottom right)');
        break;
        
      case STATES.PREVIEW:
        // Calculate dimensions
        const width = this.points[0].distanceTo(this.points[1]);
        const height = this.points[1].distanceTo(this.points[2]);
        const widthCm = (width * 100).toFixed(1);
        const heightCm = (height * 100).toFixed(1);
        
        // Update visualization one more time to ensure it's complete
        this.updateObjectVisualization();
        
        // Emit status with dimensions
        this.emitStatus('preview', 
          `OBJECT READY! ${widthCm}×${heightCm} cm. Click "Complete" to save or "Reset" to start over.`,
          { widthCm, heightCm }
        );
        break;
    }
  },
  
  /**
   * Helper to emit status updates with consistent format
   * @param {String} status - Status code (started, in-progress, preview, etc.)
   * @param {String} message - Status message to display
   * @param {Object} additionalData - Any additional data to include
   */
  emitStatus: function(status, message, additionalData = {}) {
    emitEvent(this.el, EVENTS.OBJECT.STATUS, {
      status: status,
      message: message,
      pointCount: this.points.length,
      ...additionalData
    });
  },
  
  setupEventListeners: function() {
    // Add event listeners
    this.el.sceneEl.addEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
    this.el.sceneEl.addEventListener(EVENTS.OBJECT.ACTION, this.onObjectActionReceived);
  },
  
  onObjectActionReceived: function(event) {
    const action = event.detail.action;
    
    console.log('Object Definition: Action received -', action);
    
    switch(action) {
      case 'start-object-definition':
        this.startObjectDefinition();
        break;
        
      case 'cancel-object-definition':
        this.setState(STATES.IDLE);
        this.emitStatus('cancelled', 'Object definition cancelled');
        break;
        
      case 'complete-object-definition':
        this.completeObjectDefinition();
        break;
        
      case 'reset-current-object':
        // Just reset the current object (don't change state to PLACING_POINT_1)
        console.log('Object Definition: Resetting current object');
        
        // Clear current points and markers
        this.reset();
        
        // Keep original state (IDLE)
        this.setState(STATES.IDLE);
        
        // Emit status update
        this.emitStatus('reset', 'Object definition reset. Ready for new object.');
        break;
        
      case 'delete-object':
        this.deleteObject(event.detail.objectId);
        break;
    }
  },
  
  startObjectDefinition: function() {
    console.log('Object Definition: Starting new object definition');
    
    // Transition to placing first point
    this.setState(STATES.PLACING_POINT_1);
    
    // Show component
    this.setVisibility(true);
  },
  
  completeObjectDefinition: function() {
    console.log('Object Definition: Completing current object definition');
    
    // Only complete if we have 3 points and are in preview state
    if (this.points.length === 3 && this.state === STATES.PREVIEW) {
      this.finalizeObject();
    } else if (this.points.length === 3) {
      // We have 3 points but aren't in preview mode yet - force to preview then finalize
      this.setState(STATES.PREVIEW);
      this.finalizeObject();
    } else {
      console.warn('Object Definition: Cannot complete, not enough points defined');
      
      this.emitStatus('error', `Need 3 corner points, only have ${this.points.length}`);
    }
  },
  
  // Handle pinch events for point selection
  onPinchStarted: function(event) {
    // Only process pinch events when component is active and in a point-placing state
    const validStates = [STATES.PLACING_POINT_1, STATES.PLACING_POINT_2, STATES.PLACING_POINT_3];
    
    if (!this.data.active || !validStates.includes(this.state)) {
      return;
    }
    
    console.log('Object Definition: Pinch detected in state:', this.state);
    
    // Prevent multiple pinches from being processed too quickly
    const now = Date.now();
    if (this.lastPinchTime && (now - this.lastPinchTime < 1000)) {
      console.log('Object Definition: Ignoring pinch, too soon after last pinch');
      return;
    }
    this.lastPinchTime = now;
    
    // Get position from pinch event
    let worldPosition = getPinchPosition(event);
    if (!worldPosition) {
      console.error('Object Definition: Could not get pinch position');
      return;
    }
    
    // Process this pinch point
    this.addPoint(worldPosition);
  },
  
  // Add a point and transition to the next state
  addPoint: function(position) {
    // Store point
    this.points.push(position);
    
    // Create visual marker at point
    const pointIndex = this.points.length;
    const colorIndex = pointIndex - 1;
    
    const marker = createMarker(
      position, 
      pointIndex, 
      this.pointColors[colorIndex], 
      this.el.sceneEl
    );
    this.markers.push(marker);
    
    // Update object visualization if we have at least 2 points
    if (this.points.length >= 2) {
      this.updateObjectVisualization();
    }
    
    // Transition to next state based on current state
    switch(this.state) {
      case STATES.PLACING_POINT_1:
        this.setState(STATES.PLACING_POINT_2);
        break;
      case STATES.PLACING_POINT_2:
        this.setState(STATES.PLACING_POINT_3);
        break;
      case STATES.PLACING_POINT_3:
        this.setState(STATES.PREVIEW);
        break;
    }
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
  
  // Create a line between two points
  createLine: function(start, end, color, dashed = false) {
    if (!this.visualObject) return;
    
    // Use the createLine utility function
    const line = createLine(start, end, color, dashed);
    this.visualObject.appendChild(line);
    return line;
  },
  
  // Render a plane with the correct orientation
  renderObjectPlane: function(p1, p2, p3) {
    // Points: p1 = top-left, p2 = top-right, p3 = bottom-right
    
    // Use utility functions for calculations
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate the fourth point (bottom-left) to complete the rectangle
    const p4 = calculateFourthCorner(p1, p2, p3);
    
    // Calculate rectangle center and dimensions
    const points = [p1, p2, p3, p4];
    const dimensions = calculateRectangleDimensions(points);
    const center = dimensions.center;
    
    // Calculate rotation using rectangle orientation utility
    const rotation = calculateRectangleOrientation(p1, p2, p3);
    
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
  
  // Add dimensions text to the visualization
  addDimensionsText: function() {
    if (this.points.length < 3 || !this.visualObject) return;
    
    // Calculate dimensions using geometry utility function
    const p1 = this.points[0];
    const p2 = this.points[1];
    const p3 = this.points[2];
    
    // Calculate width and height directly
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate center of the three points
    const center = new THREE.Vector3()
      .add(p1).add(p2).add(p3)
      .divideScalar(3);
    
    // Calculate positions for dimension labels
    const widthTextPos = new THREE.Vector3()
      .add(p1).add(p2)
      .divideScalar(2)
      .add(new THREE.Vector3(0, 0.05, 0));
    
    const heightTextPos = new THREE.Vector3()
      .add(p2).add(p3)
      .divideScalar(2)
      .add(new THREE.Vector3(0.05, 0, 0));
    
    // Use utility functions to create text elements
    const widthText = createMeasurementText(width, widthTextPos, 'cm', {
      color: '#FFFFFF',
      scale: '0.1 0.1 0.1',
      lookAt: '[camera]'
    });
    this.visualObject.appendChild(widthText);
    
    const heightText = createMeasurementText(height, heightTextPos, 'cm', {
      color: '#FFFFFF',
      scale: '0.1 0.1 0.1',
      lookAt: '[camera]'
    });
    this.visualObject.appendChild(heightText);
    
    // Create area text in center of rectangle
    const areaCmSq = (width * height * 10000).toFixed(0); // cm²
    const areaText = createFloatingText(`${areaCmSq} cm²`, center, {
      color: '#FFFFFF',
      scale: '0.1 0.1 0.1',
      lookAt: '[camera]'
    });
    this.visualObject.appendChild(areaText);
  },
  
  // Finalize and save the defined object
  finalizeObject: function() {
    if (this.points.length !== 3) {
      console.error('Object Definition: Not enough points for object definition');
      return;
    }
    
    // Use utility functions for calculations
    const p1 = this.points[0]; // top-left
    const p2 = this.points[1]; // top-right
    const p3 = this.points[2]; // bottom-right
    
    // Calculate dimensions
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate the fourth point and get dimensions
    const p4 = calculateFourthCorner(p1, p2, p3);
    const points = [p1, p2, p3, p4];
    const dimensions = calculateRectangleDimensions(points);
    const center = dimensions.center;
    
    // Get orientation using the utility function
    const rotation = calculateRectangleOrientation(p1, p2, p3);
    
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
      rotation: rotation,
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
    emitEvent(this.el, EVENTS.OBJECT.CREATED, {
      object: objectData
    });
    
    // Emit status update
    this.emitStatus('completed', 'Object defined successfully', {
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
    this.setState(STATES.IDLE);
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
    
    console.log('Object Definition: Reset complete');
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
    emitEvent(this.el, EVENTS.OBJECT.DELETED, {
      objectId: objectId
    });
    
    // Emit status update
    this.emitStatus('deleted', 'Object deleted');
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
        this.setState(STATES.IDLE);
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
    this.el.sceneEl.removeEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
    this.el.sceneEl.removeEventListener(EVENTS.OBJECT.ACTION, this.onObjectActionReceived);
    
    // Clean up visual elements
    this.reset();
  }
});

// Register the component
console.log('Object Definition component registered');
/**
 * Example of refactored object definition using utility modules
 * This shows how to use the new utility modules to reduce boilerplate
 */

// Import utilities from standardized modules
import { 
  geometry,
  uiElements,
  events,
  interaction
} from '../utils/index.js';

const {
  calculateRectangleOrientation, 
  calculateFourthCorner, 
  metersToFormattedCm 
} = geometry;

const {
  createMarker, 
  removeMarkers, 
  createLine, 
  createPlane, 
  createMeasurementText 
} = uiElements;

const { 
  EVENTS, 
  emitEvent, 
  addListener, 
  removeListener 
} = events;

const {
  getPinchPosition, 
  debounceInteraction 
} = interaction;

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
    this.pointColors = ['#4285F4', '#0F9D58', '#F4B400']; // Google colors - only need 3 colors for 3 points
    
    // Point selection state
    this.points = [];
    this.markers = [];
    this.visualObject = null;
    this.step = 0;
    this.lastPinchTime = 0;
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Bind event handlers and set up event listeners
    this.setupEventListeners();
    
    // Initialize component state
    this.setVisibility(this.data.visible && this.data.active);
    
    console.log('Object Definition: Initialized');
  },
  
  setupEventListeners: function() {
    // Use the new event utilities to set up listeners
    this.boundPinchHandler = addListener(
      this.el.sceneEl, 
      EVENTS.INTERACTION.PINCH_STARTED, 
      this.onPinchStarted, 
      this
    );
    
    this.boundActionHandler = addListener(
      this.el.sceneEl, 
      EVENTS.OBJECT.ACTION, 
      this.onObjectActionReceived, 
      this
    );
  },
  
  onObjectActionReceived: function(event) {
    const action = event.detail.action;
    console.log('Object Definition: Action received -', action);
    
    switch(action) {
      case 'start-object-definition':
        this.startObjectDefinition();
        break;
        
      case 'cancel-object-definition':
        this.reset();
        emitEvent(this.el, EVENTS.OBJECT.STATUS, {
          status: 'cancelled',
          message: 'Object definition cancelled'
        });
        break;
        
      case 'complete-object-definition':
        this.completeObjectDefinition();
        break;
        
      case 'reset-current-object':
        this.reset();
        emitEvent(this.el, EVENTS.OBJECT.STATUS, {
          status: 'reset',
          message: 'Object definition reset'
        });
        break;
        
      case 'delete-object':
        this.deleteObject(event.detail.objectId);
        break;
    }
  },
  
  onPinchStarted: function(event) {
    // Only process pinch events when component is active and in point selection mode (steps 1-3)
    if (!this.data.active || this.step < 1 || this.step >= 4 || this.points.length >= 3) {
      return;
    }
    
    console.log('Object Definition: Pinch detected in step:', this.step);
    
    // Use debounce utility to prevent multiple pinches
    const newTimestamp = debounceInteraction(this.lastPinchTime, 1000);
    if (newTimestamp === false) {
      console.log('Object Definition: Ignoring pinch, too soon after last pinch');
      return;
    }
    this.lastPinchTime = newTimestamp;
    
    // Use getPinchPosition utility to get position
    const worldPosition = getPinchPosition(event);
    if (!worldPosition) {
      console.error('Object Definition: Could not get pinch position');
      return;
    }
    
    // Process this pinch point
    this.processPoint(worldPosition);
  },
  
  processPoint: function(position) {
    // Store point
    this.points.push(position);
    
    // Create visual marker using utility
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
      // All three points collected
      
      // Calculate dimensions using utility
      const width = this.points[0].distanceTo(this.points[1]);
      const height = this.points[1].distanceTo(this.points[2]);
      const widthCm = metersToFormattedCm(width);
      const heightCm = metersToFormattedCm(height);
      
      // Update status with dimensions
      statusMessage = `OBJECT READY! ${widthCm}×${heightCm} cm. Click "Complete" to save or "Reset" to start over.`;
      
      // Force an update to the visualization to show the object
      this.updateObjectVisualization();
      
      // Use event utility to emit status
      emitEvent(this.el, EVENTS.OBJECT.STATUS, {
        status: 'preview',
        message: statusMessage,
        dimensions: {
          widthCm: widthCm,
          heightCm: heightCm
        }
      });
      
      // Move to the "preview" step
      this.step = 4;
      return;
    }
    
    // Use event utility to emit status update
    emitEvent(this.el, EVENTS.OBJECT.STATUS, {
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
    
    // Draw lines between points using utilities
    const linePoints = [...this.points];
    
    if (linePoints.length === 2) {
      // For 2 points, create a simple line
      const line = createLine(linePoints[0], linePoints[1], '#4285F4');
      this.visualObject.appendChild(line);
    } else if (linePoints.length === 3) {
      // For 3 points, create a complete triangle and render the plane
      this.visualObject.appendChild(createLine(linePoints[0], linePoints[1], '#4285F4')); // Top edge
      this.visualObject.appendChild(createLine(linePoints[1], linePoints[2], '#0F9D58')); // Right edge
      this.visualObject.appendChild(createLine(linePoints[2], linePoints[0], '#DB4437')); // Closing edge
      
      // Calculate and render the object plane
      this.renderObjectPlane(linePoints[0], linePoints[1], linePoints[2]);
      
      // Add dimensions text
      this.addDimensionsText();
    }
    
    // Add to scene
    this.el.sceneEl.appendChild(this.visualObject);
  },
  
  // Render a plane with the correct orientation using geometry utilities
  renderObjectPlane: function(p1, p2, p3) {
    // Calculate width and height
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate the fourth point using utility
    const p4 = calculateFourthCorner(p1, p2, p3);
    
    // Calculate center as average of all four corners
    const center = new THREE.Vector3()
      .add(p1).add(p2).add(p3).add(p4)
      .divideScalar(4);
    
    // Calculate rotation using utility
    const rotation = calculateRectangleOrientation(p1, p2, p3);
    
    // Create a plane using utility
    const objectPlane = createPlane({
      width,
      height,
      position: center,
      rotation,
      color: '#42D544',
      opacity: 0.2,
      side: 'double'
    });
    
    this.visualObject.appendChild(objectPlane);
  },
  
  // Add dimensions text to the visualization using utilities
  addDimensionsText: function() {
    if (this.points.length < 3 || !this.visualObject) return;
    
    const p1 = this.points[0]; // top-left
    const p2 = this.points[1]; // top-right
    const p3 = this.points[2]; // bottom-right
    
    // Calculate dimensions
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate text positions
    const widthTextPos = new THREE.Vector3()
      .addVectors(p1, p2)
      .divideScalar(2)
      .add(new THREE.Vector3(0, 0.05, 0));
    
    const heightTextPos = new THREE.Vector3()
      .addVectors(p2, p3)
      .divideScalar(2)
      .add(new THREE.Vector3(0.05, 0, 0));
    
    // Create texts using utilities
    const widthText = createMeasurementText(width, widthTextPos, 'cm', {
      lookAt: '[camera]'
    });
    
    const heightText = createMeasurementText(height, heightTextPos, 'cm', {
      lookAt: '[camera]'
    });
    
    // Create area text
    const center = new THREE.Vector3()
      .add(p1).add(p2).add(p3)
      .divideScalar(3);
    const areaText = createMeasurementText(width * height, center, 'cm²', {
      lookAt: '[camera]'
    });
    
    // Add to visualization
    this.visualObject.appendChild(widthText);
    this.visualObject.appendChild(heightText);
    this.visualObject.appendChild(areaText);
  },
  
  reset: function() {
    // Remove all point markers using utility
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
  
  remove: function() {
    // Clean up all event listeners using event utils
    removeListener(this.el.sceneEl, EVENTS.INTERACTION.PINCH_STARTED, this.boundPinchHandler);
    removeListener(this.el.sceneEl, EVENTS.OBJECT.ACTION, this.boundActionHandler);
    
    // Clean up visual elements
    this.reset();
  }
});

// Note: This is just a partial example showing how to refactor the component.
// It doesn't include all methods from the original component.

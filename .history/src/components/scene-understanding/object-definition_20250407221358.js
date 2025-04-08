/**
 * Object Definition Component
 * 
 * Creates and manages the process of defining rectangular objects on walls
 * by placing corner points and calculating dimensions.
 */

// Import utility modules
import { 
  geometry, 
  uiElements,
  events,
  interaction
} from '../../utils/index.js';

const {
  calculateFourthCorner,
  calculateRectangleDimensions, calculateRectangleOrientation
} = geometry;

const {
  createMarker, removeMarkers, createLine, createFloatingText,
  createMeasurementText, createVisualizationEntity
} = uiElements;

const { EVENTS, emitEvent, emitStatus } = events;
const { getPinchPosition } = interaction;

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
    
    // Internal state - simplified with just the essential properties
    this.step = 0; // 0: idle, 1: placing point 1, 2: placing point 2, 3: placing point 3, 4: preview
    this.points = [];
    this.markers = [];
    this.visualObject = null;
    this.lastPinchTime = 0;
    this.preserveForAnchoring = false; // Flag to keep object visible during anchoring transition
    
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
        this.reset();
        this.step = 0;
        this.emitStatus('cancelled', 'Object definition cancelled');
        break;
        
      case 'complete-object-definition':
        this.completeObjectDefinition();
        break;
        
      case 'reset-current-object':
        this.reset();
        // Set step to 1 (placing first point) to stay in object creation mode
        // instead of going back to idle (0)
        this.step = 1;
        this.emitStatus('reset', 'Object reset. Place the first corner point (top left).');
        break;
        
      case 'delete-object':
        this.deleteObject(event.detail.objectId);
        break;
      
      case 'toggle-object-visibility':
        this.toggleObjectVisibility(event.detail.objectId);
        break;
    }
  },
  
  emitStatus: function(status, message, additionalData = {}) {
    // Use the utility function but add pointCount to all status updates
    emitStatus(this.el, EVENTS.OBJECT.STATUS, status, message, {
      pointCount: this.points.length,
      ...additionalData
    });
  },
  
  startObjectDefinition: function() {
    console.log('Object Definition: Starting new object definition');
    
    // Reset and transition to placing first point
    this.reset();
    this.step = 1;
    
    // Show component
    this.setVisibility(true);
    
    // Emit status update
    this.emitStatus('started', 'Place the first corner point (top left)');
  },
  
  completeObjectDefinition: function() {
    console.log('Object Definition: Completing current object definition');
    
    // Only complete if we have 3 points and are in preview state
    if (this.points.length === 3 && this.step === 4) {
      this.finalizeObject();
    } else if (this.points.length === 3) {
      // We have 3 points but aren't in preview mode yet - force to preview then finalize
      this.step = 4;
      this.finalizeObject();
    } else {
      console.warn('Object Definition: Cannot complete, not enough points defined');
      
      this.emitStatus('error', `Need 3 corner points, only have ${this.points.length}`);
    }
  },
  
  // Handle pinch events for point selection
  onPinchStarted: function(event) {
    // Only process pinch events when component is active and in a point-placing state
    if (!this.data.active || this.step === 0 || this.step > 3) {
      return;
    }
    
    console.log('Object Definition: Pinch detected in step:', this.step);
    
    // Prevent multiple pinches from being processed too quickly
    const now = Date.now();
    if (this.lastPinchTime && (now - this.lastPinchTime < 1000)) {
      console.log('Object Definition: Ignoring pinch, too soon after last pinch');
      return;
    }
    this.lastPinchTime = now;
    
    // Get position from pinch event using interaction utility
    const worldPosition = getPinchPosition(event);
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
    
    // Transition to next step based on current step
    let statusMessage = '';
    
    switch(this.step) {
      case 1:
        this.step = 2;
        statusMessage = 'Place the second corner point (top right)';
        break;
      case 2:
        this.step = 3;
        statusMessage = 'Place the third corner point (bottom right)';
        break;
      case 3:
        // Calculate dimensions
        const width = this.points[0].distanceTo(this.points[1]);
        const height = this.points[1].distanceTo(this.points[2]);
        const widthCm = (width * 100).toFixed(1);
        const heightCm = (height * 100).toFixed(1);
        
        this.step = 4;
        statusMessage = `OBJECT READY! ${widthCm}×${heightCm} cm. Click "Complete" to save or "Reset" to start over.`;
        
        // Force update visualization
        this.updateObjectVisualization();
        
        // Add dimensions data
        this.emitStatus('preview', statusMessage, { 
          widthCm, 
          heightCm 
        });
        return;
    }
    
    // Emit status update
    this.emitStatus(this.step === 1 ? 'started' : 'in-progress', statusMessage);
  },
  
  // Update the visual representation of the rectangle
  updateObjectVisualization: function() {
    // Create or update visualization entity using utility
    this.visualObject = createVisualizationEntity(
      this.visualObject, 
      this.el.sceneEl, 
      'object-visualization'
    );
    
    // Always make object interactable with raycasters
    this.visualObject.classList.add('anchoring-enabled');
    this.visualObject.setAttribute('data-collideable', 'true');
    this.visualObject.setAttribute('data-object-type', 'visual');
    
    // Add a unique identifier if needed for tracking
    // (We now use permanent object IDs instead of temporary ones)
    const uniqueVisId = `vis_${Date.now()}`;
    this.visualObject.setAttribute('data-vis-id', uniqueVisId);
    
    // Draw lines between points
    const linePoints = [...this.points];
    
    // Create lines based on number of points
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
    
    // Ensure the object is exposed to the scene state for easy access
    if (this.sceneState) {
      this.sceneState.updateState('currentVisualization', this.visualObject);
    }
  },
  
  // Render a plane with the correct orientation
  renderObjectPlane: function(p1, p2, p3) {
    // Points: p1 = top-left, p2 = top-right, p3 = bottom-right
    
    // Calculate width and height
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
    
    // Always make the plane interactive for raycasters and anchors
    objectPlane.classList.add('anchoring-enabled');
    objectPlane.setAttribute('data-collideable', 'true');
    objectPlane.setAttribute('data-object-type', 'plane');
    
    // Add the same vis-id as the parent visualization for consistent identification
    if (this.visualObject.hasAttribute('data-vis-id')) {
      const visId = this.visualObject.getAttribute('data-vis-id');
      objectPlane.setAttribute('data-vis-id', visId);
    }
    
    this.visualObject.appendChild(objectPlane);
  },
  
  // Add dimensions text to the visualization
  addDimensionsText: function() {
    if (this.points.length < 3 || !this.visualObject) return;
    
    // Calculate dimensions
    const p1 = this.points[0];
    const p2 = this.points[1];
    const p3 = this.points[2];
    
    // Calculate width and height directly
    const width = p1.distanceTo(p2);
    const height = p2.distanceTo(p3);
    
    // Calculate positions for dimension labels
    const widthTextPos = new THREE.Vector3()
      .addVectors(p1, p2)
      .divideScalar(2)
      .add(new THREE.Vector3(0, 0.05, 0));
    
    const heightTextPos = new THREE.Vector3()
      .addVectors(p2, p3)
      .divideScalar(2)
      .add(new THREE.Vector3(0.05, 0, 0));
    
    // Center of the three points
    const center = new THREE.Vector3()
      .add(p1).add(p2).add(p3)
      .divideScalar(3);
    
    // Create text elements
    const widthText = createMeasurementText(width, widthTextPos, 'cm', {
      color: '#FFFFFF',
      scale: '0.1 0.1 0.1',
      lookAt: '[camera]',
      className: 'dimension-text'
    });
    this.visualObject.appendChild(widthText);
    
    const heightText = createMeasurementText(height, heightTextPos, 'cm', {
      color: '#FFFFFF',
      scale: '0.1 0.1 0.1',
      lookAt: '[camera]',
      className: 'dimension-text'
    });
    this.visualObject.appendChild(heightText);
    
    // Create area text in center of rectangle
    const areaCmSq = (width * height * 10000).toFixed(0); // cm²
    const areaText = createFloatingText(`${areaCmSq} cm²`, center, {
      color: '#FFFFFF',
      scale: '0.1 0.1 0.1',
      lookAt: '[camera]',
      className: 'area-text'
    });
    this.visualObject.appendChild(areaText);
  },
  
  // Finalize and save the defined object
  finalizeObject: function() {
    if (this.points.length !== 3) {
      console.error('Object Definition: Not enough points for object definition');
      return;
    }
    
    // Get the three defined points
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
    
    // Get orientation
    const rotation = calculateRectangleOrientation(p1, p2, p3);
    
    // Create object data
    const objectId = 'object_' + Date.now();
    const objectData = {
      id: objectId,
      type: 'rectangle',
      points: this.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
      width,
      height,
      center: {
        x: center.x,
        y: center.y,
        z: center.z
      },
      rotation,
      visible: true, // Objects are visible by default
      locked: false,
      createdAt: new Date().toISOString()
    };
    
    // If we keep the visualization, give it an ID tied to the object
    if (this.visualObject) {
      this.visualObject.setAttribute('id', `visual-${objectId}`);
      
      // Use data-id as the universal identifier for all objects
      this.visualObject.setAttribute('data-id', objectId);
      
      // Mark the object as collideable for raycasters
      this.visualObject.classList.add('anchoring-enabled');
      this.visualObject.setAttribute('data-collideable', 'true');
      
      // Also mark all planes inside the object as collideable
      const planes = this.visualObject.querySelectorAll('a-plane');
      planes.forEach(plane => {
        plane.classList.add('anchoring-enabled');
        plane.setAttribute('data-collideable', 'true');
        plane.setAttribute('data-id', objectId);
      });
      
      console.log(`Object ${objectId} marked as collideable with ${planes.length} planes`);
    }
    
    // Add to objects array
    this.objects.push(objectData);
    
    // Update scene state if available
    if (this.sceneState) {
      this.sceneState.updateState('objects', this.objects);
      this.sceneState.updateState('currentObjectId', objectId);
    }
    
    // Emit object created event
    emitEvent(this.el, EVENTS.OBJECT.CREATED, {
      object: objectData
    });
    
    // Emit status update
    this.emitStatus('completed', 'Object defined successfully', {
      dimensions: {
        width,
        height,
        widthCm: (width * 100).toFixed(1),
        heightCm: (height * 100).toFixed(1),
        areaCmSq: (width * height * 10000).toFixed(0)
      },
      object: objectData
    });
    
    // Reset for next object
    this.reset();
    this.step = 0;
  },
  
  // Reset state and clean up
  reset: function() {
    // Remove all point markers
    removeMarkers(this.markers);
    this.markers = [];
    
    // Remove visualization entity and all its children (lines, plane, dimension texts)
    if (this.visualObject && this.visualObject.parentNode) {
      // This removes all child elements including dimension texts
      this.visualObject.parentNode.removeChild(this.visualObject);
    }
    this.visualObject = null;
    
    // Reset state
    this.points = [];
    
    // Also check for any orphaned text elements with specific classes
    const texts = document.querySelectorAll('.dimension-text, .area-text');
    texts.forEach(text => {
      if (text.parentNode) {
        text.parentNode.removeChild(text);
      }
    });
    
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
      objectId
    });
    
    // Emit status update
    this.emitStatus('deleted', 'Object deleted');
  },
  
  // Toggle visibility of an object by ID
  toggleObjectVisibility: function(objectId) {
    if (!objectId) return;
    
    // Find the object
    const objectIndex = this.objects.findIndex(obj => obj.id === objectId);
    if (objectIndex === -1) return;
    
    // Toggle visibility
    this.objects[objectIndex].visible = !this.objects[objectIndex].visible;
    
    console.log(`Object Definition: ${this.objects[objectIndex].visible ? 'Showing' : 'Hiding'} object ${objectId}`);
    
    // Find and update the visual representation if it exists in the scene
    const objectVisual = document.getElementById(`visual-${objectId}`);
    if (objectVisual) {
      objectVisual.setAttribute('visible', this.objects[objectIndex].visible);
    }
    
    // Update scene state
    if (this.sceneState) {
      this.sceneState.updateState('objects', this.objects);
    }
    
    // Emit status update
    const visibilityStatus = this.objects[objectIndex].visible ? 'shown' : 'hidden';
    this.emitStatus('visibility-toggle', `Object ${visibilityStatus}`, {
      objectId,
      visible: this.objects[objectIndex].visible
    });
  },
  
  // Set visibility of the component
  setVisibility: function(visible) {
    this.el.setAttribute('visible', visible);
  },
  
  // This method has been completely removed - we now always save objects before anchor placement
  
  update: function(oldData) {
    // Handle changes to component properties
    if (oldData.active !== this.data.active) {
      // Reset when deactivated, but only if not preserving for anchoring
      if (!this.data.active && !this.preserveForAnchoring) {
        this.reset();
        this.step = 0;
      } else if (!this.data.active && this.preserveForAnchoring) {
        console.log('Object Definition: Preserving object for anchoring');
        // Don't reset, just keep everything as is for anchoring
      }
      
      // If we're transitioning to active and preserving for anchoring, keep object visible
      if (this.data.active && this.preserveForAnchoring) {
        this.setVisibility(true);
      } else {
        // Update visibility based on active state
        this.setVisibility(this.data.visible && this.data.active);
      }
    }
    
    if (oldData.visible !== this.data.visible) {
      // Update visibility, but respect preserveForAnchoring flag
      if (this.preserveForAnchoring) {
        this.setVisibility(true);
      } else {
        this.setVisibility(this.data.visible && this.data.active);
      }
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

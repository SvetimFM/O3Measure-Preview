/**
 * Anchor Placement Component
 * 
 * Creates and manages the process of placing anchor points on
 * defined objects for mounting/hanging.
 * 
 * This implementation uses a state machine pattern for clear state management.
 */

// Import utility modules
import { 
  anchorPlacement, 
  events, 
  interaction, 
  uiElements,
  geometry
} from '../../utils/index.js';

const { 
  getDefaultAnchorPositions
} = anchorPlacement;

const { EVENTS, emitEvent } = events;
const { rayPlaneIntersection } = interaction;

// Define states as constants
const STATES = {
  IDLE: 'idle',               // Not currently placing anchors
  SELECTING_OBJECT: 'selecting_object', // Selecting an object to place anchors on
  PLACING_ANCHORS: 'placing_anchors',   // Placing anchors on the object
  PREVIEW: 'preview'          // All anchors placed, ready to finalize
};

// Anchor colors
const ANCHOR_COLORS = ['#F4B400', '#DB4437', '#4285F4', '#0F9D58'];

AFRAME.registerComponent('anchor-placement', {
  schema: {
    active: { type: 'boolean', default: false },
    objectId: { type: 'string', default: '' },
    anchorCount: { type: 'number', default: 2 },
    visible: { type: 'boolean', default: true }
  },
  
  init: function() {
    console.log('Anchor Placement: Initializing');
    
    // Anchor placement state
    this.state = STATES.IDLE;
    this.currentObject = null;
    this.anchors = [];
    this.anchorMarkers = [];
    this.raycastLine = null;
    
    // Reticle properties
    this.reticleActive = false;
    this.reticleEntity = null;
    this.lastAimCheck = 0;
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Bind event handlers
    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.onAnchorActionReceived = this.onAnchorActionReceived.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize component state
    this.setVisibility(this.data.visible && this.data.active);
    
    console.log('Anchor Placement: Initialized in state:', this.state);
    
    // Check if the hand entities exist yet
    console.log('Anchor Placement: Initial hand entities check:');
    const leftHand = document.getElementById('leftHand');
    const rightHand = document.getElementById('rightHand');
    console.log('- Left hand found:', leftHand ? 'yes' : 'no');
    console.log('- Right hand found:', rightHand ? 'yes' : 'no');
    
    // Set up a periodic check for reticles during active states
    this.reticleCheckInterval = setInterval(() => {
      if (this.reticleActive) {
        const leftReticle = document.getElementById('anchor-reticle-left');
        const rightReticle = document.getElementById('anchor-reticle-right');
        console.log('Anchor Placement: Reticle check:', {
          state: this.state,
          reticleActive: this.reticleActive,
          leftFound: !!leftReticle,
          rightFound: !!rightReticle
        });
      }
    }, 2000); // Check every 2 seconds
  },
  
  /**
   * State transition function - centralizes all state changes
   * @param {String} newState - New state to transition to
   */
  setState: function(newState) {
    const oldState = this.state;
    console.log(`Anchor Placement: State transition ${oldState} -> ${newState}`);
    
    // Pre-transition cleanup
    if (newState === STATES.IDLE && oldState !== STATES.IDLE) {
      this.reset();
    }
    
    // Update state
    this.state = newState;
    
    // Post-transition setup
    switch(newState) {
      case STATES.IDLE:
        this.toggleReticle(false);
        break;
        
      case STATES.SELECTING_OBJECT:
        this.emitStatus('started', 'Select an object to place anchors on');
        this.toggleReticle(true);
        break;
        
      case STATES.PLACING_ANCHORS:
        this.emitStatus('in-progress', 
          `Pinch to place ${this.data.anchorCount} anchors on the object`);
        this.toggleReticle(true);
        break;
        
      case STATES.PREVIEW:
        this.emitStatus('preview', 
          `All ${this.anchors.length} anchors placed. Click "Complete" to save or "Reset" to start over.`);
        this.toggleReticle(false);
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
    emitEvent(this.el, EVENTS.ANCHOR.STATUS, {
      status: status,
      message: message,
      anchorCount: this.data.anchorCount,
      ...additionalData
    });
  },
  
  setupEventListeners: function() {
    // Add event listeners
    this.el.sceneEl.addEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
    this.el.sceneEl.addEventListener(EVENTS.ANCHOR.ACTION, this.onAnchorActionReceived);
    
    // Add tick event listener for reticle updates
    this.el.sceneEl.addEventListener('renderstart', this.onUpdate);
  },
  
  onAnchorActionReceived: function(event) {
    const action = event.detail.action;
    
    console.log('Anchor Placement: Action received -', action);
    
    switch(action) {
      case 'start-anchor-placement':
        this.startAnchorPlacement(event.detail.objectId);
        break;
        
      case 'set-anchor-count':
        this.setAnchorCount(event.detail.count);
        break;
        
      case 'auto-place-anchors':
        this.autoPlaceAnchors();
        break;
        
      case 'reset-anchors':
        this.reset();
        // Check if we should reset to the initial start state
        if (event.detail.resetToStart) {
          // Reset to initial starting state before any anchor placement
          this.setState(STATES.SELECTING_OBJECT);
          this.emitStatus('started', 'Select an object to place anchors on');
        } 
        // Otherwise if we were in an active state, go back to placing anchors state
        else if (this.state !== STATES.IDLE) {
          this.setState(STATES.PLACING_ANCHORS);
        }
        break;
        
      case 'complete-anchor-placement':
        this.completeAnchorPlacement();
        break;
        
      case 'cancel-anchor-placement':
        this.setState(STATES.IDLE);
        this.emitStatus('cancelled', 'Anchor placement cancelled');
        break;
    }
  },
  
  startAnchorPlacement: function(objectId) {
    console.log('Anchor Placement: Starting new anchor placement for objectId:', objectId);
    
    // If objectId is provided, use it
    if (objectId) {
      // Find the object in the state
      const sceneState = this.el.sceneEl.systems['scene-state'];
      if (sceneState) {
        const objects = sceneState.getState('objects') || [];
        this.currentObject = objects.find(obj => obj.id === objectId);
        
        if (this.currentObject) {
          console.log('Anchor Placement: Object found:', this.currentObject);
          this.data.objectId = objectId;
          
          // Make sure component is active and in PLACING_ANCHORS state
          this.data.active = true;
          this.setState(STATES.PLACING_ANCHORS);
          
          // Emit status update to sync UI
          this.emitStatus('in-progress', 
            `Pinch to place ${this.data.anchorCount} anchors on the object`);
          
          console.log('Anchor Placement: Started in PLACING_ANCHORS state');
          return;
        } else {
          console.error('Anchor Placement: Object with ID', objectId, 'not found');
        }
      } else {
        console.error('Anchor Placement: Scene state system not found');
      }
    } else {
      console.error('Anchor Placement: No objectId provided');
    }
    
    // If we didn't find an object or none was specified, start with object selection
    console.log('Anchor Placement: Falling back to SELECTING_OBJECT state');
    this.setState(STATES.SELECTING_OBJECT);
  },
  
  autoPlaceAnchors: function() {
    console.log('Anchor Placement: Auto-placing anchors');
    
    // Clear existing anchors
    this.reset();
    
    if (!this.currentObject) {
      console.warn('Anchor Placement: No object selected for auto-placement');
      return;
    }
    
    // Find the object entity in the scene
    const objectEntity = document.getElementById(this.currentObject.id);
    if (!objectEntity) {
      console.error('Anchor Placement: Object entity not found in scene for auto-placement');
      return;
    }
    
    // Find the a-plane element (rectangle) within the object entity
    const objectPlane = objectEntity.querySelector('a-plane');
    if (!objectPlane) {
      console.error('Anchor Placement: Object plane not found in object entity for auto-placement');
      return;
    }
    
    // Get the object's dimensions
    const width = this.currentObject.width;
    const height = this.currentObject.height;
    
    // Get default anchor positions for the current anchor count (0-1 range)
    const defaultPositions = getDefaultAnchorPositions(this.data.anchorCount);
    
    // Create anchors at default positions
    defaultPositions.forEach((pos, index) => {
      // Convert from normalized coordinates (0-1) to object-local coordinates
      const localX = (pos.x - 0.5) * width;
      const localY = (pos.y - 0.5) * height;
      
      // Create an anchor entity using the uiElements utility
      const color = ANCHOR_COLORS[index % ANCHOR_COLORS.length];
      const anchorEntity = uiElements.createEntity({
        class: 'anchor-marker',
        position: `${localX} ${localY} 0.001`
      });
      
      // Add visual elements with circle, crosshair, and label
      const circle = document.createElement('a-circle');
      circle.setAttribute('radius', 0.01);
      circle.setAttribute('color', color);
      circle.setAttribute('material', 'shader: flat; opacity: 0.9');
      anchorEntity.appendChild(circle);
      
      // Add crosshair (horizontal line)
      const horizontalLine = document.createElement('a-entity');
      horizontalLine.setAttribute('line', {
        start: {x: -0.015, y: 0, z: 0.0005},
        end: {x: 0.015, y: 0, z: 0.0005},
        color: '#FFFFFF',
        opacity: 1.0
      });
      anchorEntity.appendChild(horizontalLine);
      
      // Add crosshair (vertical line)
      const verticalLine = document.createElement('a-entity');
      verticalLine.setAttribute('line', {
        start: {x: 0, y: -0.015, z: 0.0005},
        end: {x: 0, y: 0.015, z: 0.0005},
        color: '#FFFFFF',
        opacity: 1.0
      });
      anchorEntity.appendChild(verticalLine);
      
      // Add label with number
      const label = document.createElement('a-text');
      label.setAttribute('value', `${index + 1}`);
      label.setAttribute('align', 'center');
      label.setAttribute('position', '0 0.025 0');
      label.setAttribute('scale', '0.05 0.05 0.05');
      label.setAttribute('color', '#FFFFFF');
      label.setAttribute('look-at', '[camera]');
      anchorEntity.appendChild(label);
      
      // Add the anchor entity to the object plane
      objectPlane.appendChild(anchorEntity);
      
      // Store reference to the anchor entity
      this.anchorMarkers.push(anchorEntity);
      
      // Create anchor data with direct local position
      const anchorData = {
        id: `anchor_${Date.now()}_${index}`,
        objectId: this.currentObject.id,
        position: {
          x: localX,
          y: localY,
          z: 0.001
        }
      };
      
      // Add to anchors array
      this.anchors.push(anchorData);
    });
    
    // Update state
    this.setState(STATES.PREVIEW);
  },
  
  setAnchorCount: function(count) {
    if (count < 1 || count > 4) {
      console.warn('Anchor Placement: Invalid anchor count', count);
      return;
    }
    
    this.data.anchorCount = count;
    console.log('Anchor Placement: Anchor count updated to', count);
    
    // If we're auto-placing or have existing anchors, update them
    if (this.state === STATES.PREVIEW && this.anchors.length > 0) {
      // Reset and auto-place with new count
      this.autoPlaceAnchors();
    } else if (this.state === STATES.PLACING_ANCHORS) {
      // Update the status message
      this.emitStatus('in-progress', 
        `Pinch to place ${this.data.anchorCount} anchors on the object`);
    }
  },
  
  completeAnchorPlacement: function() {
    console.log('Anchor Placement: Completing anchor placement');
    
    // Only complete if we have at least one anchor
    if (this.anchors.length === 0) {
      console.warn('Anchor Placement: Cannot complete, no anchors placed');
      this.emitStatus('error', 'Please place at least one anchor');
      return;
    }
    
    // Only complete if anchors match expected count
    if (this.anchors.length !== this.data.anchorCount) {
      console.warn(`Anchor Placement: Expected ${this.data.anchorCount} anchors, but have ${this.anchors.length}`);
      this.emitStatus('error', `Need ${this.data.anchorCount} anchors, only have ${this.anchors.length}`);
      return;
    }
    
    this.finalizeAnchors();
  },
  
  finalizeAnchors: function() {
    if (!this.currentObject) {
      console.error('Anchor Placement: No object selected for finalizing anchors');
      return;
    }
    
    // Update the object in state with anchors
    const sceneState = this.el.sceneEl.systems['scene-state'];
    if (sceneState) {
      const objects = sceneState.getState('objects') || [];
      const objectIndex = objects.findIndex(obj => obj.id === this.currentObject.id);
      
      if (objectIndex >= 0) {
        // Update object with anchors
        objects[objectIndex].anchors = this.anchors;
        
        // Update state
        sceneState.updateState('objects', objects);
        
        // Emit anchors completed event
        emitEvent(this.el, EVENTS.ANCHOR.COMPLETED, {
          objectId: this.currentObject.id,
          anchors: this.anchors
        });
        
        // Emit status update
        this.emitStatus('completed', 'Anchors saved successfully', {
          objectId: this.currentObject.id,
          anchorCount: this.anchors.length
        });
        
        // Clean up and reset
        this.setState(STATES.IDLE);
      }
    }
  },
  
  // Handle pinch events for anchor placement
  onPinchStarted: function(event) {
    // Output detailed state information for debugging
    console.log('Anchor Placement: Pinch detected, component state:', {
      active: this.data.active,
      state: this.state,
      currentStateMatches: this.state === STATES.PLACING_ANCHORS,
      expectedState: STATES.PLACING_ANCHORS,
      objectId: this.data.objectId,
      hasCurrentObject: !!this.currentObject
    });
    
    // Only process pinch events when component is active and in placing anchors state
    if (!this.data.active || this.state !== STATES.PLACING_ANCHORS) {
      console.log('Anchor Placement: Ignoring pinch, not in correct state');
      return;
    }
    
    // Get the hand from the event
    const hand = event.detail.hand || 'right'; // Default to right if not specified
    const handId = hand === 'left' ? 'leftHand' : 'rightHand';
    const handEntity = document.getElementById(handId);
    
    if (!handEntity) {
      console.error('Anchor Placement: Hand entity not found:', handId);
      return;
    }

    // Get the reticle entity
    const reticleId = `anchor-reticle-${hand}`;
    const reticleEntity = document.getElementById(reticleId);
    
    console.log('Anchor Placement: Looking for reticle with ID:', reticleId);
    console.log('Anchor Placement: Reticle found:', reticleEntity ? 'yes' : 'no');
    
    if (!reticleEntity) {
      // If reticle not found, let's look at all entities in the scene for debugging
      const allEntities = document.querySelectorAll('a-entity');
      console.log('Anchor Placement: Total entities in scene:', allEntities.length);
      console.log('Anchor Placement: Entities with IDs:', 
        Array.from(allEntities)
          .filter(e => e.id)
          .map(e => e.id)
          .join(', '));
      
      console.error('Anchor Placement: Reticle entity not found:', reticleId);
      return;
    }
    
    // Get the reticle's exact world position
    const reticlePos = new THREE.Vector3();
    reticleEntity.object3D.getWorldPosition(reticlePos);
    
    console.log('Anchor Placement: Reticle world position:', 
      JSON.stringify({x: reticlePos.x, y: reticlePos.y, z: reticlePos.z}));
    
    // Validate object data
    if (!this.currentObject || !this.currentObject.points || this.currentObject.points.length < 3) {
      console.error('Anchor Placement: Invalid object data');
      return;
    }
    
    // Add anchor at reticle position - the addAnchor method will handle conversion to local coordinates
    this.addAnchor(reticlePos);
  },
  
  // Add an anchor and check if we need to transition state
  addAnchor: function(worldPosition) {
    // Ensure we have a current object
    if (!this.currentObject) {
      console.error('Anchor Placement: No current object for anchor placement');
      return;
    }
    
    // Find the object entity in the scene
    const objectEntity = document.getElementById(this.currentObject.id);
    if (!objectEntity) {
      console.error('Anchor Placement: Object entity not found in scene');
      return;
    }
    
    // Find the a-plane element (rectangle) within the object entity
    const objectPlane = objectEntity.querySelector('a-plane');
    if (!objectPlane) {
      console.error('Anchor Placement: Object plane not found in object entity');
      return;
    }
    
    // Create a simple raycaster to find the intersection with the object plane
    const raycaster = new THREE.Raycaster();
    
    // Get camera position for raycasting
    const camera = document.querySelector('[camera]').object3D;
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    
    // Direction from camera to click point
    const direction = new THREE.Vector3()
      .subVectors(worldPosition, cameraPosition)
      .normalize();
    
    // Set up raycaster
    raycaster.set(cameraPosition, direction);
    
    // Convert the object plane to a THREE.js mesh for intersection
    const planeMesh = objectPlane.object3D;
    
    // Get the world-to-local matrix from the object plane
    const worldToLocal = new THREE.Matrix4();
    planeMesh.updateMatrixWorld();
    worldToLocal.copy(planeMesh.matrixWorld).invert();
    
    // Convert world position to local position in object's coordinate system
    const localPosition = worldPosition.clone().applyMatrix4(worldToLocal);
    
    // Add a small offset to prevent z-fighting
    localPosition.z = 0.001;
    
    // Get the object dimensions for normalized coordinates
    const width = this.currentObject.width;
    const height = this.currentObject.height;
    
    // We just store the direct local position
    
    // Create anchor entity using uiElements utility
    const index = this.anchors.length;
    const color = ANCHOR_COLORS[index % ANCHOR_COLORS.length];
    
    // Use the utility function to create the entity
    const anchorEntity = uiElements.createEntity({
      class: 'anchor-marker',
      position: `${localPosition.x} ${localPosition.y} ${localPosition.z}`
    });
    
    // Add visual elements with circle, crosshair, and label
    const circle = document.createElement('a-circle');
    circle.setAttribute('radius', 0.01);
    circle.setAttribute('color', color);
    circle.setAttribute('material', 'shader: flat; opacity: 0.9');
    anchorEntity.appendChild(circle);
    
    // Add crosshair (horizontal line)
    const horizontalLine = document.createElement('a-entity');
    horizontalLine.setAttribute('line', {
      start: {x: -0.015, y: 0, z: 0.0005},
      end: {x: 0.015, y: 0, z: 0.0005},
      color: '#FFFFFF',
      opacity: 1.0
    });
    anchorEntity.appendChild(horizontalLine);
    
    // Add crosshair (vertical line)
    const verticalLine = document.createElement('a-entity');
    verticalLine.setAttribute('line', {
      start: {x: 0, y: -0.015, z: 0.0005},
      end: {x: 0, y: 0.015, z: 0.0005},
      color: '#FFFFFF',
      opacity: 1.0
    });
    anchorEntity.appendChild(verticalLine);
    
    // Add label with number
    const label = document.createElement('a-text');
    label.setAttribute('value', `${index + 1}`);
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 0.025 0');
    label.setAttribute('scale', '0.05 0.05 0.05');
    label.setAttribute('color', '#FFFFFF');
    label.setAttribute('look-at', '[camera]');
    anchorEntity.appendChild(label);
    
    // Add the anchor entity to the object plane
    objectPlane.appendChild(anchorEntity);
    
    // Store reference to anchor entity
    this.anchorMarkers.push(anchorEntity);
    
    // Create anchor data with direct local position
    const anchorData = {
      id: `anchor_${Date.now()}`,
      objectId: this.currentObject.id,
      position: {
        x: localPosition.x,
        y: localPosition.y,
        z: localPosition.z
      }
    };
    
    // Add to anchors array
    this.anchors.push(anchorData);
    
    // Create visual placement effect
    this.createPlacementEffect(worldPosition);
    
    // Check if we've placed all anchors
    if (this.anchors.length >= this.data.anchorCount) {
      this.setState(STATES.PREVIEW);
    } else {
      // Update status with remaining count
      const remaining = this.data.anchorCount - this.anchors.length;
      this.emitStatus('in-progress', 
        `Placed ${this.anchors.length} anchor${this.anchors.length > 1 ? 's' : ''}. ` + 
        `Place ${remaining} more anchor${remaining > 1 ? 's' : ''}.`);
    }
  },
  
  // Reset state and clean up
  reset: function() {
    // Clean up anchor markers - remove them from their parent
    this.anchorMarkers.forEach(marker => {
      if (marker && marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    });
    this.anchorMarkers = [];
    
    // Remove reticles if active
    this.toggleReticle(false);
    
    // Reset state
    this.anchors = [];
    
    console.log('Anchor Placement: Reset complete');
  },
  
  // Toggle reticle visibility - use hand-reticle component instead of manual creation
  toggleReticle: function(active) {
    this.reticleActive = active;
    console.log('Anchor Placement: Toggling reticle visibility to:', active);
    
    // Toggle reticles on both hands
    ['left', 'right'].forEach(hand => {
      const handId = hand === 'left' ? 'leftHand' : 'rightHand';
      const handElem = document.getElementById(handId);
      
      console.log(`Anchor Placement: ${hand} hand element:`, handElem ? 'found' : 'not found');
      
      if (!handElem) {
        console.error(`Anchor Placement: Hand element not found: ${handId}`);
        return;
      }
      
      if (active) {
        console.log(`Anchor Placement: Adding hand-reticle to ${hand} hand`);
        // Add reticle component to hand
        handElem.setAttribute('hand-reticle', {
          active: true,
          id: `anchor-reticle-${hand}`,
          hand: hand,
          color: hand === 'left' ? '#4285F4' : '#F4B400'
        });
        
        // Check if the reticle was created
        setTimeout(() => {
          const reticleId = `anchor-reticle-${hand}`;
          const reticleEntity = document.getElementById(reticleId);
          console.log(`Anchor Placement: ${hand} reticle after delay:`, reticleEntity ? 'found' : 'not found');
          
          // Store reference to right hand reticle
          if (hand === 'right') {
            this.reticleEntity = reticleEntity;
          }
        }, 100);
      } else {
        console.log(`Anchor Placement: Removing hand-reticle from ${hand} hand`);
        // Remove reticle component from hand
        handElem.removeAttribute('hand-reticle');
        
        // Remove any existing reticle elements
        const reticleId = `anchor-reticle-${hand}`;
        const existing = document.getElementById(reticleId);
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }
    });
  },
  
  // Update method for reticle color based on object intersection
  onUpdate: function() {
    // Only update when active and reticle is enabled
    if (!this.data.active || !this.reticleActive) {
      return;
    }
    
    // Limit check frequency for performance
    const now = Date.now();
    if (now - this.lastAimCheck < 50) { // 20fps check rate
      return;
    }
    this.lastAimCheck = now;
    
    // Skip if no object to interact with
    if (!this.currentObject || !this.currentObject.points || this.currentObject.points.length < 3) {
      return;
    }
    
    // Use imported geometry utilities for calculations
    const points = this.currentObject.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    
    // Update reticles for both hands
    ['left', 'right'].forEach(hand => {
      const handId = hand === 'left' ? 'leftHand' : 'rightHand';
      const reticleId = `anchor-reticle-${hand}`;
      const reticle = document.getElementById(reticleId);
      
      if (!reticle) return;
      
      // Get reticle position
      const reticleWorldPos = reticle.object3D.getWorldPosition(new THREE.Vector3());
      
      // Check intersection using imported geometry function rather than local implementation
      const isValid = geometry.pointInRectangle(reticleWorldPos, points);
      
      // Update reticle color - just get the ring element (simplifies code)
      const ring = reticle.querySelector('a-ring');
      if (ring) {
        ring.setAttribute('color', isValid ? '#00FF00' : 
          (hand === 'left' ? '#4285F4' : '#F4B400'));
      }
    });
  },
  // We've removed the pointIsInRectangle method as we're now using
  // the geometry.pointInRectangle utility function from the imported utils
  
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
      } else if (this.state === STATES.IDLE) {
        // Start when activated
        this.startAnchorPlacement(this.data.objectId);
      }
      
      // Update visibility based on active state
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.visible !== this.data.visible) {
      // Update visibility
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.anchorCount !== this.data.anchorCount) {
      // Update anchor count
      console.log('Anchor Placement: Anchor count updated to', this.data.anchorCount);
    }
    
    if (oldData.objectId !== this.data.objectId && this.data.objectId) {
      // Update current object if active
      if (this.data.active) {
        this.startAnchorPlacement(this.data.objectId);
      }
    }
  },
  
  remove: function() {
    // Clean up all event listeners
    this.el.sceneEl.removeEventListener(EVENTS.INTERACTION.PINCH_STARTED, this.onPinchStarted);
    this.el.sceneEl.removeEventListener(EVENTS.ANCHOR.ACTION, this.onAnchorActionReceived);
    this.el.sceneEl.removeEventListener('renderstart', this.onUpdate);
    
    // Remove reticles from both hands
    ['left', 'right'].forEach(hand => {
      const reticle = document.getElementById(`anchor-reticle-${hand}`);
      if (reticle && reticle.parentNode) {
        reticle.parentNode.removeChild(reticle);
      }
    });
    
    // Clear any intervals
    if (this.reticleCheckInterval) {
      clearInterval(this.reticleCheckInterval);
      this.reticleCheckInterval = null;
    }
    
    // Clean up visual elements
    this.reset();
  },
  
  // Create a visual effect when an anchor is placed - simplified
  createPlacementEffect: function(position) {
    // Use the uiElements utility to create the effect
    const effect = uiElements.createPlacementEffect(position, {
      color: '#00FF00',
      duration: 700,
      scale: 2,
      parent: this.el.sceneEl
    });
    
    // No need for timeout as the utility handles cleanup
  }
});

// Register the component
console.log('Anchor Placement component registered');
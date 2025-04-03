/**
 * Anchor Placement Component
 * 
 * Creates and manages the process of placing anchor points on defined objects.
 * Uses a balanced approach with utilities for reusable functions.
 */

// Import only the utilities we actually need
import { createMarker, removeMarkers } from '../../utils/ui-elements.js';
import { toVector3 } from '../../utils/geometry.js';

AFRAME.registerComponent('anchor-placement', {
  schema: {
    active: { type: 'boolean', default: false },
    objectId: { type: 'string', default: '' },
    anchorCount: { type: 'number', default: 2 },
    visible: { type: 'boolean', default: true }
  },
  
  init: function() {
    console.log('Anchor Placement: Initializing');
    
    // Internal state - simplified with just the essential properties
    this.step = 0; // 0: idle, 1: selecting object, 2: placing anchors, 3: preview
    this.currentObject = null;
    this.anchors = [];
    this.anchorMarkers = [];
    this.lastPinchTime = 0;
    
    // Anchor colors - direct definition for simplicity
    this.anchorColors = ['#F4B400', '#DB4437', '#4285F4', '#0F9D58'];
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Bind event handlers
    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.onAnchorAction = this.onAnchorAction.bind(this);
    
    // Set up event listeners with direct event names
    this.el.sceneEl.addEventListener('pinchstarted', this.onPinchStarted);
    this.el.sceneEl.addEventListener('anchor-action', this.onAnchorAction);
    
    // Initialize component visibility
    this.el.setAttribute('visible', this.data.visible && this.data.active);
    
    console.log('Anchor Placement: Initialized');
  },
  
  // Primary event handler for anchor actions
  onAnchorAction: function(event) {
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
        this.step = 2; // Go back to placing anchors state
        this.emitStatus('reset', 'Anchors reset. Place new anchors now.');
        break;
        
      case 'complete-anchor-placement':
        this.completeAnchorPlacement();
        break;
        
      case 'cancel-anchor-placement':
        this.reset();
        this.step = 0; // Go back to idle
        this.emitStatus('cancelled', 'Anchor placement cancelled');
        break;
    }
  },
  
  /**
   * Start anchor placement on the specified object
   * @param {String} objectId - ID of the object to place anchors on
   */
  startAnchorPlacement: function(objectId) {
    console.log('Anchor Placement: Starting new anchor placement for objectId:', objectId);
    
    // Reset current state first
    this.reset();
    
    // If objectId is provided, use it
    if (objectId) {
      if (this.sceneState) {
        const objects = this.sceneState.getState('objects') || [];
        this.currentObject = objects.find(obj => obj.id === objectId);
        
        if (this.currentObject) {
          this.data.objectId = objectId;
          this.data.active = true;
          this.step = 2; // Placing anchors state
          this.emitStatus('in-progress', `Pinch to place ${this.data.anchorCount} anchors on the object`);
          this.toggleHandReticles(true);
          return;
        }
      }
    }
    
    // If no object specified or not found, start with object selection
    this.step = 1; // Selecting object state
    this.emitStatus('started', 'Select an object to place anchors on');
    this.toggleHandReticles(true);
  },
  
  /**
   * Auto-place anchors on the current object using default positions
   */
  autoPlaceAnchors: function() {
    console.log('Anchor Placement: Auto-placing anchors');
    
    // Clear existing anchors first
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
    
    // Find the plane within the object entity
    const objectPlane = objectEntity.querySelector('a-plane');
    if (!objectPlane) {
      console.error('Anchor Placement: Object plane not found in object entity for auto-placement');
      return;
    }
    
    // Get default anchor positions for the current anchor count (0-1 range)
    const defaultPositions = this.getDefaultAnchorPositions(this.data.anchorCount);
    const width = this.currentObject.width;
    const height = this.currentObject.height;
    
    // Create anchors at default positions
    defaultPositions.forEach((pos, index) => {
      // Convert from normalized coordinates (0-1) to object-local coordinates
      const localX = (pos.x - 0.5) * width;
      const localY = (pos.y - 0.5) * height;
      
      // Create anchor marker using utility function
      const color = this.anchorColors[index % this.anchorColors.length];
      const anchorEntity = createMarker(
        {x: localX, y: localY, z: 0.001}, 
        index + 1, 
        color,
        null // Don't add to scene directly
      );
      
      // Add the anchor entity to the object plane
      objectPlane.appendChild(anchorEntity);
      
      // Store reference to anchor entity
      this.anchorMarkers.push(anchorEntity);
      
      // Store anchor data
      this.anchors.push({
        id: `anchor_${Date.now()}_${index}`,
        objectId: this.currentObject.id,
        position: {
          x: localX,
          y: localY,
          z: 0.001
        }
      });
    });
    
    // Update state
    this.step = 3; // Preview state
    this.emitStatus('preview', 
      `All ${this.anchors.length} anchors placed. Click "Complete" to save or "Reset" to start over.`);
  },
  
  /**
   * Get default positions for anchors based on count
   * @param {Number} count - Number of anchors (1-4)
   * @returns {Array} Array of {x,y} positions (normalized 0-1)
   */
  getDefaultAnchorPositions: function(count) {
    // Default positions for 1-4 anchors
    switch(count) {
      case 1:
        // Center
        return [{ x: 0.5, y: 0.5 }];
      case 2:
        // Top center and bottom center
        return [
          { x: 0.5, y: 0.25 },
          { x: 0.5, y: 0.75 }
        ];
      case 3:
        // Triangle pattern
        return [
          { x: 0.5, y: 0.2 },
          { x: 0.2, y: 0.8 },
          { x: 0.8, y: 0.8 }
        ];
      case 4:
        // Near the corners
        return [
          { x: 0.2, y: 0.2 },
          { x: 0.8, y: 0.2 },
          { x: 0.8, y: 0.8 },
          { x: 0.2, y: 0.8 }
        ];
      default:
        return [{ x: 0.5, y: 0.5 }];
    }
  },
  
  /**
   * Set the number of anchors to place
   * @param {Number} count - Number of anchors (1-4)
   */
  setAnchorCount: function(count) {
    if (count < 1 || count > 4) {
      console.warn('Anchor Placement: Invalid anchor count', count);
      return;
    }
    
    this.data.anchorCount = count;
    console.log('Anchor Placement: Anchor count updated to', count);
    
    // If we're auto-placing or have existing anchors, update them
    if (this.step === 3 && this.anchors.length > 0) {
      this.autoPlaceAnchors();
    } else if (this.step === 2) {
      this.emitStatus('in-progress', 
        `Pinch to place ${this.data.anchorCount} anchors on the object`);
    }
  },
  
  /**
   * Complete anchor placement and save to object
   */
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
    
    if (!this.currentObject) {
      console.error('Anchor Placement: No object selected for finalizing anchors');
      return;
    }
    
    // Update the object in state with anchors
    if (this.sceneState) {
      const objects = this.sceneState.getState('objects') || [];
      const objectIndex = objects.findIndex(obj => obj.id === this.currentObject.id);
      
      if (objectIndex >= 0) {
        // Update object with anchors
        objects[objectIndex].anchors = this.anchors;
        
        // Update state
        this.sceneState.updateState('objects', objects);
        
        // Emit anchors completed event
        this.el.sceneEl.emit('anchor-completed', {
          objectId: this.currentObject.id,
          anchors: this.anchors
        });
        
        // Emit status update
        this.emitStatus('completed', 'Anchors saved successfully', {
          objectId: this.currentObject.id,
          anchorCount: this.anchors.length
        });
        
        // Reset state
        this.reset();
        this.step = 0; // Back to idle
        this.toggleHandReticles(false);
      }
    }
  },
  
  /**
   * Handle pinch event for anchor placement
   * @param {Event} event - Pinch event from A-Frame
   */
  onPinchStarted: function(event) {
    // Skip if component is not active or not in placing anchors state
    if (!this.data.active || this.step !== 2) {
      return;
    }
    
    // Throttle pinch events to prevent multiple rapid placements
    const now = Date.now();
    if (now - this.lastPinchTime < 500) { // 500ms throttle
      return;
    }
    this.lastPinchTime = now;
    
    // Get the hand from the event
    const hand = event.detail.hand || 'right';
    const handId = hand === 'left' ? 'leftHand' : 'rightHand';
    const handEntity = document.getElementById(handId);
    
    if (!handEntity) {
      console.error('Anchor Placement: Hand entity not found:', handId);
      return;
    }

    // Get the reticle entity
    const reticleId = `anchor-reticle-${hand}`;
    const reticleEntity = document.getElementById(reticleId);
    
    if (!reticleEntity) {
      console.error('Anchor Placement: Reticle entity not found:', reticleId);
      return;
    }
    
    // Get the reticle's world position
    const reticlePos = new THREE.Vector3();
    reticleEntity.object3D.getWorldPosition(reticlePos);
    
    // Make sure we have a valid object
    if (!this.currentObject) {
      console.error('Anchor Placement: Invalid object data');
      return;
    }
    
    // Add anchor at reticle position
    this.addAnchor(reticlePos);
  },
  
  /**
   * Add an anchor at the given position
   * @param {THREE.Vector3} worldPosition - World position for the anchor
   */
  addAnchor: function(worldPosition) {
    // Ensure we have a current object
    if (!this.currentObject) {
      console.error('Anchor Placement: No current object for anchor placement');
      return;
    }
    
    // Find the object entity and its plane
    const objectEntity = document.getElementById(this.currentObject.id);
    if (!objectEntity) {
      console.error('Anchor Placement: Object entity not found in scene');
      return;
    }
    
    const objectPlane = objectEntity.querySelector('a-plane');
    if (!objectPlane) {
      console.error('Anchor Placement: Object plane not found in object entity');
      return;
    }
    
    // Convert world position to object-local position
    const worldToLocal = new THREE.Matrix4();
    objectPlane.object3D.updateMatrixWorld();
    worldToLocal.copy(objectPlane.object3D.matrixWorld).invert();
    
    // Apply world-to-local transform
    const localPosition = worldPosition.clone().applyMatrix4(worldToLocal);
    localPosition.z = 0.001; // Small offset to prevent z-fighting
    
    // Create anchor marker using utility function
    const index = this.anchors.length;
    const color = this.anchorColors[index % this.anchorColors.length];
    const anchorEntity = createMarker(
      {x: localPosition.x, y: localPosition.y, z: localPosition.z},
      index + 1,
      color,
      null // Don't add to scene directly
    );
    
    // Add to object plane
    objectPlane.appendChild(anchorEntity);
    this.anchorMarkers.push(anchorEntity);
    
    // Store anchor data
    this.anchors.push({
      id: `anchor_${Date.now()}`,
      objectId: this.currentObject.id,
      position: {
        x: localPosition.x,
        y: localPosition.y,
        z: localPosition.z
      }
    });
    
    // Create visual feedback
    this.createPlacementEffect(worldPosition);
    
    // Check if we've placed all anchors
    if (this.anchors.length >= this.data.anchorCount) {
      this.step = 3; // Preview state
      this.emitStatus('preview', 
        `All ${this.anchors.length} anchors placed. Click "Complete" to save or "Reset" to start over.`);
    } else {
      // Update status with remaining count
      const remaining = this.data.anchorCount - this.anchors.length;
      this.emitStatus('in-progress', 
        `Placed ${this.anchors.length} anchor${this.anchors.length > 1 ? 's' : ''}. ` + 
        `Place ${remaining} more anchor${remaining > 1 ? 's' : ''}.`);
    }
  },
  
  /**
   * Create a visual effect at the placement point
   * Custom implementation because it's a specialized, one-off effect
   * @param {THREE.Vector3} position - World position for the effect
   */
  createPlacementEffect: function(position) {
    // Create effect entity
    const effect = document.createElement('a-entity');
    effect.setAttribute('position', position);
    
    // Add a pulsing ring
    const ring = document.createElement('a-ring');
    ring.setAttribute('radius-inner', 0.01);
    ring.setAttribute('radius-outer', 0.015);
    ring.setAttribute('color', '#00FF00');
    ring.setAttribute('opacity', 0.8);
    ring.setAttribute('animation', {
      property: 'scale',
      from: '0.5 0.5 0.5',
      to: '2 2 2',
      dur: 700,
      easing: 'easeOutQuad'
    });
    ring.setAttribute('animation__opacity', {
      property: 'opacity',
      from: 0.8,
      to: 0,
      dur: 700,
      easing: 'easeOutQuad'
    });
    
    effect.appendChild(ring);
    this.el.sceneEl.appendChild(effect);
    
    // Remove effect after animation completes
    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 700);
  },
  
  /**
   * Reset state and clean up
   */
  reset: function() {
    // Use utility to remove markers
    removeMarkers(this.anchorMarkers);
    
    // Clear arrays
    this.anchorMarkers = [];
    this.anchors = [];
  },
  
  /**
   * Toggle reticle visibility on hands
   * @param {Boolean} active - Whether to show reticles
   */
  toggleHandReticles: function(active) {
    // Toggle reticles on both hands
    ['left', 'right'].forEach(hand => {
      const handId = hand === 'left' ? 'leftHand' : 'rightHand';
      const handElem = document.getElementById(handId);
      
      if (!handElem) return;
      
      if (active) {
        // Add reticle component to hand
        handElem.setAttribute('hand-reticle', {
          active: true,
          id: `anchor-reticle-${hand}`,
          hand: hand,
          color: hand === 'left' ? '#4285F4' : '#F4B400'
        });
      } else {
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
  
  /**
   * Emit status update event
   * @param {String} status - Status code
   * @param {String} message - Status message
   * @param {Object} additionalData - Extra data to include
   */
  emitStatus: function(status, message, additionalData = {}) {
    this.el.sceneEl.emit('anchor-status', {
      status: status,
      message: message,
      anchorCount: this.data.anchorCount,
      ...additionalData
    });
  },
  
  /**
   * Set component visibility
   * @param {Boolean} visible - Whether component is visible
   */
  setVisibility: function(visible) {
    this.el.setAttribute('visible', visible);
  },
  
  /**
   * Update component based on property changes
   */
  update: function(oldData) {
    // Handle changes to component properties
    if (oldData.active !== this.data.active) {
      // Reset when deactivated
      if (!this.data.active) {
        this.reset();
        this.step = 0;
        this.toggleHandReticles(false);
      }
      
      // Update visibility based on active state
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.visible !== this.data.visible) {
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.objectId !== this.data.objectId && this.data.objectId) {
      // Update current object if active
      if (this.data.active) {
        this.startAnchorPlacement(this.data.objectId);
      }
    }
  },
  
  /**
   * Component cleanup
   */
  remove: function() {
    // Clean up event listeners
    this.el.sceneEl.removeEventListener('pinchstarted', this.onPinchStarted);
    this.el.sceneEl.removeEventListener('anchor-action', this.onAnchorAction);
    
    // Remove reticles from both hands
    this.toggleHandReticles(false);
    
    // Clean up visual elements
    this.reset();
  }
});

// Register the component
console.log('Anchor Placement component registered');
/**
 * Anchor Placement Component (Laser Controls Implementation)
 * 
 * Uses laser-controls for anchor placement on objects.
 * Designed to work with the existing anchor-placement-menu UI.
 */

// Import only the utilities we need
import { createMarker, removeMarkers } from '../../utils/ui-elements.js';

AFRAME.registerComponent('anchor-placement', {
  schema: {
    active: { type: 'boolean', default: false },
    objectId: { type: 'string', default: '' },
    anchorCount: { type: 'number', default: 2 },
    visible: { type: 'boolean', default: true }
  },
  
  init: function() {
    console.log('Anchor Placement: Initializing laser-based implementation');
    
    // Internal state
    this.step = 0; // 0: idle, 1: ready, 2: placing anchors, 3: preview
    this.currentObject = null;
    this.anchors = [];
    this.anchorMarkers = [];
    
    // Anchor colors
    this.anchorColors = ['#F4B400', '#DB4437', '#4285F4', '#0F9D58'];
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Bind event handlers
    this.onAnchorAction = this.onAnchorAction.bind(this);
    this.onControllerConnected = this.onControllerConnected.bind(this);
    this.onLaserHit = this.onLaserHit.bind(this);
    this.onRaycasterIntersection = this.onRaycasterIntersection.bind(this);
    
    // Set up event listeners for menu actions
    this.el.sceneEl.addEventListener('anchor-action', this.onAnchorAction);
    
    // Initialize component visibility
    this.el.setAttribute('visible', this.data.visible && this.data.active);
    
    console.log('Anchor Placement: Initialized with laser-based implementation');
  },
  
  // Primary event handler for anchor actions from the menu
  onAnchorAction: function(event) {
    const action = event.detail.action;
    const objectId = event.detail.objectId;
    
    console.log('Anchor Placement: Action received -', action, 'for objectId:', objectId);
    
    switch(action) {
      case 'start-anchor-placement':
        this.startAnchorPlacement(objectId);
        break;
        
      case 'set-anchor-count':
        // When setting anchor count, we need to maintain the current object ID
        // even if it wasn't included in the event
        this.setAnchorCount(event.detail.count);
        break;
        
      case 'auto-place-anchors':
        this.autoPlaceAnchors(objectId);
        break;
        
      case 'reset-anchors':
        this.reset();
        // Pass the objectId through to maintain it for subsequent actions
        this.emitStatus('reset', 'Anchors reset. Use laser to place new anchors.', 
                       { objectId: objectId || this.currentObject });
        break;
        
      case 'complete-anchor-placement':
        this.completeAnchorPlacement(objectId);
        break;
        
      case 'cancel-anchor-placement':
        // Reset the working state
        this.reset();
        this.step = 0;
        
        // Important: For cancellation, we don't save any changes
        // The original object's anchors will remain unchanged
        console.log('Anchor Placement: Cancelled - original anchors preserved');
        
        this.emitStatus('cancelled', 'Anchor placement cancelled - original anchors preserved', 
                      { objectId: objectId || this.currentObject });
        break;
    }
  },
  
  /**
   * Start anchor placement on the specified object
   * @param {String} objectId - ID of the object to place anchors on
   */
  startAnchorPlacement: function(objectId) {
    console.log('Anchor Placement: Starting new laser-based anchor placement for objectId:', objectId);
    
    // Reset current state
    this.reset();
    
    // Store object ID
    this.data.objectId = objectId;
    this.currentObject = objectId;
    
    // Make sure the target object is visible
    this.ensureObjectVisible(objectId);
    
    // Setup the laser controls if not already present
    this.setupLaserControls();
    
    // Set step to placing anchors
    this.step = 2;
    this.emitStatus('in-progress', 
      `Use laser to place ${this.data.anchorCount} anchors. Press trigger to place.`);
  },
  
  /**
   * Make sure the object is visible for anchoring
   */
  ensureObjectVisible: function(objectId) {
    if (!objectId) return;
    
    // For regular objects
    const objectElem = document.getElementById(objectId);
    if (objectElem) {
      objectElem.setAttribute('visible', true);
      console.log('Made object visible:', objectId);
    }
    
    // For temporary objects in definition
    if (objectId.startsWith('temp_object_')) {
      const visualObj = document.getElementById('object-visualization');
      if (visualObj) {
        visualObj.setAttribute('visible', true);
        console.log('Made visual object visible for temp object');
      }
    }
  },
  
  /**
   * Set up laser controls for both hands
   */
  setupLaserControls: function() {
    // We'll create laser pointers for both hands
    ['left', 'right'].forEach(hand => {
      const handId = `${hand}Hand`;
      const handEntity = document.getElementById(handId);
      
      if (!handEntity) {
        console.warn(`Anchor Placement: ${hand} hand entity not found`);
        return;
      }
      
      // Create separate raycaster entities parented to the hands
      // This works better with hand-tracking-controls
      const rayId = `anchor-laser-${hand}`;
      
      // Remove existing ray if present
      const existingRay = document.getElementById(rayId);
      if (existingRay) {
        existingRay.parentNode.removeChild(existingRay);
      }
      
      // Create new ray entity
      const rayEntity = document.createElement('a-entity');
      rayEntity.id = rayId;
      rayEntity.setAttribute('position', '0 0 0');
      
      // Only target the specific object we're placing anchors on by using an ID-specific selector
      const targetObjectId = this.data.objectId;
      let raycasterObjects = '';
      
      if (targetObjectId) {
        // Only target the specific object and its plane by ID
        raycasterObjects = `#${targetObjectId}, #plane-${targetObjectId}`;
      } else {
        // Fallback to class-based selector if for some reason we don't have an object ID
        raycasterObjects = '.anchoring-enabled[data-id]';
      }
      
      // Set up raycaster component targeting only our specific object
      // Make raycaster point downward instead of forward
      rayEntity.setAttribute('raycaster', {
        objects: raycasterObjects,
        direction: '0 -1 0', // Point downward (-Y direction)
        far: 10,
        lineColor: hand === 'left' ? '#4285F4' : '#F4B400',
        lineOpacity: 0.7,
        showLine: true
      });
      
      // Add to hand entity
      handEntity.appendChild(rayEntity);
      console.log(`Added raycaster to ${hand} hand targeting: ${raycasterObjects}`);
      
      // Add raycaster intersection event listeners (proper way to handle intersections)
      rayEntity.addEventListener('raycaster-intersection', this.onRaycasterIntersection);
      
      // Add event listener for pinch gestures (works with hand tracking)
      handEntity.addEventListener('pinchstarted', this.onLaserHit);
      handEntity.addEventListener('triggerdown', this.onLaserHit); // Also keep trigger for controller support
    });
    
    // Add class to objects for raycaster targeting
    this.enableObjectForAnchoring(this.data.objectId);
    
    console.log('Laser controls setup complete - using raycasters with ID-specific targeting');
  },
  
  /**
   * Add the anchoring-enabled class to the target object
   */
  enableObjectForAnchoring: function(objectId) {
    if (!objectId) return;
    
    // For regular objects
    const objectElem = document.getElementById(objectId);
    if (objectElem) {
      objectElem.classList.add('anchoring-enabled');
      objectElem.setAttribute('data-collideable', 'true');
      console.log('Enabled object for anchoring:', objectId);
      
      // Also make sure the plane within the object is enabled
      const objectPlane = objectElem.querySelector('a-plane');
      if (objectPlane) {
        objectPlane.classList.add('anchoring-enabled');
        objectPlane.setAttribute('data-collideable', 'true');
        console.log('Enabled plane for anchoring in object:', objectId);
      }
    }
    
    // All objects should now be properly saved (no more temp objects)
  },
  
  /**
   * Handle controller connection event
   */
  onControllerConnected: function(event) {
    console.log('Controller connected for anchor placement:', event.detail);
  },
  
  /**
   * Handle raycaster intersection events - this is the correct way to detect intersections
   */
  onRaycasterIntersection: function(event) {
    // Store the latest intersections for use during trigger/pinch events
    const intersections = event.detail.intersections;

    if (intersections.length > 0) {
      const element = intersections[0].object?.el;
      const elementId = element?.id || 'unnamed-element';
      const dataId = element?.getAttribute('data-id') || 'no-data-id';

      console.log(`${intersections.length} intersections detected. First with:`,
        `${element?.tagName}#${elementId} (data-id: ${dataId})`);

      // Only log detailed debug info for the first intersection
      const intersection = intersections[0];
      if (intersection.object && intersection.object.el) {
        const element = intersection.object.el;
        console.log(`Intersection point:`, intersection.point);
        console.log(`Element data:`, {
          id: element.id || 'none',
          'data-id': element.getAttribute('data-id') || 'none',
          classes: element.className
        });
      }
    }
  },

  /**
   * Handle laser hit (trigger down or pinch) event
   */
  onLaserHit: function(event) {
    // Only process if we're in the active placing anchors state
    if (!this.data.active || this.step !== 2) {
      return;
    }
    
    // Get event type and log
    const eventType = event.type;
    console.log(`Anchor Placement: ${eventType} detected`);
    
    // Get the target hand/controller
    const hand = event.target;
    const handId = hand.id;
    
    // Find the raycaster entity we created
    const rayId = handId === 'leftHand' ? 'anchor-laser-left' : 'anchor-laser-right';
    const rayEntity = document.getElementById(rayId);
    
    if (!rayEntity) {
      console.error(`Raycaster entity ${rayId} not found`);
      return;
    }
    
    // Get the raycaster component from our ray entity
    const raycaster = rayEntity.components.raycaster;
    if (!raycaster) {
      console.error('No raycaster component found on ray entity');
      return;
    }
    
    // The proper way to get intersections in A-Frame
    const intersections = raycaster.intersections;
    if (!intersections || intersections.length === 0) {
      console.log('No intersections found when trigger pressed');
      return;
    }
    
    // Get the first intersection
    const intersection = intersections[0];
    const intersectedEl = intersection.object.el;
    
    if (!intersectedEl) {
      console.log('No element in intersection');
      return;
    }
    
    console.log('Trigger/Pinch on intersection with:', 
      intersectedEl.id || intersectedEl.tagName, 
      'Classes:', intersectedEl.className);
    
    // Get the point of intersection in world coordinates
    const point = intersection.point;
    console.log('Intersection point for anchor placement:', point);
    
    // Log if this is a plane or has plane attributes
    if (intersectedEl.tagName === 'A-PLANE') {
      console.log('Intersection with plane! Width:', 
        intersectedEl.getAttribute('width'),
        'Height:', intersectedEl.getAttribute('height'));
    }
    
    // Add an anchor at this position
    this.addAnchor(point, intersectedEl);
    
    // Create visual feedback at the intersection point
    this.createLaserFeedback(true, point);
  },
  
  /**
   * Create visual feedback for laser interaction
   * @param {Boolean} success - Whether the interaction was successful
   * @param {THREE.Vector3} position - Position for the feedback
   */
  createLaserFeedback: function(success, position) {
    // Only create feedback if we have a valid position
    if (!position) {
      console.log('No position provided for laser feedback, skipping visual feedback');
      return;
    }
    
    console.log('Creating laser feedback at point:', position);
    
    // Create flash entity at the intersection point
    const flash = document.createElement('a-entity');
    flash.setAttribute('position', position);
    
    // Create circle facing the camera
    const circle = document.createElement('a-circle');
    circle.setAttribute('radius', 0.02);
    circle.setAttribute('color', success ? '#00FF00' : '#FF0000');
    circle.setAttribute('opacity', 0.7);
    circle.setAttribute('look-at', '[camera]');
    circle.setAttribute('animation', {
      property: 'scale',
      from: '0.5 0.5 0.5',
      to: '2 2 2',
      dur: 300,
      easing: 'easeOutQuad'
    });
    circle.setAttribute('animation__opacity', {
      property: 'opacity',
      from: 0.7,
      to: 0,
      dur: 300,
      easing: 'easeOutQuad'
    });
    
    flash.appendChild(circle);
    this.el.sceneEl.appendChild(flash);
    
    // Remove after animation
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 300);
  },
  
   * @param {String} objectId - ID of the object to place anchors on
   */
  autoPlaceAnchors: function(objectId) {
    console.log('Anchor Placement: Auto-placing anchors for object:', objectId || this.data.objectId);
    
    // Clear existing anchors first
    this.reset();
    
    const targetObjectId = objectId || this.data.objectId;
    if (!targetObjectId) {
      console.warn('Anchor Placement: No object ID for auto-placement');
      return;
    }
    
    // Target object ID and plane-ID (for the plane inside the object)
    const objectEntityId = targetObjectId;
    const planeSelectorId = `plane-${targetObjectId}`;
    
    console.log('Anchor Placement: Looking for elements by ID:', objectEntityId, 'or', planeSelectorId);
    
    // First try to find the object's plane directly - this is the preferred target
    let targetEl = document.getElementById(planeSelectorId);
    
    // If plane not found, try the main object
    if (!targetEl) {
      targetEl = document.getElementById(objectEntityId);
    }
    
    if (!targetEl) {
      console.error('Anchor Placement: Target element not found for auto-placement');
      return;
    }
    
    console.log('Auto-placement target found:', targetEl.id);
    
    // For object-visualization, we need the plane that's a direct child
    let plane = targetEl.querySelector('a-plane');
    
    if (!plane) {
      console.error('Anchor Placement: No plane found in target for auto-placement');
      console.log('Using target element itself as anchor parent');
      plane = targetEl;  // Fallback to using the target element itself
    }
    
    // Get plane dimensions
    const width = plane.getAttribute('width') || 1;
    const height = plane.getAttribute('height') || 1;
    
    console.log(`Auto-placing anchors using width=${width}, height=${height}`);
    
    // Get default anchor positions (normalized 0-1)
    const positions = this.getDefaultAnchorPositions(this.data.anchorCount);
    
    // Create anchors at these positions
    positions.forEach((pos, index) => {
      // Convert normalized coordinates to local plane coordinates
      const localX = (pos.x - 0.5) * width;
      const localY = (pos.y - 0.5) * height;
      
      // Create a local position
      const localPos = new THREE.Vector3(localX, localY, 0.001);
      
      console.log(`Adding anchor ${index+1} at local position:`, localPos);
      
      // Add anchor with the plane as parent
      this.addAnchor(localPos, plane, true);
    });
    
    // Set to preview state
    this.step = 3;
    this.emitStatus('preview', 
      `${this.anchors.length} anchors auto-placed. Click "Complete" to save or "Reset" to start over.`);
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
    console.log('Anchor Placement: Anchor count updated to', count, 'for objectId:', this.data.objectId || this.currentObject);
    
    // Make sure we preserve the object ID (might be undefined from menu events)
    const objectId = this.data.objectId || this.currentObject;
    
    // If we're in preview mode with anchors, update them
    if (this.step === 3 && this.anchors.length > 0) {
      this.autoPlaceAnchors(objectId);
    } else {
      // Otherwise just update the status message
      this.emitStatus('in-progress', 
        `Use laser to place ${this.data.anchorCount} anchors. Press trigger to place.`, 
        { objectId: objectId });
    }
  },
  
  /**
   * Add an anchor at the given position
   * @param {THREE.Vector3} position - Position for the anchor
   * @param {Element} targetEl - Element to attach the anchor to
   * @param {Boolean} isLocalPos - Whether position is already in local coordinates
   */
  addAnchor: function(position, targetEl, isLocalPos = false) {
    if (!targetEl) {
      console.error('Anchor Placement: No target element to add anchor to');
      return;
    }
    
    console.log('Anchor Placement: Adding anchor at position', position);
    
    // Position is in world coordinates by default, need to convert to target local space
    let localPosition;
    
    if (isLocalPos) {
      // Already in local coordinates
      localPosition = position;
    } else {
      // Convert from world to local coordinates
      localPosition = new THREE.Vector3();
      
      // Get world matrix of target
      const worldToLocal = new THREE.Matrix4();
      targetEl.object3D.updateMatrixWorld();
      worldToLocal.copy(targetEl.object3D.matrixWorld).invert();
      
      // Apply transform
      localPosition.copy(position).applyMatrix4(worldToLocal);
      
      // Add small z offset to prevent z-fighting
      localPosition.z = 0.001;
    }
    
    // Create anchor marker
    const index = this.anchors.length;
    const color = this.anchorColors[index % this.anchorColors.length];
    
    const anchorEntity = createMarker(
      localPosition,
      index + 1,
      color,
      null // Don't add to scene directly
    );
    
    // Add to target element
    targetEl.appendChild(anchorEntity);
    this.anchorMarkers.push(anchorEntity);
    
    // Store anchor data
    this.anchors.push({
      id: `anchor_${Date.now()}_${index}`,
      objectId: this.data.objectId,
      position: {
        x: localPosition.x,
        y: localPosition.y,
        z: localPosition.z
      }
    });
    
    // Create the placement effect
    this.createPlacementEffect(position);
    
    // Check if we've placed all anchors
    if (this.anchors.length >= this.data.anchorCount) {
      this.step = 3; // Preview state
      this.emitStatus('preview', 
        `All ${this.anchors.length} anchors placed. Click "Complete" to save or "Reset" to start over.`,
        { anchorCount: this.anchors.length });
    } else {
      // Update status with remaining count
      const remaining = this.data.anchorCount - this.anchors.length;
      this.emitStatus('in-progress', 
        `Placed ${this.anchors.length} anchor${this.anchors.length > 1 ? 's' : ''}. ` + 
        `Place ${remaining} more anchor${remaining > 1 ? 's' : ''}.`,
        { anchorCount: this.anchors.length });
    }
  },
  
  /**
   * Create a visual effect at the placement point
   * @param {THREE.Vector3} position - Position for the effect
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
   * Complete anchor placement and save to object
   * @param {String} objectId - ID of the object to save anchors for
   */
  completeAnchorPlacement: function(objectId) {
    console.log('Anchor Placement: Completing anchor placement for:', objectId || this.data.objectId);
    
    const targetObjectId = objectId || this.data.objectId;
    
    // Only complete if we have at least one anchor
    if (this.anchors.length === 0) {
      console.warn('Anchor Placement: Cannot complete, no anchors placed');
      this.emitStatus('error', 'Please place at least one anchor');
      return;
    }
    
    // Check if anchors match expected count
    if (this.anchors.length !== this.data.anchorCount) {
      console.warn(`Anchor Placement: Expected ${this.data.anchorCount} anchors, but have ${this.anchors.length}`);
      this.emitStatus('error', `Need ${this.data.anchorCount} anchors, only have ${this.anchors.length}`);
      return;
    }
    
    // Update object IDs if needed
    for (let anchor of this.anchors) {
      if (anchor.objectId !== targetObjectId) {
        anchor.objectId = targetObjectId;
      }
    }
    
    // Emit completed event with anchor data
    this.el.sceneEl.emit('anchor-completed', {
      objectId: targetObjectId,
      anchors: this.anchors.slice() // Send a copy of the anchor data
    });
    
    // Remove anchoring-enabled class from objects
    this.disableObjectForAnchoring(targetObjectId);
    
    // Remove laser controls from hands or reset their settings
    this.cleanupLaserControls();
    
    // Emit status update
    this.emitStatus('completed', 'Anchors saved successfully', {
      objectId: targetObjectId,
      anchorCount: this.anchors.length
    });
    
    // Reset state
    this.reset();
    this.step = 0; // Back to idle
  },
  
  /**
   * Remove anchoring-enabled class from objects
   */
  disableObjectForAnchoring: function(objectId) {
    if (!objectId) return;
    
    // Try to find object by ID first
    let objectElem = document.getElementById(objectId);
    
    // We no longer need to handle temporary objects
    // All objects should be properly saved before anchor placement
    
    // Remove anchoring classes
    if (objectElem) {
      objectElem.classList.remove('anchoring-enabled');
      
      // Also cleanup planes
      const objectPlanes = objectElem.querySelectorAll('a-plane');
      objectPlanes.forEach(plane => {
        plane.classList.remove('anchoring-enabled');
        plane.setAttribute('data-collideable', 'false');
      });
      
      // Update collideable status
      objectElem.setAttribute('data-collideable', 'false');
    }
  },
  
  /**
   * Clean up laser controls
   */
  cleanupLaserControls: function() {
    // Remove our raycaster entities that were added to hands
    ['left', 'right'].forEach(hand => {
      const handEntity = document.getElementById(`${hand}Hand`);
      if (!handEntity) return;
      
      // Remove event listeners from hands
      handEntity.removeEventListener('triggerdown', this.onLaserHit);
      handEntity.removeEventListener('pinchstarted', this.onLaserHit);
      
      // Remove raycaster entity if it exists
      const rayId = `anchor-laser-${hand}`;
      const rayEntity = document.getElementById(rayId);
      if (rayEntity) {
        // Remove event listeners from raycaster
        rayEntity.removeEventListener('raycaster-intersection', this.onRaycasterIntersection);
        
        // Remove raycaster entity
        if (rayEntity.parentNode) {
          rayEntity.parentNode.removeChild(rayEntity);
          console.log(`Removed raycaster from ${hand} hand`);
        }
      }
    });
  },
  
  /**
   * Reset state and clean up - clears current working state but doesn't affect saved anchors
   */
  reset: function() {
    // Clean up anchor markers
    removeMarkers(this.anchorMarkers);
    
    // Clear arrays
    this.anchorMarkers = [];
    this.anchors = [];
    
    // Reset step to 2 (placing anchors) if we still have an active object
    // This ensures we're in the correct state to place anchors after reset
    if (this.data.active && this.data.objectId) {
      this.step = 2;
      
      // Send status update with empty anchor count to disable the save button
      this.emitStatus('reset', 
        `Use laser to place ${this.data.anchorCount} anchors. Press trigger to place.`,
        { anchorCount: 0 });
        
      console.log('Anchor Placement: Reset completed, working state cleared. Original object anchors preserved until save/cancel.');
    }
  },
  
  /**
   * Emit status update event
   * @param {String} status - Status code
   * @param {String} message - Status message
   * @param {Object} additionalData - Extra data to include
   */
  emitStatus: function(status, message, additionalData = {}) {
    // Always include objectId if available
    const data = {
      status: status,
      message: message,
      anchorCount: this.data.anchorCount,
      objectId: this.data.objectId || null,
      ...additionalData
    };
    
    this.el.sceneEl.emit('anchor-status', data);
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
        this.cleanupLaserControls();
        this.disableObjectForAnchoring(this.data.objectId);
      }
      
      // Update visibility based on active state
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.visible !== this.data.visible) {
      this.setVisibility(this.data.visible && this.data.active);
    }
    
    if (oldData.objectId !== this.data.objectId && this.data.objectId && this.data.active) {
      // If object ID changed while active, update target
      this.disableObjectForAnchoring(oldData.objectId);
      this.enableObjectForAnchoring(this.data.objectId);
    }
  },
  
  /**
   * Component cleanup
   */
  remove: function() {
    // Clean up event listeners
    this.el.sceneEl.removeEventListener('anchor-action', this.onAnchorAction);
    
    // Clean up controller event listeners
    ['left', 'right'].forEach(hand => {
      const controllerEntity = document.getElementById(`${hand}Hand`);
      if (controllerEntity) {
        controllerEntity.removeEventListener('triggerdown', this.onLaserHit);
        controllerEntity.removeEventListener('pinchstarted', this.onLaserHit);
        
        // Also find and clean up any raycaster entities
        const rayId = `anchor-laser-${hand}`;
        const rayEntity = document.getElementById(rayId);
        if (rayEntity) {
          rayEntity.removeEventListener('raycaster-intersection', this.onRaycasterIntersection);
        }
      }
    });
    
    // Final cleanup
    this.cleanupLaserControls();
    this.disableObjectForAnchoring(this.data.objectId);
    this.reset();
  }
});

// Register the component
console.log('Anchor Placement component registered (laser-based implementation)');

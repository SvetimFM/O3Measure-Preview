/**
 * Draggable Wall Object Component
 * 
 * Creates a draggable interaction plane for objects on walls
 * Allows objects to be moved along the wall plane but not in/out
 */

import { events } from '../../utils/index.js';
import { createMarker } from '../../utils/ui-elements.js';
const { EVENTS, emitEvent } = events;

AFRAME.registerComponent('draggable-wall-object', {
  schema: {
    objectId: { type: 'string', default: '' },
    active: { type: 'boolean', default: true },
    opacity: { type: 'number', default: 0.1 }
  },
  
  init: function() {
    console.log('Draggable Wall Object: Initializing');
    
    // References
    this.sceneEl = this.el.sceneEl;
    this.sceneState = this.sceneEl.systems['scene-state'];
    this.wallEntity = document.querySelector('[wall-plane]');
    
    // State
    this.isDragging = false;
    this.dragOffset = new THREE.Vector3();
    this.wallNormal = new THREE.Vector3();
    this.wallPlane = new THREE.Plane();
    this.intersectionPoint = new THREE.Vector3();
    
    // Bind methods
    this.onRaycastHit = this.onRaycastHit.bind(this);
    this.onRaycastEnd = this.onRaycastEnd.bind(this);
    this.onRaycastMove = this.onRaycastMove.bind(this);
    
    // Get the object reference from data attribute or state
    const dataObject = this.el.getAttribute('data-object');
    if (dataObject) {
      try {
        this.objectRef = JSON.parse(dataObject);
        console.log('Draggable Wall Object: Using object data from data-object attribute');
      } catch (e) {
        console.error('Draggable Wall Object: Failed to parse data-object', e);
      }
    } else if (this.data.objectId && this.sceneState) {
      const objects = this.sceneState.getState('objects') || [];
      this.objectRef = objects.find(obj => obj.id === this.data.objectId);
      console.log('Draggable Wall Object: Found object reference from state', this.objectRef);
    }
    
    // Render the object
    if (this.objectRef) {
      this.renderObject(this.objectRef);
    } else {
      console.error('Draggable Wall Object: No object reference found');
    }
    
    // Bind methods
    this.onRaycastHit = this.onRaycastHit.bind(this);
    this.onRaycastEnd = this.onRaycastEnd.bind(this);
    this.onRaycastMove = this.onRaycastMove.bind(this);
    
    // Initialize wall plane reference and planes
    this.updateWallReference();
    
    // Add event listeners
    this.addEventListeners();
    
    console.log('Draggable Wall Object: Initialized for object', this.data.objectId);
  },
  
  // Render the object - this function handles both rendering the object
  // and creating the interactive drag plane
  renderObject: function(objectData) {
    if (!objectData) return;
    
    // Check if there's a more up-to-date version of the object in scene state
    // This is crucial for getting the latest anchors
    if (this.sceneState && objectData.id) {
      const objects = this.sceneState.getState('objects') || [];
      const stateObject = objects.find(obj => obj.id === objectData.id);
      
      if (stateObject) {
        console.log('Found more up-to-date object in scene state with anchors:', 
          stateObject.anchors ? stateObject.anchors.length : 0);
        
        // Use the state version which might have anchors
        objectData = stateObject;
        this.objectRef = stateObject;
      }
    }
    
    const width = objectData.width;
    const height = objectData.height;
    
    // Create interactive drag plane that's coplanar with the wall
    // Using higher opacity (0.3 instead of 0.1) for better visibility from all angles
    this.dragPlane = document.createElement('a-plane');
    this.dragPlane.setAttribute('width', width);
    this.dragPlane.setAttribute('height', height);
    this.dragPlane.setAttribute('opacity', 0.3); // Increased from data.opacity
    this.dragPlane.setAttribute('color', '#42D544'); // Use green color matching the object
    this.dragPlane.setAttribute('side', 'double'); // CRITICAL: Double-sided rendering
    this.dragPlane.setAttribute('class', 'drag-plane interactive');
    this.dragPlane.setAttribute('visible', true);
    this.dragPlane.setAttribute('position', '0 0 0.01'); // Give it a z-offset to ensure it renders in front of wall
    
    // Add to entity
    this.el.appendChild(this.dragPlane);
    
    console.log('Draggable Wall Object: Created drag plane for object', objectData.id, 
      'with dimensions', width, 'x', height);
    
    // Create visual object representation
    this.createObjectVisuals(objectData);
  },
  
  // Create visual elements to represent the object
  createObjectVisuals: function(objectData) {
    console.log('Creating visual elements for object', objectData.id, 'with anchors:', objectData.anchors);
    
    // NOTE: We're now using the dragPlane as the main visual element
    // The dragPlane is already created with higher opacity (0.3) and double-sided rendering
    
    // Add anchors if available - use a separate check to help debug
    if (objectData.anchors) {
      console.log('Object has anchors property:', objectData.anchors);
      
      if (Array.isArray(objectData.anchors) && objectData.anchors.length > 0) {
        console.log(`Object has ${objectData.anchors.length} anchors, creating them`);
        this.createAnchors(objectData.anchors);
      } else {
        console.warn('Object has anchors property but it is empty or not an array');
      }
    } else {
      console.warn('Object has no anchors property');
    }
    
    // Add dimensions text
    this.createDimensionsLabels(objectData);
  },
  
  // Create outline from points
  createOutline: function(points) {
    const colors = ['#4285F4', '#0F9D58', '#F4B400', '#DB4437']; // Google colors
    
    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];
      
      const line = document.createElement('a-entity');
      line.setAttribute('line', {
        start: { x: start.x, y: start.y, z: 0.002 },
        end: { x: end.x, y: end.y, z: 0.002 },
        color: colors[i % colors.length],
        opacity: 0.8
      });
      
      this.el.appendChild(line);
    }
  },
  
  // Create anchors for the object
  createAnchors: function(anchors) {
    console.log('Creating anchors:', anchors);
    
    if (!anchors || !Array.isArray(anchors) || anchors.length === 0) {
      console.warn('No anchors to create');
      return;
    }
    
    // Create visual markers for anchors using the standard UI element
    anchors.forEach((anchor, index) => {
      const anchorColors = ['#F4B400', '#DB4437', '#4285F4', '#0F9D58'];
      const color = anchorColors[index % anchorColors.length];
      
      // Check if anchor has a valid position
      if (!anchor.position) {
        console.error('Invalid anchor position:', anchor);
        return;
      }
      
      // Get anchor position - already in local coordinates
      const localPosition = {
        x: anchor.position.x,
        y: anchor.position.y,
        z: 0.015 // Increased offset to be more visible
      };
      
      console.log(`Creating anchor ${index} at local position:`, localPosition);
      
      // Create the anchor using the standard marker utility to ensure consistency
      const marker = createMarker(
        localPosition,   // Position already in local coordinates
        index + 1,       // Label with index number
        color,           // Use color from the standard scheme
        this.el          // Add directly to this entity
      );
      
      // Ensure marker is visible from all angles by setting components to double-sided
      marker.querySelectorAll('a-entity').forEach(el => {
        // For entities with material component
        if (el.hasAttribute('material')) {
          const material = el.getAttribute('material');
          material.side = 'double';
          el.setAttribute('material', material);
        }
      });
      
      // Ensure marker is visible
      marker.setAttribute('visible', true);
    });
  },
  
  // Create dimension labels
  createDimensionsLabels: function(objectData) {
    const widthCm = (objectData.width * 100).toFixed(1);
    const heightCm = (objectData.height * 100).toFixed(1);
    
    // Width label with look-at camera behavior for auto-facing
    const widthLabel = document.createElement('a-entity');
    widthLabel.setAttribute('position', `0 ${objectData.height/2 + 0.03} 0.005`);
    widthLabel.setAttribute('text', {
      value: `${widthCm} cm`,
      align: 'center',
      width: 0.5,
      color: '#FFFFFF'
    });
    widthLabel.setAttribute('look-at', '[camera]'); // Auto-look at camera
    widthLabel.setAttribute('scale', '0.1 0.1 0.1');
    this.el.appendChild(widthLabel);
    
    // Height label with look-at camera behavior for auto-facing
    const heightLabel = document.createElement('a-entity');
    heightLabel.setAttribute('position', `${objectData.width/2 + 0.03} 0 0.005`);
    heightLabel.setAttribute('text', {
      value: `${heightCm} cm`,
      align: 'center',
      width: 0.5,
      color: '#FFFFFF'
    });
    heightLabel.setAttribute('look-at', '[camera]'); // Auto-look at camera
    heightLabel.setAttribute('scale', '0.1 0.1 0.1');
    this.el.appendChild(heightLabel);
  },
  
  updateWallReference: function() {
    // Find wall entity if not already set or if previously null
    if (!this.wallEntity) {
      this.wallEntity = document.querySelector('[wall-plane]');
      if (!this.wallEntity) {
        console.warn('Draggable Wall Object: No wall plane found');
        return;
      } else {
        console.log('Draggable Wall Object: Found wall plane that was previously missing');
      }
    }
    
    // Get wall orientation
    const wallRotation = this.wallEntity.getAttribute('rotation');
    const wallPosition = this.wallEntity.getAttribute('position');
    
    // Apply the same rotation as the wall to this entity
    this.el.setAttribute('rotation', wallRotation);
    console.log('Draggable Wall Object: Applied wall rotation:', wallRotation);
    
    // If we have the objectRef, update its rotation to match the wall
    if (this.objectRef) {
      this.objectRef.rotation = wallRotation;
    }
    
    // Create wall normal vector (facing into the room from the wall)
    // Default is +Z axis rotated by the wall's rotation
    this.wallNormal.set(0, 0, 1);
    
    // Create rotation from Euler angles
    const rotation = new THREE.Euler(
      THREE.MathUtils.degToRad(wallRotation.x),
      THREE.MathUtils.degToRad(wallRotation.y),
      THREE.MathUtils.degToRad(wallRotation.z),
      'XYZ'
    );
    
    // Apply rotation to normal vector
    this.wallNormal.applyEuler(rotation);
    
    // Create plane using normal and point
    const point = new THREE.Vector3(wallPosition.x, wallPosition.y, wallPosition.z);
    this.wallPlane.setFromNormalAndCoplanarPoint(this.wallNormal, point);
    
    // Ensure object is exactly on the wall plane
    if (this.objectRef) {
      // Project the object onto the wall plane

      // We want to place the object at the center of the wall initially
      // The object will maintain its size but be positioned at the wall's center
      // This gives the user a good starting point to drag from
      const newPos = {
        x: wallPosition.x,
        y: wallPosition.y,
        z: wallPosition.z
      };
      
      // Update entity position to be at exact wall position
      this.el.setAttribute('position', newPos);
      
      // Update objectRef center
      this.objectRef.center = newPos;
      
      // Make sure we update state with our changes
      if (this.sceneState && this.objectRef && this.objectRef.id) {
        const objects = this.sceneState.getState('objects') || [];
        const objIndex = objects.findIndex(o => o.id === this.objectRef.id);
        
        if (objIndex >= 0) {
          // Update the object in state
          objects[objIndex] = this.objectRef;
          this.sceneState.updateState('objects', objects);
          console.log('Draggable Wall Object: Updated object in scene state');
        }
      }
      
      console.log('Draggable Wall Object: Aligned with wall Z position', wallPosition.z);
    }
    
    console.log('Draggable Wall Object: Wall plane set up', {
      normal: this.wallNormal,
      point: point
    });
    
    // Make sure object is visible if wall is calibrated and visible
    const wallPlaneContainer = this.wallEntity.querySelector('.wall-container');
    if (wallPlaneContainer) {
      const isWallVisible = wallPlaneContainer.getAttribute('visible');
      this.el.setAttribute('visible', isWallVisible);
    }
  },
  
  addEventListeners: function() {
    // Listen for raycaster intersection events - these help us get the initial raycaster reference
    this.dragPlane.addEventListener('raycaster-intersected', this.onRaycastHit);
    this.dragPlane.addEventListener('raycaster-intersected-cleared', this.onRaycastEnd);
    
    // Listen for controller trigger down/up events
    this.sceneEl.addEventListener('triggerdown', this.onRaycastMove);
    this.sceneEl.addEventListener('triggerup', this.onRaycastEnd);
    
    // Listen for hand tracking gestures
    this.sceneEl.addEventListener('pinchstarted', this.onRaycastMove);
    this.sceneEl.addEventListener('pinchended', this.onRaycastEnd);
    this.sceneEl.addEventListener('pinchmoved', this.onPinchMove.bind(this));
    
    // Listen for object updates
    this.sceneEl.addEventListener(EVENTS.OBJECT.UPDATED, this.onObjectUpdated.bind(this));
    
    // Listen for wall calibration events
    this.sceneEl.addEventListener(EVENTS.WALL.CALIBRATION_COMPLETE, this.onWallCalibrationChange.bind(this));
    this.sceneEl.addEventListener(EVENTS.WALL.RESET, this.onWallReset.bind(this));
    
    // Listen for wall plane updates
    if (this.wallEntity) {
      this.wallEntity.addEventListener('componentchanged', (evt) => {
        if (evt.detail.name === 'position' || evt.detail.name === 'rotation') {
          this.updateWallReference();
        }
        
        // Also listen for visibility changes
        if (evt.detail.name === 'visible' || 
            (evt.detail.name === 'getAttribute' && evt.detail.attrName === 'visible')) {
          // Get the wall container visibility
          const container = this.wallEntity.querySelector('.wall-container');
          if (container) {
            const isWallVisible = container.getAttribute('visible');
            this.el.setAttribute('visible', isWallVisible);
          }
        }
      });
    }
  },
  
  onRaycastHit: function(evt) {
    // Store the raycaster for later use
    this.raycaster = evt.detail.el.components.raycaster;
  },
  
  onRaycastEnd: function() {
    // End dragging
    if (this.isDragging) {
      this.isDragging = false;
      
      // Emit object moved event
      if (this.objectRef) {
        emitEvent(this.sceneEl, EVENTS.OBJECT.UPDATED, {
          objectId: this.data.objectId,
          object: this.objectRef,
          action: 'moved'
        });
      }
    }
    
    // Clear raycaster reference
    this.raycaster = null;
  },
  
  // Handle trigger events (for controller-based interaction)
  onRaycastMove: function() {
    // Only respond if we're dragging or component is active
    if (!this.isDragging && !this.raycaster) return;
    if (!this.data.active) return;
    
    // Get object reference if needed
    if (!this.objectRef && this.data.objectId) {
      const objects = this.sceneState.getState('objects') || [];
      this.objectRef = objects.find(obj => obj.id === this.data.objectId);
      if (!this.objectRef) {
        console.warn('Draggable Wall Object: Object not found in state', this.data.objectId);
        return;
      }
    }
    
    // Make sure we have wall reference
    if (!this.wallEntity) {
      this.wallEntity = document.querySelector('[wall-plane]');
      if (!this.wallEntity) {
        console.warn('Draggable Wall Object: No wall plane found');
        return;
      }
      this.updateWallReference();
    }
    
    // Use raycaster to find intersection with wall plane
    if (!this.raycaster) return;
    
    const ray = this.raycaster.raycaster.ray;
    
    // Raycast against wall plane to find intersection point
    if (ray.intersectPlane(this.wallPlane, this.intersectionPoint)) {
      // Start dragging if not already
      if (!this.isDragging) {
        this.isDragging = true;
        
        // Calculate offset between intersection point and object center
        const objectCenter = new THREE.Vector3(
          this.objectRef.center.x,
          this.objectRef.center.y,
          this.objectRef.center.z
        );
        
        this.dragOffset.copy(objectCenter).sub(this.intersectionPoint);
      }
      
      // Calculate new position with offset
      const newPosition = this.intersectionPoint.clone().add(this.dragOffset);
      
      // Ensure position stays exactly on wall plane
      const distToPlane = this.wallPlane.distanceToPoint(newPosition);
      if (Math.abs(distToPlane) > 0.001) { // If more than 1mm away from plane
        const projected = newPosition.clone().sub(this.wallNormal.clone().multiplyScalar(distToPlane));
        newPosition.copy(projected);
      }
      
      // Update object position
      this.updateObjectPosition(newPosition);
    }
  },
  
  // Handle pinch move events for dragging with hand tracking
  onPinchMove: function(evt) {
    // Only continue if we're actively dragging and have raycaster
    if (!this.isDragging || !this.raycaster || !this.data.active) return;
    
    // Get movement data from event
    const detail = evt.detail;
    if (!detail || !detail.position) return;
    
    // Get the ray from the raycaster
    const ray = this.raycaster.raycaster.ray;
    
    // Update ray origin based on hand position for accurate raycasting
    ray.origin.copy(detail.position);
    
    // Find intersection with wall plane
    if (ray.intersectPlane(this.wallPlane, this.intersectionPoint)) {
      // Calculate new position with offset
      const newPosition = this.intersectionPoint.clone().add(this.dragOffset);
      
      // Update object position - ensure it stays on wall plane
      this.updateObjectPosition(newPosition);
    }
  },
  
  updateObjectPosition: function(newPosition) {
    if (!this.objectRef) return;
    
    // Ensure position is coplanar with wall by projecting onto wall plane
    const distToPlane = this.wallPlane.distanceToPoint(newPosition);
    if (Math.abs(distToPlane) > 0.001) { // If more than 1mm away from plane
      newPosition.sub(this.wallNormal.clone().multiplyScalar(distToPlane));
    }
    
    // Update object center
    this.objectRef.center = {
      x: newPosition.x,
      y: newPosition.y,
      z: newPosition.z
    };
    
    // Update points based on the new center
    const halfWidth = this.objectRef.width / 2;
    const halfHeight = this.objectRef.height / 2;
    
    // Get wall rotation 
    const wallRotation = this.wallEntity.getAttribute('rotation');
    
    // Store wall rotation in objectRef to maintain alignment
    this.objectRef.rotation = wallRotation;
    
    // Create a rotation matrix from wall rotation
    const rotMat = new THREE.Matrix4();
    rotMat.makeRotationFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(wallRotation.x),
      THREE.MathUtils.degToRad(wallRotation.y),
      THREE.MathUtils.degToRad(wallRotation.z),
      'XYZ'
    ));
    
    // Define corners in local coordinates (relative to center)
    const corners = [
      new THREE.Vector3(-halfWidth, halfHeight, 0),  // Top-left
      new THREE.Vector3(halfWidth, halfHeight, 0),   // Top-right
      new THREE.Vector3(halfWidth, -halfHeight, 0),  // Bottom-right
      new THREE.Vector3(-halfWidth, -halfHeight, 0)  // Bottom-left
    ];
    
    // Apply rotation and translate to new center
    corners.forEach((corner, index) => {
      corner.applyMatrix4(rotMat);
      corner.add(newPosition);
      
      // Update object's points
      this.objectRef.points[index] = {
        x: corner.x,
        y: corner.y,
        z: corner.z
      };
    });
    
    // Update entity position
    this.el.setAttribute('position', this.objectRef.center);
    
    // Update state
    if (this.sceneState) {
      const objects = this.sceneState.getState('objects') || [];
      const index = objects.findIndex(obj => obj.id === this.data.objectId);
      if (index >= 0) {
        objects[index] = this.objectRef;
        this.sceneState.updateState('objects', objects);
      }
    }
  },
  
  onObjectUpdated: function(evt) {
    const { objectId, object } = evt.detail;
    
    // Update our reference if this is our object
    if (objectId === this.data.objectId) {
      this.objectRef = object;
    }
  },
  
  update: function(oldData) {
    // Update drag plane visibility
    if (this.dragPlane) {
      this.dragPlane.setAttribute('visible', this.data.active);
      this.dragPlane.setAttribute('opacity', this.data.opacity);
    }
    
    // Update object reference if ID changed
    if (oldData.objectId !== this.data.objectId) {
      const objects = this.sceneState.getState('objects') || [];
      this.objectRef = objects.find(obj => obj.id === this.data.objectId);
      
      // Update position to match object
      if (this.objectRef) {
        this.el.setAttribute('position', this.objectRef.center);
      }
    }
  },
  
  // Handle wall calibration events
  onWallCalibrationChange: function(evt) {
    const { isCalibrated, wallVisible } = evt.detail;
    
    // Update visibility based on calibration state
    if (typeof wallVisible !== 'undefined') {
      this.el.setAttribute('visible', !!wallVisible);
    } else {
      this.el.setAttribute('visible', !!isCalibrated);
    }

    // If wall has been recalibrated, we need to refresh our wall reference and alignment
    // This is critical for objects created before the wall was calibrated
    if (isCalibrated) {
      // Make sure we have the latest wall entity reference 
      this.wallEntity = document.querySelector('[wall-plane]');
      
      // Update wall reference and realign object to the wall
      if (this.wallEntity) {
        console.log('Draggable Wall Object: Wall recalibrated, updating reference and position');
        this.updateWallReference();
        
        // Make object directly visible if wall is visible (critical for objects created before wall)
        const wallPlaneContainer = this.wallEntity.querySelector('.wall-container');
        if (wallPlaneContainer && wallPlaneContainer.getAttribute('visible')) {
          this.el.setAttribute('visible', true);
        }
      }
    }
  },
  
  // Handle direct wall reset events
  onWallReset: function() {
    // When wall is reset, hide this object
    this.el.setAttribute('visible', false);
  },
  
  remove: function() {
    // Remove event listeners
    if (this.dragPlane) {
      this.dragPlane.removeEventListener('raycaster-intersected', this.onRaycastHit);
      this.dragPlane.removeEventListener('raycaster-intersected-cleared', this.onRaycastEnd);
    }
    
    // Remove controller events
    this.sceneEl.removeEventListener('triggerdown', this.onRaycastMove);
    this.sceneEl.removeEventListener('triggerup', this.onRaycastEnd);
    
    // Remove hand tracking events
    this.sceneEl.removeEventListener('pinchstarted', this.onRaycastMove);
    this.sceneEl.removeEventListener('pinchended', this.onRaycastEnd);
    this.sceneEl.removeEventListener('pinchmoved', this.onPinchMove);
    
    // Remove event listener for object updates
    this.sceneEl.removeEventListener(EVENTS.OBJECT.UPDATED, this.onObjectUpdated);
    
    // Remove event listeners for wall events
    this.sceneEl.removeEventListener(EVENTS.WALL.CALIBRATION_COMPLETE, this.onWallCalibrationChange);
    this.sceneEl.removeEventListener(EVENTS.WALL.RESET, this.onWallReset);
    
    // Clean up all children
    while (this.el.firstChild) {
      this.el.removeChild(this.el.firstChild);
    }
  }
});
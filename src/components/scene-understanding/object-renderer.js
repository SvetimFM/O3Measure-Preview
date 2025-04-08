/**
 * Object Renderer Component
 * 
 * Renders saved objects on the wall plane using provided dimensions and coordinates
 */

import { events } from '../../utils/index.js';
import { createMarker } from '../../utils/ui-elements.js';
const { EVENTS } = events;

AFRAME.registerComponent('object-renderer', {
  schema: {
    active: { type: 'boolean', default: true },
    wallId: { type: 'string', default: 'wallPlane' }
  },
  
  init: function() {
    console.log('Object Renderer: Initializing');
    
    // Object rendering state
    this.objects = [];
    this.renderedObjects = {};
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Create container for rendered objects
    this.container = document.createElement('a-entity');
    this.container.setAttribute('id', 'object-container');
    this.el.appendChild(this.container);
    
    // Bind methods
    this.onObjectCreated = this.onObjectCreated.bind(this);
    this.onObjectUpdated = this.onObjectUpdated.bind(this);
    this.onStateChanged = this.onStateChanged.bind(this);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize from state if available
    this.initFromState();
    
    console.log('Object Renderer: Initialized');
  },
  
  setupEventListeners: function() {
    // Listen for object-related events
    this.el.sceneEl.addEventListener(EVENTS.OBJECT.CREATED, this.onObjectCreated);
    this.el.sceneEl.addEventListener(EVENTS.OBJECT.UPDATED, this.onObjectUpdated);
    this.el.sceneEl.addEventListener(EVENTS.OBJECT.ACTION, this.onObjectAction.bind(this));
    
    // Listen for wall calibration events to handle projecting objects onto newly calibrated walls
    this.el.sceneEl.addEventListener(EVENTS.WALL.CALIBRATION_COMPLETE, this.onWallCalibrationComplete.bind(this));
    
    // Listen for state changes
    if (this.sceneState) {
      this.el.sceneEl.addEventListener(EVENTS.STATE.CHANGED, this.onStateChanged);
    }
  },
  
  onObjectCreated: function(event) {
    const objectData = event.detail.object;
    
    console.log('Object Renderer: New object created', objectData);
    
    // Add to objects array if not already present
    if (!this.objects.find(obj => obj.id === objectData.id)) {
      this.objects.push(objectData);
      
      // Render the new object
      this.renderObject(objectData);
    }
  },
  
  // Handle object updates (e.g. when anchors are added)
  onObjectUpdated: function(event) {
    const { objectId, object } = event.detail;
    
    console.log('Object Renderer: Object updated', objectId, object);
    
    // Update the object in our local array
    const index = this.objects.findIndex(obj => obj.id === objectId);
    if (index >= 0) {
      this.objects[index] = object;
    } else {
      // If not found, add it
      this.objects.push(object);
    }
    
    // Update the rendered object
    this.updateObject(object);
  },
  
  onStateChanged: function(event) {
    const detail = event.detail;
    
    // Only respond to objects-related state changes
    if (detail.path && detail.path === 'objects') {
      console.log('Object Renderer: Objects state changed', detail.value);
      this.objects = detail.value;
      this.updateRenderedObjects();
    }
  },
  
  // Handle object actions (like project-on-wall)
  onObjectAction: function(event) {
    const { action, objectId, object } = event.detail;
    
    if (action === 'project-on-wall') {
      console.log('Object Renderer: Projecting object on wall', objectId);
      
      // Always get the most up-to-date object from scene state
      let targetObject = null;
      
      if (this.sceneState) {
        const stateObjects = this.sceneState.getState('objects') || [];
        targetObject = stateObjects.find(obj => obj.id === objectId);
        
        if (targetObject) {
          console.log('Object Renderer: Found object in scene state with',
            targetObject.anchors ? targetObject.anchors.length : 0, 'anchors');
        }
      }
      
      // Fall back to provided object or local cache if not in state
      if (!targetObject) {
        targetObject = object || this.objects.find(obj => obj.id === objectId);
        console.log('Object Renderer: Using fallback object data');
      }
      
      if (!targetObject) {
        console.error('Object Renderer: Cannot project object, not found:', objectId);
        return;
      }
      
      // Ensure the object is visible
      targetObject.visible = true;
      
      // Check if this object is already projected on the wall
      const existingEntity = document.getElementById(`wall-object-${targetObject.id}`);
      
      if (existingEntity) {
        // Update the existing entity
        existingEntity.setAttribute('position', targetObject.center);
        existingEntity.setAttribute('data-object', JSON.stringify(targetObject));
        
        // Ensure draggable component is updated
        if (existingEntity.hasAttribute('draggable-wall-object')) {
          existingEntity.setAttribute('draggable-wall-object', {
            objectId: targetObject.id,
            active: true
          });
        } else {
          existingEntity.setAttribute('draggable-wall-object', {
            objectId: targetObject.id,
            active: true,
            opacity: 0.1
          });
        }
      } else {
        // Get wall entity to place object on it
        const wallEntity = document.querySelector('[wall-plane]');
        
        if (!wallEntity) {
          console.error('Object Renderer: Cannot project object, wall plane not found');
          return;
        }
        
        // Get wall position and rotation
        const wallPosition = wallEntity.getAttribute('position');
        const wallRotation = wallEntity.getAttribute('rotation');
        
        console.log('Object Renderer: Wall position:', wallPosition, 'rotation:', wallRotation);
        
        // Initially place object at center of wall (user will drag it to position)
        // Create a new entity that will handle both rendering and dragging
        const wallObjectEntity = document.createElement('a-entity');
        wallObjectEntity.setAttribute('id', `wall-object-${targetObject.id}`);
        
        // Add z-offset to ensure object renders in front of the wall plane (prevents z-fighting)
        const wallPositionWithOffset = {
          x: wallPosition.x,
          y: wallPosition.y,
          z: wallPosition.z + 0.005 // Increased offset to ensure it's in front of all wall elements
        };
        
        // Start at wall position - the draggable-wall-object component will place it exactly on the wall plane
        wallObjectEntity.setAttribute('position', wallPositionWithOffset);
        wallObjectEntity.setAttribute('data-object', JSON.stringify(targetObject));
        
        // Add the draggable-wall-object component
        wallObjectEntity.setAttribute('draggable-wall-object', {
          objectId: targetObject.id,
          active: true,
          opacity: 0.3  // Increased opacity for better visibility from all angles
        });
        
        // Add to scene
        this.el.sceneEl.appendChild(wallObjectEntity);
      }
      
      // Store the object data in the renderer's objects list
      const existingIndex = this.objects.findIndex(o => o.id === targetObject.id);
      if (existingIndex >= 0) {
        this.objects[existingIndex] = targetObject;
      } else {
        this.objects.push(targetObject);
      }
    }
  },
  
  initFromState: function() {
    if (this.sceneState) {
      const objects = this.sceneState.getState('objects');
      
      if (objects && Array.isArray(objects)) {
        console.log('Object Renderer: Loading objects from state into memory (not rendering yet)', objects);
        this.objects = objects;
        // Do NOT call updateRenderedObjects() here - we just want to store objects in memory
        // Objects should only be rendered when explicitly requested from View Items menu
      }
    }
  },
  
  // Render a single object
  renderObject: function(objectData) {
    // Skip if already rendered
    if (this.renderedObjects[objectData.id]) {
      return this.updateObject(objectData);
    }
    
    console.log('Object Renderer: Rendering object', objectData.id);
    
    // Create entity for this object
    const objectEntity = document.createElement('a-entity');
    objectEntity.setAttribute('id', objectData.id);
    objectEntity.setAttribute('class', 'rendered-object anchoring-enabled');
    objectEntity.setAttribute('visible', objectData.visible);
    objectEntity.setAttribute('data-id', objectData.id);
    objectEntity.setAttribute('data-collideable', 'true');
    
    // Create rectangle visualization
    const width = objectData.width;
    const height = objectData.height;
    
    // Convert points array to Vector3 objects
    const points = objectData.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    
    // Create outline
    this.createRectangleOutline(objectEntity, points);
    
    // Create rectangle mesh with proper orientation
    const rectangle = document.createElement('a-plane');
    rectangle.setAttribute('width', width);
    rectangle.setAttribute('height', height);
    rectangle.setAttribute('position', objectData.center);
    
    // Set rotation if available
    if (objectData.rotation) {
      rectangle.setAttribute('rotation', objectData.rotation);
    }
    
    rectangle.setAttribute('color', '#42D544');
    rectangle.setAttribute('opacity', 0.2);
    rectangle.setAttribute('side', 'double');
    
    // Add anchoring-enabled class and data-id for interaction
    rectangle.setAttribute('class', 'anchoring-enabled');
    rectangle.setAttribute('data-id', objectData.id);
    rectangle.setAttribute('data-collideable', 'true');
    rectangle.setAttribute('id', `plane-${objectData.id}`);
    
    objectEntity.appendChild(rectangle);
    
    // Add dimensions labels
    this.addDimensionsLabels(objectEntity, objectData);
    
    // Add anchor points if available
    if (objectData.anchors && objectData.anchors.length > 0) {
      this.renderAnchors(objectEntity, objectData.anchors, rectangle);
    }
    
    // Add to container
    this.container.appendChild(objectEntity);
    
    // Store reference to rendered object
    this.renderedObjects[objectData.id] = {
      entity: objectEntity,
      data: objectData
    };
    
    return objectEntity;
  },
  
  // Update an existing rendered object
  updateObject: function(objectData) {
    const rendered = this.renderedObjects[objectData.id];
    if (!rendered) return null;
    
    console.log('Object Renderer: Updating object', objectData.id);
    
    // Update visibility
    rendered.entity.setAttribute('visible', objectData.visible);
    
    // Check if anchors have changed - remove old and add new
    // First find the plane element
    const planeEl = rendered.entity.querySelector('a-plane') || 
                    document.getElementById(`plane-${objectData.id}`);
    
    if (planeEl) {
      // Remove any existing anchor markers
      const existingAnchors = rendered.entity.querySelectorAll('.anchor-marker');
      existingAnchors.forEach(anchor => {
        if (anchor.parentNode) {
          anchor.parentNode.removeChild(anchor);
        }
      });
      
      // Add updated anchors if available
      if (objectData.anchors && objectData.anchors.length > 0) {
        this.renderAnchors(rendered.entity, objectData.anchors, planeEl);
      }
    }
    
    // Update data reference
    rendered.data = objectData;
    
    return rendered.entity;
  },
  
  // Create triangle outline from three points
  createRectangleOutline: function(parent, points) {
    // Draw lines between points - can work with both triangles (3 points) and rectangles (4 points)
    const numPoints = points.length;
    if (numPoints < 3) return;
    
    const colors = ['#4285F4', '#0F9D58', '#F4B400', '#DB4437']; // Google colors
    
    for (let i = 0; i < numPoints; i++) {
      const start = points[i];
      const end = points[(i + 1) % numPoints];
      
      const line = document.createElement('a-entity');
      line.setAttribute('line', {
        start: start,
        end: end,
        color: colors[i],
        opacity: 0.8
      });
      
      parent.appendChild(line);
    }
  },
  
  // Render anchor markers on the object
  renderAnchors: function(parentEntity, anchors, planeEl) {
    if (!anchors || !anchors.length || !planeEl) return;
    
    console.log(`Object Renderer: Rendering ${anchors.length} anchors`);
    
    // Add each anchor as a marker
    anchors.forEach((anchor, index) => {
      // Anchor colors - use the same scheme as in anchor-placement.js
      const anchorColors = ['#F4B400', '#DB4437', '#4285F4', '#0F9D58'];
      const color = anchorColors[index % anchorColors.length];
      
      // Create marker using the reticle style from our updated createMarker function
      const marker = createMarker(
        anchor.position, // Use the stored local position
        index + 1,      // Label with number
        color,          // Use color from our scheme
        null            // Don't add to scene directly
      );
      
      // Add to plane element for proper positioning
      planeEl.appendChild(marker);
    });
  },
  
  // Add dimension labels to the object
  addDimensionsLabels: function(parent, objectData) {
    // Format dimensions - show in centimeters
    const widthCm = (objectData.width * 100).toFixed(1);
    const heightCm = (objectData.height * 100).toFixed(1);
    const points = objectData.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    
    // Create width text at top of rectangle
    const widthTextPos = new THREE.Vector3()
      .add(points[0])
      .add(points[1])
      .divideScalar(2)
      .add(new THREE.Vector3(0, 0.05, 0));
    
    const widthText = document.createElement('a-text');
    widthText.setAttribute('value', `${widthCm} cm`);
    widthText.setAttribute('align', 'center');
    widthText.setAttribute('position', widthTextPos);
    widthText.setAttribute('scale', '0.1 0.1 0.1');
    widthText.setAttribute('color', '#FFFFFF');
    widthText.setAttribute('look-at', '[camera]');
    parent.appendChild(widthText);
    
    // Create height text at right side of rectangle
    const heightTextPos = new THREE.Vector3()
      .add(points[1])
      .add(points[2])
      .divideScalar(2)
      .add(new THREE.Vector3(0.05, 0, 0));
    
    const heightText = document.createElement('a-text');
    heightText.setAttribute('value', `${heightCm} cm`);
    heightText.setAttribute('align', 'center');
    heightText.setAttribute('position', heightTextPos);
    heightText.setAttribute('scale', '0.1 0.1 0.1');
    heightText.setAttribute('color', '#FFFFFF');
    heightText.setAttribute('look-at', '[camera]');
    parent.appendChild(heightText);
    
    // Create area text in center (optional)
    const areaTextPos = objectData.center;
    const areaCmSq = (objectData.width * objectData.height * 10000).toFixed(0); // cm²
    
    const areaText = document.createElement('a-text');
    areaText.setAttribute('value', `${areaCmSq} cm²`);
    areaText.setAttribute('align', 'center');
    areaText.setAttribute('position', areaTextPos);
    areaText.setAttribute('scale', '0.1 0.1 0.1');
    areaText.setAttribute('color', '#FFFFFF');
    areaText.setAttribute('look-at', '[camera]');
    parent.appendChild(areaText);
  },
  
  // Update all rendered objects
  updateRenderedObjects: function() {
    console.log('Object Renderer: Updating all rendered objects');
    
    // Get current object IDs
    const currentIds = this.objects.map(obj => obj.id);
    
    // Remove objects that are no longer in the list
    Object.keys(this.renderedObjects).forEach(id => {
      if (!currentIds.includes(id)) {
        // Remove from DOM
        const entity = this.renderedObjects[id].entity;
        if (entity.parentNode) {
          entity.parentNode.removeChild(entity);
        }
        
        // Remove from tracked objects
        delete this.renderedObjects[id];
      }
    });
    
    // Add or update objects
    this.objects.forEach(objectData => {
      if (this.renderedObjects[objectData.id]) {
        // Update existing object
        this.updateObject(objectData);
      } else {
        // Render new object
        this.renderObject(objectData);
      }
    });
  },
  
  update: function(oldData) {
    // Handle changes to component properties
    if (oldData.active !== this.data.active) {
      // Update visibility of all rendered objects
      this.container.setAttribute('visible', this.data.active);
    }
  },
  
  // Handle wall calibration completed event
  onWallCalibrationComplete: function(event) {
    const { isCalibrated } = event.detail;
    
    if (isCalibrated) {
      console.log('Object Renderer: Wall calibrated, checking for objects to project');
      
      // Get all objects from state
      const objects = this.sceneState ? this.sceneState.getState('objects') || [] : this.objects;
      
      // Check if there are any objects that could be projected
      if (objects.length > 0) {
        console.log(`Object Renderer: Found ${objects.length} objects that may need projection`);
        
        // Verify wall is available and ready
        const wallEntity = document.querySelector('[wall-plane]');
        if (!wallEntity) {
          console.error('Object Renderer: Wall calibrated but no wall entity found');
          return;
        }
        
        // For any existing wall-object entities, update their wall reference
        objects.forEach(obj => {
          const wallObjectId = `wall-object-${obj.id}`;
          const existingEntity = document.getElementById(wallObjectId);
          
          if (existingEntity && existingEntity.components['draggable-wall-object']) {
            console.log(`Object Renderer: Updating existing wall object ${obj.id}`);
            
            // Force an update of the wall reference
            existingEntity.components['draggable-wall-object'].wallEntity = wallEntity;
            existingEntity.components['draggable-wall-object'].updateWallReference();
            
            // Also update visibility based on wall
            const wallPlaneContainer = wallEntity.querySelector('.wall-container');
            if (wallPlaneContainer && wallPlaneContainer.getAttribute('visible')) {
              existingEntity.setAttribute('visible', true);
            }
          } else if (!existingEntity) {
            // Objects should NOT auto-project when wall is calibrated
            // They should only project when explicitly requested from View Items menu
            console.log(`Object Renderer: Object ${obj.id} exists but is not projected on wall (waiting for user selection from View Items)`);
            
            // Do NOT auto-project objects here - let the user select them from View Items
          }
        });
      }
    }
  },
  
  remove: function() {
    // Clean up event listeners
    this.el.sceneEl.removeEventListener(EVENTS.OBJECT.CREATED, this.onObjectCreated);
    this.el.sceneEl.removeEventListener(EVENTS.OBJECT.UPDATED, this.onObjectUpdated);
    this.el.sceneEl.removeEventListener(EVENTS.OBJECT.ACTION, this.onObjectAction);
    this.el.sceneEl.removeEventListener(EVENTS.WALL.CALIBRATION_COMPLETE, this.onWallCalibrationComplete);
    
    if (this.sceneState) {
      this.el.sceneEl.removeEventListener(EVENTS.STATE.CHANGED, this.onStateChanged);
    }
    
    // Remove all rendered objects
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    // Remove container
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // Clean up any draggable entities
    Object.keys(this.renderedObjects).forEach(id => {
      const draggableEntity = document.getElementById(`draggable-${id}`);
      if (draggableEntity && draggableEntity.parentNode) {
        draggableEntity.parentNode.removeChild(draggableEntity);
      }
    });
  }
});

// Register the component
console.log('Object Renderer component registered');
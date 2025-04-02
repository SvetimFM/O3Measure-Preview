/**
 * Object Renderer Component
 * 
 * Renders saved objects on the wall plane using provided dimensions and coordinates
 */

import { EVENTS } from '../../utils/events.js';

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
  
  onStateChanged: function(event) {
    const detail = event.detail;
    
    // Only respond to objects-related state changes
    if (detail.path && detail.path === 'objects') {
      console.log('Object Renderer: Objects state changed', detail.value);
      this.objects = detail.value;
      this.updateRenderedObjects();
    }
  },
  
  initFromState: function() {
    if (this.sceneState) {
      const objects = this.sceneState.getState('objects');
      
      if (objects && Array.isArray(objects)) {
        console.log('Object Renderer: Initializing from state', objects);
        this.objects = objects;
        this.updateRenderedObjects();
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
    objectEntity.setAttribute('class', 'rendered-object');
    objectEntity.setAttribute('visible', objectData.visible);
    
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
    objectEntity.appendChild(rectangle);
    
    // Add dimensions labels
    this.addDimensionsLabels(objectEntity, objectData);
    
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
    
    // Update other properties as needed
    // ...
    
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
  
  remove: function() {
    // Clean up event listeners
    this.el.sceneEl.removeEventListener(EVENTS.OBJECT.CREATED, this.onObjectCreated);
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
  }
});

// Register the component
console.log('Object Renderer component registered');
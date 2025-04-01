/**
 * Wall Plane Component
 * 
 * Creates and manages a semi-transparent wall plane for measurement
 * Responds to calibration events to update wall properties
 */

AFRAME.registerComponent('wall-plane', {
  schema: {
    width: { type: 'number', default: 2 },
    height: { type: 'number', default: 2 },
    color: { type: 'color', default: '#888888' },
    opacity: { type: 'number', default: 0.6 },
    visible: { type: 'boolean', default: false }
  },
  
  init: function() {
    console.log('Wall Plane: Initializing');
    
    // Create wall plane
    this.createWallPlane();
    
    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];
    
    // Initialize from state if available
    this.initFromState();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Wall Plane: Initialized');
  },
  
  createWallPlane: function() {
    // Create wall geometry
    this.plane = document.createElement('a-plane');
    this.plane.setAttribute('width', this.data.width);
    this.plane.setAttribute('height', this.data.height);
    this.plane.setAttribute('color', this.data.color);
    this.plane.setAttribute('opacity', this.data.opacity);
    this.plane.setAttribute('shader', 'flat');
    this.plane.setAttribute('side', 'double');
    this.plane.setAttribute('class', 'wall');
    this.plane.setAttribute('visible', this.data.visible);
    
    // Add visual grid pattern
    this.createGridPattern();
    
    // Add to entity
    this.el.appendChild(this.plane);
  },
  
  createGridPattern: function() {
    // Add grid lines as child entities
    const gridSpacing = 0.2; // 20cm grid
    
    // Create horizontal and vertical lines
    for (let i = -this.data.width/2 + gridSpacing; i < this.data.width/2; i += gridSpacing) {
      // Vertical line
      const vLine = document.createElement('a-entity');
      vLine.setAttribute('geometry', {
        primitive: 'plane',
        width: 0.002,
        height: this.data.height
      });
      vLine.setAttribute('material', {
        color: '#FFFFFF',
        opacity: 0.2,
        shader: 'flat',
        side: 'double'
      });
      vLine.setAttribute('position', `${i} 0 0.001`);
      this.plane.appendChild(vLine);
    }
    
    for (let i = -this.data.height/2 + gridSpacing; i < this.data.height/2; i += gridSpacing) {
      // Horizontal line
      const hLine = document.createElement('a-entity');
      hLine.setAttribute('geometry', {
        primitive: 'plane',
        width: this.data.width,
        height: 0.002
      });
      hLine.setAttribute('material', {
        color: '#FFFFFF',
        opacity: 0.2,
        shader: 'flat',
        side: 'double'
      });
      hLine.setAttribute('position', `0 ${i} 0.001`);
      this.plane.appendChild(hLine);
    }
  },
  
  initFromState: function() {
    if (this.sceneState) {
      const wallState = this.sceneState.getState('calibration.wall');
      
      if (wallState) {
        // Apply state to component
        this.plane.setAttribute('width', wallState.width);
        this.plane.setAttribute('height', wallState.height);
        this.plane.setAttribute('color', wallState.color);
        this.plane.setAttribute('opacity', wallState.opacity);
        this.plane.setAttribute('visible', wallState.visible);
        
        // Set position and rotation
        this.el.setAttribute('position', wallState.position);
        this.el.setAttribute('rotation', wallState.rotation);
      }
    }
  },
  
  setupEventListeners: function() {
    // Listen for wall-related events
    this.el.sceneEl.addEventListener('wall-reset', this.onWallReset.bind(this));
    this.el.sceneEl.addEventListener('wall-adjust-start', this.onWallAdjustStart.bind(this));
    this.el.sceneEl.addEventListener('scene-state-changed', this.onStateChanged.bind(this));
  },
  
  onWallReset: function() {
    // Reset wall to default values
    const defaultPos = { x: 0, y: 1, z: -2 };
    const defaultRot = { x: 0, y: 0, z: 0 };
    
    this.el.setAttribute('position', defaultPos);
    this.el.setAttribute('rotation', defaultRot);
    this.plane.setAttribute('visible', false);
    
    console.log('Wall Plane: Reset to default position');
  },
  
  onWallAdjustStart: function() {
    // Make wall visible for adjustment
    this.plane.setAttribute('visible', true);
    
    // TODO: Enable wall adjustment controls
    console.log('Wall Plane: Adjustment mode started');
  },
  
  onStateChanged: function(event) {
    const detail = event.detail;
    
    // Only respond to wall-related state changes
    if (detail.path && detail.path.startsWith('calibration.wall')) {
      const property = detail.path.split('.').pop();
      const value = detail.value;
      
      // Update component based on state change
      switch(property) {
        case 'visible':
          this.plane.setAttribute('visible', value);
          break;
        case 'position':
          this.el.setAttribute('position', value);
          break;
        case 'rotation':
          this.el.setAttribute('rotation', value);
          break;
        case 'width':
        case 'height':
        case 'color':
        case 'opacity':
          this.plane.setAttribute(property, value);
          break;
      }
    }
  },
  
  update: function(oldData) {
    // Skip on first initialization
    if (Object.keys(oldData).length === 0) return;
    
    // Update component attributes when component properties change
    if (oldData.width !== this.data.width || oldData.height !== this.data.height) {
      this.plane.setAttribute('width', this.data.width);
      this.plane.setAttribute('height', this.data.height);
      
      // Recreate grid pattern for new dimensions
      while (this.plane.firstChild) {
        this.plane.removeChild(this.plane.firstChild);
      }
      this.createGridPattern();
    }
    
    if (oldData.color !== this.data.color) {
      this.plane.setAttribute('color', this.data.color);
    }
    
    if (oldData.opacity !== this.data.opacity) {
      this.plane.setAttribute('opacity', this.data.opacity);
    }
    
    if (oldData.visible !== this.data.visible) {
      this.plane.setAttribute('visible', this.data.visible);
    }
  },
  
  remove: function() {
    // Remove event listeners
    this.el.sceneEl.removeEventListener('wall-reset', this.onWallReset);
    this.el.sceneEl.removeEventListener('wall-adjust-start', this.onWallAdjustStart);
    this.el.sceneEl.removeEventListener('scene-state-changed', this.onStateChanged);
    
    // Remove wall plane
    if (this.plane && this.plane.parentNode) {
      this.plane.parentNode.removeChild(this.plane);
    }
  }
});
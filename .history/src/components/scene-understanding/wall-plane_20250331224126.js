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
    // Create container for the wall components
    this.planeContainer = document.createElement('a-entity');
    this.planeContainer.setAttribute('class', 'wall-container');
    this.planeContainer.setAttribute('visible', this.data.visible);
    
    // Create invisible interaction plane
    this.plane = document.createElement('a-plane');
    this.plane.setAttribute('width', this.data.width);
    this.plane.setAttribute('height', this.data.height);
    this.plane.setAttribute('color', this.data.color);
    this.plane.setAttribute('opacity', 0); // Invisible
    this.plane.setAttribute('side', 'double');
    this.plane.setAttribute('class', 'wall-plane');
    
    // Create grid container
    this.gridContainer = document.createElement('a-entity');
    this.gridContainer.setAttribute('class', 'grid-container');
    
    // Add visual grid pattern to grid container
    this.createGridPattern();
    
    // Add both to entity
    this.planeContainer.appendChild(this.plane);
    this.planeContainer.appendChild(this.gridContainer);
    this.el.appendChild(this.planeContainer);
  },
  
  createGridPattern: function() {
    // Add grid lines as child entities
    const gridSpacing = 0.2; // 20cm grid
    const gridWidth = 8; // 8 meter grid
    const gridHeight = 8; // 8 meter grid
    const gridColor = '#FF8800'; // Bright orange
    
    // Create horizontal and vertical lines
    for (let i = -gridWidth/2 + gridSpacing; i < gridWidth/2; i += gridSpacing) {
      // Vertical line
      const vLine = document.createElement('a-entity');
      vLine.setAttribute('geometry', {
        primitive: 'plane',
        width: 0.004,
        height: gridHeight
      });
      vLine.setAttribute('material', {
        color: gridColor,
        opacity: 0.8,
        shader: 'flat',
        side: 'double'
      });
      vLine.setAttribute('position', `${i} 0 0.001`);
      this.gridContainer.appendChild(vLine);
    }
    
    for (let i = -gridHeight/2 + gridSpacing; i < gridHeight/2; i += gridSpacing) {
      // Horizontal line
      const hLine = document.createElement('a-entity');
      hLine.setAttribute('geometry', {
        primitive: 'plane',
        width: gridWidth,
        height: 0.004
      });
      hLine.setAttribute('material', {
        color: gridColor,
        opacity: 0.8,
        shader: 'flat',
        side: 'double'
      });
      hLine.setAttribute('position', `0 ${i} 0.001`);
      this.gridContainer.appendChild(hLine);
    }
  },
  
  initFromState: function() {
    if (this.sceneState) {
      const wallState = this.sceneState.getState('calibration.wall');
      
      if (wallState) {
        // Apply visibility state to container
        this.planeContainer.setAttribute('visible', wallState.visible);
        
        // Apply width and height to the invisible plane
        if (wallState.width) {
          this.plane.setAttribute('width', wallState.width);
        }
        if (wallState.height) {
          this.plane.setAttribute('height', wallState.height);
        }
        
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
    this.planeContainer.setAttribute('visible', false);
    
    console.log('Wall Plane: Reset to default position');
  },
  
  onWallAdjustStart: function() {
    // Make wall visible for adjustment
    this.planeContainer.setAttribute('visible', true);
    
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
          this.planeContainer.setAttribute('visible', value);
          break;
        case 'position':
          this.el.setAttribute('position', value);
          break;
        case 'rotation':
          this.el.setAttribute('rotation', value);
          break;
        case 'width':
        case 'height':
          this.plane.setAttribute(property, value);
          break;
        case 'color':
          // Don't apply color changes to the invisible plane
          break;
        case 'opacity':
          // Keep the plane invisible regardless of state
          break;
      }
    }
  },
  
  update: function(oldData) {
    // Skip on first initialization
    if (Object.keys(oldData).length === 0) return;
    
    // Update component attributes when component properties change
    if (oldData.width !== this.data.width || oldData.height !== this.data.height) {
      // Update the invisible interaction plane dimensions
      this.plane.setAttribute('width', this.data.width);
      this.plane.setAttribute('height', this.data.height);
      
      // Grid size is fixed at 8m x 8m, no need to update it
    }
    
    // Color changes don't apply to the invisible plane
    
    // Keep the plane completely invisible
    this.plane.setAttribute('opacity', 0);
    
    if (oldData.visible !== this.data.visible) {
      // Visibility applies to the whole container
      this.planeContainer.setAttribute('visible', this.data.visible);
    }
  },
  
  remove: function() {
    // Remove event listeners
    this.el.sceneEl.removeEventListener('wall-reset', this.onWallReset);
    this.el.sceneEl.removeEventListener('wall-adjust-start', this.onWallAdjustStart);
    this.el.sceneEl.removeEventListener('scene-state-changed', this.onStateChanged);
    
    // Remove wall container and all children
    if (this.planeContainer && this.planeContainer.parentNode) {
      this.planeContainer.parentNode.removeChild(this.planeContainer);
    }
  }
});
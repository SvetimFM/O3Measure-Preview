/**
 * Scene State Management Component
 * 
 * Manages application state for the O3Measure app
 * Uses a singleton pattern to store state across components
 * Components can access and modify state through this system
 */

AFRAME.registerSystem('scene-state', {
  schema: {},
  
  init: function() {
    console.log('Scene State: Initializing');
    
    // Global state object
    this.state = {
      calibration: {
        wall: {
          isCalibrated: false,
          position: { x: 0, y: 1, z: -2 },
          rotation: { x: 0, y: 0, z: 0 },
          width: 4,  // Wider wall
          height: 3, // Taller wall
          color: '#888888',
          opacity: 0.6,
          visible: false,
          adjustmentFactor: 0.01 // How much to move per adjustment (in meters)
        }
      },
      objects: [] // Array for storing defined objects
    };
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Scene State: Initialized');
  },
  
  setupEventListeners: function() {
    this.el.addEventListener('scene-state-update', this.onStateUpdate.bind(this));
    this.el.addEventListener('wall-calibration-action', this.onWallCalibrationAction.bind(this));
  },
  
  // Get state or substate
  getState: function(path) {
    if (!path) return this.state;
    
    // Access nested properties via dot notation (e.g., 'calibration.wall')
    return path.split('.').reduce((obj, prop) => {
      return obj && obj[prop] !== undefined ? obj[prop] : null;
    }, this.state);
  },
  
  // Update state
  updateState: function(path, value) {
    if (!path) return;
    
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((obj, prop) => {
      if (!(prop in obj)) obj[prop] = {};
      return obj[prop];
    }, this.state);
    
    target[last] = value;
    
    // Emit state change event
    this.el.emit('scene-state-changed', {
      path: path,
      value: value
    });
    
    console.log(`Scene State: Updated ${path}`, value);
  },
  
  onStateUpdate: function(event) {
    const detail = event.detail;
    
    if (detail && detail.path && detail.value !== undefined) {
      this.updateState(detail.path, detail.value);
    }
  },
  
  onWallCalibrationAction: function(event) {
    const action = event.detail.action;
    
    switch(action) {
      case 'reset-wall-calibration':
        // Reset wall to default values
        this.updateState('calibration.wall.isCalibrated', false);
        this.updateState('calibration.wall.visible', false);
        this.el.emit('wall-reset');
        console.log('Scene State: Wall calibration reset');
        break;
        
      case 'adjust-wall':
        // Make wall visible and enter adjustment mode
        this.updateState('calibration.wall.visible', true);
        this.el.emit('wall-adjust-start');
        console.log('Scene State: Wall adjustment started');
        break;
        
      case 'move-wall-closer':
        // Move wall closer to user
        this.adjustWallPosition(-1); // Negative means closer
        console.log('Scene State: Moving wall closer');
        break;
        
      case 'move-wall-farther':
        // Move wall farther from user
        this.adjustWallPosition(1); // Positive means farther
        console.log('Scene State: Moving wall farther');
        break;
    }
  },
  
  adjustWallPosition: function(direction) {
    // Get current wall state
    const wall = this.getState('calibration.wall');
    if (!wall || !wall.visible) return;
    
    // Get adjustment factor
    const factor = wall.adjustmentFactor || 0.01; // Default 1cm
    
    // Get wall normal direction (simplified - assumes wall faces user on Z axis)
    const normal = new THREE.Vector3(0, 0, 1);
    
    // Apply rotation to normal if wall is rotated
    if (wall.rotation) {
      const rotation = new THREE.Euler(
        THREE.MathUtils.degToRad(wall.rotation.x),
        THREE.MathUtils.degToRad(wall.rotation.y),
        THREE.MathUtils.degToRad(wall.rotation.z),
        'XYZ'
      );
      normal.applyEuler(rotation);
    }
    
    // Scale normal by adjustment factor and direction
    normal.multiplyScalar(factor * direction);
    
    // Update position
    const newPosition = {
      x: wall.position.x + normal.x,
      y: wall.position.y + normal.y,
      z: wall.position.z + normal.z
    };
    
    // Update state
    this.updateState('calibration.wall.position', newPosition);
    
    console.log('Scene State: Wall adjusted to', newPosition);
  }
});
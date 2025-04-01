/**
 * Menu Manager Component
 * 
 * Creates a single draggable panel that manages different menu contexts
 * All UI elements are rendered on the same panel to maintain positioning
 * Handles navigation between different menu types without creating new panels
 */

AFRAME.registerComponent('menu-manager', {
  schema: {
    width: { type: 'number', default: 0.30 },
    height: { type: 'number', default: 0.20 },
    color: { type: 'color', default: '#333333' },
    borderWidth: { type: 'number', default: 0.003 },
    borderColor: { type: 'color', default: '#db8814' },
    active: { type: 'boolean', default: true },
    grabbable: { type: 'boolean', default: true }
  },

  init: function() {
    console.log('Menu Manager: Initializing');
    
    // Create the panel
    this.createPanel();
    
    // Menu state management
    this.menuStack = [];
    this.currentMenu = 'main';
    
    // Set visibility based on active state
    this.el.setAttribute('visible', this.data.active);
    
    // Position the panel in front of the user
    this.positionInFrontOfUser();
    
    // Show main menu initially
    this.showMenu('main');
    
    // Set up event listeners
    this.setupEventListeners();

    console.log('Menu Manager: Initialized with menu:', this.currentMenu);
  },
  
  createPanel: function() {
    // Setup the UI container - either a grabbable backing or a regular entity
    if (this.data.grabbable) {
      // Create grabbable backing using box geometry as the container
      this.container = document.createElement('a-entity');
      this.container.setAttribute('geometry', {
        primitive: 'box',
        width: this.data.width + this.data.borderWidth * 2,
        height: this.data.height + this.data.borderWidth * 2,
        depth: 0.005 // Very thin
      });
      this.container.setAttribute('material', {
        color: '#222222',
        shader: 'flat'
      });
      this.container.setAttribute('class', 'grabbable');
      this.container.setAttribute('grabbable', '');
      
      console.log('Menu Manager: Created grabbable container');
    } else {
      // Create regular container
      this.container = document.createElement('a-entity');
    }
    
    // Add the container to the entity
    this.el.appendChild(this.container);
    
    // Create main background panel as child of container
    this.panel = document.createElement('a-plane');
    this.panel.setAttribute('width', this.data.width);
    this.panel.setAttribute('height', this.data.height);
    this.panel.setAttribute('color', this.data.color);
    this.panel.setAttribute('shader', 'flat');
    this.panel.setAttribute('side', 'double');
    this.panel.setAttribute('position', '0 0 0.003'); // Slightly in front of container
    
    // Create border as child of container
    this.border = document.createElement('a-plane');
    this.border.setAttribute('width', this.data.width + this.data.borderWidth * 2);
    this.border.setAttribute('height', this.data.height + this.data.borderWidth * 2);
    this.border.setAttribute('color', this.data.borderColor);
    this.border.setAttribute('shader', 'flat');
    this.border.setAttribute('side', 'double');
    this.border.setAttribute('position', '0 0 0.002'); // Between panel and container
    
    // Create content container for menu elements
    this.contentContainer = document.createElement('a-entity');
    this.contentContainer.setAttribute('position', '0 0 0.004'); // In front of the panel
    
    // Add to container in the right order for proper layering
    this.container.appendChild(this.border);
    this.container.appendChild(this.panel);
    this.container.appendChild(this.contentContainer);
  },
  
  setupEventListeners: function() {
    // Bind event handlers
    this.onMenuAction = this.onMenuAction.bind(this);
    this.onSelectStart = this.onSelectStart.bind(this);
    
    // Listen for menu action events
    this.el.sceneEl.addEventListener('menu-action', this.onMenuAction);
    
    // Listen for system menu gesture (selectstart event)
    this.el.sceneEl.addEventListener('selectstart', this.onSelectStart);
  },
  
  onSelectStart: function(event) {
    // Check if this is a system menu selection (palm-up menu button)
    const inputSource = event.detail?.inputSource;
    if (inputSource?.targetRayMode === 'tracked-pointer' && 
        inputSource?.handedness && 
        inputSource?.profiles?.includes('hand')) {
        
      console.log('Menu Manager: System menu gesture detected, showing main menu');
      
      // Position menu in front of user
      this.positionInFrontOfUser();
      
      // Show menu and navigate to main menu
      this.show();
      this.showMenu('main');
    }
  },
  
  onMenuAction: function(event) {
    const detail = event.detail;
    const action = detail.action;
    
    console.log('Menu action received:', action);
    
    // Handle navigation between menus
    switch(action) {
      case 'wall-calibration':
        // Push current menu to stack for back navigation
        this.menuStack.push(this.currentMenu);
        this.showMenu('wall-calibration');
        break;
        
      case 'start-wall-calibration':
        // Push current menu to stack for back navigation
        this.menuStack.push(this.currentMenu);
        this.showMenu('wall-point-selection');
        break;
        
      case 'back-to-main-menu':
        // Navigate back to main menu
        if (this.menuStack.length > 0) {
          const previousMenu = this.menuStack.pop();
          this.showMenu(previousMenu);
        } else {
          this.showMenu('main');
        }
        break;
    }
  },
  
  showMenu: function(menuId) {
    console.log('Showing menu:', menuId);
    
    // Clear current content
    this.clearMenuContent();
    
    // Create new menu content based on menuId
    switch(menuId) {
      case 'main':
        this.createMainMenu();
        break;
      case 'wall-calibration':
        this.createWallCalibrationMenu();
        break;
      case 'wall-adjustment':
        this.createWallAdjustmentMenu();
        break;
      case 'wall-point-selection':
        this.createWallPointSelectionMenu();
        break;
      default:
        console.warn('Unknown menu:', menuId);
        this.createMainMenu();
    }
    
    this.currentMenu = menuId;
  },
  
  clearMenuContent: function() {
    // Remove all children from content container
    while (this.contentContainer.firstChild) {
      this.contentContainer.removeChild(this.contentContainer.firstChild);
    }
  },
  
  createMainMenu: function() {
    // Add title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'O3Measure');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.015} 0`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.contentContainer.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Menu');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 ${this.data.height/2 - 0.035} 0`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.025 0.025 0.025');
    this.contentContainer.appendChild(subtitle);
    
    // Add a divider line
    const divider = document.createElement('a-entity');
    divider.setAttribute('geometry', {
      primitive: 'plane',
      width: this.data.width - 0.01,
      height: 0.001
    });
    divider.setAttribute('material', {
      color: this.data.borderColor,
      shader: 'flat'
    });
    divider.setAttribute('position', `0 ${this.data.height/2 - 0.05} 0`);
    this.contentContainer.appendChild(divider);
    
    // Create column of menu buttons
    this.createMainMenuButtons();
  },
  
  createMainMenuButtons: function() {
    // Calculate starting Y position based on panel height
    const startY = this.data.height/2 - 0.07; 
    const spacing = 0.0275;
    
    // Button config - defines labels, colors and positions
    const buttons = [
      { label: 'Placeholder', color: '#4285F4', position: `0 ${startY} 0` },
      { label: 'Placeholder_1', color: '#0F9D58', position: `0 ${startY - spacing} 0` },
      { label: 'Placeholder_2', color: '#DB4437', position: `0 ${startY - spacing*2} 0` },
      { label: 'Wall Calibration', color: '#F4B400', position: `0 ${startY - spacing*3} 0` }
    ];
    
    // Create all buttons in a column
    buttons.forEach((config) => {
      const button = document.createElement('a-entity');
      button.setAttribute('button', {
        label: config.label,
        width: 0.14,
        height: 0.025,
        color: config.color,
        textColor: '#FFFFFF'
      });
      button.setAttribute('position', config.position);
      
      // Add event listener for button press
      button.addEventListener('button-press-ended', (event) => {
        console.log('Menu button pressed:', event.detail.label);
        this.handleMainMenuButtonPress(event.detail.label);
      });
      
      // Store reference to the button
      button.id = `button-${config.label.toLowerCase().replace(/\s+/g, '-')}`;
      this.contentContainer.appendChild(button);
    });
  },
  
  handleMainMenuButtonPress: function(buttonLabel) {
    // Emit global event with button action
    this.el.sceneEl.emit('menu-action', {
      action: buttonLabel.toLowerCase().replace(/\s+/g, '-')
    });
    
    // Add specific functionality based on button pressed
    switch(buttonLabel) {
      case 'Placeholder':
        console.log('Placeholder function');
        break;
      case 'Placeholder_1':
        console.log('Placeholder_1 function');
        break;
      case 'Placeholder_2':
        console.log('Placeholder_2 function');
        break;
      case 'Wall Calibration':
        console.log('Opening Wall Calibration Interface');
        // Event has already been emitted to navigate to wall calibration menu
        break;
    }
  },
  
  createWallCalibrationMenu: function() {
    // Add title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'Wall Calibration');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.015} 0`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.contentContainer.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Configure Wall Settings');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 ${this.data.height/2 - 0.035} 0`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.025 0.025 0.025');
    this.contentContainer.appendChild(subtitle);
    
    // Add a divider line
    const divider = document.createElement('a-entity');
    divider.setAttribute('geometry', {
      primitive: 'plane',
      width: this.data.width - 0.01,
      height: 0.001
    });
    divider.setAttribute('material', {
      color: this.data.borderColor,
      shader: 'flat'
    });
    divider.setAttribute('position', `0 ${this.data.height/2 - 0.05} 0`);
    this.contentContainer.appendChild(divider);
    
    // Create wall calibration controls
    this.createWallCalibrationControls();
  },
  
  createWallCalibrationControls: function() {
    // Calculate starting Y position based on panel height
    const startY = this.data.height/2 - 0.07;
    const spacing = 0.035;
    
    // Instructional text
    const instructionText = document.createElement('a-text');
    instructionText.setAttribute('value', 'Wall Calibration Options');
    instructionText.setAttribute('align', 'center');
    instructionText.setAttribute('position', `0 ${startY} 0`);
    instructionText.setAttribute('color', '#FFFFFF');
    instructionText.setAttribute('scale', '0.025 0.025 0.025');
    this.contentContainer.appendChild(instructionText);
    
    // Get wall calibration state
    const sceneState = this.el.sceneEl.systems['scene-state'];
    const wallState = sceneState ? sceneState.getState('calibration.wall') : null;
    const isCalibrated = wallState ? wallState.isCalibrated : false;
    
    // Button config - defines calibration options
    const buttons = [
      { 
        label: 'Adjust Wall', 
        color: '#4285F4', 
        position: `0 ${startY - spacing} 0`,
        width: 0.2,
        height: 0.03
      },
      { 
        label: 'Reset Wall Calibration', 
        color: '#DB4437', 
        position: `0 ${startY - spacing*2} 0`,
        width: 0.2,
        height: 0.03
      }
    ];
    
    // Create calibration buttons
    buttons.forEach(config => {
      this.createButton(config);
    });
    
    // Create back button
    this.createBackButton();
  },
  
  createButton: function(config) {
    const button = document.createElement('a-entity');
    button.setAttribute('button', {
      label: config.label,
      width: config.width || 0.14,
      height: config.height || 0.025,
      color: config.color,
      textColor: '#FFFFFF'
    });
    button.setAttribute('position', config.position);
    
    // Add event listener for button press
    button.addEventListener('button-press-ended', (event) => {
      console.log('Wall Calibration button pressed:', event.detail.label);
      this.handleWallCalibrationButtonPress(event.detail.label);
    });
    
    // Store reference to the button
    button.id = `button-${config.label.toLowerCase().replace(/\s+/g, '-')}`;
    this.contentContainer.appendChild(button);
    
    return button;
  },
  
  createBackButton: function() {
    // Back button at the bottom of the menu
    const backButton = this.createButton({
      label: 'Back to Main Menu',
      color: '#DB4437',
      position: `0 ${-this.data.height/2 + 0.025} 0`,
      width: 0.2,
      height: 0.03
    });
  },
  
  handleWallCalibrationButtonPress: function(buttonLabel) {
    const action = buttonLabel.toLowerCase().replace(/\s+/g, '-');
    
    // Emit global event with button action
    this.el.sceneEl.emit('wall-calibration-action', {
      action: action
    });
    
    // Add specific functionality based on button pressed
    switch(buttonLabel) {
      case 'Adjust Wall':
        console.log('Starting wall adjustment');
        // Navigate to wall adjustment menu
        this.menuStack.push(this.currentMenu);
        this.showMenu('wall-adjustment');
        break;
      case 'Reset Wall Calibration':
        console.log('Resetting wall calibration');
        
        // Clear menu content but keep panel visible
        this.clearMenuContent();
        
        // Show calibration UI
        this.showCalibrationUI();
        
        break;
      case 'Back to Main Menu':
        console.log('Returning to main menu');
        
        // Emit event to navigate back to main menu
        this.el.sceneEl.emit('menu-action', {
          action: 'back-to-main-menu'
        });
        break;
    }
  },
  
  showCalibrationUI: function() {
    console.log('Menu Manager: Showing calibration UI');
    
    // Title text
    const title = document.createElement('a-text');
    title.setAttribute('value', 'Wall Calibration');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.015} 0`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.contentContainer.appendChild(title);
    
    // Instructions text
    const instructions = document.createElement('a-text');
    instructions.setAttribute('value', 'Press Start to begin calibration');
    instructions.setAttribute('align', 'center');
    instructions.setAttribute('position', `0 ${this.data.height/2 - 0.05} 0`);
    instructions.setAttribute('color', '#FFFFFF');
    instructions.setAttribute('scale', '0.03 0.03 0.03');
    instructions.setAttribute('id', 'calibration-instructions');
    this.contentContainer.appendChild(instructions);
    
    // Progress indicator
    const progress = document.createElement('a-text');
    progress.setAttribute('value', '0 / 3 points selected');
    progress.setAttribute('align', 'center');
    progress.setAttribute('position', `0 ${this.data.height/2 - 0.08} 0`);
    progress.setAttribute('color', '#4285F4');
    progress.setAttribute('scale', '0.035 0.035 0.035');
    progress.setAttribute('id', 'calibration-progress');
    this.contentContainer.appendChild(progress);
    
    // Start button
    const startButton = document.createElement('a-entity');
    startButton.setAttribute('button', {
      label: 'Start',
      width: 0.12,
      height: 0.04,
      color: '#4285F4'
    });
    startButton.setAttribute('position', '-0.07 0 0');
    startButton.setAttribute('id', 'calibration-start-button');
    startButton.addEventListener('button-press-ended', this.onStartCalibration.bind(this));
    this.contentContainer.appendChild(startButton);
    
    // Cancel button
    const cancelButton = document.createElement('a-entity');
    cancelButton.setAttribute('button', {
      label: 'Cancel',
      width: 0.12,
      height: 0.04,
      color: '#DB4437'
    });
    cancelButton.setAttribute('position', '0.07 0 0');
    cancelButton.addEventListener('button-press-ended', this.onCancelCalibration.bind(this));
    this.contentContainer.appendChild(cancelButton);
    
    // Store state for calibration
    this.calibrationState = {
      step: 0,
      points: [],
      markers: []
    };
    
    // Set up pinch event listener
    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.el.sceneEl.addEventListener('pinchstarted', this.onPinchStarted);
    
    // Save current menu for return
    this.previousMenu = this.currentMenu;
    this.currentMenu = 'calibration';
  },
  
  onStartCalibration: function() {
    const startButton = document.getElementById('calibration-start-button');
    const instructions = document.getElementById('calibration-instructions');
    
    // Check if we're in "Done" state
    if (startButton.getAttribute('button').label === 'Done') {
      console.log('Menu Manager: Calibration complete, returning to menu');
      
      // Clean up
      this.cleanupCalibration();
      
      // Return to previous menu
      this.showMenu('wall-calibration');
      return;
    }
    
    // Begin calibration
    this.calibrationState.step = 1;
    
    // Update UI
    instructions.setAttribute('value', 'Pinch on the first point of the wall (top left)');
    
    // Grey out start button
    startButton.setAttribute('button', {
      label: 'Started',
      width: 0.12,
      height: 0.04,
      color: '#888888' // Grey color
    });
    
    console.log('Menu Manager: Started wall point selection');
  },
  
  onCancelCalibration: function() {
    console.log('Menu Manager: Cancelled calibration');
    
    // Clean up
    this.cleanupCalibration();
    
    // Return to previous menu
    this.showMenu('wall-calibration');
  },
  
  cleanupCalibration: function() {
    // Remove event listeners
    this.el.sceneEl.removeEventListener('pinchstarted', this.onPinchStarted);
    
    // Remove all markers
    this.removeMarkers();
    
    // Reset calibration state
    this.calibrationState = {
      step: 0,
      points: [],
      markers: []
    };
  },
  
  removeMarkers: function() {
    // Remove all point markers from scene
    if (this.calibrationState && this.calibrationState.markers) {
      this.calibrationState.markers.forEach(marker => {
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker);
        }
      });
      this.calibrationState.markers = [];
    }
  },
  
  onPinchStarted: function(event) {
    // Only process pinch events when in calibration mode
    if (!this.calibrationState || this.calibrationState.step < 1 || this.calibrationState.step > 3) {
      return;
    }
    
    console.log('Menu Manager: Pinch detected in calibration, step:', this.calibrationState.step);
    
    // Prevent multiple pinches from being processed too quickly
    const now = Date.now();
    if (this.lastPinchTime && (now - this.lastPinchTime < 1000)) {
      console.log('Menu Manager: Ignoring pinch, too soon after last pinch');
      return;
    }
    this.lastPinchTime = now;
    
    // Get position from pinch event
    let worldPosition;
    
    if (event.detail && event.detail.position) {
      // Get position directly from event
      const position = event.detail.position;
      worldPosition = new THREE.Vector3(position.x, position.y, position.z);
    } else {
      // Get position from hand entity if position not in event
      const hand = event.detail.hand === 'left' ? 'leftHand' : 'rightHand';
      const handEls = document.querySelectorAll(`#${hand}`);
      
      if (handEls.length > 0) {
        const handEl = handEls[0];
        const position = handEl.getAttribute('position');
        worldPosition = new THREE.Vector3(position.x, position.y, position.z);
      } else {
        console.error('Menu Manager: Could not find hand entity');
        return;
      }
    }
    
    // Process this pinch point
    this.processCalibrationPoint(worldPosition);
  },
  
  processCalibrationPoint: function(position) {
    // Store point
    this.calibrationState.points.push(position);
    
    // Create visual marker at point
    this.createMarker(position, this.calibrationState.step);
    
    // Update progress indicator
    const progress = document.getElementById('calibration-progress');
    progress.setAttribute('value', `${this.calibrationState.points.length} / 3 points selected`);
    
    // Update instructions for next point
    const instructions = document.getElementById('calibration-instructions');
    
    if (this.calibrationState.step === 1) {
      instructions.setAttribute('value', 'Pinch on the second point of the wall (top right)');
      this.calibrationState.step = 2;
    } else if (this.calibrationState.step === 2) {
      instructions.setAttribute('value', 'Pinch on the third point of the wall (bottom left or right)');
      this.calibrationState.step = 3;
    } else if (this.calibrationState.step === 3) {
      // All points collected, process the calibration
      this.finalizeCalibration();
    }
  },
  
  createMarker: function(position, index) {
    // Create a visual marker at the selected point
    const marker = document.createElement('a-entity');
    
    // Create sphere for the marker
    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('radius', 0.02);
    sphere.setAttribute('color', index === 1 ? '#4285F4' : (index === 2 ? '#0F9D58' : '#F4B400'));
    sphere.setAttribute('shader', 'flat');
    marker.appendChild(sphere);
    
    // Create label
    const label = document.createElement('a-text');
    label.setAttribute('value', `Point ${index}`);
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 0.05 0');
    label.setAttribute('scale', '0.1 0.1 0.1');
    label.setAttribute('color', '#FFFFFF');
    label.setAttribute('look-at', '[camera]');
    marker.appendChild(label);
    
    // Position marker
    marker.setAttribute('position', position);
    
    // Add to scene
    this.el.sceneEl.appendChild(marker);
    
    // Store reference to marker
    this.calibrationState.markers.push(marker);
  },
  
  finalizeCalibration: function() {
    if (this.calibrationState.points.length !== 3) {
      console.error('Menu Manager: Not enough points for calibration');
      return;
    }
    
    // Calculate wall plane from three points
    const plane = this.calculatePlaneFromPoints(
      this.calibrationState.points[0],
      this.calibrationState.points[1],
      this.calibrationState.points[2]
    );
    
    if (!plane) {
      console.error('Menu Manager: Failed to calculate plane');
      return;
    }
    
    // Update UI
    const instructions = document.getElementById('calibration-instructions');
    instructions.setAttribute('value', 'Calibration complete! Wall created successfully.');
    
    const progress = document.getElementById('calibration-progress');
    progress.setAttribute('value', '3 / 3 points - Complete!');
    
    // Reset start button to active state with Done label
    const startButton = document.getElementById('calibration-start-button');
    startButton.setAttribute('button', {
      label: 'Done',
      width: 0.12,
      height: 0.04,
      color: '#4285F4' // Active blue color
    });
    
    // Get scene state system
    const sceneState = this.el.sceneEl.systems['scene-state'];
    if (sceneState) {
      // Calculate the center point of the triangle
      const center = new THREE.Vector3()
        .add(this.calibrationState.points[0])
        .add(this.calibrationState.points[1])
        .add(this.calibrationState.points[2])
        .divideScalar(3);
      
      // Update wall state
      sceneState.updateState('calibration.wall.position', {
        x: center.x,
        y: center.y,
        z: center.z
      });
      
      sceneState.updateState('calibration.wall.rotation', {
        x: THREE.MathUtils.radToDeg(plane.rotation.x),
        y: THREE.MathUtils.radToDeg(plane.rotation.y),
        z: THREE.MathUtils.radToDeg(plane.rotation.z)
      });
      
      // Calculate width and height based on points
      const width = this.calibrationState.points[0].distanceTo(this.calibrationState.points[1]);
      const height = this.calibrationState.points[0].distanceTo(this.calibrationState.points[2]);
      
      sceneState.updateState('calibration.wall.width', width);
      sceneState.updateState('calibration.wall.height', height);
      sceneState.updateState('calibration.wall.isCalibrated', true);
      sceneState.updateState('calibration.wall.visible', true);
      
      console.log('Menu Manager: Wall calibrated', {
        position: center,
        rotation: plane.rotation,
        width: width,
        height: height
      });
    }
    
    // Reset step to indicate completion
    this.calibrationState.step = 0;
  },
  
  calculatePlaneFromPoints: function(p1, p2, p3) {
    // Calculate two vectors on the plane
    const v1 = new THREE.Vector3().subVectors(p2, p1);
    const v2 = new THREE.Vector3().subVectors(p3, p1);
    
    // Calculate normal vector using cross product
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
    
    // Ensure normal is pointing towards the user (positive Z)
    if (normal.z < 0) {
      normal.negate();
    }
    
    // Get rotation from normal vector
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), // Default normal (facing user)
      normal
    );
    rotation.setFromQuaternion(quaternion);
    
    return {
      normal: normal,
      rotation: rotation,
      point: p1
    };
  },
  
  createWallAdjustmentMenu: function() {
    // Add title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'Wall Adjustment');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.015} 0`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.contentContainer.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Move wall closer or farther');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 ${this.data.height/2 - 0.035} 0`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.025 0.025 0.025');
    this.contentContainer.appendChild(subtitle);
    
    // Add a divider line
    const divider = document.createElement('a-entity');
    divider.setAttribute('geometry', {
      primitive: 'plane',
      width: this.data.width - 0.01,
      height: 0.001
    });
    divider.setAttribute('material', {
      color: this.data.borderColor,
      shader: 'flat'
    });
    divider.setAttribute('position', `0 ${this.data.height/2 - 0.05} 0`);
    this.contentContainer.appendChild(divider);
    
    // Calculate button positions
    const startY = this.data.height/2 - 0.08;
    
    // Create Move Closer button
    const closerButton = document.createElement('a-entity');
    closerButton.setAttribute('button', {
      label: 'Move Closer',
      width: 0.14,
      height: 0.04,
      color: '#4285F4'
    });
    closerButton.setAttribute('position', `0 ${startY} 0`);
    closerButton.addEventListener('button-press-ended', this.onMoveWallCloser.bind(this));
    this.contentContainer.appendChild(closerButton);
    
    // Create Move Farther button
    const fartherButton = document.createElement('a-entity');
    fartherButton.setAttribute('button', {
      label: 'Move Farther',
      width: 0.14,
      height: 0.04,
      color: '#0F9D58'
    });
    fartherButton.setAttribute('position', `0 ${startY - 0.05} 0`);
    fartherButton.addEventListener('button-press-ended', this.onMoveWallFarther.bind(this));
    this.contentContainer.appendChild(fartherButton);
    
    // Create Back button to return to wall calibration menu
    const backButton = document.createElement('a-entity');
    backButton.setAttribute('button', {
      label: 'Back',
      width: 0.14,
      height: 0.04,
      color: '#DB4437'
    });
    backButton.setAttribute('position', `0 ${startY - 0.10} 0`);
    backButton.addEventListener('button-press-ended', this.onWallAdjustmentBack.bind(this));
    this.contentContainer.appendChild(backButton);
  },
  
  onMoveWallCloser: function() {
    // Emit event to move wall closer
    this.el.sceneEl.emit('wall-calibration-action', {
      action: 'move-wall-closer'
    });
    
    console.log('Menu Manager: Moving wall closer');
  },
  
  onMoveWallFarther: function() {
    // Emit event to move wall farther
    this.el.sceneEl.emit('wall-calibration-action', {
      action: 'move-wall-farther'
    });
    
    console.log('Menu Manager: Moving wall farther');
  },
  
  onWallAdjustmentBack: function() {
    // Return to previous menu (wall calibration)
    if (this.menuStack.length > 0) {
      const previousMenu = this.menuStack.pop();
      this.showMenu(previousMenu);
    } else {
      // Fallback to wall calibration menu if stack is empty
      this.showMenu('wall-calibration');
    }
    
    console.log('Menu Manager: Exiting wall adjustment');
  },
  
  positionInFrontOfUser: function() {
    // Position the UI in front of the user at eye level
    // Default camera is at 0, 1.6, 0 looking down -Z axis
    this.el.setAttribute('position', '0 1.0 -0.5');
    
    // Slight downward tilt for better visibility
    this.el.setAttribute('rotation', '-15 0 0');
    
    console.log('Menu Manager: Positioned in front of user');
  },
  
  show: function() {
    this.data.active = true;
    this.el.setAttribute('visible', true);
  },
  
  hide: function() {
    this.data.active = false;
    this.el.setAttribute('visible', false);
  },
  
  update: function(oldData) {
    // Skip on first initialization
    if (Object.keys(oldData).length === 0) return;
    
    // Update panel dimensions
    if (oldData.width !== this.data.width || oldData.height !== this.data.height) {
      this.panel.setAttribute('width', this.data.width);
      this.panel.setAttribute('height', this.data.height);
      this.border.setAttribute('width', this.data.width + this.data.borderWidth * 2);
      this.border.setAttribute('height', this.data.height + this.data.borderWidth * 2);
      
      // Update container geometry if it's grabbable
      if (this.data.grabbable) {
        this.container.setAttribute('geometry', {
          width: this.data.width + this.data.borderWidth * 2,
          height: this.data.height + this.data.borderWidth * 2,
          depth: 0.005
        });
      }
      
      // Re-show current menu to update layout
      this.showMenu(this.currentMenu);
    }
    
    // Update colors
    if (oldData.color !== this.data.color) {
      this.panel.setAttribute('color', this.data.color);
    }
    
    if (oldData.borderColor !== this.data.borderColor) {
      this.border.setAttribute('color', this.data.borderColor);
    }
    
    // Update visibility
    if (oldData.active !== this.data.active) {
      this.el.setAttribute('visible', this.data.active);
    }
    
    // Handle changes to grabbable state
    if (oldData.grabbable !== this.data.grabbable) {
      // This is a major change that requires reconstruction of the UI
      // Remove all existing content
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      
      // Recreate everything
      this.createPanel();
      this.showMenu(this.currentMenu);
    }
  },
  
  remove: function() {
    // Remove event listeners
    this.el.sceneEl.removeEventListener('menu-action', this.onMenuAction);
    this.el.sceneEl.removeEventListener('selectstart', this.onSelectStart);
    
    // Clean up calibration resources if present
    if (this.onPinchStarted) {
      this.el.sceneEl.removeEventListener('pinchstarted', this.onPinchStarted);
    }
    
    // Remove any markers
    if (this.removeMarkers) {
      this.removeMarkers();
    }
    
    // Just remove the container - this will handle all children
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
});
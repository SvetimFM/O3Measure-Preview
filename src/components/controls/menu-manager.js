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
    // Listen for menu action events
    this.onMenuAction = this.onMenuAction.bind(this);
    this.el.sceneEl.addEventListener('menu-action', this.onMenuAction);
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
    instructionText.setAttribute('value', 'Select a wall to calibrate');
    instructionText.setAttribute('align', 'center');
    instructionText.setAttribute('position', `0 ${startY} 0`);
    instructionText.setAttribute('color', '#FFFFFF');
    instructionText.setAttribute('scale', '0.025 0.025 0.025');
    this.contentContainer.appendChild(instructionText);
    
    // Button config - defines calibration options
    const buttons = [
      { 
        label: 'Start Wall Scan', 
        color: '#4285F4', 
        position: `0 ${startY - spacing} 0`,
        width: 0.2,
        height: 0.03
      },
      { 
        label: 'Set Wall Height', 
        color: '#0F9D58', 
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
    // Emit global event with button action
    this.el.sceneEl.emit('wall-calibration-action', {
      action: buttonLabel.toLowerCase().replace(/\s+/g, '-')
    });
    
    // Add specific functionality based on button pressed
    switch(buttonLabel) {
      case 'Start Wall Scan':
        console.log('Starting wall scan process');
        break;
      case 'Set Wall Height':
        console.log('Setting wall height');
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
    
    // Just remove the container - this will handle all children
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
});
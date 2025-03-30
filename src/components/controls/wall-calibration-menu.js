/**
 * Wall Calibration Menu Component
 * 
 * Creates a specialized menu for wall calibration functions
 * Appears when the Wall Calibration button is pressed in the main menu
 * Provides wall-specific calibration options and a back button to return to main menu
 */

AFRAME.registerComponent('wall-calibration-menu', {
  schema: {
    width: { type: 'number', default: 0.30 },
    height: { type: 'number', default: 0.25 },
    color: { type: 'color', default: '#333333' },
    borderWidth: { type: 'number', default: 0.003 },
    borderColor: { type: 'color', default: '#db8814' },
    active: { type: 'boolean', default: false },
    grabbable: { type: 'boolean', default: true }
  },

  init: function() {
    console.log('Wall Calibration Menu: Initializing');
    
    // Create the panel
    this.createPanel();
    
    // Create menu content
    this.createMenuContent();
    
    // Set visibility based on active state
    this.el.setAttribute('visible', this.data.active);
    
    // Position the panel in front of the user
    this.positionInFrontOfUser();
    
    // Listen for menu action events
    this.el.sceneEl.addEventListener('menu-action', this.onMenuAction.bind(this));
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
    
    // Add to container in the right order for proper layering
    this.container.appendChild(this.border);
    this.container.appendChild(this.panel);
  },
  
  createMenuContent: function() {
    // Add title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'Wall Calibration');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.015} 0.004`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.container.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Configure Wall Settings');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 ${this.data.height/2 - 0.035} 0.004`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.025 0.025 0.025');
    this.container.appendChild(subtitle);
    
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
    divider.setAttribute('position', `0 ${this.data.height/2 - 0.05} 0.004`);
    this.container.appendChild(divider);
    
    // Create calibration controls
    this.createCalibrationControls();
    
    // Create back button
    this.createBackButton();
  },
  
  createCalibrationControls: function() {
    // Calculate starting Y position based on panel height
    const startY = this.data.height/2 - 0.07;
    const spacing = 0.035;
    
    // Instructional text
    const instructionText = document.createElement('a-text');
    instructionText.setAttribute('value', 'Select a wall to calibrate');
    instructionText.setAttribute('align', 'center');
    instructionText.setAttribute('position', `0 ${startY} 0.004`);
    instructionText.setAttribute('color', '#FFFFFF');
    instructionText.setAttribute('scale', '0.025 0.025 0.025');
    this.container.appendChild(instructionText);
    
    // Button config - defines calibration options
    const buttons = [
      { 
        label: 'Start Wall Scan', 
        color: '#4285F4', 
        position: `0 ${startY - spacing} 0.004`,
        width: 0.2,
        height: 0.03
      },
      { 
        label: 'Set Wall Height', 
        color: '#0F9D58', 
        position: `0 ${startY - spacing*2} 0.004`,
        width: 0.2,
        height: 0.03
      }
    ];
    
    // Create calibration buttons
    buttons.forEach(config => {
      this.createButton(config);
    });
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
      this.handleButtonPress(event.detail.label);
    });
    
    // Store reference to the button
    button.id = `button-${config.label.toLowerCase().replace(/\s+/g, '-')}`;
    this.container.appendChild(button);
    
    return button;
  },
  
  createBackButton: function() {
    // Back button at the bottom of the menu
    const backButton = this.createButton({
      label: 'Back to Main Menu',
      color: '#DB4437',
      position: `0 ${-this.data.height/2 + 0.025} 0.004`,
      width: 0.2,
      height: 0.03
    });
  },
  
  positionInFrontOfUser: function() {
    // Position the UI in front of the user at eye level
    // Default camera is at 0, 1.6, 0 looking down -Z axis
    this.el.setAttribute('position', '0 1.1 -0.5');
    
    // Slight downward tilt for better visibility
    this.el.setAttribute('rotation', '-15 0 0');
  },
  
  handleButtonPress: function(buttonLabel) {
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
        this.hide();
        
        // Emit event to notify that wall calibration menu is closed
        this.el.sceneEl.emit('wall-calibration-closed');
        
        // Find and show the main menu
        const mainMenu = document.getElementById('menuPanel');
        if (mainMenu && mainMenu.components['menu-panel']) {
          mainMenu.components['menu-panel'].el.setAttribute('visible', true);
        }
        break;
    }
  },
  
  show: function() {
    this.data.active = true;
    this.el.setAttribute('visible', true);
  },
  
  hide: function() {
    this.data.active = false;
    this.el.setAttribute('visible', false);
  },
  
  onMenuAction: function(event) {
    const detail = event.detail;
    
    // Check if this event is for wall calibration
    if (detail.action === 'wall-calibration') {
      console.log('Wall calibration menu received show signal');
      this.show();
      
      // Store reference to the source menu if provided
      if (detail.menuId) {
        this.sourceMenuId = detail.menuId;
      }
    }
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
      this.createMenuContent();
    }
  },
  
  remove: function() {
    // Remove event listener
    this.el.sceneEl.removeEventListener('menu-action', this.onMenuAction);
    
    // Just remove the container - this will handle all children
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
});
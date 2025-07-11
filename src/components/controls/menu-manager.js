/**
 * Menu Manager Component
 * 
 * Creates a menu panel positioned in front of the user with a grabbable backing
 * Manages different menu contexts using the menu registry
 * Handles menu navigation and events
 */

import { MenuRegistry } from './menu-system/index.js';
import { events } from '../../utils/index.js';

const { EVENTS } = events;

AFRAME.registerComponent('menu-manager', {
  schema: {
    width: { type: 'number', default: 0.1 },
    height: { type: 'number', default: 0.3 },
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
    this.currentMenu = null;
    this.activeMenu = null;
    
    // Set visibility based on active state
    this.el.setAttribute('visible', this.data.active);
    
    // Position the panel in front of the user
    this.positionInFrontOfUser();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Show main menu initially
    this.showMenu('main');

    console.log('Menu Manager: Initialized with menu:', this.currentMenu);
  },
  
  createPanel: function() {
    console.log('Menu Manager: Creating panel...');
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
      this.container.setAttribute('obb-collider', '');
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
    this.el.sceneEl.addEventListener(EVENTS.MENU.ACTION, this.onMenuAction);
    
    // Listen for system menu gesture (selectstart event)
    this.el.sceneEl.addEventListener('selectstart', this.onSelectStart);
  },
  
  //TODO: FIX this for different headsets (start button should invoke main menu in front of user)
  onSelectStart: function() {
  },
  
  onMenuAction: function(event) {
    const action = event.detail.action;
    const params = {};
    
    // Extract any parameters from the event
    for (const key in event.detail) {
      if (key !== 'action' && key !== 'menu') {
        params[key] = event.detail[key];
      }
    }
    
    console.log('Menu Manager: Menu action received -', action, 'with params:', params);
    
    // Handle navigation between menus
    switch(action) {
      case 'wall-calibration':
        // Push current menu to stack for back navigation
        this.pushMenu('wall-calibration', params);
        break;
        
      case 'reset-wall-calibration':
        // Push current menu to stack for back navigation
        this.pushMenu('wall-point-selection', params);
        break;
        
      case 'adjust-wall':
        // Push current menu to stack for back navigation
        this.pushMenu('wall-adjustment', params);
        break;
        
      case 'object-definition':
        // Push current menu to stack for back navigation
        this.pushMenu('object-definition', params);
        break;
        
      case 'anchor-placement':
        // Navigate to anchor placement menu with parameters
        this.pushMenu('anchor-placement', params);
        break;
        
      case 'anchor-placement-completed':
      case 'back-to-object-definition':
        // Return to object definition menu with parameters
        this.showMenu('object-definition', params);
        break;
        
      case 'view-items':
        // Navigate to the view items menu
        this.pushMenu('view-items', params);
        break;
        
      case 'back-to-main-menu':
        // Navigate back to main menu
        this.showMenu('main');
        this.menuStack = []; // Clear navigation stack
        break;
        
      case 'back-to-previous-menu':
        // Navigate back to previous menu
        this.popMenu();
        break;
    }
  },
  
  pushMenu: function(menuId, params = {}) {
    // Add current menu to stack and show the new one
    if (this.currentMenu) {
      this.menuStack.push(this.currentMenu);
    }
    this.showMenu(menuId, params);
  },
  
  popMenu: function() {
    // Go back to the previous menu
    if (this.menuStack.length > 0) {
      const previousMenu = this.menuStack.pop();
      this.showMenu(previousMenu);
    } else {
      // Default to main menu if stack is empty
      this.showMenu('main');
    }
  },
  
  showMenu: function(menuId, params = {}) {
    console.log('Menu Manager: Showing menu -', menuId, 'with params:', params);
    
    // Check if menu exists in registry
    if (!MenuRegistry.hasMenu(menuId)) {
      console.error(`Menu Manager: Menu '${menuId}' not found in registry`);
      return;
    }
    
    // Clean up previous menu if any
    this.clearMenu();
    
    // Get menu from registry
    const menuDefinition = MenuRegistry.getMenu(menuId);
    
    // Add parameters to data
    const menuData = {
      ...this.data,
      params: params
    };
    
    // Initialize the menu with our container and data
    const menu = Object.create(menuDefinition);
    menu.init(this.contentContainer, menuData, this.el.sceneEl);
    
    // Render the menu
    menu.render();
    
    // Save reference to active menu
    this.activeMenu = menu;
    this.currentMenu = menuId;
  },
  
  clearMenu: function() {
    // Clean up active menu if there is one
    if (this.activeMenu && this.activeMenu.cleanup) {
      this.activeMenu.cleanup();
    }
    
    // Clear content container
    while (this.contentContainer.firstChild) {
      this.contentContainer.removeChild(this.contentContainer.firstChild);
    }
    
    this.activeMenu = null;
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
    // Clean up active menu
    this.clearMenu();
    
    // Remove event listeners
    this.el.sceneEl.removeEventListener(EVENTS.MENU.ACTION, this.onMenuAction);
    this.el.sceneEl.removeEventListener('selectstart', this.onSelectStart);
    
    // Just remove the container - this will handle all children
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
});
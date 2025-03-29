/**
 * UI Panel Component
 * 
 * Creates a grabbable UI panel positioned in front of the user
 * Used for menu and interaction purposes in AR/VR
 */

AFRAME.registerComponent('wrist-ui', {
  schema: {
    width: { type: 'number', default: 0.30 },
    height: { type: 'number', default: 0.20 },
    color: { type: 'color', default: '#333333' },
    opacity: { type: 'number', default: 1 },
    borderWidth: { type: 'number', default: 0.003 },
    borderColor: { type: 'color', default: '#db8814' },
    active: { type: 'boolean', default: true }
  },

  init: function() {
    console.log('Wrist UI Component: Initializing');
    
    // Create the UI panel
    console.log('Wrist UI: Creating panel');
    this.createPanel();
    
    // Add demo content
    console.log('Wrist UI: Adding demo content');
    this.addDemoContent();
    
    // Set visibility based on active state
    this.el.setAttribute('visible', this.data.active);
    console.log('Wrist UI: Visibility set to', this.data.active);
    
    // Position the panel in front of the user
    this.positionInFrontOfUser();
    
    // Log the component's element
    console.log('Wrist UI: Component element', this.el);
  },
  
  createPanel: function() {
    // Create main background panel
    this.panel = document.createElement('a-plane');
    this.panel.setAttribute('width', this.data.width);
    this.panel.setAttribute('height', this.data.height);
    this.panel.setAttribute('color', this.data.color);
    this.panel.setAttribute('shader', 'flat');
    this.panel.setAttribute('side', 'double');
    this.panel.setAttribute('position', '0 0 0');
    
    // Create border
    this.border = document.createElement('a-plane');
    this.border.setAttribute('width', this.data.width + this.data.borderWidth * 2);
    this.border.setAttribute('height', this.data.height + this.data.borderWidth * 2);
    this.border.setAttribute('color', this.data.borderColor);
    this.border.setAttribute('shader', 'flat');
    this.border.setAttribute('side', 'double');
    this.border.setAttribute('position', '0 0 -0.001');
    
    // Add to entity (border first so it's behind the panel)
    this.el.appendChild(this.border);
    this.el.appendChild(this.panel);
  },
  
  addDemoContent: function() {
    // Add title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'O3Measure');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.02} 0.001`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.el.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Wrist UI Demo');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 0.02 0.001`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.03 0.03 0.03');
    this.el.appendChild(subtitle);
    
    // Add a divider line
    const divider = document.createElement('a-entity');
    divider.setAttribute('geometry', {
      primitive: 'plane',
      width: this.data.width - 0.02,
      height: 0.002
    });
    divider.setAttribute('material', {
      color: this.data.borderColor,
      shader: 'flat'
    });
    divider.setAttribute('position', `0 -0.02 0.001`);
    this.el.appendChild(divider);
    
    // Add a test button
    const button = document.createElement('a-entity');
    button.setAttribute('geometry', {
      primitive: 'plane',
      width: 0.08,
      height: 0.04
    });
    button.setAttribute('material', {
      color: '#4285F4',
      shader: 'flat'
    });
    button.setAttribute('position', '0 -0.06 0.001');
    this.el.appendChild(button);
    
    // Add button text
    const buttonText = document.createElement('a-text');
    buttonText.setAttribute('value', 'Start');
    buttonText.setAttribute('align', 'center');
    buttonText.setAttribute('position', '0 -0.06 0.002');
    buttonText.setAttribute('color', '#FFFFFF');
    buttonText.setAttribute('scale', '0.03 0.03 0.03');
    this.el.appendChild(buttonText);
  },
  
  positionInFrontOfUser: function() {
    // Position the UI in front of the user at eye level
    // Default camera is at 0, 1.6, 0 looking down -Z axis
    this.el.setAttribute('position', '0 0.6 -0.5');
    
    // Slight downward tilt for better visibility
    this.el.setAttribute('rotation', '-15 0 0');
    
    console.log('Wrist UI: Positioned in front of user');
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
  },
  
  remove: function() {
    // Remove panel elements
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    if (this.border && this.border.parentNode) {
      this.border.parentNode.removeChild(this.border);
    }
  }
});
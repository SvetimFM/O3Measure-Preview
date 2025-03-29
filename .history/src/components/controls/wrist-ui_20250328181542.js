/**
 * Wrist UI Component
 * 
 * Attaches a UI panel to the user's wrist
 * Uses slice9 component for nice looking panels
 */

AFRAME.registerComponent('wrist-ui', {
  schema: {
    hand: { type: 'string', default: 'left' },
    width: { type: 'number', default: 0.10 },
    height: { type: 'number', default: 0.20 },
    color: { type: 'color', default: '#444444' },  // Darker gray for better visibility
    opacity: { type: 'number', default: 0 },
    padding: { type: 'number', default: 0.02 },    // Smaller padding for a tighter UI
    borderWidth: { type: 'number', default: 0.01 }, // Thinner border
    borderColor: { type: 'color', default: '#db8814' },
    active: { type: 'boolean', default: true }
  },

  init: function() {
    // Create the UI panel
    this.createPanel();
    
    // Add demo content
    this.addDemoContent();
    
    // Set visibility based on active state
    this.el.setAttribute('visible', this.data.active);
    
    // Position the UI relative to the hand
    this.positionPanel();
  },
  
  createPanel: function() {
    // Use the proper texture from our assets folder
    const textureSrc = '/src/assets/textures/backgroundMenu.png';
    
    // Create background panel using slice9
    this.panel = document.createElement('a-entity');
    this.panel.setAttribute('slice9', {
      width: this.data.width,
      height: this.data.height,
      left: 20,       // Increased slice margins to match a larger texture
      right: 20,
      top: 20,
      bottom: 20,
      padding: this.data.padding,
      color: this.data.color,
      opacity: this.data.opacity,
      transparent: false,
      src: textureSrc
    });
    
    // Create border - we'll use an additional slice9 entity for the border
    this.border = document.createElement('a-entity');
    this.border.setAttribute('slice9', {
      width: this.data.width + this.data.borderWidth * 2,
      height: this.data.height + this.data.borderWidth * 2,
      left: 20,       // Matching slice margins for consistency
      right: 20,
      top: 20,
      bottom: 20,
      color: this.data.borderColor, 
      opacity: this.data.opacity,
      transparent: true,
      src: textureSrc
    });
    
    // Position border behind the panel
    this.border.setAttribute('position', `0 0 -0.001`);
    
    // Add to entity
    this.el.appendChild(this.border);
    this.el.appendChild(this.panel);
  },
  
  addDemoContent: function() {
    // Add title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'O3Measure');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${this.data.height/2 - 0.02} 0.005`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    this.el.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Wrist UI Demo');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 0 0.005`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.03 0.03 0.03');
    this.el.appendChild(subtitle);
    
    // Add a small divider line
    const divider = document.createElement('a-entity');
    divider.setAttribute('geometry', {
      primitive: 'plane',
      width: this.data.width - 0.04,
      height: 0.002
    });
    divider.setAttribute('material', {
      color: '#3498db',
      opacity: 0.8,
      transparent: true,
      shader: 'flat'
    });
    divider.setAttribute('position', `0 -0.02 0.005`);
    this.el.appendChild(divider);
    
    // Add version text at bottom
    const version = document.createElement('a-text');
    version.setAttribute('value', 'v0.1.0');
    version.setAttribute('align', 'center');
    version.setAttribute('position', `0 ${-this.data.height/2 + 0.02} 0.005`);
    version.setAttribute('color', '#AAAAAA');
    version.setAttribute('scale', '0.02 0.02 0.02');
    this.el.appendChild(version);
  },
  
  positionPanel: function() {
    // Position panel relative to hand
    // For left hand, position on inner wrist but raised up
    if (this.data.hand === 'left') {
      // Attach to wrist area but raised above
      this.el.setAttribute('position', '0.01 0.08 0.08');
      this.el.setAttribute('rotation', '50 0 0');
    } else {
      // For right hand
      this.el.setAttribute('position', '-0.01 0.08 0.08');
      this.el.setAttribute('rotation', '50 0 0');
    }
  },
  
  update: function(oldData) {
    // Skip on first initialization
    if (Object.keys(oldData).length === 0) return;
    
    // Update panel dimensions and appearance
    if (oldData.width !== this.data.width || 
        oldData.height !== this.data.height || 
        oldData.padding !== this.data.padding) {
      this.panel.setAttribute('slice9', {
        width: this.data.width,
        height: this.data.height,
        padding: this.data.padding
      });
      
      // Update border dimensions
      this.border.setAttribute('slice9', {
        width: this.data.width + this.data.borderWidth * 2,
        height: this.data.height + this.data.borderWidth * 2
      });
    }
    
    // Update colors and opacity
    if (oldData.color !== this.data.color ||
        oldData.opacity !== this.data.opacity ||
        oldData.borderColor !== this.data.borderColor) {
      this.panel.setAttribute('slice9', {
        color: this.data.color,
        opacity: this.data.opacity
      });
      
      this.border.setAttribute('slice9', {
        color: this.data.borderColor,
        opacity: this.data.opacity
      });
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
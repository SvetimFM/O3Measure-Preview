/**
 * UI Panel Component
 * 
 * Creates a panel with customizable background and layout
 * to serve as a container for UI elements.
 */

AFRAME.registerComponent('ui-panel', {
  schema: {
    width: { type: 'number', default: 0.2 },
    height: { type: 'number', default: 0.3 },
    color: { type: 'color', default: '#333333' },
    opacity: { type: 'number', default: 0.8 },
    visible: { type: 'boolean', default: true }
  },

  init: function() {
    this.createPanel();
  },

  update: function(oldData) {
    // Skip on first initialization (handled by init)
    if (Object.keys(oldData).length === 0) return;

    // If visibility changed
    if (oldData.visible !== this.data.visible) {
      this.el.setAttribute('visible', this.data.visible);
    }

    // Update panel if dimensions changed
    if (oldData.width !== this.data.width || oldData.height !== this.data.height) {
      // Update panel with new dimensions
      this.panel.setAttribute('width', this.data.width);
      this.panel.setAttribute('height', this.data.height);
    }

    // Update material if appearance changed
    if (oldData.color !== this.data.color || oldData.opacity !== this.data.opacity) {
      this.panel.setAttribute('color', this.data.color);
      this.panel.setAttribute('opacity', this.data.opacity);
    }
  },

  createPanel: function() {
    // Create panel background using a-plane
    this.panel = document.createElement('a-plane');
    this.panel.setAttribute('width', this.data.width);
    this.panel.setAttribute('height', this.data.height);
    this.panel.setAttribute('color', this.data.color);
    this.panel.setAttribute('opacity', this.data.opacity);
    this.panel.setAttribute('shader', 'flat');
    this.panel.setAttribute('transparent', true);
    this.panel.setAttribute('side', 'double');
    this.panel.setAttribute('grabbable')
    // Round corners by using segments
    this.panel.setAttribute('segments-width', 10);
    this.panel.setAttribute('segments-height', 10);
    
    // Add panel to entity
    this.el.appendChild(this.panel);
    
    // Add container for content
    this.container = document.createElement('a-entity');
    this.container.setAttribute('position', '0 0 0.001'); // Slight offset to avoid z-fighting
    this.el.appendChild(this.container);
    
    // Set visibility
    this.el.setAttribute('visible', this.data.visible);
  },
  
  getContentContainer: function() {
    return this.container;
  },
  
  remove: function() {
    // Clean up
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
});
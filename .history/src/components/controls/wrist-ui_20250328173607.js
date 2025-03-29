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
    color: { type: 'color', default: '#2c3e50' },
    opacity: { type: 'number', default: 0.2 },
    padding: { type: 'number', default: 0.01 },
    borderWidth: { type: 'number', default: 0.02 },
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
    // Get a reference to a slice9 texture - we're using a transparent PNG for now
    // In a production app, we would create a proper slice9 texture
    const textureSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTExIDc5LjE1ODMyNSwgMjAxNS8wOS8xMC0wMToxMDoyMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjRDOEVFMjhGMEYzMTFFNjgzN0ZFMkJDNDY1RUFFODgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjRDOEVFMjlGMEYzMTFFNjgzN0ZFMkJDNDY1RUFFODgiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyNEM4RUUyNkYwRjMxMUU2ODM3RkUyQkM0NjVFQUU4OCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyNEM4RUUyN0YwRjMxMUU2ODM3RkUyQkM0NjVFQUU4OCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiEG3HIAAADSSURBVHjaYvj//z8DtQETlKYKYGKgImDBI2fCyMgoAKR5ofw/QHwXiJ8B8SsGBgZTIL8YiD9+/fpVi5AVX758OQXEPkBsAOVrAvFcIL4IxI1QcVtCljwD4kQgvg3EX6DiL4G4A4hLgHgZED8gZMl6IP4CxMeB+BsQv4OKrwDiElIssQBiXiC+A8SvgPgSlZwLN2Q+EB8D4s9UtuQPEPcD8VYgvkhNS04C8QQg3g/Eb6hpCUjDYCBuA+JD1LYEBPYBcTkQr6cnYAQIMACpfAYEDIAw+QAAAABJRU5ErkJggg==';
    
    // Create background panel using slice9
    this.panel = document.createElement('a-entity');
    this.panel.setAttribute('slice9', {
      width: this.data.width,
      height: this.data.height,
      left: 5,
      right: 5,
      top: 5,
      bottom: 5,
      padding: this.data.padding,
      color: this.data.color,
      opacity: this.data.opacity,
      transparent: true,
      src: textureSrc
    });
    
    // Create border - we'll use an additional slice9 entity for the border
    this.border = document.createElement('a-entity');
    this.border.setAttribute('slice9', {
      width: this.data.width + this.data.borderWidth * 2,
      height: this.data.height + this.data.borderWidth * 2,
      left: 5,
      right: 5,
      top: 5,
      bottom: 5,
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
    // For left hand, position on inner wrist
    if (this.data.hand === 'left') {
      // Attach to wrist area
      this.el.setAttribute('position', '0.01 0.02 0.05');
      this.el.setAttribute('rotation', '-45 0 0');
    } else {
      // For right hand
      this.el.setAttribute('position', '-0.01 0.02 0.05');
      this.el.setAttribute('rotation', '-45 0 0');
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
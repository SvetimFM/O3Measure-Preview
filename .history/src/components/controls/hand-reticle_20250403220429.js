/**
 * Simplified Hand Reticle Component
 * 
 * Creates a visual reticle attached to the user's hand
 * for precise targeting and interaction.
 */

AFRAME.registerComponent('hand-reticle', {
  schema: {
    active: { type: 'boolean', default: true },
    id: { type: 'string', default: '' },
    hand: { type: 'string', default: 'right' }, // left or right
    color: { type: 'color', default: '#F4B400' }, // default color
    distance: { type: 'number', default: 0.15 } // distance from hand in meters
  },
  
  init: function() {
    // Only create if active
    if (this.data.active) {
      this.createReticle();
    }
  },
  
  createReticle: function() {
    // Create reticle entity
    const reticle = document.createElement('a-entity');
    const reticleId = this.data.id || `reticle-${this.data.hand}`;
    reticle.setAttribute('id', reticleId);
    reticle.setAttribute('position', `0 0.05 -${this.data.distance}`); // Position slightly above and in front of hand
    
    // Create ring
    const ring = document.createElement('a-ring');
    ring.setAttribute('radius-inner', '0.02');
    ring.setAttribute('radius-outer', '0.03');
    ring.setAttribute('color', this.data.color);
    ring.setAttribute('material', 'shader: flat; opacity: 1.0; side: double');
    reticle.appendChild(ring);
    
    // Create center dot
    const dot = document.createElement('a-circle');
    dot.setAttribute('radius', '0.01');
    dot.setAttribute('color', '#FF0000');
    dot.setAttribute('material', 'shader: flat; opacity: 0.8');
    dot.setAttribute('position', '0 0 0.001');
    reticle.appendChild(dot);
    
    // Add crosshair lines
    this.createCrosshairLines(reticle);
    
    // Add to entity
    this.el.appendChild(reticle);
    this.reticle = reticle;
  },
  
  createCrosshairLines: function(parent) {
    // Create the crosshair lines (vertical and horizontal)
    const lineColor = '#FFFFFF';
    const lineWidth = 0.0015;
    
    // Horizontal line
    const hLine = document.createElement('a-entity');
    hLine.setAttribute('geometry', {
      primitive: 'plane',
      width: 0.04,
      height: lineWidth
    });
    hLine.setAttribute('material', {
      color: lineColor,
      shader: 'flat',
      transparent: true
    });
    hLine.setAttribute('position', '0 0 0.0005');
    parent.appendChild(hLine);
    
    // Vertical line
    const vLine = document.createElement('a-entity');
    vLine.setAttribute('geometry', {
      primitive: 'plane',
      width: lineWidth,
      height: 0.04
    });
    vLine.setAttribute('material', {
      color: lineColor,
      shader: 'flat',
      transparent: true
    });
    vLine.setAttribute('position', '0 0 0.0005');
    parent.appendChild(vLine);
  },
  
  update: function(oldData) {
    // Handle active state changes
    if (oldData.active !== this.data.active) {
      if (!this.data.active && this.reticle) {
        // Remove reticle when deactivated
        if (this.reticle.parentNode) {
          this.reticle.parentNode.removeChild(this.reticle);
        }
        this.reticle = null;
      } else if (this.data.active && !this.reticle) {
        // Create reticle when activated
        this.createReticle();
      }
    }
    
    // Update reticle properties if it exists
    if (this.reticle) {
      // Update color if changed
      if (oldData.color !== this.data.color) {
        const ring = this.reticle.querySelector('a-ring');
        if (ring) {
          ring.setAttribute('color', this.data.color);
        }
      }
      
      // Update position if distance changed
      if (oldData.distance !== this.data.distance) {
        this.reticle.setAttribute('position', `0 0.05 -${this.data.distance}`);
      }
    }
  },
  
  remove: function() {
    // Clean up
    if (this.reticle && this.reticle.parentNode) {
      this.reticle.parentNode.removeChild(this.reticle);
      this.reticle = null;
    }
  }
});

console.log('Hand Reticle component registered');
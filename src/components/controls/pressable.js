/**
 * Pressable Component
 * 
 * Detects when a finger is close enough to hover or press this element
 * Works with hand-tracking-controls
 */
AFRAME.registerComponent('pressable', {
  schema: {
    pressDistance: { default: 0.005 },  // Much smaller press distance for precise interaction
    hoverDistance: { default: 0.015 }   // Hover distance is 30% of previous value (0.05 * 0.3)
  },

  init: function () {
    this.worldPosition = new THREE.Vector3();
    this.handEls = document.querySelectorAll('[hand-tracking-controls]');
    this.pressed = false;
    this.hovered = false;
  },

  tick: function () {
    var handEls = this.handEls;
    var handEl;
    var distance;
    var minDistance = Infinity;
    
    // Find the closest finger
    for (var i = 0; i < handEls.length; i++) {
      handEl = handEls[i];
      if (handEl.components['hand-tracking-controls'] && 
          handEl.components['hand-tracking-controls'].indexTipPosition) {
        distance = this.calculateFingerDistance(handEl.components['hand-tracking-controls'].indexTipPosition);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
    
    // Handle press state
    if (minDistance < this.data.pressDistance) {
      if (!this.pressed) { 
        this.el.emit('pressedstarted');
        console.log('Button press started');
      }
      this.pressed = true;
    } else if (this.pressed) {
      this.el.emit('pressedended'); 
      console.log('Button press ended');
      this.pressed = false;
    }
    
    // Handle hover state separately
    if (minDistance < this.data.hoverDistance && !this.hovered) {
      this.el.emit('mouseenter');
      console.log('Button hover started');
      this.hovered = true;
    } else if (minDistance >= this.data.hoverDistance && this.hovered) {
      this.el.emit('mouseleave');
      console.log('Button hover ended');
      this.hovered = false;
    }
  },

  calculateFingerDistance: function (fingerPosition) {
    var el = this.el;
    var worldPosition = this.worldPosition;

    worldPosition.copy(el.object3D.position);
    el.object3D.parent.updateMatrixWorld();
    el.object3D.parent.localToWorld(worldPosition);

    return worldPosition.distanceTo(fingerPosition);
  }
});
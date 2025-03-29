/**
 * Pressable Component
 * 
 * Detects when a finger is close enough to press this element
 * Works with hand-tracking-controls
 */
AFRAME.registerComponent('pressable', {
  schema: {
    pressDistance: { default: 0.02 }
  },

  init: function () {
    this.worldPosition = new THREE.Vector3();
    this.handEls = document.querySelectorAll('[hand-tracking-controls]');
    this.pressed = false;
  },

  tick: function () {
    var handEls = this.handEls;
    var handEl;
    var distance;
    
    for (var i = 0; i < handEls.length; i++) {
      handEl = handEls[i];
      if (handEl.components['hand-tracking-controls'] && 
          handEl.components['hand-tracking-controls'].indexTipPosition) {
        distance = this.calculateFingerDistance(handEl.components['hand-tracking-controls'].indexTipPosition);
        if (distance < this.data.pressDistance) {
          if (!this.pressed) { 
            this.el.emit('pressedstarted');
            console.log('Button press started');
          }
          this.pressed = true;
          return;
        }
      }
    }
    
    if (this.pressed) { 
      this.el.emit('pressedended'); 
      console.log('Button press ended');
    }
    this.pressed = false;
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
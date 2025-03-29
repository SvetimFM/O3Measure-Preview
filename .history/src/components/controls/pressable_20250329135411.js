/**
 * Pressable Component
 * 
 * Detects when a finger is close enough to hover or press this element
 * Works with hand-tracking-controls
 * Uses THREE.Box3 for width-aware detection across button's entire surface
 */
AFRAME.registerComponent('pressable', {
  schema: {
    pressDistance: { default: 0.008 },  // Z-distance for press detection
    hoverDistance: { default: 0.025 }   // Z-distance for hover detection
  },

  init: function () {
    this.worldPosition = new THREE.Vector3();
    this.handEls = document.querySelectorAll('[hand-tracking-controls]');
    this.pressed = false;
    this.hovered = false;
    
    // Create bounding box for button
    this.boundingBox = new THREE.Box3();
    this.tempVector = new THREE.Vector3();
    this.boundingBoxSize = new THREE.Vector3();
    
    // Track matrix state for transformations
    this.matrix = new THREE.Matrix4();
    this.inverse = new THREE.Matrix4();
  },
  
  updateBoundingBox: function() {
    var el = this.el;
    var object3D = el.object3D;
    var childPlane;
    
    // Get size from button plane (usually first child of button entity)
    if (el.firstChild && el.firstChild.getAttribute('geometry')) {
      childPlane = el.firstChild;
    } else if (el.firstChild && el.firstChild.getAttribute('width')) {
      childPlane = el.firstChild;
    }
    
    var width = childPlane ? 
                (childPlane.getAttribute('geometry') ? 
                 childPlane.getAttribute('geometry').width : 
                 childPlane.getAttribute('width')) : 0.08;
    
    var height = childPlane ? 
                 (childPlane.getAttribute('geometry') ? 
                  childPlane.getAttribute('geometry').height : 
                  childPlane.getAttribute('height')) : 0.02;
    
    // Update size
    this.boundingBoxSize.set(width, height, 0.01);
    
    // Get world position and update matrices
    this.worldPosition.copy(object3D.position);
    object3D.parent.updateMatrixWorld();
    object3D.parent.localToWorld(this.worldPosition);
    
    // Set box center at button position
    this.boundingBox.setFromCenterAndSize(
      this.worldPosition, 
      this.boundingBoxSize
    );
    
    // Store transformation matrix
    this.matrix.copy(object3D.matrixWorld);
    this.inverse.copy(this.matrix).invert();
  },

  tick: function () {
    var handEls = this.handEls;
    var handEl;
    var distance;
    var minDistance = Infinity;
    
    // Update bounding box to current transform
    this.updateBoundingBox();
    
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
    // Transform finger position to local space
    this.tempVector.copy(fingerPosition);
    
    // Check if finger is within X and Y bounds of button (width and height)
    var withinXBounds = (this.tempVector.x >= this.boundingBox.min.x && 
                         this.tempVector.x <= this.boundingBox.max.x);
    var withinYBounds = (this.tempVector.y >= this.boundingBox.min.y && 
                         this.tempVector.y <= this.boundingBox.max.y);
    
    if (withinXBounds && withinYBounds) {
      // If within X and Y boundaries, just return Z distance
      return Math.abs(this.tempVector.z - this.worldPosition.z);
    } else {
      // Outside bounds, use distance to closest point on box
      return this.boundingBox.distanceToPoint(this.tempVector);
    }
  }
});
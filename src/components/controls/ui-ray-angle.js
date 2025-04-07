/**
 * UI Ray Angle Component
 * 
 * Adjusts the ray direction of laser controls for better UI interaction
 */

AFRAME.registerComponent('ui-ray-angle', {
  schema: {
    angle: { type: 'number', default: 30 }, // Angle in degrees to tilt down
    restoreOnRemove: { type: 'boolean', default: true }
  },
  
  init: function() {
    // Store original raycaster direction to restore later
    this.originalDirection = null;
    this.raycaster = this.el.components.raycaster;
    
    if (this.raycaster) {
      // Store original direction
      this.originalDirection = this.raycaster.raycaster.ray.direction.clone();
      
      // Apply the angled direction
      this.applyAngle();
    } else {
      console.warn('ui-ray-angle: No raycaster component found');
    }
  },
  
  applyAngle: function() {
    if (!this.raycaster) return;
    
    // Convert angle to radians
    const angleRad = THREE.MathUtils.degToRad(this.data.angle);
    
    // Create a rotated direction vector
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad);
    
    // Set the new direction
    this.raycaster.raycaster.ray.direction.copy(direction);
    
    // Update the line if there is one
    if (this.el.components.line) {
      this.el.components.line.data.end = {
        x: 0,
        y: -Math.sin(angleRad) * 100,
        z: -Math.cos(angleRad) * 100
      };
      this.el.components.line.update();
    }
  },
  
  update: function(oldData) {
    // If angle changed, reapply
    if (oldData.angle !== this.data.angle) {
      this.applyAngle();
    }
  },
  
  remove: function() {
    // Restore original direction if available
    if (this.raycaster && this.originalDirection && this.data.restoreOnRemove) {
      this.raycaster.raycaster.ray.direction.copy(this.originalDirection);
      
      // Update the line if there is one
      if (this.el.components.line) {
        this.el.components.line.data.end = {
          x: 0,
          y: 0,
          z: -100
        };
        this.el.components.line.update();
      }
    }
  }
});
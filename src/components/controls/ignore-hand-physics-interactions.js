/**
 * Hand Physics Interactions Component
 * 
 * Adds physical collision properties to hand controllers for interacting with
 * physics-enabled objects like menus.
 * 
 * This component:
 * 1. Creates invisible colliders around finger tips
 * 2. Handles physics-based interactions between hands and menus
 * 3. Prevents hands from passing through physical objects
 */

AFRAME.registerComponent('hand-physics-interactions', {
  schema: {
    hand: {type: 'string', default: 'right', oneOf: ['left', 'right']},
    fingerRadius: {type: 'number', default: 0.008}, // Radius of finger tip colliders
    fingerMass: {type: 'number', default: 0.02}     // Mass of each finger tip
  },

  init: function() {
    this.fingerEnts = {};
    this.joints = {};
    
    // Key finger joints we want to add physics to
    this.fingerJoints = [
      "index-finger-tip",
      "thumb-tip",
      "middle-finger-tip"
    ];
    
    // Hand changed event to reinitialize colliders when hand data changes
    this.onHandChanged = this.onHandChanged.bind(this);
    this.el.addEventListener('hand-tracking-controls-changed', this.onHandChanged);
    
    // Setup initial colliders
    this.setupColliders();
  },
  
  setupColliders: function() {
    // Only proceed if we have hand-tracking-controls
    const handControls = this.el.components['hand-tracking-controls'];
    if (!handControls) {
      console.warn('hand-physics-interactions: No hand-tracking-controls component found');
      return;
    }
    
    // Remove any existing colliders
    this.removeColliders();
    
    // Create invisible colliders for key finger joints
    this.fingerJoints.forEach(jointName => {
      // Get the joint name based on hand side
      const fullJointName = jointName;
      
      // Create entity for this joint
      const fingerEnt = document.createElement('a-entity');
      fingerEnt.setAttribute('id', `${this.data.hand}-${jointName}-physics`);
      
      // Add invisible sphere for collision
      fingerEnt.setAttribute('geometry', {
        primitive: 'sphere',
        radius: this.data.fingerRadius
      });
      
      // Make invisible but still collidable
      fingerEnt.setAttribute('material', {
        opacity: 0.0,
        transparent: true,
        visible: false
      });
      
      // Add physics body - kinematic so it affects dynamic bodies but isn't affected by gravity
      fingerEnt.setAttribute('dynamic-body', {
        mass: this.data.fingerMass,
        linearDamping: 0.95,
        angularDamping: 0.95,
        type: 'kinematic'
      });
      
      // Add entity to the scene
      this.el.appendChild(fingerEnt);
      
      // Save reference to the entity
      this.fingerEnts[fullJointName] = fingerEnt;
    });
  },
  
  onHandChanged: function() {
    // Reinitialize colliders when hand is detected or changes
    this.setupColliders();
  },
  
  removeColliders: function() {
    // Clean up existing finger entities
    Object.values(this.fingerEnts).forEach(entity => {
      if (entity.parentNode) {
        entity.parentNode.removeChild(entity);
      }
    });
    this.fingerEnts = {};
  },
  
  // Add throttling to avoid running every frame
  tick: function(time, timeDelta) {
    // Throttle updates to every 30ms (approx every 2nd frame at 60fps)
    // Skip if less than 30ms have passed since last update
    if (this.lastUpdate && (time - this.lastUpdate) < 30) return;
    this.lastUpdate = time;
    
    // Only proceed if hand is detected
    const handControls = this.el.components['hand-tracking-controls'];
    if (!handControls) return;
    
    // Reuse vector to prevent memory allocations
    if (!this.worldPos) this.worldPos = new THREE.Vector3();
    
    // Update finger collider positions based on current hand pose
    for (let i = 0; i < this.fingerJoints.length; i++) {
      const jointName = this.fingerJoints[i];
      const fingerEnt = this.fingerEnts[jointName];
      
      if (fingerEnt && handControls.bones && handControls.bones[jointName]) {
        const bone = handControls.bones[jointName];
        if (bone) {
          // Get world position of joint (reusing vector)
          this.worldPos.set(0, 0, 0);
          bone.getWorldPosition(this.worldPos);
          
          // Update physics collider position without creating new objects
          fingerEnt.object3D.position.x = this.worldPos.x;
          fingerEnt.object3D.position.y = this.worldPos.y;
          fingerEnt.object3D.position.z = this.worldPos.z;
        }
      }
    }
  },
  
  remove: function() {
    // Clean up
    this.removeColliders();
    this.el.removeEventListener('hand-tracking-controls-changed', this.onHandChanged);
  }
});
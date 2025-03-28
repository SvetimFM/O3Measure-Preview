/**
 * Scene Manager Component
 * Handles scene transitions, environment setup, and mode changes
 * Optimized for hand tracking focus
 */

AFRAME.registerComponent('scene-manager', {
  schema: {
    debugMode: {type: 'boolean', default: true},
    preferHandTracking: {type: 'boolean', default: true}
  },
  
  init: function() {
    console.log('Initializing scene manager with hand tracking focus');
    
    // Track current app state
    this.state = {
      mode: 'desktop', // desktop, vr, ar
      handTrackingActive: false,
      environmentReady: false
    };
    
    // Bind methods
    this.onEnterVR = this.onEnterVR.bind(this);
    this.onExitVR = this.onExitVR.bind(this);
    this.setupAR = this.setupAR.bind(this);
    this.setupVR = this.setupVR.bind(this);
    this.onHandStateChanged = this.onHandStateChanged.bind(this);
    
    // Listen for mode changes
    this.el.addEventListener('enter-vr', this.onEnterVR);
    this.el.addEventListener('exit-vr', this.onExitVR);
    this.el.addEventListener('handStateChanged', this.onHandStateChanged);
    
    // Initially hide ground
    const ground = document.getElementById('ground');
    if (ground) {
      ground.object3D.visible = false;
    }
    
    // Initialize hand tracking components
    this.initializeHandTracking();
    
    console.log('Scene manager initialized');
  },
  
  /**
   * Initialize hand tracking specific features
   */
  initializeHandTracking: function() {
    // Nothing specific needed at the moment - A-Frame handles initialization
    // This method can be expanded for more complex setup later
  },
  
  /**
   * Handle enter VR/AR event
   */
  onEnterVR: function() {
    if (this.el.is('ar-mode')) {
      this.state.mode = 'ar';
      this.setupAR();
    } else {
      this.state.mode = 'vr';
      this.setupVR();
    }
    
    // Update debug info
    console.log(`Entered ${this.state.mode.toUpperCase()} mode`);
  },
  
  /**
   * Handle exit VR/AR event
   */
  onExitVR: function() {
    this.state.mode = 'desktop';
    console.log('Exited XR mode');
    
    // Hide ground
    const ground = document.getElementById('ground');
    if (ground) {
      ground.object3D.visible = false;
    }
  },
  
  /**
   * Handle hand state changed event
   */
  onHandStateChanged: function(evt) {
    // Track if either hand is actively being tracked
    const handState = evt.detail.state;
    
    if (handState.tracking) {
      if (!this.state.handTrackingActive) {
        this.state.handTrackingActive = true;
        console.log(`Hand tracking active for ${evt.detail.hand} hand`);
      }
    } else {
      // Check if any hands are still tracked
      const controllerSystem = this.el.sceneEl.systems['enhanced-controller'];
      if (controllerSystem) {
        const leftTracking = controllerSystem.handState.left.tracking;
        const rightTracking = controllerSystem.handState.right.tracking;
        
        if (!leftTracking && !rightTracking) {
          this.state.handTrackingActive = false;
          console.log('Hand tracking inactive, no hands detected');
        }
      }
    }
  },
  
  /**
   * Set up scene for VR mode
   */
  setupVR: function() {
    // Show ground in VR
    const ground = document.getElementById('ground');
    if (ground) {
      ground.object3D.visible = true;
    }
    
    // Configure lighting for VR
    this.adjustLightingForVR();
    
    // Show debug elements if debug mode is on
    if (this.data.debugMode) {
      const debugVisuals = document.getElementById('debugVisuals');
      if (debugVisuals) {
        debugVisuals.setAttribute('visible', true);
      }
    }
    
    // Prefer hand tracking in VR if enabled
    if (this.data.preferHandTracking) {
      this.optimizeForHandTracking();
    }
  },
  
  /**
   * Set up scene for AR mode
   */
  setupAR: function() {
    // Hide ground in AR
    const ground = document.getElementById('ground');
    if (ground) {
      ground.object3D.visible = false;
    }
    
    // Configure lighting for AR
    this.adjustLightingForAR();
    
    // Show debug elements if debug mode is on
    if (this.data.debugMode) {
      const debugVisuals = document.getElementById('debugVisuals');
      if (debugVisuals) {
        debugVisuals.setAttribute('visible', true);
      }
    }
    
    // Prefer hand tracking in AR if enabled
    if (this.data.preferHandTracking) {
      this.optimizeForHandTracking();
    }
  },
  
  /**
   * Optimize scene for hand tracking
   */
  optimizeForHandTracking: function() {
    // Configure hand properties for best visibility
    const leftHand = document.getElementById('leftHand');
    const rightHand = document.getElementById('rightHand');
    
    if (leftHand) {
      leftHand.setAttribute('enhanced-controller', {
        handModelStyle: 'highPoly',
        color: '#15ACCF'
      });
    }
    
    if (rightHand) {
      rightHand.setAttribute('enhanced-controller', {
        handModelStyle: 'highPoly',
        color: '#15ACCF',
        addRaycaster: true
      });
    }
  },
  
  /**
   * Adjust lighting for VR mode
   */
  adjustLightingForVR: function() {
    // Modify lighting for VR if needed
    const ambientLight = document.querySelector('a-entity[light="type: ambient"]');
    const directionalLight = document.querySelector('a-entity[light="type: directional"]');
    
    if (ambientLight) {
      ambientLight.setAttribute('light', 'intensity', 0.7);
    }
    
    if (directionalLight) {
      directionalLight.setAttribute('light', 'intensity', 0.5);
    }
  },
  
  /**
   * Adjust lighting for AR mode
   */
  adjustLightingForAR: function() {
    // Modify lighting for AR if needed - often brighter for better visibility
    const ambientLight = document.querySelector('a-entity[light="type: ambient"]');
    const directionalLight = document.querySelector('a-entity[light="type: directional"]');
    
    if (ambientLight) {
      ambientLight.setAttribute('light', 'intensity', 0.8);
    }
    
    if (directionalLight) {
      directionalLight.setAttribute('light', 'intensity', 0.6);
    }
  },
  
  /**
   * Clean up event listeners
   */
  remove: function() {
    // Clean up event listeners
    this.el.removeEventListener('enter-vr', this.onEnterVR);
    this.el.removeEventListener('exit-vr', this.onExitVR);
    this.el.removeEventListener('handStateChanged', this.onHandStateChanged);
  }
});

// Auto-register the component on the scene when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.setAttribute('scene-manager', {
      debugMode: true,
      preferHandTracking: true
    });
  }
});
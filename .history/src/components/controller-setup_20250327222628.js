/**
 * Controller Setup Component
 * Handles controller initialization and tracking
 */

AFRAME.registerComponent('controller-setup', {
  schema: {
    leftHand: {type: 'selector', default: '#leftHand'},
    rightHand: {type: 'selector', default: '#rightHand'},
    handModelStyle: {type: 'string', default: 'lowPoly'},
    handColor: {type: 'color', default: '#15ACCF'},
    rayDistance: {type: 'number', default: 10},
    rayColor: {type: 'color', default: '#118A7E'},
    rayOpacity: {type: 'number', default: 0.5}
  },

  init: function() {
    console.log('Initializing controller setup component');
    
    // Track controller entities
    this.leftController = null;
    this.rightController = null;
    
    // Bind methods to maintain 'this' context
    this.setupControllers = this.setupControllers.bind(this);
    this.onAssetsLoaded = this.onAssetsLoaded.bind(this);
    
    // Wait for scene and assets to load
    const assetsEl = this.el.sceneEl.querySelector('a-assets');
    
    if (assetsEl) {
      if (assetsEl.hasLoaded) {
        console.log('Assets already loaded, setting up controllers');
        this.setupTimeout = setTimeout(this.setupControllers, 100);
      } else {
        console.log('Waiting for assets to load before setting up controllers');
        assetsEl.addEventListener('loaded', this.onAssetsLoaded);
      }
    } else {
      // Fallback if assets element isn't found
      console.warn('No a-assets element found, continuing with controller setup');
      if (this.el.sceneEl.hasLoaded) {
        this.setupTimeout = setTimeout(this.setupControllers, 100);
      } else {
        this.el.sceneEl.addEventListener('loaded', () => {
          this.setupTimeout = setTimeout(this.setupControllers, 100);
        });
      }
    }
  },
  
  onAssetsLoaded: function() {
    console.log('Assets loaded, setting up controllers');
    this.setupTimeout = setTimeout(this.setupControllers, 100);
  },
  
  // Note: We're not using the events property here since we need the setTimeout
  
  update: function(oldData) {
    // Skip on first initialization (handled by init)
    if (Object.keys(oldData).length === 0) { return; }
    
    // If controllers already set up, update their properties
    if (this.leftController) {
      this.setupHand(this.leftController, 'left');
    }
    
    if (this.rightController) {
      this.setupHand(this.rightController, 'right');
    }
  },
  
  setupControllers: function() {
    // Get hand elements by ID if not already provided as selectors
    const leftHand = this.data.leftHand || document.getElementById('leftHand');
    const rightHand = this.data.rightHand || document.getElementById('rightHand');
    
    if (!leftHand || !rightHand) {
      console.warn('Hand elements not found, controllers setup incomplete');
      return;
    }
    
    this.setupHand(leftHand, 'left');
    this.setupHand(rightHand, 'right');
    console.log('Controllers setup complete');
  },
  
  setupHand: function(handEl, handedness) {
    if (!handEl) {
      console.warn(`${handedness} hand element not found`);
      return;
    }
    
    // Store reference to controller
    if (handedness === 'left') {
      this.leftController = handEl;
    } else {
      this.rightController = handEl;
    }
    
    // Set up hand controls
    handEl.setAttribute('hand-controls', {
      hand: handedness,
      handModelStyle: this.data.handModelStyle,
      color: this.data.handColor
    });
    
    // Set up oculus touch controls
    handEl.setAttribute('oculus-touch-controls', {
      hand: handedness,
      model: true
    });
    
    // Add laser controls to right hand only
    if (handedness === 'right') {
      handEl.setAttribute('laser-controls', {
        hand: handedness
      });
      
      // Add raycaster for interaction
      handEl.setAttribute('raycaster', {
        showLine: true,
        far: this.data.rayDistance,
        lineColor: this.data.rayColor,
        lineOpacity: this.data.rayOpacity
      });
    }
  },
  
  remove: function() {
    // Cleanup any pending timeouts
    if (this.setupTimeout) {
      clearTimeout(this.setupTimeout);
    }
    
    // Cleanup event listeners
    this.el.sceneEl.removeEventListener('loaded', this.setupControllers);
    
    // Remove asset loaded listener if it exists
    const assetsEl = this.el.sceneEl.querySelector('a-assets');
    if (assetsEl) {
      assetsEl.removeEventListener('loaded', this.onAssetsLoaded);
    }
    
    // Remove controller components
    if (this.leftController) {
      this.leftController.removeAttribute('hand-controls');
      this.leftController.removeAttribute('oculus-touch-controls');
    }
    
    if (this.rightController) {
      this.rightController.removeAttribute('hand-controls');
      this.rightController.removeAttribute('oculus-touch-controls');
      this.rightController.removeAttribute('laser-controls');
      this.rightController.removeAttribute('raycaster');
    }
  },
  
  pause: function() {
    // Called when scene is paused
    // Could disable controller input here if needed
  },
  
  play: function() {
    // Called when scene is resumed
    // Could re-enable controller input here if needed
  }
});

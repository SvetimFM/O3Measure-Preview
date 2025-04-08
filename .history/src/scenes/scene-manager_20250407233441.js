/**
 * O3Measure - Scene Manager Component
 * Manages AR scene functionality
 */

AFRAME.registerComponent('scene-manager', {
  init: function() {
    console.log('Scene manager initialized');
    
    // Reference to scene
    this.sceneEl = this.el;
    
    // Set up event listeners
    this.setupEventListeners();
  },
  
  setupEventListeners: function() {
    // AR-specific event listeners
    this.sceneEl.addEventListener('enter-ar', this.onEnterAR.bind(this));
    this.sceneEl.addEventListener('exit-ar', this.onExitAR.bind(this));
  },
  
  onEnterAR: function() {
    console.log('Entered AR mode');
  },
  
  onExitAR: function() {
    console.log('Exited AR mode');
  },

});
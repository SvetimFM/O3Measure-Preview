/**
 * Basic Scene Configuration
 * Sets up the WebXR scene with common properties
 */

AFRAME.registerComponent('basic-scene', {
  schema: {
    // Lighting properties
    ambientIntensity: {type: 'number', default: 0.7},
    directionalIntensity: {type: 'number', default: 0.5},
    directionalPosition: {type: 'vec3', default: {x: 1, y: 1, z: 1}}
  },
  
  init: function() {
    console.log('Initializing basic scene');
    
    // Store references to created objects for cleanup
    this.sceneObjects = {};
    
    // Setup WebXR properties on the scene
    this.setupWebXR();
    
    // Setup lighting
    this.setupLighting();
    
    console.log('Basic scene initialization complete');
  },
  
  update: function(oldData) {
    // Skip on first initialization (handled by init)
    if (Object.keys(oldData).length === 0) { return; }
    
    // Update light properties if they changed
    if (this.sceneObjects.ambientLight && oldData.ambientIntensity !== this.data.ambientIntensity) {
      this.sceneObjects.ambientLight.setAttribute('intensity', this.data.ambientIntensity);
    }
    
    if (this.sceneObjects.directionalLight && 
        (oldData.directionalIntensity !== this.data.directionalIntensity ||
         oldData.directionalPosition.x !== this.data.directionalPosition.x ||
         oldData.directionalPosition.y !== this.data.directionalPosition.y ||
         oldData.directionalPosition.z !== this.data.directionalPosition.z)) {
      
      this.sceneObjects.directionalLight.setAttribute('intensity', this.data.directionalIntensity);
      this.sceneObjects.directionalLight.setAttribute('position', this.data.directionalPosition);
    }
  },
  
  setupWebXR: function() {
    // WebXR configuration is now handled by the scene attributes in HTML
    // This function can be used for additional WebXR setup if needed
    
    // Listen for AR session events
    this.el.addEventListener('enter-ar', this.handleEnterAR.bind(this));
    
    console.log('WebXR configuration applied');
  },
  
  handleEnterAR: function(evt) {
    console.log('Entered AR mode');
  },
  
  setupLighting: function() {
    // Create ambient light
    const ambientLight = document.createElement('a-light');
    ambientLight.setAttribute('type', 'ambient');
    ambientLight.setAttribute('intensity', this.data.ambientIntensity);
    this.el.sceneEl.appendChild(ambientLight);
    this.sceneObjects.ambientLight = ambientLight;
    
    // Create directional light
    const directionalLight = document.createElement('a-light');
    directionalLight.setAttribute('type', 'directional');
    directionalLight.setAttribute('position', this.data.directionalPosition);
    directionalLight.setAttribute('intensity', this.data.directionalIntensity);
    this.el.sceneEl.appendChild(directionalLight);
    this.sceneObjects.directionalLight = directionalLight;
  },
  
  remove: function() {
    // Remove event listeners
    this.el.removeEventListener('enter-ar', this.handleEnterAR);
    
    // Remove created elements
    Object.values(this.sceneObjects).forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Clear object references
    this.sceneObjects = {};
  }
});

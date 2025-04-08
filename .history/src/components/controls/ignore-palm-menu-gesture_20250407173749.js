/**
 * DOESNT WORK
 * 
 * Palm Menu Gesture Component
 * 
 * Detects the palm-up gesture similar to Meta Quest's system menu activation
 * Shows a menu button that can be pinched to show the main application menu
 */

AFRAME.registerComponent('palm-menu-gesture', {
  schema: {
    hand: { type: 'string', default: 'right', oneOf: ['left', 'right'] },
    menuButtonRadius: { type: 'number', default: 0.02 },
    menuButtonColor: { type: 'color', default: '#4285F4' },
    palmUpThreshold: { type: 'number', default: 0.6 } // Threshold for palm up detection (0-1)
  },
  
  init: function() {
    console.log(`Palm Menu Gesture: Initializing for ${this.data.hand} hand`);
    
    // State
    this.isPalmUp = false;
    this.isMenuButtonVisible = false;
    this.isNearButton = false;
    this.lastPalmUpCheck = 0;
    this.checkInterval = 200; // ms between palm checks to avoid jitter
    
    // Create menu button
    this.createMenuButton();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start with button hidden
    this.menuButton.setAttribute('visible', false);
    
    console.log(`Palm Menu Gesture: Initialized for ${this.data.hand} hand`);
  },
  
  createMenuButton: function() {
    // Create a floating button that appears on palm-up gesture
    this.menuButton = document.createElement('a-entity');
    this.menuButton.setAttribute('id', `${this.data.hand}-palm-menu-button`);
    
    // Button visual
    const button = document.createElement('a-sphere');
    button.setAttribute('radius', this.data.menuButtonRadius);
    button.setAttribute('color', this.data.menuButtonColor);
    button.setAttribute('shader', 'flat');
    button.setAttribute('segments-height', 12);
    button.setAttribute('segments-width', 12);
    this.menuButton.appendChild(button);
    
    // Add glow effect with larger transparent sphere
    const glow = document.createElement('a-sphere');
    glow.setAttribute('radius', this.data.menuButtonRadius * 1.3);
    glow.setAttribute('color', this.data.menuButtonColor);
    glow.setAttribute('opacity', 0.3);
    glow.setAttribute('shader', 'flat');
    glow.setAttribute('segments-height', 12);
    glow.setAttribute('segments-width', 12);
    this.menuButton.appendChild(glow);
    
    // "Menu" text label
    const label = document.createElement('a-text');
    label.setAttribute('value', 'Menu');
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 0.04 0');
    label.setAttribute('scale', '0.05 0.05 0.05');
    label.setAttribute('color', '#FFFFFF');
    label.setAttribute('side', 'double');
    this.menuButton.appendChild(label);
    
    // Add to scene rather than hand to avoid issues with hand model changes
    this.el.sceneEl.appendChild(this.menuButton);
  },
  
  setupEventListeners: function() {
    // Bind methods
    this.onPinchStarted = this.onPinchStarted.bind(this);
    
    // Listen for pinch on this hand specifically
    this.el.addEventListener('pinchstarted', this.onPinchStarted);
  },
  
  onPinchStarted: function(event) {
    // Only handle pinch if menu button is visible and index finger is near button
    if (this.isMenuButtonVisible && this.isNearButton) {
      console.log('Palm Menu Gesture: Menu button pinched, showing main menu');
      
      // Hide menu button
      this.menuButton.setAttribute('visible', false);
      this.isMenuButtonVisible = false;
      
      // Show main menu in front of user
      this.showMainMenu();
    }
  },
  
  showMainMenu: function() {
    // Find menu manager
    const menuManager = document.getElementById('menuManager');
    
    if (menuManager) {
      // Position menu in front of user
      this.positionInFrontOfUser(menuManager);
      
      // Show menu
      menuManager.setAttribute('visible', true);
      
      // If needed, navigate to main menu
      this.el.sceneEl.emit('menu-action', { action: 'back-to-main-menu' });
      
      console.log('Palm Menu Gesture: Main menu shown');
    } else {
      console.error('Palm Menu Gesture: Menu manager not found');
    }
  },
  
  positionInFrontOfUser: function(entityToPosition) {
    // Position entity in front of the camera
    const camera = document.querySelector('a-camera') || document.querySelector('[camera]');
    
    if (camera) {
      const cameraPosition = camera.getAttribute('position');
      const cameraRotation = camera.getAttribute('rotation');
      
      // Position in front of camera
      const distance = 0.5;
      const rad = THREE.MathUtils.degToRad(cameraRotation.y);
      
      const x = cameraPosition.x - Math.sin(rad) * distance;
      const z = cameraPosition.z - Math.cos(rad) * distance;
      
      entityToPosition.setAttribute('position', `${x} ${cameraPosition.y - 0.1} ${z}`);
      entityToPosition.setAttribute('rotation', `0 ${cameraRotation.y} 0`);
    }
  },
  
  tick: function(time, deltaTime) {
    // Only check for palm orientation periodically to avoid jitter
    if (time - this.lastPalmUpCheck < this.checkInterval) return;
    this.lastPalmUpCheck = time;
    
    // Get hand controller
    const handController = this.el;
    
    // Skip if controller is not tracking
    if (!handController || !handController.object3D || !handController.object3D.visible) {
      if (this.isMenuButtonVisible) {
        this.menuButton.setAttribute('visible', false);
        this.isMenuButtonVisible = false;
      }
      return;
    }
    
    // Get hand orientation
    const isPalmFacingUp = this.checkPalmFacingUp();
    
    // Update button visibility based on palm orientation
    if (isPalmFacingUp && !this.isMenuButtonVisible) {
      // Hand has rotated to palm up, show menu button
      this.positionMenuButton();
      this.menuButton.setAttribute('visible', true);
      this.isMenuButtonVisible = true;
    } else if (!isPalmFacingUp && this.isMenuButtonVisible) {
      // Hand has rotated away from palm up, hide menu button
      this.menuButton.setAttribute('visible', false);
      this.isMenuButtonVisible = false;
    }
    
    // If button is visible, check if index finger is near it
    if (this.isMenuButtonVisible) {
      this.isNearButton = this.checkFingerNearButton();
      
      // Visual feedback when index is near button
      if (this.isNearButton) {
        this.menuButton.children[0].setAttribute('color', '#F4B400'); // Highlight color
      } else {
        this.menuButton.children[0].setAttribute('color', this.data.menuButtonColor); // Normal color
      }
    }
  },
  
  checkPalmFacingUp: function() {
    // Get hand rotation information
    const handRotation = this.el.object3D.rotation;
    
    // Convert rotation to normalized up direction
    const upVector = new THREE.Vector3(0, 1, 0);
    const handMatrix = this.el.object3D.matrixWorld;
    const worldUp = upVector.clone().applyMatrix4(handMatrix);
    
    // Normalize the direction
    worldUp.normalize();
    
    // Calculate dot product with world up
    const worldUpVector = new THREE.Vector3(0, 1, 0);
    const dotProduct = worldUpVector.dot(worldUp);
    
    // Hand is palm up when dot product is above threshold
    const isPalmUp = dotProduct > this.data.palmUpThreshold;
    
    return isPalmUp;
  },
  
  positionMenuButton: function() {
    // Position menu button above palm
    if (!this.el.object3D) return;
    
    // Get hand position
    const handPosition = new THREE.Vector3();
    this.el.object3D.getWorldPosition(handPosition);
    
    // Position button above hand
    this.menuButton.setAttribute('position', {
      x: handPosition.x,
      y: handPosition.y + 0.08, // Position above palm
      z: handPosition.z
    });
  },
  
  checkFingerNearButton: function() {
    // Check if index finger is near the menu button
    const handComponent = this.el.components['hand-tracking-controls'];
    
    if (!handComponent || !handComponent.indexTipPosition) {
      return false;
    }
    
    // Get index tip and button positions
    const indexTip = handComponent.indexTipPosition.clone();
    
    const buttonPosition = new THREE.Vector3();
    this.menuButton.object3D.getWorldPosition(buttonPosition);
    
    // Calculate distance
    const distance = indexTip.distanceTo(buttonPosition);
    
    // Index is near when distance is less than radius * 1.5
    return distance < (this.data.menuButtonRadius * 1.5);
  },
  
  remove: function() {
    // Remove event listeners
    this.el.removeEventListener('pinchstarted', this.onPinchStarted);
    
    // Remove menu button
    if (this.menuButton && this.menuButton.parentNode) {
      this.menuButton.parentNode.removeChild(this.menuButton);
    }
  }
});
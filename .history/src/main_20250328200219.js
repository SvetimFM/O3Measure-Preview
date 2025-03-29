/**
 * O3Measure - Main Application Entry Point
 * A-Frame based WebXR application with hand tracking focus
 */

// Import core components
import './scenes/basic-scene.js';
import './scenes/scene-manager.js';

// Import custom components
import './components/index.js';

document.addEventListener('DOMContentLoaded', function() {
  console.log('O3Measure AR hand tracking application initialized');

  // Get references to key elements
  const scene = document.querySelector('a-scene');
  const statusElement = document.getElementById('status');
  const arButton = document.getElementById('ar-button');

  if (!scene || !statusElement) {
    console.error('Required elements not found');
    return;
  }

  // Set up scene events
  scene.addEventListener('loaded', function() {
    statusElement.textContent = 'Ready! Enter AR to begin hand tracking.';
    console.log('Scene loaded successfully');
    
    // Set up wrist UI
    setupWristUI();
  });
  
  // AR button setup
  if (arButton) {
    arButton.addEventListener('click', function() {
      scene.enterAR();
    });
  }
  
  // Handle entering AR
  scene.addEventListener('enter-ar', function() {
    // Update UI
    statusElement.textContent = 'AR mode active - Move your hands into view';
    
    // Hide AR button when in AR
    if (arButton) {
      arButton.style.display = 'none';
    }
    
    console.log('Entered AR mode');
  });
  
  // Set up wrist UI on left hand
  function setupWristUI() {
    const leftHand = document.querySelector('#leftHand');
    
    if (leftHand) {
      // Create a parent entity to position the UI higher up
      const uiParent = document.createElement('a-entity');
      leftHand.appendChild(uiParent);
      
      // Create wrist UI attached to the parent
      const wristUI = document.createElement('a-entity');
      wristUI.setAttribute('wrist-ui', 'hand: left');
      
      uiParent.appendChild(wristUI);
      console.log('Wrist UI attached to left hand');
    } else {
      console.error('Left hand element not found');
    }
  }
});
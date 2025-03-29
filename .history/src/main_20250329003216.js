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
  
  // Set up UI panel in front of the user
  function setupWristUI() {
    console.log('Setting up menu UI');
    
    const scene = document.querySelector('a-scene');
    console.log('Scene element:', scene);
    
    if (scene) {
      // Create UI as a direct child of the scene
      console.log('Creating menu UI entity');
      const menuUI = document.createElement('a-entity');
      menuUI.setAttribute('wrist-ui', {
        width: 0.30,
        height: 0.20,
        color: '#333333',
        borderColor: '#db8814',
        grabbable: true
      });
      menuUI.setAttribute('id', 'menuUI');
      console.log('Menu UI entity created');
      
      // Add to scene directly
      scene.appendChild(menuUI);
      console.log('Menu UI added to scene');
      
      // Verify the component was applied
      setTimeout(() => {
        const component = menuUI.components['wrist-ui'];
        console.log('Menu UI component after initialization:', component);
        
        // Check if the UI is visible in the scene
        console.log('Menu UI visible:', menuUI.getAttribute('visible'));
        console.log('Menu UI position:', menuUI.getAttribute('position'));
      }, 1000);
    } else {
      console.error('Scene element not found for menu UI setup');
    }
  }
});
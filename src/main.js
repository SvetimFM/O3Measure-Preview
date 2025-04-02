/**
 * O3Measure - Main Application Entry Point
 * A-Frame based WebXR application with hand tracking focus
 */

// Import core components
import './scenes/basic-scene.js';
import './scenes/scene-manager.js';

// Import state management
import './state/scene-state.js';

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
    
    // Set up menu panel
    setupMenuPanel();
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
  
  // Set up menu panel in front of the user
  function setupMenuPanel() {
    console.log('Setting up menu manager');
    
    const scene = document.querySelector('a-scene');
    console.log('Scene element:', scene);
    
    if (scene) {
      // Create a single menu manager as a direct child of the scene
      console.log('Creating menu manager entity');
      const menuManager = document.createElement('a-entity');
      menuManager.setAttribute('menu-manager', {
        width: 0.25,
        height: 0.20,
        color: '#333333',
        borderColor: '#db8814',
        grabbable: true
      });
      menuManager.setAttribute('id', 'menuManager');
      console.log('Menu manager entity created');
      
      // Add to scene directly
      scene.appendChild(menuManager);
      console.log('Menu manager added to scene');
      
      // Create wall plane entity
      console.log('Creating wall plane entity');
      const wallPlane = document.createElement('a-entity');
      wallPlane.setAttribute('wall-plane', {
        visible: false // Initially hidden
      });
      wallPlane.setAttribute('id', 'wallPlane');
      
      // Add wall plane to scene
      scene.appendChild(wallPlane);
      console.log('Wall plane added to scene');
      
      // Create object definition entity
      console.log('Creating object definition entity');
      const objectDef = document.createElement('a-entity');
      objectDef.setAttribute('object-definition', {
        active: false, // Initially inactive
        wallId: 'wallPlane'
      });
      objectDef.setAttribute('id', 'objectDefinition');
      
      // Add object definition to scene
      scene.appendChild(objectDef);
      console.log('Object definition added to scene');
      
      // Create object renderer entity
      console.log('Creating object renderer entity');
      const objectRenderer = document.createElement('a-entity');
      objectRenderer.setAttribute('object-renderer', {
        active: true,
        wallId: 'wallPlane'
      });
      objectRenderer.setAttribute('id', 'objectRenderer');
      
      // Add object renderer to scene
      scene.appendChild(objectRenderer);
      console.log('Object renderer added to scene');
      
      // We've integrated calibration into the menu manager
      console.log('Calibration functionality is now integrated into the menu manager');
      
      // Verify the component was applied
      setTimeout(() => {
        const component = menuManager.components['menu-manager'];
        console.log('Menu manager component after initialization:', component);
        
        // Check if the panel is visible in the scene
        console.log('Menu manager visible:', menuManager.getAttribute('visible'));
        console.log('Menu manager position:', menuManager.getAttribute('position'));
      }, 1000);
    } else {
      console.error('Scene element not found for menu manager setup');
    }
  }
});
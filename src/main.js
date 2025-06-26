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
    
  });
  
  // Set up menu panel in front of the user
  function setupMenuPanel() {
    
    const scene = document.querySelector('a-scene');
    
    if (scene) {
      // Create a single menu manager as a direct child of the scene
      const menuManager = document.createElement('a-entity');
      menuManager.setAttribute('menu-manager', {
        width: 0.25,
        height: 0.20,
        color: '#333333',
        borderColor: '#db8814',
        grabbable: true
      });
      menuManager.setAttribute('id', 'menuManager');
      
      // Add to scene directly
      scene.appendChild(menuManager);
      
      // Create wall plane entity
      const wallPlane = document.createElement('a-entity');
      wallPlane.setAttribute('wall-plane', {
        visible: false // Initially hidden
      });
      wallPlane.setAttribute('id', 'wallPlane');
      
      // Add wall plane to scene
      scene.appendChild(wallPlane);
      
      // Create object definition entity
      const objectDef = document.createElement('a-entity');
      objectDef.setAttribute('object-definition', {
        active: false, // Initially inactive
        wallId: 'wallPlane'
      });
      objectDef.setAttribute('id', 'objectDefinition');
      
      // Add object definition to scene
      scene.appendChild(objectDef);
      
      // Create object renderer entity
      const objectRenderer = document.createElement('a-entity');
      objectRenderer.setAttribute('object-renderer', {
        active: true,
        wallId: 'wallPlane'
      });
      objectRenderer.setAttribute('id', 'objectRenderer');
      
      // Add object renderer to scene
      scene.appendChild(objectRenderer);
      
      // Create anchor placement entity
      const anchorPlacement = document.createElement('a-entity');
      anchorPlacement.setAttribute('anchor-placement', {
        active: false, // Initially inactive
        objectId: ''
      });
      anchorPlacement.setAttribute('id', 'anchorPlacement');
      
      // Add anchor placement to scene
      scene.appendChild(anchorPlacement);
      
      // We've integrated calibration into the menu manager
      
      // Verify the component was applied
      setTimeout(() => {
        const component = menuManager.components['menu-manager'];
        
        // Check if the panel is visible in the scene
      }, 1000);
    } else {
      console.error('Scene element not found for menu manager setup');
    }
  }
});
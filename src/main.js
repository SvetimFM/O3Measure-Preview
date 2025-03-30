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
    console.log('Setting up menu panel');
    
    const scene = document.querySelector('a-scene');
    console.log('Scene element:', scene);
    
    if (scene) {
      // Create menu panel as a direct child of the scene
      console.log('Creating menu panel entity');
      const menuPanel = document.createElement('a-entity');
      menuPanel.setAttribute('menu-panel', {
        width: 0.15,    // Half the original width (0.30 * 0.5)
        height: 0.192,  // Half the original height (0.384 * 0.5)
        color: '#333333',
        borderColor: '#db8814',
        grabbable: true
      });
      menuPanel.setAttribute('id', 'menuPanel');
      console.log('Menu panel entity created');
      
      // Add to scene directly
      scene.appendChild(menuPanel);
      console.log('Menu panel added to scene');
      
      // Create wall calibration menu (initially hidden)
      console.log('Creating wall calibration menu');
      const wallCalibrationMenu = document.createElement('a-entity');
      wallCalibrationMenu.setAttribute('wall-calibration-menu', {
        width: 0.30,
        height: 0.25,
        color: '#333333',
        borderColor: '#db8814',
        active: false,  // Start hidden
        grabbable: true
      });
      wallCalibrationMenu.setAttribute('id', 'wallCalibrationMenu');
      
      // Add wall calibration menu to scene
      scene.appendChild(wallCalibrationMenu);
      console.log('Wall calibration menu added to scene');
      
      // Listen for when the wall calibration menu is closed
      scene.addEventListener('wall-calibration-closed', function() {
        console.log('Wall calibration menu closed event received');
        if (menuPanel.components['menu-panel']) {
          menuPanel.components['menu-panel'].show();
        }
      });
      
      // Verify the component was applied
      setTimeout(() => {
        const component = menuPanel.components['menu-panel'];
        console.log('Menu panel component after initialization:', component);
        
        // Check if the panel is visible in the scene
        console.log('Menu panel visible:', menuPanel.getAttribute('visible'));
        console.log('Menu panel position:', menuPanel.getAttribute('position'));
      }, 1000);
    } else {
      console.error('Scene element not found for menu panel setup');
    }
  }
});
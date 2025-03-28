/**
 * O3Measure - Main Application Entry Point
 * A-Frame based WebXR application with hand tracking focus
 */

// Import core components
import './scenes/scene-manager.js';

// Import constants
import { ARMode, AppState, Colors } from './utils/constants.js';

// Application state
const app = {
  isVR: false,
  isAR: false,
  debugMode: true,
  handTrackingActive: false,
  
  // AR-specific state
  arSessionActive: false,
  arSessionStartTime: 0
};

document.addEventListener('DOMContentLoaded', function() {
  console.log('O3Measure AR hand tracking application initialized');

  // Get references to key elements
  const scene = document.querySelector('a-scene');
  const statusElement = document.getElementById('status');
  const gestureStatusElement = document.getElementById('gesture-status');
  const arButton = document.getElementById('ar-button');
  const leftHand = document.getElementById('leftHand');
  const rightHand = document.getElementById('rightHand');
  const ground = document.getElementById('ground');
  const reticle = document.getElementById('reticle');
  const debugVisuals = document.getElementById('debugVisuals');

  if (!scene || !statusElement) {
    console.error('Required elements not found');
    return;
  }

  // Set up scene events
  scene.addEventListener('loaded', function() {
    statusElement.textContent = 'Ready! Enter AR to begin hand tracking measurement.';
    console.log('Scene loaded successfully');
    
    // Show debug visuals when debug mode is on
    if (app.debugMode && debugVisuals) {
      debugVisuals.setAttribute('visible', true);
    }
  });
  
  // Custom AR entry setup function
  function setupAR() {
    // Setup AR UI elements
    if (arButton) {
      arButton.addEventListener('click', function() {
        // Trigger AR mode if not already in AR
        if (!app.isAR) {
          scene.enterAR();
        }
      });
    }
    
    // Setup hit-test reticle if available
    if (reticle) {
      // Hide initially
      reticle.setAttribute('visible', 'false');
    }
  }
  
  // Call setup function
  setupAR();
  
  // Handle entering AR
  scene.addEventListener('enter-ar', function() {
    // Set AR mode (primary use case)
    app.isAR = true;
    app.arSessionActive = true;
    app.arSessionStartTime = Date.now();
    
    // Update UI
    statusElement.textContent = 'AR mode active - Move your hands into view';
    if (gestureStatusElement) {
      gestureStatusElement.textContent = 'Waiting for hand gestures...';
    }
    
    // Hide AR button when in AR
    if (arButton) {
      arButton.style.display = 'none';
    }
    
    // Hide ground (never needed in AR)
    if (ground) ground.object3D.visible = false;
    
    // Hide reticle initially - will show when hand tracking is active
    if (reticle) {
      reticle.setAttribute('visible', 'false');
    }
    
    console.log(`Entered AR mode at ${new Date().toLocaleTimeString()}`);
    
    // Register for specific WebXR hand tracking events if available
    try {
      if (navigator.xr) {
        console.log('WebXR API available - optimizing for hand tracking');
        
        // Setup AR hit test if available
        if (scene.components['ar-hit-test']) {
          scene.components['ar-hit-test'].el.setAttribute('ar-hit-test', 'enabled', true);
        }
      }
    } catch (e) {
      console.warn('WebXR API not fully supported:', e);
    }
  });
});
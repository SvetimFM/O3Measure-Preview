/**
 * O3Measure - Main Application Entry Point
 * A-Frame based WebXR application with hand tracking focus
 */

// Import error handling and performance monitoring
import errorHandler from './utils/error-handler.js';
import performanceMonitor from './utils/performance-monitor.js';
import uiEnhancement from './utils/ui-enhancement.js';
import onboarding from './utils/onboarding.js';
import haptics from './utils/haptics.js';

// Import core components
import './scenes/basic-scene.js';
import './scenes/scene-manager.js';

// Import state management
import './state/scene-state.js';

// Import custom components
import './components/index.js';

// Log application info
console.log(`[O3Measure] Version: ${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0'}`);
console.log(`[O3Measure] Build Date: ${typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'Unknown'}`);
console.log(`[O3Measure] Environment: ${typeof __IS_PRODUCTION__ !== 'undefined' && __IS_PRODUCTION__ ? 'Production' : 'Development'}`);

document.addEventListener('DOMContentLoaded', function() {

  // Get references to key elements
  const scene = document.querySelector('a-scene');
  const statusElement = document.getElementById('status');
  const arButton = document.getElementById('ar-button');

  if (!scene || !statusElement) {
    console.error('Required elements not found');
    errorHandler.report('Required DOM elements not found', 'critical');
    return;
  }

  // Show loading state
  uiEnhancement.showLoading('Loading O3Measure...', 0);

  // Simulate loading progress (in real app, track actual asset loading)
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 10;
    uiEnhancement.updateLoadingProgress(progress);
    if (progress >= 90) {
      clearInterval(loadingInterval);
    }
  }, 100);

  // Set up scene events
  scene.addEventListener('loaded', function() {
    uiEnhancement.updateLoadingProgress(100, 'Ready!');

    setTimeout(() => {
      uiEnhancement.hideLoading();
      statusElement.textContent = 'Ready! Enter AR to begin hand tracking.';
      statusElement.classList.add('fade-in');

      // Show onboarding if first time
      if (onboarding.shouldShow()) {
        setTimeout(() => {
          onboarding.start();
        }, 500);
      } else {
        uiEnhancement.notify('Welcome back to O3Measure! 👋', 'info');
      }
    }, 300);

    // Set up menu panel
    setupMenuPanel();
  });

  // AR button setup with haptic feedback
  if (arButton) {
    arButton.addEventListener('click', function() {
      haptics.click('both');
      scene.enterAR();
    });

    // Add hover effects
    arButton.addEventListener('mouseenter', function() {
      haptics.tap('both');
    });
  }

  // Handle entering AR
  scene.addEventListener('enter-ar', function() {
    // Update UI
    statusElement.textContent = 'AR mode active - Move your hands into view';
    statusElement.classList.add('fade-in');

    // Hide AR button when in AR
    if (arButton) {
      arButton.classList.add('fade-out');
      setTimeout(() => {
        arButton.style.display = 'none';
      }, 300);
    }

    // Haptic feedback for AR start
    haptics.success('both');

    // Notify user
    uiEnhancement.notify('AR Mode activated! 🎯', 'success');

    // Log performance
    if (typeof __IS_PRODUCTION__ === 'undefined' || !__IS_PRODUCTION__) {
      console.log('[Performance] Entering AR mode');
    }
  });

  // Handle exiting AR
  scene.addEventListener('exit-ar', function() {
    // Update UI
    statusElement.textContent = 'AR mode ended. Click "Start AR" to return.';
    statusElement.classList.remove('fade-in');

    // Show AR button again
    if (arButton) {
      arButton.style.display = 'block';
      arButton.classList.remove('fade-out');
      arButton.classList.add('fade-in');
    }

    uiEnhancement.notify('AR Mode ended', 'info');
  });

  // Handle WebXR errors
  scene.addEventListener('enter-vr-error', function(event) {
    console.error('[WebXR] Error entering VR/AR:', event);
    errorHandler.report('Failed to enter AR mode', 'error', { event });
    uiEnhancement.notify('Failed to enter AR. Check hand tracking settings.', 'error', 5000);
    haptics.error('both');
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

      // Verify the component was applied
      setTimeout(() => {
        const component = menuManager.components['menu-manager'];

        if (component) {
          console.log('[UI] Menu manager initialized successfully');
        } else {
          errorHandler.report('Menu manager failed to initialize', 'warning');
        }
      }, 1000);
    } else {
      console.error('Scene element not found for menu manager setup');
      errorHandler.report('Scene element not found', 'critical');
    }
  }

  // Add keyboard shortcuts for development
  if (typeof __IS_PRODUCTION__ === 'undefined' || !__IS_PRODUCTION__) {
    document.addEventListener('keydown', (e) => {
      // Alt+R = Reset onboarding
      if (e.altKey && e.key === 'r') {
        onboarding.reset();
        uiEnhancement.notify('Onboarding reset!', 'info');
      }
      // Alt+O = Show onboarding
      if (e.altKey && e.key === 'o') {
        onboarding.forceStart();
      }
      // Alt+H = Test haptics
      if (e.altKey && e.key === 'h') {
        haptics.pattern('both', [
          { duration: 50, intensity: 0.3, delay: 0 },
          { duration: 50, intensity: 0.5, delay: 100 },
          { duration: 100, intensity: 0.8, delay: 200 }
        ]);
        uiEnhancement.notify('Haptic test triggered', 'info');
      }
    });
  }
});

/**
 * Modern Menu Example
 * Demonstrates how to use the new spatial UI components
 * with curved panels, SDF text, and hand tracking
 */

import './spatial-ui.js';
import './hand-ui-interaction.js';

/**
 * Example: Modern Spatial Menu
 * A floating curved menu with modern buttons
 */
AFRAME.registerComponent('modern-spatial-menu', {
  schema: {
    width: { type: 'number', default: 0.4 },
    height: { type: 'number', default: 0.5 },
    position: { type: 'vec3', default: { x: 0, y: 1.5, z: -0.8 } },
    curved: { type: 'boolean', default: true },
    grabbable: { type: 'boolean', default: true },
    followUser: { type: 'boolean', default: false }
  },

  init: function() {
    this.createMenu();
  },

  createMenu: function() {
    const data = this.data;

    // Create main panel container
    const panel = document.createElement('a-entity');
    panel.setAttribute('spatial-panel', {
      width: data.width,
      height: data.height,
      curved: data.curved,
      curvature: 2,
      backgroundColor: '#1a1a1a',
      backgroundOpacity: 0.95,
      borderColor: '#15ACCF',
      borderWidth: 0.003,
      followUser: data.followUser
    });
    panel.setAttribute('position', data.position);

    if (data.grabbable) {
      panel.setAttribute('ui-grabbable', {
        enabled: true,
        hapticFeedback: true
      });
    }

    // Add title using Troika text
    const title = document.createElement('a-entity');
    title.setAttribute('spatial-text', {
      value: 'O3Measure',
      fontSize: 0.05,
      color: '#15ACCF',
      anchorX: 'center',
      anchorY: 'middle',
      outlineWidth: 0.003,
      outlineColor: '#000000'
    });
    title.setAttribute('position', `0 ${data.height / 2 - 0.05} 0.03`);
    panel.appendChild(title);

    // Add subtitle
    const subtitle = document.createElement('a-entity');
    subtitle.setAttribute('spatial-text', {
      value: 'Spatial AR Measuring',
      fontSize: 0.025,
      color: '#ffffff',
      anchorX: 'center',
      anchorY: 'middle',
      opacity: 0.7
    });
    subtitle.setAttribute('position', `0 ${data.height / 2 - 0.1} 0.03`);
    panel.appendChild(subtitle);

    // Create button group
    const buttonSpacing = 0.07;
    const startY = 0.08;

    const buttons = [
      { label: 'Wall Calibration', action: 'wall-calibration' },
      { label: 'Object Definition', action: 'object-definition' },
      { label: 'Anchor Placement', action: 'anchor-placement' },
      { label: 'View Objects', action: 'view-objects' },
      { label: 'Settings', action: 'settings' }
    ];

    buttons.forEach((button, index) => {
      const buttonEl = document.createElement('a-entity');
      buttonEl.setAttribute('spatial-button', {
        label: button.label,
        width: data.width - 0.1,
        height: 0.05,
        fontSize: 0.028,
        color: '#15ACCF',
        hoverColor: '#1ac4e6',
        glowOnHover: true,
        haptics: true
      });

      buttonEl.setAttribute('position', {
        x: 0,
        y: startY - (index * buttonSpacing),
        z: 0.03
      });

      // Add hover highlight
      buttonEl.setAttribute('hover-highlight', {
        color: '#15ACCF',
        intensity: 0.4,
        scale: 1.03
      });

      // Add poke detection for direct finger press
      buttonEl.setAttribute('poke-detector', {
        threshold: 0.01,
        haptics: true
      });

      // Handle button click
      buttonEl.addEventListener('spatial-button-click', () => {
        console.log(`[Modern Menu] ${button.label} clicked`);
        this.handleButtonClick(button.action);
      });

      panel.appendChild(buttonEl);
    });

    // Add info text at bottom
    const infoText = document.createElement('a-entity');
    infoText.setAttribute('spatial-text', {
      value: 'Pinch or poke to select',
      fontSize: 0.02,
      color: '#ffffff',
      anchorX: 'center',
      anchorY: 'middle',
      opacity: 0.5
    });
    infoText.setAttribute('position', `0 ${-data.height / 2 + 0.05} 0.03`);
    panel.appendChild(infoText);

    // Add close button
    const closeButton = document.createElement('a-entity');
    closeButton.setAttribute('spatial-button', {
      label: '✕',
      width: 0.04,
      height: 0.04,
      fontSize: 0.03,
      color: '#EF4444',
      hoverColor: '#DC2626'
    });
    closeButton.setAttribute('position', {
      x: data.width / 2 - 0.04,
      y: data.height / 2 - 0.04,
      z: 0.03
    });
    closeButton.addEventListener('spatial-button-click', () => {
      this.el.setAttribute('visible', false);
    });
    panel.appendChild(closeButton);

    this.el.appendChild(panel);

    // Add hand raycasters for interaction
    this.addHandRaycasters();
  },

  addHandRaycasters: function() {
    // Left hand raycaster
    const leftHand = document.getElementById('leftHand');
    if (leftHand && !leftHand.hasAttribute('hand-ui-raycaster')) {
      leftHand.setAttribute('hand-ui-raycaster', {
        hand: 'left',
        lineColor: '#15ACCF',
        showLine: true,
        enabled: true
      });
    }

    // Right hand raycaster
    const rightHand = document.getElementById('rightHand');
    if (rightHand && !rightHand.hasAttribute('hand-ui-raycaster')) {
      rightHand.setAttribute('hand-ui-raycaster', {
        hand: 'right',
        lineColor: '#15ACCF',
        showLine: true,
        enabled: true
      });
    }
  },

  handleButtonClick: function(action) {
    // Emit event for the main app to handle
    this.el.sceneEl.emit('menu-action', { action: action });

    // Show notification
    if (window.uiEnhancement) {
      window.uiEnhancement.notify(`${action} selected`, 'info');
    }

    // Haptic feedback
    if (window.haptics) {
      window.haptics.success('both');
    }
  }
});

/**
 * Example: Curved Info Panel
 * Displays information in a curved panel that follows the user
 */
AFRAME.registerComponent('info-panel', {
  schema: {
    title: { type: 'string', default: 'Information' },
    message: { type: 'string', default: 'This is an info panel' },
    width: { type: 'number', default: 0.35 },
    height: { type: 'number', default: 0.2 },
    autoHide: { type: 'number', default: 5000 } // Auto-hide after ms
  },

  init: function() {
    this.createPanel();

    if (this.data.autoHide > 0) {
      setTimeout(() => {
        this.el.setAttribute('visible', false);
      }, this.data.autoHide);
    }
  },

  createPanel: function() {
    const data = this.data;

    // Create curved panel
    const panel = document.createElement('a-entity');
    panel.setAttribute('curved-panel', {
      width: data.width,
      height: data.height,
      radius: 1.5,
      color: '#2a2a2a',
      opacity: 0.9,
      borderColor: '#F59E0B',
      borderWidth: 0.002,
      glowIntensity: 0.2
    });

    // Title
    const titleEl = document.createElement('a-entity');
    titleEl.setAttribute('spatial-text', {
      value: data.title,
      fontSize: 0.035,
      color: '#F59E0B',
      anchorX: 'center',
      anchorY: 'middle',
      outlineWidth: 0.002
    });
    titleEl.setAttribute('position', `0 ${data.height / 3} 0.02`);
    panel.appendChild(titleEl);

    // Message
    const messageEl = document.createElement('a-entity');
    messageEl.setAttribute('spatial-text', {
      value: data.message,
      fontSize: 0.025,
      color: '#ffffff',
      anchorX: 'center',
      anchorY: 'middle',
      maxWidth: data.width - 0.05,
      textAlign: 'center'
    });
    messageEl.setAttribute('position', '0 0 0.02');
    panel.appendChild(messageEl);

    this.el.appendChild(panel);

    // Follow user smoothly
    panel.setAttribute('spatial-panel', {
      followUser: true,
      followSmoothing: 0.05
    });
  }
});

/**
 * Example: HUD Element
 * Always-visible heads-up display with stats
 */
AFRAME.registerComponent('spatial-hud', {
  schema: {
    position: { type: 'vec3', default: { x: 0.3, y: 0.15, z: -0.5 } }
  },

  init: function() {
    this.createHUD();
  },

  createHUD: function() {
    // Small panel for HUD
    const hudPanel = document.createElement('a-entity');
    hudPanel.setAttribute('position', this.data.position);

    // Semi-transparent background
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', 0.15);
    bg.setAttribute('height', 0.08);
    bg.setAttribute('color', '#000000');
    bg.setAttribute('opacity', 0.6);
    bg.setAttribute('shader', 'flat');
    hudPanel.appendChild(bg);

    // FPS counter
    this.fpsText = document.createElement('a-entity');
    this.fpsText.setAttribute('spatial-text', {
      value: 'FPS: 60',
      fontSize: 0.015,
      color: '#10B981',
      anchorX: 'center',
      anchorY: 'middle'
    });
    this.fpsText.setAttribute('position', '0 0.02 0.01');
    hudPanel.appendChild(this.fpsText);

    // Status text
    this.statusText = document.createElement('a-entity');
    this.statusText.setAttribute('spatial-text', {
      value: 'Ready',
      fontSize: 0.012,
      color: '#ffffff',
      anchorX: 'center',
      anchorY: 'middle',
      opacity: 0.8
    });
    this.statusText.setAttribute('position', '0 -0.01 0.01');
    hudPanel.appendChild(this.statusText);

    // Make it follow camera
    this.el.appendChild(hudPanel);
    this.hudPanel = hudPanel;

    // Update FPS
    this.lastTime = performance.now();
    this.frames = 0;
  },

  tick: function(time, deltaTime) {
    // Update FPS every second
    this.frames++;
    if (time - this.lastTime >= 1000) {
      const fps = Math.round(this.frames);
      if (this.fpsText) {
        this.fpsText.setAttribute('spatial-text', 'value', `FPS: ${fps}`);

        // Color based on performance
        if (fps >= 60) {
          this.fpsText.setAttribute('spatial-text', 'color', '#10B981');
        } else if (fps >= 45) {
          this.fpsText.setAttribute('spatial-text', 'color', '#F59E0B');
        } else {
          this.fpsText.setAttribute('spatial-text', 'color', '#EF4444');
        }
      }

      this.frames = 0;
      this.lastTime = time;
    }

    // Follow camera
    const camera = document.querySelector('[camera]');
    if (camera && this.hudPanel) {
      const cameraPos = camera.object3D.position;
      const cameraRot = camera.object3D.rotation;

      // Position relative to camera
      const offset = new THREE.Vector3(0.3, 0.15, -0.5);
      offset.applyEuler(cameraRot);
      this.hudPanel.object3D.position.copy(cameraPos).add(offset);

      // Face camera
      this.hudPanel.object3D.lookAt(cameraPos);
    }
  }
});

console.log('[Modern Menu Example] Example components loaded');

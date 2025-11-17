/**
 * Modern Spatial UI System for O3Measure
 * Uses Troika-Three-Text and Three-Mesh-UI for cutting-edge VR interfaces
 * Follows Meta Quest 2025 design guidelines
 */

import { Text } from 'troika-three-text';
import * as THREE from 'three';

/**
 * Spatial Text Component
 * High-quality SDF text rendering using Troika
 */
AFRAME.registerComponent('spatial-text', {
  schema: {
    value: { type: 'string', default: 'Text' },
    fontSize: { type: 'number', default: 0.05 },
    color: { type: 'color', default: '#ffffff' },
    anchorX: { type: 'string', default: 'center' }, // left, center, right
    anchorY: { type: 'string', default: 'middle' }, // top, middle, bottom
    maxWidth: { type: 'number', default: 1 },
    textAlign: { type: 'string', default: 'center' },
    font: { type: 'string', default: '' },
    outlineWidth: { type: 'number', default: 0 },
    outlineColor: { type: 'color', default: '#000000' },
    opacity: { type: 'number', default: 1 },
    depthOffset: { type: 'number', default: 0 }
  },

  init: function() {
    this.textMesh = new Text();
    this.el.setObject3D('text', this.textMesh);

    // Set up text properties
    this.textMesh.text = this.data.value;
    this.textMesh.fontSize = this.data.fontSize;
    this.textMesh.color = this.data.color;
    this.textMesh.anchorX = this.data.anchorX;
    this.textMesh.anchorY = this.data.anchorY;
    this.textMesh.maxWidth = this.data.maxWidth;
    this.textMesh.textAlign = this.data.textAlign;
    this.textMesh.depthOffset = this.data.depthOffset;

    // Optional outline
    if (this.data.outlineWidth > 0) {
      this.textMesh.outlineWidth = this.data.outlineWidth;
      this.textMesh.outlineColor = this.data.outlineColor;
    }

    // Material properties
    this.textMesh.material = new THREE.MeshBasicMaterial({
      transparent: this.data.opacity < 1,
      opacity: this.data.opacity
    });

    // Sync the rendering
    this.textMesh.sync();
  },

  update: function(oldData) {
    if (!this.textMesh) return;

    const data = this.data;

    if (oldData.value !== data.value) {
      this.textMesh.text = data.value;
    }
    if (oldData.fontSize !== data.fontSize) {
      this.textMesh.fontSize = data.fontSize;
    }
    if (oldData.color !== data.color) {
      this.textMesh.color = data.color;
    }
    if (oldData.opacity !== data.opacity) {
      this.textMesh.material.opacity = data.opacity;
      this.textMesh.material.transparent = data.opacity < 1;
    }

    this.textMesh.sync();
  },

  remove: function() {
    if (this.textMesh) {
      this.textMesh.dispose();
    }
  }
});

/**
 * Curved Panel Component
 * Creates curved UI panels following Meta Quest spatial guidelines
 */
AFRAME.registerComponent('curved-panel', {
  schema: {
    width: { type: 'number', default: 0.5 },
    height: { type: 'number', default: 0.3 },
    radius: { type: 'number', default: 2 }, // Curvature radius
    segments: { type: 'number', default: 32 },
    color: { type: 'color', default: '#1a1a1a' },
    opacity: { type: 'number', default: 0.95 },
    borderWidth: { type: 'number', default: 0.002 },
    borderColor: { type: 'color', default: '#15ACCF' },
    depth: { type: 'number', default: 0.01 }, // Panel thickness
    glowIntensity: { type: 'number', default: 0 },
    castShadow: { type: 'boolean', default: true }
  },

  init: function() {
    this.createCurvedPanel();
  },

  createCurvedPanel: function() {
    const data = this.data;

    // Create curved geometry
    const geometry = new THREE.CylinderBufferGeometry(
      data.radius,
      data.radius,
      data.height,
      data.segments,
      1,
      true, // Open-ended
      Math.PI - (data.width / data.radius) / 2,
      data.width / data.radius
    );

    // Rotate to face forward
    geometry.rotateY(Math.PI);
    geometry.translate(0, 0, -data.radius);

    // Main panel material with modern look
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      transparent: data.opacity < 1,
      opacity: data.opacity,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.1,
      emissive: data.glowIntensity > 0 ? data.borderColor : '#000000',
      emissiveIntensity: data.glowIntensity
    });

    const mesh = new THREE.Mesh(geometry, material);

    if (data.castShadow) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    this.el.setObject3D('panel', mesh);

    // Add border if specified
    if (data.borderWidth > 0) {
      this.createBorder();
    }

    // Add depth/extrusion
    if (data.depth > 0) {
      this.createDepthLayer();
    }
  },

  createBorder: function() {
    const data = this.data;

    // Create slightly larger curved panel for border
    const borderGeometry = new THREE.CylinderBufferGeometry(
      data.radius - 0.001,
      data.radius - 0.001,
      data.height + data.borderWidth * 2,
      data.segments,
      1,
      true,
      Math.PI - ((data.width + data.borderWidth * 2) / data.radius) / 2,
      (data.width + data.borderWidth * 2) / data.radius
    );

    borderGeometry.rotateY(Math.PI);
    borderGeometry.translate(0, 0, -data.radius + 0.001);

    const borderMaterial = new THREE.MeshStandardMaterial({
      color: data.borderColor,
      emissive: data.borderColor,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
    this.el.setObject3D('border', borderMesh);
  },

  createDepthLayer: function() {
    const data = this.data;

    // Create back layer for depth effect
    const depthGeometry = new THREE.CylinderBufferGeometry(
      data.radius + data.depth,
      data.radius + data.depth,
      data.height,
      data.segments,
      1,
      true,
      Math.PI - (data.width / (data.radius + data.depth)) / 2,
      data.width / (data.radius + data.depth)
    );

    depthGeometry.rotateY(Math.PI);
    depthGeometry.translate(0, 0, -(data.radius + data.depth));

    const depthMaterial = new THREE.MeshStandardMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const depthMesh = new THREE.Mesh(depthGeometry, depthMaterial);
    this.el.setObject3D('depth', depthMesh);
  },

  update: function(oldData) {
    // Recreate if major properties changed
    if (oldData.width !== this.data.width ||
        oldData.height !== this.data.height ||
        oldData.radius !== this.data.radius) {
      this.remove();
      this.createCurvedPanel();
    }
  },

  remove: function() {
    ['panel', 'border', 'depth'].forEach(name => {
      const obj = this.el.getObject3D(name);
      if (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        this.el.removeObject3D(name);
      }
    });
  }
});

/**
 * Modern Button Component
 * Spatial button with depth, glow, and hand tracking support
 */
AFRAME.registerComponent('spatial-button', {
  schema: {
    label: { type: 'string', default: 'Button' },
    width: { type: 'number', default: 0.15 },
    height: { type: 'number', default: 0.05 },
    depth: { type: 'number', default: 0.01 },
    color: { type: 'color', default: '#15ACCF' },
    hoverColor: { type: 'color', default: '#1ac4e6' },
    pressColor: { type: 'color', default: '#0f8fad' },
    textColor: { type: 'color', default: '#ffffff' },
    fontSize: { type: 'number', default: 0.03 },
    borderRadius: { type: 'number', default: 0.01 },
    glowOnHover: { type: 'boolean', default: true },
    haptics: { type: 'boolean', default: true }
  },

  init: function() {
    this.pressed = false;
    this.hovered = false;

    this.createButton();
    this.setupInteraction();
  },

  createButton: function() {
    const data = this.data;

    // Create rounded box geometry for button
    const geometry = this.createRoundedBoxGeometry(
      data.width,
      data.height,
      data.depth,
      data.borderRadius
    );

    // Modern gradient-like material
    this.material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.4,
      metalness: 0.2,
      emissive: data.color,
      emissiveIntensity: 0,
      envMapIntensity: 1
    });

    this.buttonMesh = new THREE.Mesh(geometry, this.material);
    this.buttonMesh.castShadow = true;
    this.buttonMesh.receiveShadow = true;

    this.el.setObject3D('button', this.buttonMesh);

    // Add text using spatial-text
    this.textEntity = document.createElement('a-entity');
    this.textEntity.setAttribute('spatial-text', {
      value: data.label,
      fontSize: data.fontSize,
      color: data.textColor,
      anchorX: 'center',
      anchorY: 'middle',
      outlineWidth: 0.002,
      outlineColor: '#000000'
    });
    this.textEntity.setAttribute('position', `0 0 ${data.depth / 2 + 0.001}`);
    this.el.appendChild(this.textEntity);

    // Make interactive
    this.el.classList.add('interactive');
  },

  createRoundedBoxGeometry: function(width, height, depth, radius) {
    // Create rounded corners using THREE.Shape
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.1,
      bevelSize: depth * 0.1,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  },

  setupInteraction: function() {
    const data = this.data;

    // Hover state
    this.el.addEventListener('mouseenter', () => {
      if (this.pressed) return;
      this.hovered = true;
      this.updateVisuals();

      if (data.haptics && window.haptics) {
        window.haptics.tap();
      }
    });

    this.el.addEventListener('mouseleave', () => {
      this.hovered = false;
      this.updateVisuals();
    });

    // Press state
    this.el.addEventListener('mousedown', () => {
      this.pressed = true;
      this.updateVisuals();

      if (data.haptics && window.haptics) {
        window.haptics.click();
      }
    });

    this.el.addEventListener('mouseup', () => {
      this.pressed = false;
      this.updateVisuals();
    });

    // Click event
    this.el.addEventListener('click', (evt) => {
      if (data.haptics && window.haptics) {
        window.haptics.strong();
      }

      // Emit custom event
      this.el.emit('spatial-button-click', { button: this.el }, true);
    });
  },

  updateVisuals: function() {
    const data = this.data;

    if (this.pressed) {
      // Pressed state
      this.material.color.set(data.pressColor);
      this.material.emissiveIntensity = 0.2;
      this.buttonMesh.scale.set(0.95, 0.95, 0.7);
    } else if (this.hovered) {
      // Hover state
      this.material.color.set(data.hoverColor);
      this.material.emissiveIntensity = data.glowOnHover ? 0.3 : 0;
      this.buttonMesh.scale.set(1.05, 1.05, 1);
    } else {
      // Normal state
      this.material.color.set(data.color);
      this.material.emissiveIntensity = 0;
      this.buttonMesh.scale.set(1, 1, 1);
    }
  },

  remove: function() {
    if (this.buttonMesh) {
      if (this.buttonMesh.geometry) this.buttonMesh.geometry.dispose();
      if (this.material) this.material.dispose();
    }
    if (this.textEntity) {
      this.textEntity.parentNode?.removeChild(this.textEntity);
    }
  }
});

/**
 * Spatial Panel Container
 * Flexible container with modern layout capabilities
 */
AFRAME.registerComponent('spatial-panel', {
  schema: {
    width: { type: 'number', default: 0.5 },
    height: { type: 'number', default: 0.3 },
    curved: { type: 'boolean', default: true },
    curvature: { type: 'number', default: 2 },
    padding: { type: 'number', default: 0.02 },
    backgroundColor: { type: 'color', default: '#1a1a1a' },
    backgroundOpacity: { type: 'number', default: 0.95 },
    borderColor: { type: 'color', default: '#15ACCF' },
    borderWidth: { type: 'number', default: 0.002 },
    followUser: { type: 'boolean', default: false },
    followSmoothing: { type: 'number', default: 0.1 },
    anchorToSpace: { type: 'boolean', default: true }
  },

  init: function() {
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();

    // Create panel background
    if (this.data.curved) {
      this.backgroundEntity = document.createElement('a-entity');
      this.backgroundEntity.setAttribute('curved-panel', {
        width: this.data.width,
        height: this.data.height,
        radius: this.data.curvature,
        color: this.data.backgroundColor,
        opacity: this.data.backgroundOpacity,
        borderColor: this.data.borderColor,
        borderWidth: this.data.borderWidth
      });
      this.el.appendChild(this.backgroundEntity);
    } else {
      // Flat panel
      this.backgroundEntity = document.createElement('a-plane');
      this.backgroundEntity.setAttribute('width', this.data.width);
      this.backgroundEntity.setAttribute('height', this.data.height);
      this.backgroundEntity.setAttribute('color', this.data.backgroundColor);
      this.backgroundEntity.setAttribute('opacity', this.data.backgroundOpacity);
      this.backgroundEntity.setAttribute('shader', 'standard');
      this.el.appendChild(this.backgroundEntity);
    }

    // Content container
    this.contentContainer = document.createElement('a-entity');
    this.contentContainer.setAttribute('position', `0 0 0.02`);
    this.el.appendChild(this.contentContainer);
  },

  tick: function(time, deltaTime) {
    if (!this.data.followUser) return;

    // Smooth follow camera
    const camera = document.querySelector('[camera]');
    if (!camera) return;

    const cameraPos = camera.object3D.position;
    const cameraRot = camera.object3D.rotation;

    // Calculate target position (in front of user)
    this.targetPosition.copy(cameraPos);
    this.targetPosition.z -= 0.8; // 0.8m in front

    // Smooth interpolation
    const currentPos = this.el.object3D.position;
    currentPos.lerp(this.targetPosition, this.data.followSmoothing);

    // Face the camera
    this.el.object3D.lookAt(cameraPos);
  },

  getContentContainer: function() {
    return this.contentContainer;
  }
});

console.log('[Spatial UI] Modern 3D UI components loaded');

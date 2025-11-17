/**
 * Hand Tracking UI Interaction System
 * Advanced hand gesture support for spatial UI
 * Supports pinch, poke, hover, and grab gestures
 */

import * as THREE from 'three';

/**
 * Hand UI Raycaster
 * Casts rays from hand joints for UI interaction
 */
AFRAME.registerComponent('hand-ui-raycaster', {
  schema: {
    hand: { type: 'string', default: 'right' }, // 'left' or 'right'
    lineColor: { type: 'color', default: '#15ACCF' },
    lineOpacity: { type: 'number', default: 0.5 },
    lineWidth: { type: 'number', default: 0.002 },
    showLine: { type: 'boolean', default: true },
    maxDistance: { type: 'number', default: 2 },
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    this.raycaster = new THREE.Raycaster();
    this.direction = new THREE.Vector3();
    this.origin = new THREE.Vector3();

    this.hoveredElement = null;
    this.previousHovered = null;

    if (this.data.showLine) {
      this.createPointerLine();
    }

    // Get hand tracking element
    this.handEl = document.getElementById(this.data.hand + 'Hand');

    // Listen for pinch events
    if (this.handEl) {
      this.handEl.addEventListener('pinchstarted', this.onPinchStart.bind(this));
      this.handEl.addEventListener('pinchended', this.onPinchEnd.bind(this));
    }

    this.pinching = false;
  },

  createPointerLine: function() {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1)
    ]);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.data.lineColor,
      opacity: this.data.lineOpacity,
      transparent: true,
      linewidth: this.data.lineWidth
    });

    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.line.visible = false;
    this.el.setObject3D('line', this.line);
  },

  tick: function() {
    if (!this.data.enabled || !this.handEl) return;

    // Get index finger tip position for pointing
    const indexTip = this.handEl.components['hand-tracking-controls']?.indexTipPosition;

    if (!indexTip) return;

    // Set ray origin and direction
    this.origin.copy(indexTip);

    // Direction from index finger
    const indexBase = this.handEl.components['hand-tracking-controls']?.indexKnucklePosition;
    if (indexBase) {
      this.direction.subVectors(indexTip, indexBase).normalize();
    } else {
      // Default forward direction
      this.direction.set(0, 0, -1);
      this.direction.applyQuaternion(this.handEl.object3D.quaternion);
    }

    this.raycaster.set(this.origin, this.direction);
    this.raycaster.far = this.data.maxDistance;

    // Find interactive elements
    const interactiveElements = document.querySelectorAll('.interactive');
    const intersections = [];

    interactiveElements.forEach(el => {
      const obj = el.object3D;
      if (obj && obj.visible) {
        const results = this.raycaster.intersectObject(obj, true);
        if (results.length > 0) {
          intersections.push({
            element: el,
            distance: results[0].distance,
            point: results[0].point
          });
        }
      }
    });

    // Sort by distance
    intersections.sort((a, b) => a.distance - b.distance);

    // Update hover state
    const newHovered = intersections.length > 0 ? intersections[0].element : null;

    if (newHovered !== this.previousHovered) {
      // Mouse leave previous
      if (this.previousHovered) {
        this.previousHovered.emit('mouseleave');
      }

      // Mouse enter new
      if (newHovered) {
        newHovered.emit('mouseenter');

        // Update pointer line
        if (this.line) {
          this.line.visible = true;
          const positions = this.line.geometry.attributes.position.array;
          positions[3] = 0;
          positions[4] = 0;
          positions[5] = -intersections[0].distance;
          this.line.geometry.attributes.position.needsUpdate = true;
        }
      } else if (this.line) {
        this.line.visible = false;
      }

      this.previousHovered = newHovered;
    }

    this.hoveredElement = newHovered;

    // Handle pinch click
    if (this.pinching && this.hoveredElement && !this.clickHandled) {
      this.hoveredElement.emit('mousedown');
      this.clickHandled = true;
    }
  },

  onPinchStart: function() {
    this.pinching = true;
    this.clickHandled = false;

    if (this.hoveredElement) {
      this.hoveredElement.emit('mousedown');
    }
  },

  onPinchEnd: function() {
    if (this.hoveredElement && this.pinching) {
      this.hoveredElement.emit('mouseup');
      this.hoveredElement.emit('click');
    }

    this.pinching = false;
    this.clickHandled = false;
  },

  remove: function() {
    if (this.line) {
      this.line.geometry.dispose();
      this.line.material.dispose();
    }
  }
});

/**
 * Grabbable Spatial UI
 * Allows panels and menus to be grabbed and repositioned
 */
AFRAME.registerComponent('ui-grabbable', {
  schema: {
    enabled: { type: 'boolean', default: true },
    smoothing: { type: 'number', default: 0.3 },
    maxDistance: { type: 'number', default: 1.5 },
    hapticFeedback: { type: 'boolean', default: true }
  },

  init: function() {
    this.grabbed = false;
    this.grabbingHand = null;
    this.grabOffset = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.targetQuaternion = new THREE.Quaternion();

    this.el.classList.add('grabbable');
    this.setupGrabListeners();
  },

  setupGrabListeners: function() {
    // Listen for hand grab gestures
    const leftHand = document.getElementById('leftHand');
    const rightHand = document.getElementById('rightHand');

    if (leftHand) {
      leftHand.addEventListener('gripdown', (evt) => this.onGripDown(evt, 'left'));
      leftHand.addEventListener('gripup', (evt) => this.onGripUp(evt, 'left'));
    }

    if (rightHand) {
      rightHand.addEventListener('gripdown', (evt) => this.onGripDown(evt, 'right'));
      rightHand.addEventListener('gripup', (evt) => this.onGripUp(evt, 'right'));
    }
  },

  onGripDown: function(evt, hand) {
    if (this.grabbed || !this.data.enabled) return;

    const handEl = document.getElementById(hand + 'Hand');
    if (!handEl) return;

    // Check if hand is close enough to this UI element
    const handPos = handEl.object3D.position;
    const uiPos = this.el.object3D.position;
    const distance = handPos.distanceTo(uiPos);

    if (distance < this.data.maxDistance) {
      this.grabbed = true;
      this.grabbingHand = handEl;

      // Calculate grab offset
      this.grabOffset.copy(uiPos).sub(handPos);

      // Haptic feedback
      if (this.data.hapticFeedback && window.haptics) {
        window.haptics.grab(hand);
      }

      // Visual feedback
      this.el.emit('grab-start');

      console.log(`[UI Grabbable] Grabbed with ${hand} hand`);
    }
  },

  onGripUp: function(evt, hand) {
    if (!this.grabbed) return;

    const handEl = document.getElementById(hand + 'Hand');
    if (handEl === this.grabbingHand) {
      this.grabbed = false;
      this.grabbingHand = null;

      // Haptic feedback
      if (this.data.hapticFeedback && window.haptics) {
        window.haptics.release(hand);
      }

      // Visual feedback
      this.el.emit('grab-end');

      console.log(`[UI Grabbable] Released from ${hand} hand`);
    }
  },

  tick: function(time, deltaTime) {
    if (!this.grabbed || !this.grabbingHand) return;

    // Follow hand position
    const handPos = this.grabbingHand.object3D.position;
    this.targetPosition.copy(handPos).add(this.grabOffset);

    // Smooth follow
    const currentPos = this.el.object3D.position;
    currentPos.lerp(this.targetPosition, this.data.smoothing);

    // Optional: Match hand rotation
    const handRot = this.grabbingHand.object3D.quaternion;
    this.el.object3D.quaternion.slerp(handRot, this.data.smoothing * 0.5);
  }
});

/**
 * Poke Interaction
 * Detects finger poke gestures for button pressing
 */
AFRAME.registerComponent('poke-detector', {
  schema: {
    threshold: { type: 'number', default: 0.01 }, // Distance threshold for poke
    haptics: { type: 'boolean', default: true }
  },

  init: function() {
    this.poking = false;
    this.boundingBox = new THREE.Box3();
    this.fingerPosition = new THREE.Vector3();

    this.el.classList.add('pokeable');
  },

  tick: function() {
    // Update bounding box
    this.boundingBox.setFromObject(this.el.object3D);

    // Check both hands
    const hands = ['leftHand', 'rightHand'];

    hands.forEach(handId => {
      const handEl = document.getElementById(handId);
      if (!handEl) return;

      const handTracking = handEl.components['hand-tracking-controls'];
      if (!handTracking || !handTracking.indexTipPosition) return;

      this.fingerPosition.copy(handTracking.indexTipPosition);

      // Check if finger is inside bounding box
      const isPoking = this.boundingBox.containsPoint(this.fingerPosition);

      if (isPoking && !this.poking) {
        // Poke started
        this.poking = true;
        this.el.emit('poke-start');
        this.el.emit('mousedown');

        if (this.data.haptics && window.haptics) {
          const hand = handId.includes('left') ? 'left' : 'right';
          window.haptics.click(hand);
        }
      } else if (!isPoking && this.poking) {
        // Poke ended
        this.poking = false;
        this.el.emit('poke-end');
        this.el.emit('mouseup');
        this.el.emit('click');
      }
    });
  }
});

/**
 * Hover Highlight
 * Visual feedback for hovering over UI elements
 */
AFRAME.registerComponent('hover-highlight', {
  schema: {
    color: { type: 'color', default: '#15ACCF' },
    intensity: { type: 'number', default: 0.3 },
    scale: { type: 'number', default: 1.05 }
  },

  init: function() {
    this.originalScale = this.el.object3D.scale.clone();
    this.originalEmissive = null;
    this.isHovering = false;

    this.el.addEventListener('mouseenter', this.onHover.bind(this));
    this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
  },

  onHover: function() {
    this.isHovering = true;

    // Scale up
    this.el.object3D.scale.set(
      this.originalScale.x * this.data.scale,
      this.originalScale.y * this.data.scale,
      this.originalScale.z * this.data.scale
    );

    // Add emissive glow
    this.el.object3D.traverse((child) => {
      if (child.material && child.material.emissive) {
        if (!this.originalEmissive) {
          this.originalEmissive = child.material.emissiveIntensity;
        }
        child.material.emissive.set(this.data.color);
        child.material.emissiveIntensity = this.data.intensity;
      }
    });
  },

  onUnhover: function() {
    this.isHovering = false;

    // Reset scale
    this.el.object3D.scale.copy(this.originalScale);

    // Reset emissive
    this.el.object3D.traverse((child) => {
      if (child.material && child.material.emissive && this.originalEmissive !== null) {
        child.material.emissiveIntensity = this.originalEmissive;
      }
    });
  }
});

console.log('[Hand UI Interaction] Hand tracking UI system loaded');

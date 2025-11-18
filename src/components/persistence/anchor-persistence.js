/**
 * WebXR Anchors Persistence System
 * Implements WebXR Anchors API for persistent AR object tracking
 * Allows measurements to stay anchored in real-world space across sessions
 */

import * as THREE from 'three';

/**
 * Anchor Manager Component
 * Manages WebXR spatial anchors for persistent object placement
 */
AFRAME.registerComponent('anchor-manager', {
  schema: {
    enabled: { type: 'boolean', default: true },
    persistentAnchors: { type: 'boolean', default: true }, // Use persistent anchors if supported
    debugMode: { type: 'boolean', default: false }
  },

  init: function() {
    this.anchors = new Map(); // Map of anchor ID to anchor object
    this.anchoredObjects = new Map(); // Map of object ID to anchor ID
    this.session = null;
    this.frame = null;

    // Check WebXR Anchors support
    this.checkAnchorSupport();

    // Bind event handlers
    this.onSessionStarted = this.onSessionStarted.bind(this);
    this.onSessionEnded = this.onSessionEnded.bind(this);

    // Listen for AR session events
    this.el.sceneEl.addEventListener('enter-vr', this.onSessionStarted);
    this.el.sceneEl.addEventListener('exit-vr', this.onSessionEnded);

    console.log('[Anchor Manager] Initialized');
  },

  checkAnchorSupport: function() {
    // Check if browser supports WebXR Anchors
    if (!navigator.xr) {
      console.warn('[Anchor Manager] WebXR not supported');
      this.anchorSupport = false;
      return;
    }

    // Will be checked when session starts
    this.anchorSupport = null;
    console.log('[Anchor Manager] WebXR detected, checking anchor support...');
  },

  onSessionStarted: function() {
    const sceneEl = this.el.sceneEl;

    // Wait for XR session to be available
    setTimeout(() => {
      const renderer = sceneEl.renderer;
      if (!renderer || !renderer.xr) {
        console.warn('[Anchor Manager] XR renderer not available');
        return;
      }

      this.session = renderer.xr.getSession();
      if (!this.session) {
        console.warn('[Anchor Manager] No active XR session');
        return;
      }

      // Check anchor support
      if (this.session.requestHitTestSource) {
        this.anchorSupport = true;
        console.log('[Anchor Manager] ✓ WebXR Anchors supported');

        // Check for persistent anchors
        if (this.data.persistentAnchors && this.session.restorePersistentAnchor) {
          this.persistentAnchorSupport = true;
          console.log('[Anchor Manager] ✓ Persistent anchors supported');

          // Restore previously saved anchors
          this.restorePersistentAnchors();
        } else {
          this.persistentAnchorSupport = false;
          console.log('[Anchor Manager] ✗ Persistent anchors not supported');
        }
      } else {
        this.anchorSupport = false;
        console.warn('[Anchor Manager] ✗ Anchors not supported by this device');
      }

      // Start anchor update loop
      this.startAnchorLoop();
    }, 1000);
  },

  onSessionEnded: function() {
    console.log('[Anchor Manager] Session ended, cleaning up anchors');

    // Delete all non-persistent anchors
    this.anchors.forEach((anchor, id) => {
      if (!anchor.persistent) {
        anchor.delete();
      }
    });

    this.session = null;
    this.frame = null;
  },

  startAnchorLoop: function() {
    const sceneEl = this.el.sceneEl;

    // Get reference space
    const renderer = sceneEl.renderer;
    if (!renderer || !renderer.xr) return;

    // Update anchors every frame
    this.el.sceneEl.addEventListener('beforerender', (evt) => {
      if (!this.session || !this.data.enabled) return;

      const frame = evt.detail.frame;
      if (!frame) return;

      this.frame = frame;
      this.updateAnchors(frame);
    });

    console.log('[Anchor Manager] Anchor tracking started');
  },

  updateAnchors: function(frame) {
    const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();

    // Update all tracked anchors
    this.anchors.forEach((anchorData, id) => {
      const anchor = anchorData.anchor;

      try {
        const anchorPose = frame.getPose(anchor.anchorSpace, referenceSpace);

        if (anchorPose) {
          // Update anchored object position
          const objectId = anchorData.objectId;
          const object = this.anchoredObjects.get(objectId);

          if (object && object.object3D) {
            // Apply anchor transform to object
            const transform = anchorPose.transform;
            object.object3D.position.set(
              transform.position.x,
              transform.position.y,
              transform.position.z
            );

            object.object3D.quaternion.set(
              transform.orientation.x,
              transform.orientation.y,
              transform.orientation.z,
              transform.orientation.w
            );
          }
        }
      } catch (error) {
        if (this.data.debugMode) {
          console.error(`[Anchor Manager] Error updating anchor ${id}:`, error);
        }
      }
    });
  },

  /**
   * Create an anchor at a specific position
   * @param {Object} position - {x, y, z} position in world space
   * @param {string} objectId - ID of object to anchor
   * @param {boolean} persistent - Whether anchor should persist across sessions
   * @returns {Promise<string>} Anchor ID
   */
  createAnchor: async function(position, objectId, persistent = false) {
    if (!this.anchorSupport) {
      console.warn('[Anchor Manager] Anchors not supported, skipping');
      return null;
    }

    if (!this.session || !this.frame) {
      console.warn('[Anchor Manager] No active session');
      return null;
    }

    try {
      // Create anchor pose
      const anchorPose = new XRRigidTransform(
        { x: position.x, y: position.y, z: position.z },
        { x: 0, y: 0, z: 0, w: 1 }
      );

      const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();

      // Create anchor
      let anchor;
      if (persistent && this.persistentAnchorSupport) {
        // Create persistent anchor
        anchor = await this.session.createAnchor(anchorPose, referenceSpace);

        // Request persistence
        const persistentId = await anchor.requestPersistentHandle();
        console.log(`[Anchor Manager] ✓ Created persistent anchor: ${persistentId}`);

        // Save to localStorage for restoration
        this.savePersistentAnchorId(objectId, persistentId);
      } else {
        // Create regular (session-only) anchor
        anchor = await this.session.createAnchor(anchorPose, referenceSpace);
        console.log('[Anchor Manager] ✓ Created session anchor');
      }

      // Generate anchor ID
      const anchorId = `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store anchor
      this.anchors.set(anchorId, {
        anchor: anchor,
        objectId: objectId,
        persistent: persistent,
        createdAt: Date.now()
      });

      // Emit event
      this.el.emit('anchor-created', {
        anchorId: anchorId,
        objectId: objectId,
        persistent: persistent
      });

      return anchorId;

    } catch (error) {
      console.error('[Anchor Manager] Failed to create anchor:', error);
      return null;
    }
  },

  /**
   * Anchor an existing object to a position
   * @param {HTMLElement} object - A-Frame entity to anchor
   * @param {boolean} persistent - Whether anchor should persist
   * @returns {Promise<string>} Anchor ID
   */
  anchorObject: async function(object, persistent = false) {
    if (!object || !object.object3D) {
      console.error('[Anchor Manager] Invalid object');
      return null;
    }

    const objectId = object.getAttribute('data-id') || object.id;
    const position = object.object3D.position;

    console.log(`[Anchor Manager] Anchoring object ${objectId} at`, position);

    // Create anchor
    const anchorId = await this.createAnchor(
      { x: position.x, y: position.y, z: position.z },
      objectId,
      persistent
    );

    if (anchorId) {
      // Store object reference
      this.anchoredObjects.set(objectId, object);

      // Mark object as anchored
      object.setAttribute('data-anchored', 'true');
      object.setAttribute('data-anchor-id', anchorId);

      console.log(`[Anchor Manager] ✓ Object ${objectId} anchored with ID ${anchorId}`);
    }

    return anchorId;
  },

  /**
   * Remove anchor from an object
   * @param {string} objectId - ID of anchored object
   */
  unanchorObject: function(objectId) {
    const anchorEntry = Array.from(this.anchors.entries()).find(
      ([id, data]) => data.objectId === objectId
    );

    if (!anchorEntry) {
      console.warn(`[Anchor Manager] No anchor found for object ${objectId}`);
      return;
    }

    const [anchorId, anchorData] = anchorEntry;

    // Delete anchor
    if (anchorData.anchor) {
      anchorData.anchor.delete();
    }

    // Remove from maps
    this.anchors.delete(anchorId);
    this.anchoredObjects.delete(objectId);

    // Update object
    const object = document.querySelector(`[data-id="${objectId}"]`);
    if (object) {
      object.removeAttribute('data-anchored');
      object.removeAttribute('data-anchor-id');
    }

    // Remove from localStorage if persistent
    this.removePersistentAnchorId(objectId);

    console.log(`[Anchor Manager] ✓ Removed anchor for object ${objectId}`);

    // Emit event
    this.el.emit('anchor-removed', { objectId: objectId, anchorId: anchorId });
  },

  /**
   * Save persistent anchor ID to localStorage
   */
  savePersistentAnchorId: function(objectId, persistentId) {
    const savedAnchors = JSON.parse(localStorage.getItem('o3measure_persistent_anchors') || '{}');
    savedAnchors[objectId] = {
      persistentId: persistentId,
      savedAt: Date.now()
    };
    localStorage.setItem('o3measure_persistent_anchors', JSON.stringify(savedAnchors));
  },

  /**
   * Remove persistent anchor ID from localStorage
   */
  removePersistentAnchorId: function(objectId) {
    const savedAnchors = JSON.parse(localStorage.getItem('o3measure_persistent_anchors') || '{}');
    delete savedAnchors[objectId];
    localStorage.setItem('o3measure_persistent_anchors', JSON.stringify(savedAnchors));
  },

  /**
   * Restore persistent anchors from previous sessions
   */
  restorePersistentAnchors: async function() {
    if (!this.persistentAnchorSupport || !this.session) {
      return;
    }

    const savedAnchors = JSON.parse(localStorage.getItem('o3measure_persistent_anchors') || '{}');

    console.log(`[Anchor Manager] Restoring ${Object.keys(savedAnchors).length} persistent anchors...`);

    for (const [objectId, data] of Object.entries(savedAnchors)) {
      try {
        const anchor = await this.session.restorePersistentAnchor(data.persistentId);

        if (anchor) {
          const anchorId = `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          this.anchors.set(anchorId, {
            anchor: anchor,
            objectId: objectId,
            persistent: true,
            createdAt: data.savedAt
          });

          console.log(`[Anchor Manager] ✓ Restored persistent anchor for object ${objectId}`);

          // Emit event for object restoration
          this.el.emit('anchor-restored', {
            anchorId: anchorId,
            objectId: objectId,
            persistentId: data.persistentId
          });
        }
      } catch (error) {
        console.warn(`[Anchor Manager] Failed to restore anchor for ${objectId}:`, error);

        // Remove invalid anchor from storage
        this.removePersistentAnchorId(objectId);
      }
    }
  },

  /**
   * Get all anchored objects
   * @returns {Array} Array of {objectId, anchorId, persistent}
   */
  getAnchoredObjects: function() {
    const result = [];

    this.anchors.forEach((data, anchorId) => {
      result.push({
        anchorId: anchorId,
        objectId: data.objectId,
        persistent: data.persistent,
        createdAt: data.createdAt
      });
    });

    return result;
  },

  remove: function() {
    // Clean up anchors
    this.anchors.forEach((anchorData) => {
      if (anchorData.anchor && !anchorData.persistent) {
        anchorData.anchor.delete();
      }
    });

    // Remove event listeners
    this.el.sceneEl.removeEventListener('enter-vr', this.onSessionStarted);
    this.el.sceneEl.removeEventListener('exit-vr', this.onSessionEnded);
  }
});

console.log('[Anchor Persistence] WebXR Anchors persistence system loaded');

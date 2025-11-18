/**
 * AR Photo Capture System
 * Capture screenshots with measurement overlays
 * Professional documentation and sharing capabilities
 */

import * as THREE from 'three';

/**
 * Screenshot Manager Component
 * Handles capturing AR views with measurements
 */
AFRAME.registerComponent('screenshot-manager', {
  schema: {
    includeOverlays: { type: 'boolean', default: true },
    resolution: { type: 'string', default: 'high' }, // 'low', 'medium', 'high', 'ultra'
    format: { type: 'string', default: 'png' }, // 'png' or 'jpeg'
    quality: { type: 'number', default: 0.92 }, // For JPEG (0-1)
    watermark: { type: 'boolean', default: true }
  },

  init: function() {
    this.renderer = null;
    this.camera = null;

    // Bind event handlers
    this.captureScreenshot = this.captureScreenshot.bind(this);

    // Listen for capture requests
    this.el.sceneEl.addEventListener('capture-screenshot', this.captureScreenshot);
    this.el.sceneEl.addEventListener('capture-with-measurements', this.captureWithMeasurements.bind(this));

    console.log('[Screenshot Manager] Initialized');
  },

  /**
   * Get resolution multiplier based on quality setting
   */
  getResolutionMultiplier: function() {
    switch (this.data.resolution) {
      case 'low': return 1;
      case 'medium': return 1.5;
      case 'high': return 2;
      case 'ultra': return 3;
      default: return 2;
    }
  },

  /**
   * Capture current AR view
   */
  captureScreenshot: function(evt) {
    const options = evt.detail || {};

    try {
      // Get renderer and camera
      this.renderer = this.el.sceneEl.renderer;
      this.camera = this.el.sceneEl.camera;

      if (!this.renderer || !this.camera) {
        console.error('[Screenshot Manager] Renderer or camera not available');
        return;
      }

      // Get current canvas
      const canvas = this.renderer.domElement;

      // Create high-resolution capture canvas
      const multiplier = this.getResolutionMultiplier();
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = canvas.width * multiplier;
      captureCanvas.height = canvas.height * multiplier;

      const ctx = captureCanvas.getContext('2d');

      // Draw current scene
      ctx.drawImage(canvas, 0, 0, captureCanvas.width, captureCanvas.height);

      // Add watermark if enabled
      if (this.data.watermark) {
        this.addWatermark(ctx, captureCanvas.width, captureCanvas.height);
      }

      // Add metadata overlay if requested
      if (options.includeMetadata) {
        this.addMetadataOverlay(ctx, captureCanvas.width, captureCanvas.height);
      }

      // Convert to image
      const mimeType = this.data.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataURL = captureCanvas.toDataURL(mimeType, this.data.quality);

      // Download or return
      if (options.download !== false) {
        this.downloadImage(dataURL, options.filename);
      }

      // Emit event with data
      this.el.emit('screenshot-captured', {
        dataURL: dataURL,
        width: captureCanvas.width,
        height: captureCanvas.height,
        format: this.data.format
      });

      console.log('[Screenshot Manager] ✓ Screenshot captured');

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Screenshot captured', 'success');
      }

      // Haptic feedback
      if (window.haptics) {
        window.haptics.success('both');
      }

      return dataURL;

    } catch (error) {
      console.error('[Screenshot Manager] Capture failed:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Screenshot failed', 'error');
      }

      return null;
    }
  },

  /**
   * Capture with measurement annotations
   */
  captureWithMeasurements: function(evt) {
    const options = evt.detail || {};

    try {
      // First capture base screenshot
      const baseDataURL = this.captureScreenshot({
        detail: { ...options, download: false }
      });

      if (!baseDataURL) {
        throw new Error('Failed to capture base screenshot');
      }

      // Create composite canvas with measurement overlays
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Add measurement annotations
        this.addMeasurementAnnotations(ctx, canvas.width, canvas.height);

        // Add metadata
        if (options.includeMetadata !== false) {
          this.addMetadataOverlay(ctx, canvas.width, canvas.height);
        }

        // Convert to image
        const mimeType = this.data.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const finalDataURL = canvas.toDataURL(mimeType, this.data.quality);

        // Download
        this.downloadImage(finalDataURL, options.filename);

        // Emit event
        this.el.emit('screenshot-with-measurements-captured', {
          dataURL: finalDataURL,
          width: canvas.width,
          height: canvas.height
        });

        if (window.uiEnhancement) {
          window.uiEnhancement.notify('Annotated screenshot captured', 'success');
        }
      };

      img.src = baseDataURL;

    } catch (error) {
      console.error('[Screenshot Manager] Annotated capture failed:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Annotated capture failed', 'error');
      }
    }
  },

  /**
   * Add watermark to image
   */
  addWatermark: function(ctx, width, height) {
    ctx.save();

    // Position at bottom right
    const padding = 20;
    const fontSize = Math.max(12, width / 80);

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const text = 'O3Measure';
    ctx.fillText(text, width - padding, height - padding);

    ctx.restore();
  },

  /**
   * Add metadata overlay (timestamp, object count, etc.)
   */
  addMetadataOverlay: function(ctx, width, height) {
    ctx.save();

    const padding = 20;
    const fontSize = Math.max(14, width / 60);
    const lineHeight = fontSize * 1.5;

    // Semi-transparent background
    const bgHeight = lineHeight * 4 + padding * 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(padding, padding, width - padding * 2, bgHeight);

    // Text
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let yPos = padding + 10;

    // Project name
    const storageManager = document.querySelector('[storage-manager]');
    const projectName = storageManager ?
      storageManager.components['storage-manager'].data.projectName :
      'O3Measure Project';

    ctx.fillText(projectName, padding + 10, yPos);
    yPos += lineHeight;

    // Timestamp
    ctx.font = `${fontSize * 0.8}px Arial`;
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`Captured: ${timestamp}`, padding + 10, yPos);
    yPos += lineHeight;

    // Object count
    const objectDefComponent = document.querySelector('[object-definition]');
    const objectCount = objectDefComponent ?
      objectDefComponent.components['object-definition'].objects.length : 0;

    ctx.fillText(`Objects: ${objectCount}`, padding + 10, yPos);

    ctx.restore();
  },

  /**
   * Add measurement annotations overlay
   */
  addMeasurementAnnotations: function(ctx, width, height) {
    // Get all measured objects
    const objectDefComponent = document.querySelector('[object-definition]');
    if (!objectDefComponent) return;

    const objects = objectDefComponent.components['object-definition'].objects;

    ctx.save();

    // Style for annotations
    const fontSize = Math.max(16, width / 50);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    objects.forEach((obj, index) => {
      // Project 3D position to 2D screen space
      if (!obj.center) return;

      const position = new THREE.Vector3(obj.center.x, obj.center.y, obj.center.z);

      // Get screen coordinates
      const screenPos = this.projectToScreen(position, width, height);

      if (screenPos && screenPos.x >= 0 && screenPos.x <= width &&
          screenPos.y >= 0 && screenPos.y <= height) {

        // Draw measurement badge
        const badgeWidth = 150;
        const badgeHeight = 60;
        const badgeX = screenPos.x - badgeWidth / 2;
        const badgeY = screenPos.y - badgeHeight / 2;

        // Background
        ctx.fillStyle = 'rgba(21, 172, 207, 0.9)';
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Text
        ctx.fillStyle = '#FFFFFF';

        // Width × Height
        import('../../utils/units.js').then(({ convertLength }) => {
          const width = convertLength(obj.width, { shortUnit: true });
          const height = convertLength(obj.height, { shortUnit: true });

          ctx.fillText(
            `${width.numericValue} × ${height.numericValue} ${width.shortUnit}`,
            screenPos.x,
            screenPos.y - 10
          );

          // Area
          import('../../utils/units.js').then(({ convertArea }) => {
            const area = convertArea(obj.width * obj.height, { shortUnit: true });
            ctx.font = `${fontSize * 0.7}px Arial`;
            ctx.fillText(area.value, screenPos.x, screenPos.y + 10);
          });
        });
      }
    });

    ctx.restore();
  },

  /**
   * Project 3D position to 2D screen coordinates
   */
  projectToScreen: function(position, width, height) {
    if (!this.camera) return null;

    const vector = position.clone();
    vector.project(this.camera);

    // Convert to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * width;
    const y = (vector.y * -0.5 + 0.5) * height;

    return { x, y };
  },

  /**
   * Download image
   */
  downloadImage: function(dataURL, customFilename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const ext = this.data.format;
    const filename = customFilename || `O3Measure_${timestamp}.${ext}`;

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`[Screenshot Manager] ✓ Downloaded as ${filename}`);
  },

  remove: function() {
    this.el.sceneEl.removeEventListener('capture-screenshot', this.captureScreenshot);
    this.el.sceneEl.removeEventListener('capture-with-measurements', this.captureWithMeasurements);
  }
});

/**
 * Capture Button Component
 * UI button for triggering screenshots
 */
AFRAME.registerComponent('capture-button', {
  schema: {
    type: { type: 'string', default: 'basic' }, // 'basic' or 'annotated'
    label: { type: 'string', default: '📸 Capture' },
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }
  },

  init: function() {
    this.createButton();
  },

  createButton: function() {
    // Create spatial button
    this.el.setAttribute('spatial-button', {
      label: this.data.label,
      width: 0.2,
      height: 0.05,
      fontSize: 0.03,
      color: '#10B981',
      hoverColor: '#34D399',
      haptics: true
    });

    this.el.setAttribute('position', this.data.position);

    // Handle click
    this.el.addEventListener('spatial-button-click', () => {
      this.handleCapture();
    });
  },

  handleCapture: function() {
    const eventName = this.data.type === 'annotated' ?
      'capture-with-measurements' : 'capture-screenshot';

    console.log(`[Capture Button] Triggering ${this.data.type} capture`);

    // Emit capture event
    this.el.sceneEl.emit(eventName, {
      includeMetadata: true
    });

    // Haptic feedback
    if (window.haptics) {
      window.haptics.click('both');
    }
  }
});

console.log('[Photo Capture] AR photo capture system loaded 📸');

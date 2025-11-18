/**
 * Measurement Display System
 * Modern measurement overlays using Troika spatial-text
 * Displays dimensions, area, and labels with professional styling
 */

import * as THREE from 'three';
import { convertLength, convertArea, formatDimensions, formatArea } from '../../utils/units.js';

/**
 * Measurement Label Component
 * Displays a single measurement value with modern styling
 */
AFRAME.registerComponent('measurement-label', {
  schema: {
    value: { type: 'number', default: 0 }, // Value in meters
    type: { type: 'string', default: 'length' }, // 'length', 'area', 'volume'
    label: { type: 'string', default: '' }, // Optional prefix label (e.g., "Width:")
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    color: { type: 'color', default: '#FFFFFF' },
    backgroundColor: { type: 'color', default: '#000000' },
    backgroundOpacity: { type: 'number', default: 0.7 },
    fontSize: { type: 'number', default: 0.04 },
    precision: { type: 'number', default: 1 },
    showBackground: { type: 'boolean', default: true },
    billboardMode: { type: 'boolean', default: true }, // Always face camera
    glowColor: { type: 'color', default: '#15ACCF' },
    glowIntensity: { type: 'number', default: 0.3 }
  },

  init: function() {
    this.createLabel();

    // Update when unit system changes
    this.onUnitSystemChanged = this.updateText.bind(this);
    window.addEventListener('unit-system-changed', this.onUnitSystemChanged);

    // Get camera for billboard mode
    this.camera = null;
  },

  createLabel: function() {
    const data = this.data;

    // Create background panel if enabled
    if (data.showBackground) {
      this.background = document.createElement('a-plane');
      this.background.setAttribute('width', 0.2);
      this.background.setAttribute('height', 0.06);
      this.background.setAttribute('color', data.backgroundColor);
      this.background.setAttribute('opacity', data.backgroundOpacity);
      this.background.setAttribute('shader', 'flat');

      // Add subtle glow
      if (data.glowIntensity > 0) {
        this.background.setAttribute('material', {
          emissive: data.glowColor,
          emissiveIntensity: data.glowIntensity
        });
      }

      this.el.appendChild(this.background);
    }

    // Create text using spatial-text
    this.textEntity = document.createElement('a-entity');
    this.updateText();

    this.textEntity.setAttribute('position', '0 0 0.01'); // Slightly in front of background
    this.el.appendChild(this.textEntity);

    // Set position
    this.el.setAttribute('position', data.position);
  },

  updateText: function() {
    const data = this.data;

    // Convert value based on type
    let displayText;
    if (data.type === 'area') {
      const converted = convertArea(data.value, {
        precision: data.precision,
        shortUnit: true
      });
      displayText = data.label ? `${data.label} ${converted.value}` : converted.value;
    } else {
      const converted = convertLength(data.value, {
        precision: data.precision,
        shortUnit: true
      });
      displayText = data.label ? `${data.label} ${converted.value}` : converted.value;
    }

    // Update or create spatial-text
    this.textEntity.setAttribute('spatial-text', {
      value: displayText,
      fontSize: data.fontSize,
      color: data.color,
      anchorX: 'center',
      anchorY: 'middle',
      outlineWidth: 0.003,
      outlineColor: '#000000'
    });

    // Auto-resize background to fit text
    if (this.background && data.showBackground) {
      const textLength = displayText.length;
      const estimatedWidth = Math.max(0.15, textLength * data.fontSize * 0.6);
      this.background.setAttribute('width', estimatedWidth);
    }
  },

  tick: function() {
    // Billboard mode - always face camera
    if (this.data.billboardMode) {
      if (!this.camera) {
        this.camera = document.querySelector('[camera]');
      }

      if (this.camera) {
        const cameraPos = this.camera.object3D.position;
        this.el.object3D.lookAt(cameraPos);
      }
    }
  },

  update: function(oldData) {
    // Update text if value or type changed
    if (oldData.value !== this.data.value ||
        oldData.type !== this.data.type ||
        oldData.label !== this.data.label ||
        oldData.precision !== this.data.precision) {
      this.updateText();
    }

    // Update position
    if (oldData.position !== this.data.position) {
      this.el.setAttribute('position', this.data.position);
    }

    // Update colors
    if (oldData.color !== this.data.color && this.textEntity) {
      this.textEntity.setAttribute('spatial-text', 'color', this.data.color);
    }

    if (oldData.backgroundColor !== this.data.backgroundColor && this.background) {
      this.background.setAttribute('color', this.data.backgroundColor);
    }
  },

  remove: function() {
    window.removeEventListener('unit-system-changed', this.onUnitSystemChanged);
  }
});

/**
 * Measurement Display Component
 * Complete measurement overlay for a defined object
 * Shows width, height, area, and optional labels
 */
AFRAME.registerComponent('measurement-display', {
  schema: {
    width: { type: 'number', default: 1 }, // Width in meters
    height: { type: 'number', default: 1 }, // Height in meters
    depth: { type: 'number', default: 0 }, // Depth in meters (for 3D objects)
    showWidth: { type: 'boolean', default: true },
    showHeight: { type: 'boolean', default: true },
    showArea: { type: 'boolean', default: true },
    showDepth: { type: 'boolean', default: false },
    showVolume: { type: 'boolean', default: false },
    widthPosition: { type: 'vec3', default: { x: 0, y: 0.1, z: 0 } },
    heightPosition: { type: 'vec3', default: { x: 0.1, y: 0, z: 0 } },
    areaPosition: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    labelColor: { type: 'color', default: '#FFFFFF' },
    areaColor: { type: 'color', default: '#15ACCF' },
    precision: { type: 'number', default: 1 },
    showLabels: { type: 'boolean', default: true } // Show "Width:", "Height:" labels
  },

  init: function() {
    this.labels = {};
    this.createMeasurementLabels();
  },

  createMeasurementLabels: function() {
    const data = this.data;

    // Width label
    if (data.showWidth) {
      const widthLabel = document.createElement('a-entity');
      widthLabel.setAttribute('measurement-label', {
        value: data.width,
        type: 'length',
        label: data.showLabels ? 'W:' : '',
        position: data.widthPosition,
        color: data.labelColor,
        fontSize: 0.035,
        precision: data.precision
      });
      this.el.appendChild(widthLabel);
      this.labels.width = widthLabel;
    }

    // Height label
    if (data.showHeight) {
      const heightLabel = document.createElement('a-entity');
      heightLabel.setAttribute('measurement-label', {
        value: data.height,
        type: 'length',
        label: data.showLabels ? 'H:' : '',
        position: data.heightPosition,
        color: data.labelColor,
        fontSize: 0.035,
        precision: data.precision
      });
      this.el.appendChild(heightLabel);
      this.labels.height = heightLabel;
    }

    // Area label (in center)
    if (data.showArea) {
      const area = data.width * data.height;
      const areaLabel = document.createElement('a-entity');
      areaLabel.setAttribute('measurement-label', {
        value: area,
        type: 'area',
        label: '',
        position: data.areaPosition,
        color: data.areaColor,
        fontSize: 0.045,
        precision: 2,
        glowIntensity: 0.5
      });
      this.el.appendChild(areaLabel);
      this.labels.area = areaLabel;
    }

    // Depth label (for 3D objects)
    if (data.showDepth && data.depth > 0) {
      const depthLabel = document.createElement('a-entity');
      depthLabel.setAttribute('measurement-label', {
        value: data.depth,
        type: 'length',
        label: data.showLabels ? 'D:' : '',
        position: { x: 0, y: -0.1, z: 0 },
        color: data.labelColor,
        fontSize: 0.035,
        precision: data.precision
      });
      this.el.appendChild(depthLabel);
      this.labels.depth = depthLabel;
    }

    // Volume label
    if (data.showVolume && data.depth > 0) {
      const volume = data.width * data.height * data.depth;
      const volumeLabel = document.createElement('a-entity');
      volumeLabel.setAttribute('measurement-label', {
        value: volume,
        type: 'volume',
        label: '',
        position: { x: 0, y: -0.15, z: 0 },
        color: data.areaColor,
        fontSize: 0.04,
        precision: 3
      });
      this.el.appendChild(volumeLabel);
      this.labels.volume = volumeLabel;
    }
  },

  update: function(oldData) {
    // Update individual labels if dimensions changed
    if (oldData.width !== this.data.width && this.labels.width) {
      this.labels.width.setAttribute('measurement-label', 'value', this.data.width);
    }

    if (oldData.height !== this.data.height && this.labels.height) {
      this.labels.height.setAttribute('measurement-label', 'value', this.data.height);
    }

    if ((oldData.width !== this.data.width || oldData.height !== this.data.height) && this.labels.area) {
      const area = this.data.width * this.data.height;
      this.labels.area.setAttribute('measurement-label', 'value', area);
    }

    if (oldData.depth !== this.data.depth && this.labels.depth) {
      this.labels.depth.setAttribute('measurement-label', 'value', this.data.depth);
    }

    if ((oldData.width !== this.data.width ||
         oldData.height !== this.data.height ||
         oldData.depth !== this.data.depth) && this.labels.volume) {
      const volume = this.data.width * this.data.height * this.data.depth;
      this.labels.volume.setAttribute('measurement-label', 'value', volume);
    }
  }
});

/**
 * Dimension Line Component
 * Visual line with measurement label and arrows
 * Professional dimension lines like CAD software
 */
AFRAME.registerComponent('dimension-line', {
  schema: {
    start: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    end: { type: 'vec3', default: { x: 1, y: 0, z: 0 } },
    offset: { type: 'number', default: 0.05 }, // Offset from object edge
    lineColor: { type: 'color', default: '#15ACCF' },
    arrowColor: { type: 'color', default: '#15ACCF' },
    textColor: { type: 'color', default: '#FFFFFF' },
    lineWidth: { type: 'number', default: 0.002 },
    arrowSize: { type: 'number', default: 0.015 },
    showArrows: { type: 'boolean', default: true },
    showLabel: { type: 'boolean', default: true },
    precision: { type: 'number', default: 1 }
  },

  init: function() {
    this.createDimensionLine();
  },

  createDimensionLine: function() {
    const data = this.data;

    // Convert positions to Vector3
    const start = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
    const end = new THREE.Vector3(data.end.x, data.end.y, data.end.z);

    // Calculate dimension line direction and length
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();

    // Calculate perpendicular offset direction
    const up = new THREE.Vector3(0, 1, 0);
    const offsetDir = new THREE.Vector3().crossVectors(direction, up).normalize();

    // Offset start and end points
    const offsetStart = new THREE.Vector3().addVectors(start, offsetDir.clone().multiplyScalar(data.offset));
    const offsetEnd = new THREE.Vector3().addVectors(end, offsetDir.clone().multiplyScalar(data.offset));

    // Create main dimension line
    this.createLine(offsetStart, offsetEnd);

    // Create extension lines (from object edge to dimension line)
    this.createExtensionLine(start, offsetStart);
    this.createExtensionLine(end, offsetEnd);

    // Create arrows
    if (data.showArrows) {
      this.createArrow(offsetStart, direction, false); // Arrow pointing right
      this.createArrow(offsetEnd, direction, true); // Arrow pointing left
    }

    // Create measurement label
    if (data.showLabel) {
      const midPoint = new THREE.Vector3().addVectors(offsetStart, offsetEnd).multiplyScalar(0.5);

      const label = document.createElement('a-entity');
      label.setAttribute('measurement-label', {
        value: length,
        type: 'length',
        position: midPoint,
        color: data.textColor,
        fontSize: 0.03,
        precision: data.precision,
        showBackground: true,
        backgroundOpacity: 0.8
      });
      this.el.appendChild(label);
    }
  },

  createLine: function(start, end) {
    const line = document.createElement('a-entity');

    // Use THREE.js Line for precise rendering
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: this.data.lineColor,
      linewidth: this.data.lineWidth * 100 // LineBasicMaterial linewidth
    });

    const lineObj = new THREE.Line(geometry, material);
    line.setObject3D('line', lineObj);

    this.el.appendChild(line);
  },

  createExtensionLine: function(start, end) {
    // Dashed extension line
    const line = document.createElement('a-entity');

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineDashedMaterial({
      color: this.data.lineColor,
      linewidth: this.data.lineWidth * 100,
      dashSize: 0.005,
      gapSize: 0.005
    });

    const lineObj = new THREE.Line(geometry, material);
    lineObj.computeLineDistances(); // Required for dashed lines
    line.setObject3D('line', lineObj);

    this.el.appendChild(line);
  },

  createArrow: function(position, direction, reverse = false) {
    const arrow = document.createElement('a-cone');

    // Arrow properties
    const arrowDir = reverse ? direction.clone().negate() : direction.clone();
    arrow.setAttribute('radius-bottom', this.data.arrowSize);
    arrow.setAttribute('radius-top', 0);
    arrow.setAttribute('height', this.data.arrowSize * 2);
    arrow.setAttribute('color', this.data.arrowColor);
    arrow.setAttribute('position', position);

    // Orient arrow in direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      arrowDir
    );
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    arrow.setAttribute('rotation', {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z)
    });

    this.el.appendChild(arrow);
  },

  update: function(oldData) {
    // Recreate if start/end changed
    if (oldData.start !== this.data.start || oldData.end !== this.data.end) {
      // Remove all children
      while (this.el.firstChild) {
        this.el.removeChild(this.el.firstChild);
      }
      this.createDimensionLine();
    }
  }
});

console.log('[Measurement Display] Modern measurement display system loaded');

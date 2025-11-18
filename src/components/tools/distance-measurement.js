/**
 * Point-to-Point Distance Measurement Tool
 * Flexible measurement between any two points in 3D space
 * Perfect for measuring diagonals, arbitrary distances, and verification
 */

import * as THREE from 'three';
import { convertLength } from '../../utils/units.js';

/**
 * Distance Measurement Tool Component
 * Measures distance between two user-selected points
 */
AFRAME.registerComponent('distance-tool', {
  schema: {
    active: { type: 'boolean', default: false },
    showLine: { type: 'boolean', default: true },
    showLabel: { type: 'boolean', default: true },
    lineColor: { type: 'color', default: '#15ACCF' },
    pointColor: { type: 'color', default: '#10B981' },
    continuous: { type: 'boolean', default: false } // Allow multiple measurements without resetting
  },

  init: function() {
    // State
    this.measurements = []; // Array of {id, point1, point2, distance, visualEntity}
    this.currentMeasurement = null;
    this.currentPoint = null; // 'point1' or 'point2'

    // Bind event handlers
    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.onActionReceived = this.onActionReceived.bind(this);

    // Listen for events
    this.setupEventListeners();

    console.log('[Distance Tool] Initialized');
  },

  setupEventListeners: function() {
    this.el.sceneEl.addEventListener('pinch-started', this.onPinchStarted);
    this.el.sceneEl.addEventListener('distance-tool-action', this.onActionReceived);
  },

  onActionReceived: function(evt) {
    const action = evt.detail.action;

    switch (action) {
      case 'start':
        this.startMeasurement();
        break;

      case 'reset':
        this.resetCurrent();
        break;

      case 'clear-all':
        this.clearAll();
        break;

      case 'activate':
        this.data.active = true;
        this.startMeasurement();
        break;

      case 'deactivate':
        this.data.active = false;
        this.resetCurrent();
        break;
    }
  },

  startMeasurement: function() {
    console.log('[Distance Tool] Starting new measurement');

    // Create new measurement
    this.currentMeasurement = {
      id: `distance_${Date.now()}`,
      point1: null,
      point2: null,
      distance: 0,
      visualEntity: null
    };

    this.currentPoint = 'point1';

    // Emit status
    this.emitStatus('started', 'Select first point');
  },

  onPinchStarted: function(evt) {
    if (!this.data.active) return;

    // Get pinch position
    const position = evt.detail?.position;
    if (!position) {
      console.error('[Distance Tool] No position in pinch event');
      return;
    }

    const worldPos = new THREE.Vector3(position.x, position.y, position.z);

    // Add point to current measurement
    this.addPoint(worldPos);
  },

  addPoint: function(position) {
    if (!this.currentMeasurement) {
      this.startMeasurement();
    }

    if (this.currentPoint === 'point1') {
      // Add first point
      this.currentMeasurement.point1 = position;
      this.currentPoint = 'point2';

      // Create visual marker
      this.createMarker(position, 'point1');

      // Emit status
      this.emitStatus('point1-placed', 'Select second point');

      console.log('[Distance Tool] Point 1 placed');

    } else if (this.currentPoint === 'point2') {
      // Add second point
      this.currentMeasurement.point2 = position;

      // Calculate distance
      const distance = this.currentMeasurement.point1.distanceTo(position);
      this.currentMeasurement.distance = distance;

      // Create visual marker
      this.createMarker(position, 'point2');

      // Create measurement visualization
      this.createMeasurementVisualization();

      // Save measurement
      this.measurements.push(this.currentMeasurement);

      // Convert and display
      const converted = convertLength(distance, { shortUnit: true });

      // Emit completion
      this.emitStatus('completed', `Distance: ${converted.value}`, {
        distance: distance,
        converted: converted
      });

      console.log(`[Distance Tool] ✓ Measurement complete: ${converted.value}`);

      // Show notification
      if (window.uiEnhancement) {
        window.uiEnhancement.notify(`Distance: ${converted.value}`, 'success');
      }

      // Haptic feedback
      if (window.haptics) {
        window.haptics.success('both');
      }

      // Reset for next measurement if continuous mode
      if (this.data.continuous) {
        this.currentMeasurement = null;
        this.currentPoint = null;
        setTimeout(() => this.startMeasurement(), 500);
      } else {
        this.currentMeasurement = null;
        this.currentPoint = null;
      }
    }
  },

  createMarker: function(position, label) {
    if (!this.currentMeasurement.visualEntity) {
      // Create container for visualization
      this.currentMeasurement.visualEntity = document.createElement('a-entity');
      this.currentMeasurement.visualEntity.setAttribute('id', `distance-vis-${this.currentMeasurement.id}`);
      this.el.sceneEl.appendChild(this.currentMeasurement.visualEntity);
    }

    // Create marker sphere
    const marker = document.createElement('a-sphere');
    marker.setAttribute('radius', 0.015);
    marker.setAttribute('color', this.data.pointColor);
    marker.setAttribute('position', position);

    // Add glow
    marker.setAttribute('material', {
      emissive: this.data.pointColor,
      emissiveIntensity: 0.5,
      shader: 'standard'
    });

    // Add label
    if (this.data.showLabel) {
      const labelText = document.createElement('a-entity');
      labelText.setAttribute('spatial-text', {
        value: label === 'point1' ? 'A' : 'B',
        fontSize: 0.025,
        color: '#FFFFFF',
        anchorX: 'center',
        anchorY: 'middle',
        outlineWidth: 0.002,
        outlineColor: '#000000'
      });
      labelText.setAttribute('position', {
        x: position.x,
        y: position.y + 0.03,
        z: position.z
      });

      this.currentMeasurement.visualEntity.appendChild(labelText);
    }

    this.currentMeasurement.visualEntity.appendChild(marker);
  },

  createMeasurementVisualization: function() {
    const measurement = this.currentMeasurement;

    // Create line between points
    if (this.data.showLine) {
      const line = document.createElement('a-entity');
      line.setAttribute('dimension-arrow', {
        start: measurement.point1,
        end: measurement.point2,
        color: this.data.lineColor,
        lineWidth: 0.003,
        showArrows: true,
        arrowLength: 0.03,
        style: 'solid'
      });

      measurement.visualEntity.appendChild(line);
    }

    // Create distance label at midpoint
    if (this.data.showLabel) {
      const midpoint = new THREE.Vector3()
        .addVectors(measurement.point1, measurement.point2)
        .multiplyScalar(0.5);

      const label = document.createElement('a-entity');
      label.setAttribute('measurement-label', {
        value: measurement.distance,
        type: 'length',
        label: '',
        position: midpoint,
        color: '#FFFFFF',
        fontSize: 0.04,
        precision: 2,
        showBackground: true,
        backgroundOpacity: 0.9,
        glowIntensity: 0.4
      });

      measurement.visualEntity.appendChild(label);
    }
  },

  resetCurrent: function() {
    if (this.currentMeasurement) {
      // Remove visualization if incomplete
      if (this.currentMeasurement.visualEntity && !this.currentMeasurement.point2) {
        if (this.currentMeasurement.visualEntity.parentNode) {
          this.currentMeasurement.visualEntity.parentNode.removeChild(
            this.currentMeasurement.visualEntity
          );
        }
      }
    }

    this.currentMeasurement = null;
    this.currentPoint = null;

    console.log('[Distance Tool] Reset');

    this.emitStatus('reset', 'Measurement reset');
  },

  clearAll: function() {
    console.log('[Distance Tool] Clearing all measurements');

    // Remove all visualizations
    this.measurements.forEach(measurement => {
      if (measurement.visualEntity && measurement.visualEntity.parentNode) {
        measurement.visualEntity.parentNode.removeChild(measurement.visualEntity);
      }
    });

    // Clear current measurement
    this.resetCurrent();

    // Clear array
    this.measurements = [];

    this.emitStatus('cleared', 'All measurements cleared');

    if (window.uiEnhancement) {
      window.uiEnhancement.notify('All measurements cleared', 'info');
    }
  },

  deleteMeasurement: function(measurementId) {
    const index = this.measurements.findIndex(m => m.id === measurementId);

    if (index !== -1) {
      const measurement = this.measurements[index];

      // Remove visualization
      if (measurement.visualEntity && measurement.visualEntity.parentNode) {
        measurement.visualEntity.parentNode.removeChild(measurement.visualEntity);
      }

      // Remove from array
      this.measurements.splice(index, 1);

      console.log(`[Distance Tool] Deleted measurement ${measurementId}`);

      this.emitStatus('deleted', 'Measurement deleted', { measurementId });
    }
  },

  getMeasurements: function() {
    return this.measurements.map(m => ({
      id: m.id,
      point1: { x: m.point1.x, y: m.point1.y, z: m.point1.z },
      point2: { x: m.point2.x, y: m.point2.y, z: m.point2.z },
      distance: m.distance,
      converted: convertLength(m.distance, { shortUnit: true })
    }));
  },

  emitStatus: function(status, message, data = {}) {
    this.el.emit('distance-tool-status', {
      status: status,
      message: message,
      ...data
    });
  },

  update: function(oldData) {
    if (oldData.active !== this.data.active) {
      if (this.data.active) {
        this.startMeasurement();
      } else {
        this.resetCurrent();
      }
    }
  },

  remove: function() {
    this.clearAll();

    this.el.sceneEl.removeEventListener('pinch-started', this.onPinchStarted);
    this.el.sceneEl.removeEventListener('distance-tool-action', this.onActionReceived);
  }
});

/**
 * Angle Measurement Tool Component
 * Measures angles between three points
 */
AFRAME.registerComponent('angle-tool', {
  schema: {
    active: { type: 'boolean', default: false },
    showLines: { type: 'boolean', default: true },
    lineColor: { type: 'color', default: '#F59E0B' }
  },

  init: function() {
    this.measurements = [];
    this.currentMeasurement = null;
    this.currentPoint = null; // 'point1', 'point2', or 'point3'

    this.onPinchStarted = this.onPinchStarted.bind(this);
    this.onActionReceived = this.onActionReceived.bind(this);

    this.setupEventListeners();

    console.log('[Angle Tool] Initialized');
  },

  setupEventListeners: function() {
    this.el.sceneEl.addEventListener('pinch-started', this.onPinchStarted);
    this.el.sceneEl.addEventListener('angle-tool-action', this.onActionReceived);
  },

  onActionReceived: function(evt) {
    const action = evt.detail.action;

    switch (action) {
      case 'start':
        this.startMeasurement();
        break;

      case 'reset':
        this.resetCurrent();
        break;

      case 'clear-all':
        this.clearAll();
        break;
    }
  },

  startMeasurement: function() {
    console.log('[Angle Tool] Starting new angle measurement');

    this.currentMeasurement = {
      id: `angle_${Date.now()}`,
      point1: null, // First point
      point2: null, // Vertex point (angle point)
      point3: null, // Third point
      angle: 0,
      visualEntity: null
    };

    this.currentPoint = 'point1';

    this.emitStatus('started', 'Select first point');
  },

  onPinchStarted: function(evt) {
    if (!this.data.active || !this.currentMeasurement) return;

    const position = evt.detail?.position;
    if (!position) return;

    const worldPos = new THREE.Vector3(position.x, position.y, position.z);

    this.addPoint(worldPos);
  },

  addPoint: function(position) {
    if (this.currentPoint === 'point1') {
      this.currentMeasurement.point1 = position;
      this.currentPoint = 'point2';
      this.createMarker(position, '1');
      this.emitStatus('point1-placed', 'Select vertex point (angle point)');

    } else if (this.currentPoint === 'point2') {
      this.currentMeasurement.point2 = position;
      this.currentPoint = 'point3';
      this.createMarker(position, 'V');
      this.emitStatus('point2-placed', 'Select third point');

    } else if (this.currentPoint === 'point3') {
      this.currentMeasurement.point3 = position;
      this.createMarker(position, '3');

      // Calculate angle
      this.calculateAngle();

      // Create visualization
      this.createAngleVisualization();

      // Save measurement
      this.measurements.push(this.currentMeasurement);

      const angleDeg = THREE.MathUtils.radToDeg(this.currentMeasurement.angle);

      this.emitStatus('completed', `Angle: ${angleDeg.toFixed(1)}°`, {
        angle: this.currentMeasurement.angle,
        angleDeg: angleDeg
      });

      console.log(`[Angle Tool] ✓ Angle measured: ${angleDeg.toFixed(1)}°`);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify(`Angle: ${angleDeg.toFixed(1)}°`, 'success');
      }

      this.currentMeasurement = null;
      this.currentPoint = null;
    }
  },

  calculateAngle: function() {
    const { point1, point2, point3 } = this.currentMeasurement;

    // Vectors from vertex to other points
    const v1 = new THREE.Vector3().subVectors(point1, point2).normalize();
    const v2 = new THREE.Vector3().subVectors(point3, point2).normalize();

    // Calculate angle using dot product
    const angle = Math.acos(v1.dot(v2));

    this.currentMeasurement.angle = angle;
  },

  createMarker: function(position, label) {
    if (!this.currentMeasurement.visualEntity) {
      this.currentMeasurement.visualEntity = document.createElement('a-entity');
      this.el.sceneEl.appendChild(this.currentMeasurement.visualEntity);
    }

    const marker = document.createElement('a-sphere');
    marker.setAttribute('radius', 0.015);
    marker.setAttribute('color', this.data.lineColor);
    marker.setAttribute('position', position);

    this.currentMeasurement.visualEntity.appendChild(marker);
  },

  createAngleVisualization: function() {
    const { point1, point2, point3 } = this.currentMeasurement;

    if (this.data.showLines) {
      // Line from point1 to vertex
      const line1 = document.createElement('a-entity');
      line1.setAttribute('dimension-arrow', {
        start: point1,
        end: point2,
        color: this.data.lineColor,
        showArrows: false
      });
      this.currentMeasurement.visualEntity.appendChild(line1);

      // Line from vertex to point3
      const line2 = document.createElement('a-entity');
      line2.setAttribute('dimension-arrow', {
        start: point2,
        end: point3,
        color: this.data.lineColor,
        showArrows: false
      });
      this.currentMeasurement.visualEntity.appendChild(line2);
    }

    // Angle label at vertex
    const angleDeg = THREE.MathUtils.radToDeg(this.currentMeasurement.angle);

    const label = document.createElement('a-entity');
    label.setAttribute('spatial-text', {
      value: `${angleDeg.toFixed(1)}°`,
      fontSize: 0.04,
      color: '#FFFFFF',
      anchorX: 'center',
      anchorY: 'middle',
      outlineWidth: 0.003,
      outlineColor: '#000000'
    });

    label.setAttribute('position', {
      x: point2.x,
      y: point2.y + 0.05,
      z: point2.z
    });

    this.currentMeasurement.visualEntity.appendChild(label);
  },

  resetCurrent: function() {
    if (this.currentMeasurement && this.currentMeasurement.visualEntity) {
      if (this.currentMeasurement.visualEntity.parentNode) {
        this.currentMeasurement.visualEntity.parentNode.removeChild(
          this.currentMeasurement.visualEntity
        );
      }
    }

    this.currentMeasurement = null;
    this.currentPoint = null;
  },

  clearAll: function() {
    this.measurements.forEach(m => {
      if (m.visualEntity && m.visualEntity.parentNode) {
        m.visualEntity.parentNode.removeChild(m.visualEntity);
      }
    });

    this.resetCurrent();
    this.measurements = [];

    this.emitStatus('cleared', 'All angle measurements cleared');
  },

  emitStatus: function(status, message, data = {}) {
    this.el.emit('angle-tool-status', {
      status: status,
      message: message,
      ...data
    });
  },

  remove: function() {
    this.clearAll();

    this.el.sceneEl.removeEventListener('pinch-started', this.onPinchStarted);
    this.el.sceneEl.removeEventListener('angle-tool-action', this.onActionReceived);
  }
});

console.log('[Distance Measurement] Point-to-point distance and angle tools loaded 📐');

/**
 * Dimension Visualization System
 * Professional dimension lines, arrows, and measurement overlays
 * Similar to CAD/architecture software visualization
 */

import * as THREE from 'three';

/**
 * Dimension Arrow Component
 * Creates professional dimension arrows with lines
 */
AFRAME.registerComponent('dimension-arrow', {
  schema: {
    start: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    end: { type: 'vec3', default: { x: 1, y: 0, z: 0 } },
    color: { type: 'color', default: '#15ACCF' },
    lineWidth: { type: 'number', default: 0.003 },
    arrowLength: { type: 'number', default: 0.02 },
    arrowWidth: { type: 'number', default: 0.008 },
    style: { type: 'string', default: 'solid' }, // 'solid', 'dashed', 'dotted'
    showArrows: { type: 'boolean', default: true },
    glowIntensity: { type: 'number', default: 0.3 }
  },

  init: function() {
    this.createArrow();
  },

  createArrow: function() {
    const data = this.data;

    // Create line between points
    this.createDimensionLine();

    // Create arrow heads at both ends
    if (data.showArrows) {
      this.createArrowHead('start');
      this.createArrowHead('end');
    }
  },

  createDimensionLine: function() {
    const data = this.data;
    const start = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
    const end = new THREE.Vector3(data.end.x, data.end.y, data.end.z);

    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    let material;
    if (data.style === 'dashed') {
      material = new THREE.LineDashedMaterial({
        color: data.color,
        linewidth: data.lineWidth * 100,
        dashSize: 0.01,
        gapSize: 0.005
      });
    } else if (data.style === 'dotted') {
      material = new THREE.LineDashedMaterial({
        color: data.color,
        linewidth: data.lineWidth * 100,
        dashSize: 0.002,
        gapSize: 0.005
      });
    } else {
      material = new THREE.LineBasicMaterial({
        color: data.color,
        linewidth: data.lineWidth * 100
      });
    }

    const line = new THREE.Line(geometry, material);

    if (data.style !== 'solid') {
      line.computeLineDistances();
    }

    this.el.setObject3D('line', line);
  },

  createArrowHead: function(position) {
    const data = this.data;

    // Calculate direction
    const start = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
    const end = new THREE.Vector3(data.end.x, data.end.y, data.end.z);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();

    // Position at start or end
    const arrowPos = position === 'start' ? start : end;
    const arrowDir = position === 'start' ? direction.clone().negate() : direction.clone();

    // Create arrow cone
    const arrow = document.createElement('a-cone');
    arrow.setAttribute('radius-bottom', data.arrowWidth);
    arrow.setAttribute('radius-top', 0);
    arrow.setAttribute('height', data.arrowLength);
    arrow.setAttribute('position', arrowPos);

    // Set color with glow
    arrow.setAttribute('material', {
      color: data.color,
      emissive: data.color,
      emissiveIntensity: data.glowIntensity,
      shader: 'standard'
    });

    // Orient arrow
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDir);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    arrow.setAttribute('rotation', {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z)
    });

    this.el.appendChild(arrow);
  },

  update: function(oldData) {
    if (oldData.start !== this.data.start || oldData.end !== this.data.end) {
      this.remove();
      this.createArrow();
    }
  },

  remove: function() {
    // Remove line
    const lineObj = this.el.getObject3D('line');
    if (lineObj) {
      if (lineObj.geometry) lineObj.geometry.dispose();
      if (lineObj.material) lineObj.material.dispose();
      this.el.removeObject3D('line');
    }

    // Remove arrow heads
    while (this.el.firstChild) {
      this.el.removeChild(this.el.firstChild);
    }
  }
});

/**
 * Measurement Grid Component
 * Displays a grid overlay for scale reference
 */
AFRAME.registerComponent('measurement-grid', {
  schema: {
    size: { type: 'number', default: 5 }, // Total grid size in meters
    divisions: { type: 'number', default: 10 }, // Number of divisions
    color: { type: 'color', default: '#15ACCF' },
    opacity: { type: 'number', default: 0.3 },
    centerColor: { type: 'color', default: '#FFFFFF' },
    showLabels: { type: 'boolean', default: true },
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }
  },

  init: function() {
    this.createGrid();
  },

  createGrid: function() {
    const data = this.data;

    // Create grid using THREE.GridHelper
    const size = data.size;
    const divisions = data.divisions;

    const gridHelper = new THREE.GridHelper(size, divisions, data.centerColor, data.color);
    gridHelper.material.opacity = data.opacity;
    gridHelper.material.transparent = true;

    this.el.setObject3D('grid', gridHelper);
    this.el.object3D.position.set(data.position.x, data.position.y, data.position.z);

    // Add labels for scale
    if (data.showLabels) {
      this.addScaleLabels();
    }
  },

  addScaleLabels: function() {
    const data = this.data;
    const cellSize = data.size / data.divisions;

    // Add labels at key points
    const labelPositions = [
      { pos: { x: data.size / 2, y: 0.01, z: 0 }, text: `${(data.size / 2).toFixed(1)}m` },
      { pos: { x: -data.size / 2, y: 0.01, z: 0 }, text: `${(data.size / 2).toFixed(1)}m` },
      { pos: { x: 0, y: 0.01, z: data.size / 2 }, text: `${(data.size / 2).toFixed(1)}m` },
      { pos: { x: 0, y: 0.01, z: -data.size / 2 }, text: `${(data.size / 2).toFixed(1)}m` }
    ];

    labelPositions.forEach(labelData => {
      const label = document.createElement('a-entity');
      label.setAttribute('spatial-text', {
        value: labelData.text,
        fontSize: 0.03,
        color: data.color,
        anchorX: 'center',
        anchorY: 'middle',
        opacity: data.opacity + 0.2
      });

      label.setAttribute('position', {
        x: data.position.x + labelData.pos.x,
        y: data.position.y + labelData.pos.y,
        z: data.position.z + labelData.pos.z
      });

      this.el.appendChild(label);
    });
  },

  remove: function() {
    const gridObj = this.el.getObject3D('grid');
    if (gridObj) {
      if (gridObj.geometry) gridObj.geometry.dispose();
      if (gridObj.material) gridObj.material.dispose();
      this.el.removeObject3D('grid');
    }
  }
});

/**
 * Scale Reference Component
 * Displays a ruler-like scale reference
 */
AFRAME.registerComponent('scale-reference', {
  schema: {
    length: { type: 'number', default: 1 }, // Length in meters
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    color: { type: 'color', default: '#15ACCF' },
    divisions: { type: 'number', default: 10 },
    orientation: { type: 'string', default: 'horizontal' }, // 'horizontal' or 'vertical'
    showNumbers: { type: 'boolean', default: true }
  },

  init: function() {
    this.createRuler();
  },

  createRuler: function() {
    const data = this.data;

    // Main ruler line
    const start = new THREE.Vector3(0, 0, 0);
    const end = data.orientation === 'horizontal'
      ? new THREE.Vector3(data.length, 0, 0)
      : new THREE.Vector3(0, data.length, 0);

    const rulerLine = document.createElement('a-entity');
    rulerLine.setAttribute('dimension-arrow', {
      start: start,
      end: end,
      color: data.color,
      lineWidth: 0.004,
      showArrows: false,
      style: 'solid'
    });

    this.el.appendChild(rulerLine);

    // Add tick marks
    const divisionSize = data.length / data.divisions;

    for (let i = 0; i <= data.divisions; i++) {
      const position = i * divisionSize;
      this.createTickMark(position, i % 5 === 0 ? 0.02 : 0.01);

      // Add numbers at major divisions
      if (data.showNumbers && i % 5 === 0) {
        this.createNumberLabel(position, position);
      }
    }

    this.el.setAttribute('position', data.position);
  },

  createTickMark: function(position, height) {
    const data = this.data;

    const tick = document.createElement('a-plane');
    tick.setAttribute('width', 0.001);
    tick.setAttribute('height', height);
    tick.setAttribute('color', data.color);

    if (data.orientation === 'horizontal') {
      tick.setAttribute('position', { x: position, y: 0, z: 0 });
      tick.setAttribute('rotation', { x: 0, y: 90, z: 0 });
    } else {
      tick.setAttribute('position', { x: 0, y: position, z: 0 });
    }

    this.el.appendChild(tick);
  },

  createNumberLabel: function(position, value) {
    const data = this.data;

    const label = document.createElement('a-entity');
    label.setAttribute('spatial-text', {
      value: `${value.toFixed(1)}m`,
      fontSize: 0.015,
      color: data.color,
      anchorX: 'center',
      anchorY: 'middle'
    });

    if (data.orientation === 'horizontal') {
      label.setAttribute('position', { x: position, y: -0.03, z: 0 });
    } else {
      label.setAttribute('position', { x: 0.03, y: position, z: 0 });
    }

    this.el.appendChild(label);
  }
});

/**
 * Measurement Annotation Component
 * Adds professional annotation markers with leaders
 */
AFRAME.registerComponent('measurement-annotation', {
  schema: {
    target: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }, // Point being annotated
    offset: { type: 'vec3', default: { x: 0.2, y: 0.2, z: 0 } }, // Label offset
    text: { type: 'string', default: 'Annotation' },
    color: { type: 'color', default: '#15ACCF' },
    showLeader: { type: 'boolean', default: true }, // Line from label to point
    markerType: { type: 'string', default: 'dot' } // 'dot', 'arrow', 'circle'
  },

  init: function() {
    this.createAnnotation();
  },

  createAnnotation: function() {
    const data = this.data;

    // Calculate label position
    const labelPos = new THREE.Vector3(
      data.target.x + data.offset.x,
      data.target.y + data.offset.y,
      data.target.z + data.offset.z
    );

    // Create label
    const label = document.createElement('a-entity');
    label.setAttribute('measurement-label', {
      value: 0, // Not a measurement, just text
      type: 'length',
      label: data.text,
      position: labelPos,
      color: '#FFFFFF',
      fontSize: 0.03,
      showBackground: true,
      backgroundOpacity: 0.9
    });

    // Override to show custom text
    label.addEventListener('loaded', () => {
      const textComp = label.querySelector('[spatial-text]');
      if (textComp) {
        textComp.setAttribute('spatial-text', 'value', data.text);
      }
    });

    this.el.appendChild(label);

    // Create leader line
    if (data.showLeader) {
      const leader = document.createElement('a-entity');
      leader.setAttribute('dimension-arrow', {
        start: data.target,
        end: labelPos,
        color: data.color,
        lineWidth: 0.002,
        style: 'dashed',
        showArrows: false
      });
      this.el.appendChild(leader);
    }

    // Create marker at target
    this.createMarker();
  },

  createMarker: function() {
    const data = this.data;

    let marker;

    switch (data.markerType) {
      case 'dot':
        marker = document.createElement('a-sphere');
        marker.setAttribute('radius', 0.01);
        marker.setAttribute('color', data.color);
        break;

      case 'arrow':
        marker = document.createElement('a-cone');
        marker.setAttribute('radius-bottom', 0.015);
        marker.setAttribute('radius-top', 0);
        marker.setAttribute('height', 0.03);
        marker.setAttribute('color', data.color);
        marker.setAttribute('rotation', { x: 0, y: 0, z: 0 });
        break;

      case 'circle':
        marker = document.createElement('a-ring');
        marker.setAttribute('radius-inner', 0.008);
        marker.setAttribute('radius-outer', 0.012);
        marker.setAttribute('color', data.color);
        break;

      default:
        marker = document.createElement('a-sphere');
        marker.setAttribute('radius', 0.01);
        marker.setAttribute('color', data.color);
    }

    marker.setAttribute('position', data.target);

    // Add glow
    marker.setAttribute('material', {
      emissive: data.color,
      emissiveIntensity: 0.5
    });

    this.el.appendChild(marker);
  }
});

console.log('[Dimension Visualization] Professional dimension visualization system loaded');

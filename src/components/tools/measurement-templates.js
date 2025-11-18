/**
 * Measurement Templates System
 * Pre-defined templates for common measurements
 * Includes furniture dimensions, room types, standard sizes
 */

import { convertLength, convertArea } from '../../utils/units.js';

/**
 * Template Library
 * Pre-defined measurement templates
 */
export const MEASUREMENT_TEMPLATES = {
  // Furniture templates (dimensions in meters)
  furniture: {
    'sofa-standard': {
      name: 'Standard Sofa',
      category: 'furniture',
      width: 2.1,
      height: 0.9,
      depth: 0.9,
      description: 'Standard 3-seater sofa'
    },
    'sofa-loveseat': {
      name: 'Loveseat',
      category: 'furniture',
      width: 1.5,
      height: 0.9,
      depth: 0.9,
      description: '2-seater loveseat'
    },
    'bed-king': {
      name: 'King Bed',
      category: 'furniture',
      width: 2.03,
      height: 0.6,
      depth: 2.13,
      description: 'King size bed (203×213 cm)'
    },
    'bed-queen': {
      name: 'Queen Bed',
      category: 'furniture',
      width: 1.52,
      height: 0.6,
      depth: 2.03,
      description: 'Queen size bed (152×203 cm)'
    },
    'table-dining-6': {
      name: 'Dining Table (6-seater)',
      category: 'furniture',
      width: 0.9,
      height: 0.75,
      depth: 1.8,
      description: 'Rectangular dining table for 6'
    },
    'table-dining-4': {
      name: 'Dining Table (4-seater)',
      category: 'furniture',
      width: 0.9,
      height: 0.75,
      depth: 1.2,
      description: 'Rectangular dining table for 4'
    },
    'desk-standard': {
      name: 'Standard Desk',
      category: 'furniture',
      width: 1.2,
      height: 0.75,
      depth: 0.6,
      description: 'Standard office desk'
    },
    'bookshelf-tall': {
      name: 'Tall Bookshelf',
      category: 'furniture',
      width: 0.8,
      height: 2.0,
      depth: 0.3,
      description: '2m tall bookshelf'
    }
  },

  // Appliance templates
  appliances: {
    'fridge-standard': {
      name: 'Standard Refrigerator',
      category: 'appliances',
      width: 0.7,
      height: 1.7,
      depth: 0.7,
      description: 'Standard fridge'
    },
    'washer-frontload': {
      name: 'Front-Load Washer',
      category: 'appliances',
      width: 0.6,
      height: 0.85,
      depth: 0.65,
      description: 'Front-loading washing machine'
    },
    'stove-standard': {
      name: 'Standard Stove',
      category: 'appliances',
      width: 0.6,
      height: 0.9,
      depth: 0.6,
      description: 'Standard kitchen stove'
    },
    'dishwasher': {
      name: 'Dishwasher',
      category: 'appliances',
      width: 0.6,
      height: 0.85,
      depth: 0.6,
      description: 'Standard dishwasher'
    }
  },

  // Room templates (floor dimensions)
  rooms: {
    'bedroom-master': {
      name: 'Master Bedroom',
      category: 'rooms',
      width: 4.0,
      height: 2.4,
      depth: 4.5,
      description: 'Typical master bedroom'
    },
    'bedroom-standard': {
      name: 'Standard Bedroom',
      category: 'rooms',
      width: 3.0,
      height: 2.4,
      depth: 3.5,
      description: 'Standard bedroom'
    },
    'bathroom-full': {
      name: 'Full Bathroom',
      category: 'rooms',
      width: 2.5,
      height: 2.4,
      depth: 2.0,
      description: 'Full bathroom with tub'
    },
    'kitchen-galley': {
      name: 'Galley Kitchen',
      category: 'rooms',
      width: 2.5,
      height: 2.4,
      depth: 3.5,
      description: 'Galley-style kitchen'
    },
    'living-room': {
      name: 'Living Room',
      category: 'rooms',
      width: 4.5,
      height: 2.4,
      depth: 5.0,
      description: 'Standard living room'
    }
  },

  // Standard construction elements
  construction: {
    'door-standard': {
      name: 'Standard Door',
      category: 'construction',
      width: 0.9,
      height: 2.0,
      depth: 0.05,
      description: 'Standard interior door'
    },
    'door-double': {
      name: 'Double Door',
      category: 'construction',
      width: 1.8,
      height: 2.0,
      depth: 0.05,
      description: 'Double door entrance'
    },
    'window-standard': {
      name: 'Standard Window',
      category: 'construction',
      width: 1.2,
      height: 1.5,
      depth: 0,
      description: 'Standard window'
    },
    'window-large': {
      name: 'Large Window',
      category: 'construction',
      width: 2.0,
      height: 1.8,
      depth: 0,
      description: 'Large picture window'
    },
    'ceiling-standard': {
      name: 'Standard Ceiling',
      category: 'construction',
      width: 0,
      height: 2.4,
      depth: 0,
      description: 'Standard ceiling height'
    },
    'ceiling-high': {
      name: 'High Ceiling',
      category: 'construction',
      width: 0,
      height: 3.0,
      depth: 0,
      description: 'High ceiling'
    }
  }
};

/**
 * Template Manager Component
 * Manages and applies measurement templates
 */
AFRAME.registerComponent('template-manager', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    this.templates = MEASUREMENT_TEMPLATES;
    this.appliedTemplates = []; // Track applied templates

    // Listen for template events
    this.el.sceneEl.addEventListener('apply-template', this.applyTemplate.bind(this));
    this.el.sceneEl.addEventListener('list-templates', this.listTemplates.bind(this));

    console.log('[Template Manager] Initialized with', this.getTemplateCount(), 'templates');
  },

  /**
   * Get total template count
   */
  getTemplateCount: function() {
    let count = 0;
    Object.values(this.templates).forEach(category => {
      count += Object.keys(category).length;
    });
    return count;
  },

  /**
   * Apply a template to create a measurement visualization
   */
  applyTemplate: function(evt) {
    const templateId = evt.detail?.templateId;
    const position = evt.detail?.position || { x: 0, y: 1.5, z: -1 };

    if (!templateId) {
      console.error('[Template Manager] No template ID provided');
      return;
    }

    // Find template
    const template = this.findTemplate(templateId);

    if (!template) {
      console.error('[Template Manager] Template not found:', templateId);
      return;
    }

    // Create visualization
    this.createTemplateVisualization(template, position, templateId);

    console.log('[Template Manager] ✓ Applied template:', template.name);

    if (window.uiEnhancement) {
      window.uiEnhancement.notify(`Template applied: ${template.name}`, 'success');
    }
  },

  /**
   * Find a template by ID
   */
  findTemplate: function(templateId) {
    for (const category of Object.values(this.templates)) {
      if (category[templateId]) {
        return category[templateId];
      }
    }
    return null;
  },

  /**
   * Create visualization for template
   */
  createTemplateVisualization: function(template, position, templateId) {
    // Create container
    const container = document.createElement('a-entity');
    container.setAttribute('id', `template-${templateId}-${Date.now()}`);
    container.setAttribute('data-template-id', templateId);

    // Create bounding box
    const box = document.createElement('a-box');
    box.setAttribute('width', template.width);
    box.setAttribute('height', template.depth || template.height); // Use depth for Y-axis
    box.setAttribute('depth', template.height); // Use height for Z-axis

    box.setAttribute('position', position);
    box.setAttribute('color', '#15ACCF');
    box.setAttribute('opacity', 0.3);
    box.setAttribute('shader', 'standard');

    // Add wireframe outline
    box.setAttribute('material', {
      wireframe: true,
      color: '#15ACCF'
    });

    container.appendChild(box);

    // Add measurement labels
    this.addTemplateLabels(container, template, position);

    // Add title label
    const titleLabel = document.createElement('a-entity');
    titleLabel.setAttribute('spatial-text', {
      value: template.name,
      fontSize: 0.04,
      color: '#FFFFFF',
      anchorX: 'center',
      anchorY: 'middle',
      outlineWidth: 0.003,
      outlineColor: '#000000'
    });

    titleLabel.setAttribute('position', {
      x: position.x,
      y: position.y + (template.depth || template.height) / 2 + 0.1,
      z: position.z
    });

    container.appendChild(titleLabel);

    // Make draggable
    container.setAttribute('ui-grabbable', {
      enabled: true,
      hapticFeedback: true
    });

    // Add to scene
    this.el.sceneEl.appendChild(container);

    // Track applied template
    this.appliedTemplates.push({
      id: container.id,
      templateId: templateId,
      template: template,
      entity: container
    });
  },

  /**
   * Add measurement labels to template
   */
  addTemplateLabels: function(container, template, position) {
    // Width label
    if (template.width > 0) {
      const widthLabel = document.createElement('a-entity');
      widthLabel.setAttribute('measurement-label', {
        value: template.width,
        type: 'length',
        label: 'W:',
        position: {
          x: position.x,
          y: position.y - (template.depth || template.height) / 2 - 0.05,
          z: position.z
        },
        color: '#FFFFFF',
        fontSize: 0.03,
        precision: 2
      });

      container.appendChild(widthLabel);
    }

    // Depth label (showing as height in 3D space)
    if (template.depth && template.depth > 0) {
      const depthLabel = document.createElement('a-entity');
      depthLabel.setAttribute('measurement-label', {
        value: template.depth,
        type: 'length',
        label: 'D:',
        position: {
          x: position.x + template.width / 2 + 0.05,
          y: position.y,
          z: position.z
        },
        color: '#FFFFFF',
        fontSize: 0.03,
        precision: 2
      });

      container.appendChild(depthLabel);
    }

    // Height label
    if (template.height > 0) {
      const heightLabel = document.createElement('a-entity');
      heightLabel.setAttribute('measurement-label', {
        value: template.height,
        type: 'length',
        label: 'H:',
        position: {
          x: position.x - template.width / 2 - 0.05,
          y: position.y,
          z: position.z
        },
        color: '#FFFFFF',
        fontSize: 0.03,
        precision: 2
      });

      container.appendChild(heightLabel);
    }
  },

  /**
   * List all templates by category
   */
  listTemplates: function(evt) {
    const callback = evt.detail?.callback;

    const templateList = {};

    Object.keys(this.templates).forEach(category => {
      templateList[category] = Object.keys(this.templates[category]).map(id => ({
        id: id,
        ...this.templates[category][id]
      }));
    });

    if (callback && typeof callback === 'function') {
      callback(templateList);
    }

    return templateList;
  },

  /**
   * Get templates by category
   */
  getTemplatesByCategory: function(category) {
    if (!this.templates[category]) {
      return [];
    }

    return Object.keys(this.templates[category]).map(id => ({
      id: id,
      ...this.templates[category][id]
    }));
  },

  /**
   * Remove all applied templates
   */
  clearAppliedTemplates: function() {
    this.appliedTemplates.forEach(applied => {
      if (applied.entity && applied.entity.parentNode) {
        applied.entity.parentNode.removeChild(applied.entity);
      }
    });

    this.appliedTemplates = [];

    console.log('[Template Manager] ✓ Cleared all applied templates');

    if (window.uiEnhancement) {
      window.uiEnhancement.notify('Templates cleared', 'info');
    }
  }
});

console.log('[Measurement Templates] Template system loaded with furniture, rooms, and construction standards');

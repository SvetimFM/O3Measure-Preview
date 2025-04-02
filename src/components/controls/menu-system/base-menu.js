/**
 * Base Menu Component
 * 
 * Base class for all menu components
 * Provides common functionality for menu rendering and event handling
 */

import MenuRegistry from './menu-registry.js';
import { EVENTS, emitEvent } from '../../../utils/events.js';

// Base menu component
const BaseMenu = {
  /**
   * Initialize the menu with container reference
   * @param {Object} container - The container element to render the menu in
   * @param {Object} data - Menu data/parameters
   * @param {Object} sceneEl - The scene element
   */
  init: function(container, data, sceneEl) {
    this.container = container;
    this.data = data;
    this.sceneEl = sceneEl;
    this.elements = []; // Keep track of created elements for cleanup
  },
  
  /**
   * Render the menu content
   * To be implemented by each menu
   */
  render: function() {
    // Override in subclasses
    console.warn('BaseMenu: render() not implemented');
  },
  
  /**
   * Clean up the menu content
   */
  cleanup: function() {
    // Remove all elements we created
    this.elements.forEach(el => {
      if (el.parentNode) {
        // Remove event listeners
        if (el._eventListeners) {
          Object.keys(el._eventListeners).forEach(event => {
            el._eventListeners[event].forEach(handler => {
              el.removeEventListener(event, handler);
            });
          });
        }
        
        // Remove from DOM
        el.parentNode.removeChild(el);
      }
    });
    
    // Clear elements array
    this.elements = [];
  },
  
  /**
   * Helper to create an element and track it for cleanup
   * @param {string} tagName - The tag name of the element to create
   * @returns {Element} - The created element
   */
  createElement: function(tagName) {
    const el = document.createElement(tagName);
    this.elements.push(el);
    return el;
  },
  
  /**
   * Helper to add an event listener and track it for cleanup
   * @param {Element} el - The element to add the listener to
   * @param {string} event - The event name
   * @param {Function} handler - The event handler
   */
  addEventListener: function(el, event, handler) {
    // Initialize event listeners tracking
    el._eventListeners = el._eventListeners || {};
    el._eventListeners[event] = el._eventListeners[event] || [];
    
    // Save reference to handler for cleanup
    el._eventListeners[event].push(handler);
    
    // Add actual event listener
    el.addEventListener(event, handler);
  },
  
  /**
   * Helper to create a title element
   * @param {string} text - The title text
   * @param {number} height - The height of the menu
   * @returns {Element} - The created title element
   */
  createTitle: function(text, height) {
    const title = this.createElement('a-text');
    title.setAttribute('value', text);
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${height/2 - 0.015} 0`);
    title.setAttribute('color', '#FFFFFF');
    title.setAttribute('scale', '0.04 0.04 0.04');
    return title;
  },
  
  /**
   * Helper to create a subtitle element
   * @param {string} text - The subtitle text
   * @param {number} height - The height of the menu
   * @returns {Element} - The created subtitle element
   */
  createSubtitle: function(text, height) {
    const subtitle = this.createElement('a-text');
    subtitle.setAttribute('value', text);
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', `0 ${height/2 - 0.035} 0`);
    subtitle.setAttribute('color', '#AAAAAA');
    subtitle.setAttribute('scale', '0.025 0.025 0.025');
    return subtitle;
  },
  
  /**
   * Helper to create a divider element
   * @param {number} width - The width of the menu
   * @param {number} height - The height of the menu
   * @param {string} color - The color of the divider
   * @returns {Element} - The created divider element
   */
  createDivider: function(width, height, color) {
    const divider = this.createElement('a-entity');
    divider.setAttribute('geometry', {
      primitive: 'plane',
      width: width - 0.01,
      height: 0.001
    });
    divider.setAttribute('material', {
      color: color,
      shader: 'flat'
    });
    divider.setAttribute('position', `0 ${height/2 - 0.05} 0`);
    return divider;
  },
  
  /**
   * Helper to create a button element
   * @param {Object} config - Button configuration
   * @returns {Element} - The created button element
   */
  createButton: function(config) {
    const button = this.createElement('a-entity');
    button.setAttribute('button', {
      label: config.label,
      width: config.width || 0.10,
      height: config.height || 0.03,
      color: config.color || '#4285F4',
      textColor: config.textColor || '#FFFFFF'
    });
    button.setAttribute('position', config.position);
    
    if (config.id) {
      button.setAttribute('id', config.id);
    }
    
    if (config.handler) {
      this.addEventListener(button, EVENTS.BUTTON.PRESS_ENDED, config.handler);
    }
    
    return button;
  },
  
  /**
   * Helper to emit a global menu action event
   * @param {string} action - The action name
   * @param {Object} detail - Additional event details
   */
  emitMenuAction: function(action, detail = {}) {
    detail.action = action;
    emitEvent(this.sceneEl, EVENTS.MENU.ACTION, detail);
  }
};

export default BaseMenu;
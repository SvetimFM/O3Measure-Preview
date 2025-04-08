/**
 * Button Component
 * 
 * Creates an interactive button that can be used with hand tracking
 * Following A-Frame's hand tracking examples
 */

import { events, Colors } from '../../../utils/index.js';

const { EVENTS, emitEvent } = events;

AFRAME.registerComponent('button', {
  schema: {
    label: {type: 'string', default: 'Button'},
    width: {type: 'number', default: 0.04},
    height: {type: 'number', default: 0.02},
    color: {type: 'color', default: Colors.PRIMARY},
    hoverColor: {type: 'color', default: '#5794F7'},
    pressColor: {type: 'color', default: '#A36736'},
    textColor: {type: 'color', default: '#FFFFFF'},
    toggleable: {type: 'boolean', default: false},
    enabled: {type: 'boolean', default: true}
  },

  init: function () {
    // Button state
    this.pressed = false;
    this.toggled = false;
    
    // Create button elements
    this.createButton();
    
    // Add event listeners
    this.addEventListeners();
  },

  createButton: function() {
    var el = this.el;
    var data = this.data;
    
    // Button background - using a-plane primitive
    this.buttonBackground = document.createElement('a-plane');
    this.buttonBackground.setAttribute('width', data.width);
    this.buttonBackground.setAttribute('height', data.height);
    this.buttonBackground.setAttribute('color', data.color);
    this.buttonBackground.setAttribute('shader', 'flat');
    
    // Button text
    this.buttonText = document.createElement('a-text');
    this.buttonText.setAttribute('value', data.label);
    this.buttonText.setAttribute('color', data.textColor);
    this.buttonText.setAttribute('align', 'center');
    this.buttonText.setAttribute('position', '0 0 0.001');
    this.buttonText.setAttribute('width', data.height * 60);
    this.buttonText.setAttribute('wrap-count', 20);
    this.buttonText.setAttribute('scale', '0.07 0.07 0.07');
    
    // Add elements to button entity
    el.appendChild(this.buttonBackground);
    el.appendChild(this.buttonText);
    
    // Make button pressable for hand tracking
    el.setAttribute('pressable', '');
  },
  
  addEventListeners: function() {
    // Bind methods
    this.onPressedStarted = this.onPressedStarted.bind(this);
    this.onPressedEnded = this.onPressedEnded.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    
    // Add event listeners for pressable
    this.el.addEventListener(EVENTS.INTERACTION.PRESSED_STARTED, this.onPressedStarted);
    this.el.addEventListener(EVENTS.INTERACTION.PRESSED_ENDED, this.onPressedEnded);
    
    // Add event listeners for hover
    this.el.addEventListener('mouseenter', this.onMouseEnter);
    this.el.addEventListener('mouseleave', this.onMouseLeave);
  },
  
  onMouseEnter: function() {
    // Only change color if not pressed and button is enabled
    if (!this.pressed && this.data.enabled) {
      this.buttonBackground.setAttribute('color', this.data.hoverColor);
    }
    console.log(`Button hover: ${this.data.label}`);
  },
  
  onMouseLeave: function() {
    // Restore original color if not pressed
    if (!this.pressed) {
      this.buttonBackground.setAttribute('color', this.data.color);
    }
    console.log(`Button hover end: ${this.data.label}`);
  },
  
  onPressedStarted: function() {
    // Only respond if button is enabled
    if (!this.data.enabled) return;
    
    // Change button color to pressed state
    this.pressed = true;
    this.updateButtonState();
    
    // Emit event for audio feedback
    emitEvent(this.el, EVENTS.BUTTON.PRESS_STARTED, {
      id: this.el.id, 
      label: this.data.label,
      enabled: true
    });
  },
  
  onPressedEnded: function() {
    // Only respond if button is enabled and was pressed
    if (!this.data.enabled || !this.pressed) return;
    
    this.pressed = false;
    
    // Toggle state if toggleable
    if (this.data.toggleable) {
      this.toggled = !this.toggled;
    }
    
    this.updateButtonState();
    
    // Emit click event for other components to listen to
    emitEvent(this.el, EVENTS.BUTTON.PRESS_ENDED, {
      id: this.el.id, 
      label: this.data.label,
      toggled: this.toggled,
      enabled: true
    });
    
    console.log(`Button clicked: ${this.data.label}, toggled: ${this.toggled}`);
  },
  
  updateButtonState: function() {
    // Set the appropriate color based on button state
    var color;
    
    // If button is disabled, use the color passed in the data
    // This allows for setting a "disabled" gray color through the API
    if (!this.data.enabled) {
      color = this.data.color;
    } else if (this.pressed) {
      color = this.data.pressColor;
    } else if (this.toggled) {
      color = this.data.hoverColor;
    } else {
      color = this.data.color;
    }
    
    this.buttonBackground.setAttribute('color', color);
    
    // Visually indicate disabled state
    this.buttonText.setAttribute('color', this.data.enabled ? this.data.textColor : '#AAAAAA');
  },
  
  update: function(oldData) {
    // Update button if properties changed
    var data = this.data;
    
    // Skip on first initialization
    if (Object.keys(oldData).length === 0) return;
    
    // Update button dimensions
    if (oldData.width !== data.width || oldData.height !== data.height) {
      this.buttonBackground.setAttribute('width', data.width);
      this.buttonBackground.setAttribute('height', data.height);
      this.buttonText.setAttribute('width', data.width * 10);
    }
    
    // Update text
    if (oldData.label !== data.label || oldData.textColor !== data.textColor) {
      this.buttonText.setAttribute('value', data.label);
      this.buttonText.setAttribute('color', data.textColor);
    }
    
    this.updateButtonState();
  },
  
  remove: function() {
    // Remove event listeners
    this.el.removeEventListener(EVENTS.INTERACTION.PRESSED_STARTED, this.onPressedStarted);
    this.el.removeEventListener(EVENTS.INTERACTION.PRESSED_ENDED, this.onPressedEnded);
    this.el.removeEventListener('mouseenter', this.onMouseEnter);
    this.el.removeEventListener('mouseleave', this.onMouseLeave);
    
    // Clean up elements
    if (this.buttonBackground && this.buttonBackground.parentNode) {
      this.buttonBackground.parentNode.removeChild(this.buttonBackground);
    }
    
    if (this.buttonText && this.buttonText.parentNode) {
      this.buttonText.parentNode.removeChild(this.buttonText);
    }
  }
});
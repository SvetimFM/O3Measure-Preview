/**
 * Button Component
 * 
 * Creates an interactive button that can be used with hand tracking
 * Following A-Frame's hand tracking examples
 */

AFRAME.registerComponent('button', {
  schema: {
    label: {type: 'string', default: 'Button'},
    width: {type: 'number', default: 0.04},
    height: {type: 'number', default: 0.02},
    color: {type: 'color', default: '#4285F4'},
    hoverColor: {type: 'color', default: '#5794F7'},
    pressColor: {type: 'color', default: '#A36736'},
    textColor: {type: 'color', default: '#FFFFFF'},
    toggleable: {type: 'boolean', default: false}
  },

  init: function () {
    var el = this.el;
    var data = this.data;

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
    this.buttonText.setAttribute('width', data.height * 50); // Scale text appropriately
    this.buttonText.setAttribute('wrap-count', 20);
    this.buttonText.setAttribute('scale', '0.07 0.07 0.07'); // Enlarged text
    
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
    this.el.addEventListener('pressedstarted', this.onPressedStarted);
    this.el.addEventListener('pressedended', this.onPressedEnded);
    
    // Add event listeners for hover
    this.el.addEventListener('mouseenter', this.onMouseEnter);
    this.el.addEventListener('mouseleave', this.onMouseLeave);
  },
  
  onMouseEnter: function() {
    // Only change color if not pressed
    if (!this.pressed) {
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
  
  onPressedStarted: function(evt) {
    // Change button color to pressed state
    this.pressed = true;
    this.updateButtonState();
    
    // Emit event for audio feedback
    this.el.emit('button-press-started', {id: this.el.id, label: this.data.label});
  },
  
  onPressedEnded: function(evt) {
    this.pressed = false;
    
    // Toggle state if toggleable
    if (this.data.toggleable) {
      this.toggled = !this.toggled;
    }
    
    this.updateButtonState();
    
    // Emit click event for other components to listen to
    this.el.emit('button-press-ended', {
      id: this.el.id, 
      label: this.data.label,
      toggled: this.toggled
    });
    
    console.log(`Button clicked: ${this.data.label}, toggled: ${this.toggled}`);
  },
  
  updateButtonState: function() {
    // Set the appropriate color based on button state
    var color;
    
    if (this.pressed) {
      color = this.data.pressColor;
    } else if (this.toggled) {
      color = this.data.hoverColor;
    } else {
      color = this.data.color;
    }
    
    this.buttonBackground.setAttribute('color', color);
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
    this.el.removeEventListener('pressedstarted', this.onPressedStarted);
    this.el.removeEventListener('pressedended', this.onPressedEnded);
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
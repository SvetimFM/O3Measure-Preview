# O3Measure Utility Modules

This directory contains utility modules that provide standardized functions to reduce boilerplate and improve code consistency across the application.

## Overview

We've organized common functionality into specialized utility modules:

1. **geometry.js** - 3D geometry calculations
2. **ui-elements.js** - A-Frame UI element creation
3. **events.js** - Event management and constants
4. **interaction.js** - User interaction handling

## Benefits of This Approach

- **Reduced Duplication**: Common functionality is centralized
- **Standardization**: Consistent patterns across components
- **Easier Maintenance**: Changes only need to be made in one place
- **Improved Readability**: Component code focuses on business logic
- **Better Testing**: Utils can be unit tested independently

## Usage Example

```javascript
// Import utilities from standardized modules
import { calculateRectangleOrientation } from '../utils/geometry.js';
import { createMarker, createLine } from '../utils/ui-elements.js';
import { EVENTS, emitEvent } from '../utils/events.js';
import { getPinchPosition } from '../utils/interaction.js';

// Use them in your component
AFRAME.registerComponent('my-component', {
  init: function() {
    // Set up event listeners using our utilities
    this.boundHandler = addListener(
      this.el.sceneEl, 
      EVENTS.INTERACTION.PINCH_STARTED,
      this.onPinchStarted,
      this
    );
  },
  
  onPinchStarted: function(event) {
    // Get position using our utility
    const position = getPinchPosition(event);
    
    // Create a marker using our utility
    const marker = createMarker(position, 1, '#FF0000', this.el.sceneEl);
    
    // Emit an event using our utility
    emitEvent(this.el, EVENTS.OBJECT.CREATED, { position });
  }
});
```

## Module Details

### geometry.js

Functions for 3D geometry calculations:
- Vector conversions
- Plane calculations
- Rectangle orientation and dimensions
- Unit conversions

### ui-elements.js

Functions for creating common A-Frame UI elements:
- Markers and points
- Lines and rectangles
- Text labels
- Measurement displays

### events.js

Provides standardized event management:
- Event name constants
- Event emitter and listener helpers
- Automatic handler binding

### interaction.js

Functions for handling user interactions:
- Pinch and press detection
- Hand position tracking
- Ray-plane intersections
- Interaction debouncing

## Next Steps

- Unit tests for utilities
- Further component refactoring
- Base component class for common patterns
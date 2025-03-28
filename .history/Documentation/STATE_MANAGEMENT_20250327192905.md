# O3Measure State Management (Feature-Oriented)

## Overview

For O3Measure, we'll use a feature-oriented approach to state management, where:

1. **Features Manage Their Own State**: Each feature component maintains its own internal state
2. **Event-Based Communication**: Features communicate via A-Frame's event system
3. **Minimal Global State**: Only truly global settings are shared across features

This approach aligns perfectly with A-Frame's entity-component architecture and makes the application easy to extend.

## Key Principles

### 1. Feature Encapsulation

Each feature (like wall calibration, object measurement) is implemented as a self-contained component that:

- Has its own internal state object
- Creates its required UI elements when activated
- Cleans up after itself when deactivated
- Makes direct changes to its own DOM elements

```javascript
AFRAME.registerComponent('feature-component', {
  schema: {
    active: {type: 'boolean', default: false}
  },
  
  init: function() {
    // Internal state - not exposed in schema
    this.state = {
      // Feature-specific state variables
    };
    
    // Listen for activation events
    this.el.sceneEl.addEventListener('activate-feature', this.onFeatureActivation.bind(this));
  },
  
  // Other lifecycle methods and custom methods...
  
  remove: function() {
    // Clean up event listeners, entities, etc.
  }
});
```

### 2. Event-Based Communication

Features communicate with each other through events:

- Global events are emitted on the scene element (`this.el.sceneEl`)
- Component-specific events are emitted on the component's entity (`this.el`)
- Events contain all necessary data to avoid maintaining shared state

```javascript
// Emitting an event with data
this.el.sceneEl.emit('wall-data-available', {
  points: this.state.points,
  dimensions: this.state.dimensions
});

// Listening for events from other features
this.el.sceneEl.addEventListener('wall-data-available', this.onWallData.bind(this));
```

### 3. Menu-Driven Navigation

A wrist-mounted menu serves as the main navigation hub:

- Displays available features
- Activates features via events
- Shows global information
- Preserves results from completed features

```javascript
AFRAME.registerComponent('wrist-menu', {
  // Schema, init, etc.
  
  activateFeature: function(featureId) {
    // Broadcast which feature to activate
    this.el.sceneEl.emit('activate-feature', {
      id: featureId
    });
  }
});
```

## Shared Utilities

### 1. Measurement Utilities

A simple system provides measurement utilities without managing application state:

```javascript
AFRAME.registerSystem('measurement-utils', {
  init: function() {
    // Constants
    this.METERS_TO_INCHES = 39.3701;
    this.METERS_TO_CM = 100;
    
    // Current unit setting
    this.units = 'IMPERIAL';
  },
  
  // Conversion methods
  metersToDisplay: function(meters) {
    if (this.units === 'IMPERIAL') {
      const inches = meters * this.METERS_TO_INCHES;
      return inches.toFixed(1) + '"';
    } else {
      const cm = meters * this.METERS_TO_CM;
      return cm.toFixed(1) + 'cm';
    }
  },
  
  toggleUnits: function() {
    this.units = this.units === 'IMPERIAL' ? 'METRIC' : 'IMPERIAL';
    // Broadcast unit change
    this.el.emit('units-changed', {units: this.units});
    return this.units;
  }
});
```

### 2. AR Utilities

Provides access to AR functionality:

```javascript
AFRAME.registerSystem('ar-utils', {
  schema: {
    hitTestActive: {type: 'boolean', default: false}
  },
  
  init: function() {
    // Initialize AR capabilities detection
    this.checkDeviceCapabilities();
  },
  
  // Enable/disable hit testing
  toggleHitTest: function(active) {
    this.el.setAttribute('ar-utils', 'hitTestActive', active);
    // Other implementation details...
  }
});
```

## Feature Implementation Examples

### 1. Wall Calibration Feature

```javascript
AFRAME.registerComponent('wall-calibration', {
  schema: {
    active: {type: 'boolean', default: false}
  },
  
  init: function() {
    // Internal state
    this.state = {
      points: [],
      wallPlane: null,
      complete: false
    };
    
    // Feature activation listener
    this.el.sceneEl.addEventListener('activate-feature', this.onFeatureActivation.bind(this));
  },
  
  onFeatureActivation: function(event) {
    if (event.detail.id === 'wall-calibration') {
      // Activate this feature
      this.el.setAttribute('wall-calibration', 'active', true);
      
      // Initialize UI
      this.createUI();
      
      // Activate hit testing
      const arUtils = this.el.sceneEl.systems['ar-utils'];
      arUtils.toggleHitTest(true);
      
      // Listen for hit events
      this.el.sceneEl.addEventListener('ar-hit', this.onHit.bind(this));
    } else if (this.data.active) {
      // Deactivate when another feature is activated
      this.el.setAttribute('wall-calibration', 'active', false);
      
      // Clean up
      this.removeUI();
      
      // Disable hit testing if we were using it
      const arUtils = this.el.sceneEl.systems['ar-utils'];
      arUtils.toggleHitTest(false);
      
      // Remove event listener
      this.el.sceneEl.removeEventListener('ar-hit', this.onHit);
    }
  },
  
  // Other methods for handling points, calculating planes, etc.
  
  completeCalibration: function() {
    this.state.complete = true;
    
    // Broadcast wall data for other features
    this.el.sceneEl.emit('wall-calibrated', {
      points: this.state.points,
      plane: this.state.wallPlane
    });
    
    // Return to menu
    this.el.sceneEl.emit('return-to-menu');
  }
});
```

### 2. Object Measurement Feature

```javascript
AFRAME.registerComponent('object-measurement', {
  schema: {
    active: {type: 'boolean', default: false}
  },
  
  init: function() {
    // Internal state
    this.state = {
      corners: [],
      dimensions: {width: 0, height: 0},
      complete: false
    };
    
    // Listen for activation
    this.el.sceneEl.addEventListener('activate-feature', this.onFeatureActivation.bind(this));
    
    // Listen for wall data (if measurement comes after wall calibration)
    this.el.sceneEl.addEventListener('wall-calibrated', this.onWallData.bind(this));
  },
  
  // Activation/deactivation logic
  
  calculateDimensions: function() {
    // Calculate object dimensions from corner points
    
    // Get measurement utilities
    const measureUtils = this.el.sceneEl.systems['measurement-utils'];
    
    // Convert to display units
    const widthDisplay = measureUtils.metersToDisplay(this.state.dimensions.width);
    const heightDisplay = measureUtils.metersToDisplay(this.state.dimensions.height);
    
    // Update UI
    this.updateDimensionDisplay(widthDisplay, heightDisplay);
  },
  
  completeObjectMeasurement: function() {
    // Broadcast object data
    this.el.sceneEl.emit('object-measured', {
      corners: this.state.corners,
      dimensions: this.state.dimensions
    });
    
    // Show success message or move to next feature
  }
});
```

## Data Persistence

For data that needs to persist between feature activations:

```javascript
AFRAME.registerSystem('session-data', {
  init: function() {
    this.data = {
      wall: null,
      object: null,
      anchors: null
    };
    
    // Listen for data from features
    this.el.addEventListener('wall-calibrated', this.onWallData.bind(this));
    this.el.addEventListener('object-measured', this.onObjectData.bind(this));
    this.el.addEventListener('anchors-placed', this.onAnchorData.bind(this));
  },
  
  onWallData: function(event) {
    this.data.wall = event.detail;
  },
  
  onObjectData: function(event) {
    this.data.object = event.detail;
  },
  
  onAnchorData: function(event) {
    this.data.anchors = event.detail;
  },
  
  hasAllData: function() {
    return this.data.wall && this.data.object && this.data.anchors;
  }
});
```

## Benefits of This Approach

1. **Simplicity**: Each feature handles only its own concerns
2. **Independence**: Features can be developed and tested in isolation
3. **Testability**: Clear boundaries make unit testing easier
4. **Extensibility**: New features can be added without modifying existing code
5. **Flexibility**: Different user flows can be created by changing menu options
6. **Performance**: Components are only active when needed

This feature-oriented approach aligns perfectly with A-Frame's component model and makes it easy to expand the application with new functionality in the future.
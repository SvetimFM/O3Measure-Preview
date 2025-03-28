# O3Measure State Management

## Overview
For O3Measure, we'll implement a lightweight state management approach that combines:
1. A-Frame systems for global state accessible to all components
2. Custom event-based communication between components
3. A simple pub/sub pattern for cross-component state updates

## State Categories

### 1. Application Flow State
Manages the user's progress through the measurement workflow steps.

```javascript
const flowState = {
  currentStep: 'WALL_SELECTION', // WALL_SELECTION, OBJECT_DEFINITION, ANCHOR_POINT, WALL_PROJECTION
  previousStep: null,
  nextStepAvailable: false,
  resetAvailable: true,
  stepData: {
    // Data specific to each step
    WALL_SELECTION: {
      wallPoints: [], // Array of Vector3 positions
      wallCalibrated: false,
    },
    OBJECT_DEFINITION: {
      corners: [], // Array of Vector3 positions for corners
      dimensions: { width: 0, height: 0 }, // In meters
      dimensionsImperial: { width: 0, height: 0 }, // In inches
    },
    ANCHOR_POINT: {
      anchors: [], // Array of Vector3 positions relative to object
      anchorCount: 0,
    },
    WALL_PROJECTION: {
      position: null, // Vector3 position on wall
      orientation: null, // Quaternion
      isPlaced: false,
    }
  }
};
```

### 2. Measurement Data State
Stores the actual measurement data and calculations.

```javascript
const measurementState = {
  units: 'IMPERIAL', // IMPERIAL or METRIC
  conversionFactor: 39.3701, // Meters to inches
  precisionDigits: 1, // Decimal places for display
  measurements: {
    objectWidth: 0, // In meters
    objectHeight: 0, // In meters 
    wallWidth: 0, // In meters
    wallHeight: 0, // In meters
    anchorPositions: [], // Relative to object origin
  },
  // Calculated values for display
  calculatedValues: {
    objectWidthDisplay: '0.0"',
    objectHeightDisplay: '0.0"',
  }
};
```

### 3. AR Context State
Manages AR-specific state such as tracking status and hit test results.

```javascript
const arState = {
  trackingActive: false,
  hitTestActive: false,
  lastHitTestResult: null,
  reticleVisible: false,
  sessionSupported: false,
  sessionActive: false,
  deviceCapabilities: {
    hasAnchors: false,
    hasHitTest: false,
    hasDepth: false,
  }
};
```

### 4. UI State
Manages UI-related state for controllers and menus.

```javascript
const uiState = {
  controllerConnected: {
    left: false,
    right: false,
  },
  uiPanelVisible: true,
  uiPanelPosition: { x: 0, y: 0, z: 0 },
  uiPanelOrientation: { x: 0, y: 0, z: 0, w: 1 },
  activeTooltip: null,
  notifications: [],
  menuOpen: false,
  helpOpen: false,
};
```

## Implementation

### A-Frame System for State Management

```javascript
AFRAME.registerSystem('state-manager', {
  schema: {},
  
  init: function() {
    // Initialize the state store
    this.state = {
      flow: { /* Flow state */ },
      measurements: { /* Measurement state */ },
      ar: { /* AR state */ },
      ui: { /* UI state */ }
    };
    
    // Event listeners
    this.eventListeners = {};
    
    // Bind state update method
    this.updateState = this.updateState.bind(this);
    
    // Register global event handlers
    this.el.addEventListener('state-update', this.handleStateUpdate.bind(this));
  },
  
  // Get the current state or a specific slice
  getState: function(sliceName) {
    if (sliceName) {
      return this.state[sliceName];
    }
    return this.state;
  },
  
  // Update state and notify subscribers
  updateState: function(sliceName, newState, source) {
    // Update state by merging new values
    this.state[sliceName] = {...this.state[sliceName], ...newState};
    
    // Notify subscribers
    this.notifySubscribers(sliceName, this.state[sliceName], source);
    
    // Emit event for debugging
    console.log(`State updated: ${sliceName}`, newState);
  },
  
  // Subscribe to state changes
  subscribe: function(sliceName, callback) {
    if (!this.eventListeners[sliceName]) {
      this.eventListeners[sliceName] = [];
    }
    this.eventListeners[sliceName].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners[sliceName] = 
        this.eventListeners[sliceName].filter(cb => cb !== callback);
    };
  },
  
  // Notify subscribers of state changes
  notifySubscribers: function(sliceName, newState, source) {
    if (this.eventListeners[sliceName]) {
      this.eventListeners[sliceName].forEach(callback => {
        callback(newState, source);
      });
    }
  },
  
  // Handle state update events from components
  handleStateUpdate: function(event) {
    const { sliceName, newState, source } = event.detail;
    this.updateState(sliceName, newState, source);
  }
});
```

## Usage in Components

Components can interact with the state system as follows:

```javascript
AFRAME.registerComponent('wall-selector', {
  init: function() {
    // Get reference to state manager
    this.stateManager = this.el.sceneEl.systems['state-manager'];
    
    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe('flow', this.onFlowStateChange.bind(this));
    
    // Set up event handlers
    this.el.addEventListener('click', this.handleClick.bind(this));
  },
  
  // State change handler
  onFlowStateChange: function(newState, source) {
    if (source === this.el.id) return; // Avoid circular updates
    
    // React to state changes
    if (newState.currentStep === 'WALL_SELECTION') {
      // Enable this component's functionality
      this.activate();
    } else {
      // Disable when not in the relevant step
      this.deactivate();
    }
  },
  
  // Update state when user interacts
  handleClick: function(event) {
    // Get current flow state
    const flowState = this.stateManager.getState('flow');
    
    // Add a new wall point
    const newPoint = event.detail.intersection.point;
    const updatedPoints = [...flowState.stepData.WALL_SELECTION.wallPoints, newPoint];
    
    // Update state
    this.stateManager.updateState('flow', {
      stepData: {
        ...flowState.stepData,
        WALL_SELECTION: {
          ...flowState.stepData.WALL_SELECTION,
          wallPoints: updatedPoints,
          // Enable next button if we have enough points
          nextStepAvailable: updatedPoints.length >= 3
        }
      }
    }, this.el.id);
  },
  
  remove: function() {
    // Clean up subscription when component is removed
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
});
```

## Extensions for Future Growth

This state management approach is designed to scale with additional features:

1. **Historical Data**: Add a history system for undo/redo operations
2. **Persistence**: Add local storage integration for saving measurements
3. **Cloud Sync**: Extend with API calls for cloud storage of measurements
4. **Multi-session Support**: Add project/session management for different measurement sets
5. **User Preferences**: Add persistent user settings and preferences
6. **Collaborative Features**: Add real-time state sharing between multiple users

By using A-Frame systems for state management, we maintain a clean separation between state logic and component behavior while leveraging A-Frame's entity-component architecture.
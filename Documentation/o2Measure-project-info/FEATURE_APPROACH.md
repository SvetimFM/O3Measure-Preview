# O3Measure Feature-Oriented Approach

## Overview

Rather than designing around a global application state, we'll organize O3Measure around independent features that manage their own state and workflow. This approach makes adding new features simple and keeps components focused on their specific tasks.

## Core Concepts

1. **Feature Components**: Self-contained modules that implement a specific task
2. **UI Components**: Reusable UI elements that handle their own rendering logic
3. **Direct Communication**: Components talk directly to relevant parts of the system
4. **Minimal Shared State**: Only truly global concerns live in system components

## Example: Main Menu on Wrist

```javascript
AFRAME.registerComponent('wrist-menu', {
  schema: {
    hand: {type: 'string', default: 'left'},
    width: {type: 'number', default: 0.15},
    height: {type: 'number', default: 0.1}
  },
  
  init: function() {
    // Create menu panel
    this.createMenuPanel();
    
    // Menu is a list of available features/tools
    this.features = [
      { id: 'wall-calibration', label: 'Calibrate Wall', icon: '#icon-wall' },
      { id: 'measure-object', label: 'Measure Object', icon: '#icon-measure' },
      { id: 'anchor-points', label: 'Set Anchors', icon: '#icon-anchor' },
      { id: 'project-wall', label: 'Project on Wall', icon: '#icon-project' }
    ];
    
    // Create buttons for each feature
    this.features.forEach(feature => {
      this.createFeatureButton(feature);
    });
    
    // Listen for controller tracking
    this.el.addEventListener('controllerconnected', this.onControllerConnected.bind(this));
  },
  
  createFeatureButton: function(feature) {
    const button = document.createElement('a-entity');
    // Set button properties...
    
    // When clicked, activate the feature
    button.addEventListener('click', () => {
      this.activateFeature(feature.id);
    });
    
    this.el.appendChild(button);
  },
  
  activateFeature: function(featureId) {
    // Simply broadcast which feature to activate
    this.el.sceneEl.emit('activate-feature', { id: featureId });
    
    // No need to manage global state - the feature components
    // themselves will respond to this event if relevant
  }
});
```

## Example: Wall Calibration Feature

```javascript
AFRAME.registerComponent('wall-calibration-feature', {
  schema: {
    active: {type: 'boolean', default: false}
  },
  
  init: function() {
    // Listen for activation events
    this.el.sceneEl.addEventListener('activate-feature', this.onFeatureActivation.bind(this));
    
    // Track our internal state
    this.state = {
      points: [],
      planeCalculated: false,
      complete: false
    };
    
    // Create components only when needed (lazy initialization)
    this.initialized = false;
  },
  
  onFeatureActivation: function(event) {
    if (event.detail.id === 'wall-calibration') {
      // Activate this feature
      this.el.setAttribute('wall-calibration-feature', 'active', true);
      
      // Initialize components if first activation
      if (!this.initialized) {
        this.initializeComponents();
        this.initialized = true;
      }
      
      // Reset state for new calibration
      this.reset();
      
      // Show UI for this feature
      this.showUI();
    } else {
      // Deactivate if a different feature is activated
      this.el.setAttribute('wall-calibration-feature', 'active', false);
      
      // Hide UI
      this.hideUI();
    }
  },
  
  initializeComponents: function() {
    // Create point markers container
    this.pointsContainer = document.createElement('a-entity');
    this.pointsContainer.id = 'wall-points-container';
    this.el.appendChild(this.pointsContainer);
    
    // Create UI
    this.ui = document.createElement('a-entity');
    this.ui.setAttribute('wall-calibration-ui', '');
    this.el.appendChild(this.ui);
    
    // Create hitTest entity
    this.hitTest = document.createElement('a-entity');
    this.hitTest.setAttribute('ar-hit-test', '');
    this.el.appendChild(this.hitTest);
    
    // Listen for point placement
    this.hitTest.addEventListener('hit', this.onHitPoint.bind(this));
    
    // Listen for UI events
    this.ui.addEventListener('reset-calibration', this.reset.bind(this));
    this.ui.addEventListener('confirm-calibration', this.confirm.bind(this));
  },
  
  onHitPoint: function(event) {
    if (!this.data.active) return;
    
    // Add point to our collection
    const point = event.detail.point.clone();
    this.state.points.push(point);
    
    // Create a visual marker
    this.createPointMarker(point);
    
    // Update UI
    this.updateUI();
    
    // Check if we have enough points to calculate a plane
    if (this.state.points.length >= 3) {
      this.calculateWallPlane();
    }
  },
  
  calculateWallPlane: function() {
    // Calculate wall plane from points...
    // This would use the points to derive a plane equation
    
    // Update state
    this.state.planeCalculated = true;
    
    // Notify UI that plane is calculated
    this.ui.emit('plane-calculated');
    
    // Visualize the wall plane
    this.visualizeWallPlane();
  },
  
  confirm: function() {
    // Mark as complete
    this.state.complete = true;
    
    // Broadcast wall data for other components
    this.el.sceneEl.emit('wall-calibrated', {
      points: this.state.points,
      // Include other wall data like normal, center, etc.
    });
    
    // Deactivate this feature
    this.el.setAttribute('wall-calibration-feature', 'active', false);
    
    // Return to main menu
    this.el.sceneEl.emit('return-to-menu');
  },
  
  reset: function() {
    // Clear all points
    this.state.points = [];
    this.state.planeCalculated = false;
    this.state.complete = false;
    
    // Remove all visual markers
    while (this.pointsContainer.firstChild) {
      this.pointsContainer.removeChild(this.pointsContainer.firstChild);
    }
    
    // Update UI
    this.updateUI();
  },
  
  updateUI: function() {
    // Update UI to reflect current state
    if (this.ui) {
      this.ui.setAttribute('wall-calibration-ui', 'pointCount', this.state.points.length);
      this.ui.setAttribute('wall-calibration-ui', 'planeCalculated', this.state.planeCalculated);
    }
  }
});
```

## UI Component Example

```javascript
AFRAME.registerComponent('wall-calibration-ui', {
  schema: {
    pointCount: {type: 'number', default: 0},
    planeCalculated: {type: 'boolean', default: false}
  },
  
  init: function() {
    // Create UI panel
    this.createPanel();
    
    // Create UI elements
    this.createInstructions();
    this.createPointCounter();
    this.createButtons();
    
    // Update UI based on current data
    this.update();
  },
  
  update: function() {
    // Update point counter
    this.pointCounter.setAttribute('value', `Points: ${this.data.pointCount}/3`);
    
    // Update instructions based on state
    if (this.data.pointCount < 3) {
      this.instructions.setAttribute('value', 'Place 3 points on the wall');
      this.confirmButton.setAttribute('visible', false);
    } else if (this.data.planeCalculated) {
      this.instructions.setAttribute('value', 'Wall detected! Adjust or confirm');
      this.confirmButton.setAttribute('visible', true);
    }
  }
});
```

## Inter-Feature Communication

Features can communicate with each other through events when needed:

```javascript
// Wall calibration complete - broadcast wall data
this.el.sceneEl.emit('wall-calibrated', {
  points: this.state.points,
  normal: this.wallNormal,
  center: this.wallCenter
});

// Object measurement feature listening for wall data
this.el.sceneEl.addEventListener('wall-calibrated', function(event) {
  // Store wall data for later use
  this.wallData = event.detail;
});
```

## Benefits of This Approach

1. **Independent Features**: Each feature manages its own state and UI
2. **Easy Extensibility**: Adding new features doesn't require modifying existing code
3. **Clear Responsibilities**: Components focus on specific tasks
4. **On-Demand Creation**: Components can be created only when needed
5. **Direct Communication**: Features communicate directly with relevant parts
6. **Minimal Global State**: No complex state management needed

## Application Structure

```
src/
├── index.html           # Main HTML with A-Frame scene
├── index.js             # JavaScript entry point
├── features/            # Feature components
│   ├── wall-calibration/
│   │   ├── index.js     # Main feature component
│   │   ├── ui.js        # Feature-specific UI
│   │   └── utils.js     # Feature-specific utilities
│   ├── object-measurement/
│   ├── anchor-points/
│   └── wall-projection/
├── components/          # Shared components
│   ├── ar/              # AR-specific components
│   │   ├── hit-test.js  # AR hit testing
│   │   └── anchors.js   # AR anchoring
│   ├── ui/              # UI components
│   │   ├── wrist-menu.js # Main menu on wrist
│   │   └── button.js    # Reusable button
│   └── utils/           # Utility components
├── primitives/          # Custom primitives
├── utils/               # Utility functions
└── assets/              # Static assets
```

This approach makes it easy to maintain and extend the application as requirements evolve, while keeping the codebase organized and focused.
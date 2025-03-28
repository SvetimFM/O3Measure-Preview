# O3Measure Project Structure (Pure A-Frame, Feature-Oriented)

## Directory Layout

```
src/
├── index.html           # Main HTML file with A-Frame scene
├── js/                  # JavaScript code
│   ├── index.js         # JavaScript entry point
│   ├── features/        # Feature components (self-contained modules)
│   │   ├── menu/        # Main menu system
│   │   │   ├── menu-component.js     # Main menu component
│   │   │   └── menu-item-component.js # Menu item component
│   │   ├── wall-calibration/ # Wall calibration feature
│   │   │   ├── wall-calibration.js   # Main feature component
│   │   │   ├── point-marker.js       # Visual marker for points
│   │   │   └── wall-visualizer.js    # Wall visualization
│   │   ├── object-measurement/ # Object measurement feature
│   │   │   ├── object-measurement.js # Main feature component
│   │   │   ├── corner-marker.js      # Corner point marker
│   │   │   └── object-visualizer.js  # Object outline
│   │   ├── anchor-points/   # Anchor points feature
│   │   │   ├── anchor-points.js      # Main feature component
│   │   │   └── anchor-marker.js      # Anchor visualization
│   │   └── wall-projection/ # Wall projection feature
│   │       ├── wall-projection.js    # Main feature component
│   │       └── projection-visualizer.js # Projection visualization
│   ├── components/      # Shared reusable components
│   │   ├── controls/    # Controller components
│   │   │   ├── controller-tracker.js # Tracks controller state
│   │   │   ├── wrist-ui.js           # Attaches UI to wrist
│   │   │   └── ray-interactor.js     # Interaction ray 
│   │   ├── ui/          # UI building blocks
│   │   │   ├── button.js             # Interactive button
│   │   │   ├── panel.js              # UI panel background
│   │   │   ├── text-label.js         # Text display
│   │   │   └── tooltip.js            # Tooltip display
│   │   └── ar/          # AR-specific components
│   │       ├── hit-test.js           # AR hit testing
│   │       ├── anchors.js            # AR anchoring
│   │       └── plane-detector.js     # Plane detection
│   ├── systems/         # A-Frame systems (global services)
│   │   ├── session-data.js           # Persistent data between features
│   │   ├── measurement-utils.js      # Measurement utilities
│   │   ├── ar-utils.js               # AR utilities
│   │   └── event-logger.js           # Debug event logging
│   └── utils/           # Helper functions
│       ├── math-utils.js             # Math/geometry calculations
│       ├── ui-utils.js               # UI helper functions
│       └── dom-utils.js              # DOM manipulation helpers
└── assets/              # Static assets
    ├── models/          # 3D models
    ├── textures/        # Textures
    └── sounds/          # Audio feedback sounds
```

## Main HTML Structure

```html
<a-scene>
  <!-- Core systems -->
  <a-entity session-data></a-entity>
  <a-entity measurement-utils></a-entity>
  <a-entity ar-utils></a-entity>
  
  <!-- Feature containers - only one active at a time -->
  <a-entity id="wall-calibration-feature" wall-calibration="active: false"></a-entity>
  <a-entity id="object-measurement-feature" object-measurement="active: false"></a-entity>
  <a-entity id="anchor-points-feature" anchor-points="active: false"></a-entity>
  <a-entity id="wall-projection-feature" wall-projection="active: false"></a-entity>
  
  <!-- Camera rig -->
  <a-entity id="cameraRig">
    <a-camera></a-camera>
    <a-entity id="leftHand" controller-tracker="hand: left">
      <a-entity wrist-ui></a-entity>
    </a-entity>
    <a-entity id="rightHand" controller-tracker="hand: right">
      <a-entity ray-interactor></a-entity>
    </a-entity>
  </a-entity>
  
  <!-- Main menu - always attached to left controller -->
  <a-entity id="main-menu" menu></a-entity>
  
  <!-- Global hit-test - activated by features as needed -->
  <a-entity id="hit-test" hit-test="active: false"></a-entity>
</a-scene>
```

## A-Frame Component Registration Pattern

Each feature and reusable component will follow the standard A-Frame component registration pattern:

```javascript
// Example component registration
AFRAME.registerComponent('feature-name', {
  schema: {
    active: {type: 'boolean', default: false},
    // Other public properties
  },
  
  init: function() {
    // Initialize internal state
    this.state = {
      // Feature-specific state
    };
    
    // Bind methods
    this.onActivate = this.onActivate.bind(this);
    
    // Set up event listeners
    this.el.sceneEl.addEventListener('activate-feature', this.onActivate);
  },
  
  update: function(oldData) {
    // React to component property changes
    if (this.data.active !== oldData.active) {
      if (this.data.active) {
        this.activate();
      } else {
        this.deactivate();
      }
    }
  },
  
  activate: function() {
    // Initialize UI elements
    // Set up feature-specific logic
  },
  
  deactivate: function() {
    // Clean up UI elements
    // Remove feature-specific event listeners
  },
  
  remove: function() {
    // Clean up all event listeners
    this.el.sceneEl.removeEventListener('activate-feature', this.onActivate);
  }
});
```

## Key Components and Systems

### Feature Components
Each feature is implemented as a standalone A-Frame component:

- **wall-calibration**: Allows placement of points to define a wall plane
- **object-measurement**: Measures objects using corner points
- **anchor-points**: Places anchor points on the measured object
- **wall-projection**: Projects the object onto the wall with anchors

### Shared Systems
Systems provide services to features:

- **session-data**: Stores data that persists between features
- **measurement-utils**: Provides measurement conversion and calculations
- **ar-utils**: Manages AR capabilities and settings

### UI Components
Reusable UI elements:

- **wrist-ui**: Attaches UI elements to the wrist
- **menu**: Main navigation menu
- **button**: Interactive button with hover/press states
- **panel**: Background panel for UI elements

## Key Design Principles

1. **Features as Self-Contained Components**:
   - Each feature manages its own lifecycle through A-Frame component methods
   - Features create DOM elements when activated
   - Features clean up after themselves when deactivated

2. **Event-Based Communication**:
   - Features communicate via A-Frame's event system
   - UI components emit events on interaction
   - Systems broadcast global state changes

3. **Lazy Initialization**:
   - Components create DOM elements on demand
   - Features only initialize when activated
   - Resources are released when not needed

4. **Pure A-Frame Implementation**:
   - Direct use of A-Frame's entity-component system
   - DOM-based entity creation and manipulation
   - Standard A-Frame component lifecycle hooks

This structure supports the feature-oriented approach where each major function of the application is a self-contained unit implemented as an A-Frame component.
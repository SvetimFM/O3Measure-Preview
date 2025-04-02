# Scene Understanding Components

This directory contains components for understanding and interacting with the user's environment in AR.

## State Machine Component Pattern

The `object-definition-state-machine.js` file implements a state machine pattern for the object definition component. This approach offers several advantages over the original step-based implementation:

### Key Benefits

1. **Explicit States**
   - States are named constants instead of magic numbers
   - State transitions are explicitly defined
   - The current state is always clear from the code

2. **Centralized State Management**
   - All state transitions go through the `setState()` method
   - Entry and exit logic for each state is centralized
   - Prevents accidental state corruption

3. **Clear Allowed Actions**
   - Each state has a clear set of allowed actions
   - Events are only processed if they're valid for the current state
   - Prevents bugs like placing too many points

4. **Self-Documenting**
   - The states and transitions form a clear, documentable graph
   - New developers can understand the flow by looking at the state constants
   - Easier to reason about the component's behavior

### State Flow Diagram

```
     ┌─────────┐                  ┌──────────────────┐
     │   IDLE  │ ───Start───────> │  PLACING_POINT_1 │
     └─────────┘ <───Cancel────── └──────────────────┘
         ^                                │
         │                                │ (pinch)
         │                                ▼
┌─────────────────┐              ┌──────────────────┐
│     PREVIEW     │ <──(pinch)─── │  PLACING_POINT_2 │
└─────────────────┘              └──────────────────┘
         │                                │
         │                                │ (pinch)
         │                                ▼
         │                       ┌──────────────────┐
         └──Finalize────────────│  PLACING_POINT_3 │
                                └──────────────────┘
```

### Using This Pattern

To use this pattern in your own components:

1. Define states as named constants
2. Implement a `setState()` method that handles transitions
3. Check the current state before processing events
4. Centralize state-specific logic in the state transition method

### Implementation Details

The state machine version replaces the `step` variable with a `state` variable that contains one of the values from the `STATES` enum. This ensures we always have a valid, named state.

The `setState()` method handles:
- Pre-transition cleanup (if needed)
- Setting the new state
- Post-transition setup (e.g., updating UI, initializing state-specific data)

Event handlers check if the current state allows the event before processing it:

```javascript
onPinchStarted: function(event) {
  const validStates = [STATES.PLACING_POINT_1, STATES.PLACING_POINT_2, STATES.PLACING_POINT_3];
  
  if (!this.data.active || !validStates.includes(this.state)) {
    return;
  }
  
  // Process the pinch...
}
```

This ensures that the component won't accept pinches in states where they shouldn't be processed, preventing bugs like the one where multiple third points could be placed.

## Other Components

### wall-plane.js

Handles wall placement and visualization in AR. Works with wall calibration to align objects with the user's environment.

### object-renderer.js

Renders saved objects on the wall plane based on their defined properties.
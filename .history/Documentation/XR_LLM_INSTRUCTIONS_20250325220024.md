# XR Implementation Guide for LLMs

## Initial Review Steps

1. First review the `/Documentation/xr_integration.md` and `/Documentation/xr_issues.md` files to understand the core requirements and current issues
2. Analyze the existing implementation in:
   - `src/App.jsx` - Main XR setup
   - `src/hooks/useHandTracking.js` - Hand tracking implementation
   - `src/hooks/useControllerInput.js` - Controller input management
   - `src/components/three/ControllerRay.jsx` - Ray visualization
   - `src/components/ui/UIPanel.jsx` - XR UI implementation

## Implementation Priority Sequence

Implement fixes in this specific order to ensure proper XR integration:

1. **XR Session Management**
   - Fix the session initialization in `App.jsx`
   - Implement proper error handling for XR session establishment
   - Add device compatibility detection

2. **Controller Input Optimization**
   - Replace custom controller ray implementation with `@react-three/xr` components
   - Fix controller reference management in global state
   - Use `useXRFrame` instead of `requestAnimationFrame`

3. **Hand Tracking Enhancement**
   - Add feature detection for hand tracking
   - Implement proper fallbacks when hand tracking isn't available
   - Add visual feedback for hand presence

4. **UI Panel Improvements**
   - Make UI follow user in more ergonomic ways
   - Implement proper XR-optimized interactions for UI elements
   - Use `@react-three/drei`'s HTML features for better UI integration

5. **Performance Optimization**
   - Optimize state management for XR requirements
   - Use references instead of state for Three.js objects
   - Implement proper cleanup for XR resources

## Testing Requirements

After each implementation step:
1. Test the application in a desktop browser with WebXR emulator
2. Verify functionality on a Meta Quest device if available
3. Check for console errors and performance issues

## Best Practices for Implementation

- Use selective imports from libraries to minimize bundle size
- Maintain compatibility with existing code patterns
- Add comments explaining XR-specific logic
- Create reusable components for common XR interactions
- Follow the 2-space indentation and code style from existing files

## Specific Implementation Tasks

### Task 1: Fix XR Session Management

```javascript
// In App.jsx
const startAR = async () => {
  setStartScreenVisible(false);
  setStatusMessage("Starting AR session...");
  
  try {
    await store.enterAR();
    setStatusMessage("AR session started");
  } catch (error) {
    console.error("Failed to start AR session:", error);
    setStatusMessage("Failed to start AR. Check device compatibility.");
    setStartScreenVisible(true);
  }
};
```

### Task 2: Optimize Controller References

```javascript
// In ItemHangingApp.jsx
const leftController = useController('left');
const rightController = useController('right');

useEffect(() => {
  if (leftController || rightController) {
    setControllers(leftController, rightController);
  }
}, [leftController, rightController, setControllers]);
```

### Task 3: Improve Hand Tracking

```javascript
// In useHandTracking.js
const [handTrackingAvailable, setHandTrackingAvailable] = useState(false);

useEffect(() => {
  if (session) {
    const supported = session.supportedFeatures?.includes('hand-tracking');
    setHandTrackingAvailable(supported);
  }
}, [session]);
```

### Task 4: Enhance UI Interactions

```javascript
// In UIPanel.jsx
<group visible={!!controller} position={[0, 0, 0]}>
  <primitive object={controller.controller}>
    <group position={[0, 0.15, 0]}>
      <Html
        transform
        distanceFactor={0.15}
        position={[0, 0, 0]}
        rotation={[-Math.PI/4, 0, 0]}
      >
        <div className="xr-ui-panel">
          {/* UI content */}
        </div>
      </Html>
    </group>
  </primitive>
</group>
```

### Task 5: Add Device Compatibility Checking

```javascript
// In App.jsx
useEffect(() => {
  // Check XR support
  if ('xr' in navigator) {
    // Check for specific features
    Promise.all([
      navigator.xr.isSessionSupported('immersive-ar'),
      navigator.xr.isSessionSupported('immersive-vr')
    ]).then(([arSupported, vrSupported]) => {
      setCapabilities({
        arSupported,
        vrSupported
      });
    });
  } else {
    setCapabilities({
      arSupported: false,
      vrSupported: false
    });
  }
}, []);
```

## Debug Utilities to Implement

Add this debug module to help troubleshoot XR issues:

```javascript
// src/utils/xrDebug.js
import { useEffect, useState } from 'react';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

export function useXRDebug() {
  const { isPresenting, session } = useXR();
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    if (!isPresenting || !session) return;
    
    // Log session info
    console.log('XR Session:', session);
    console.log('Reference space:', session.referenceSpace);
    
    // Check features
    const features = {
      handTracking: session.supportedFeatures?.includes('hand-tracking'),
      hitTest: session.supportedFeatures?.includes('hit-test'),
      planeDetection: session.supportedFeatures?.includes('plane-detection'),
      depthSensing: session.supportedFeatures?.includes('depth-sensing')
    };
    
    setDebugInfo({
      features,
      sessionMode: session.mode,
      frameRate: session.frameRate,
      referenceSpace: session.referenceSpace?.type || 'none'
    });
    
  }, [isPresenting, session]);
  
  return {
    debugInfo,
    showDebugView: (scene) => {
      if (!scene) return;
      
      // Add debug helpers
      const axesHelper = new THREE.AxesHelper(0.5);
      const gridHelper = new THREE.GridHelper(2, 20);
      
      scene.add(axesHelper);
      scene.add(gridHelper);
      
      return () => {
        scene.remove(axesHelper);
        scene.remove(gridHelper);
      };
    }
  };
}
```
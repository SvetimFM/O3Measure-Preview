import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import useItemHangingState from './hooks/useItemHangingState';
import ItemHangingApp from './features/itemHanging/ItemHangingApp';

// Create XR store
const store = createXRStore({
  granularFeatures: {
    'dom-overlay': true, 
    'hit-test': true, 
    'hand-tracking': true
  }
});

const App = () => {
  const [startScreenVisible, setStartScreenVisible] = useState(true);
  const setStatusMessage = useItemHangingState(state => state.setStatusMessage);
  
  const startAR = () => {
    setStartScreenVisible(false);
    setStatusMessage("Starting AR session...");
    store.enterAR();
  };
  
  return (
    <>
      {startScreenVisible && (
        <div id="start-screen" onClick={() => setStartScreenVisible(false)}>
          <h1>O3Measure</h1>
          <p>AR application to help measure and visualize where to hang objects on wall 1s</p>
          
          <div className="instructions">
            <h2>Instructions:</h2>
            <ol>
              <li><strong>Wall Selection:</strong> Place 3 dots on a wall to define its surface</li>
              <li><strong>Object Definition:</strong> Place 3 dots to define your object's dimensions</li>
              <li><strong>Anchor Points:</strong> Place 1-4 dots for mounting points</li>
              <li><strong>Wall Projection:</strong> Drag and position the object visualization on the wall</li>
            </ol>
            <p>Use the UI panel on your left controller and interact with it using your right controller</p>
          </div>
        </div>
      )}
      
      {/* Debug/status information */}
      <div className="status" id="status">Ready to initialize XR</div>
      
      {/* Main AR Button */}
      <button 
        className="main-ar-button" 
        onClick={startAR} 
        style={{
          display: startScreenVisible ? 'none' : 'block'
        }}
      >
        START AR EXPERIENCE
      </button>
      
      {/* 3D Canvas */}
      <Canvas>
        <XR store={store}>
          {/* Scene lighting */}
          <ambientLight intensity={1.5} />
          <hemisphereLight intensity={1} position={[0.5, 1, 0.25]} />
          
          {/* Main AR Application */}
          <ItemHangingApp />
          
          {/* Default cube to ensure scene renders in non-XR mode */}
          <mesh position={[0, 1.5, -3]}>
            <boxGeometry />
            <meshStandardMaterial color="#3366ff" />
          </mesh>
        </XR>
      </Canvas>
      
      {/* XR overlay for UI */}
      <div id="ui-overlay"></div>
    </>
  );
};

export default App;
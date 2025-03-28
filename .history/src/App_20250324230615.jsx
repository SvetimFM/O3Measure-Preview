import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import useItemHangingState from './hooks/useItemHangingState';
import ItemHangingApp from './features/itemHanging/ItemHangingApp';

// Create XR store
const store = createXRStore();

const App = () => {
  const [startScreenVisible, setStartScreenVisible] = useState(true);
  const setStatusMessage = useItemHangingState(state => state.setStatusMessage);
  
  // Function to start AR experience
  const startAR = () => {
    setStartScreenVisible(false);
    setStatusMessage("Starting AR session...");
    store.enterAR();
  };
  
  // Add startXR to window object for HTML button access
  useEffect(() => {
    window.startXR = startAR;
    
    // Clean up function
    return () => {
      window.startXR = undefined;
    };
  }, []); // Empty dependency array to run only once
  
  return (
    <>
      {startScreenVisible && (
        <div id="start-screen" onClick={() => setStartScreenVisible(false)}>
          <h1>O3Measure</h1>
          <p>AR application to help measure and visualize where to hang objects on walls</p>
          
          <div className="instructions">
            <h2>Instructions:</h2>
            <ol>
              <li><strong>Wall Selection:</strong> Placesdsad 3 dots on a wall to define its surface</li>
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
      
      {/* AR Buttons - only show when start screen is hidden */}
      {!startScreenVisible && (
        <>
          <button className="main-ar-button" onClick={startAR}>
            START AR EXPERIENCE
          </button>
          
          <button id="fallback-xr-button" className="xr-button" onClick={startAR}>
            ENTER AR
          </button>
        </>
      )}
      
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
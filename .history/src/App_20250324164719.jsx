import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ARButton, XR, createXRStore } from '@react-three/xr';
import { Environment } from '@react-three/drei';
import { AppStateProvider } from './context/AppStateContext';
import { ItemHangingApp } from './features/itemHanging/ItemHangingApp';
import { TestComponent } from './components/TestComponent';

// Create an XR store
const xrStore = createXRStore({
  controller: true,  // Enable controllers
  hand: true,        // Enable hand tracking
});

export default function App() {
  const [showTest, setShowTest] = useState(true);
  
  useEffect(() => {
    // After 5 seconds, switch to the main app
    const timer = setTimeout(() => {
      setShowTest(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      <ARButton 
        sessionInit={{ 
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay', 'hand-tracking'],
          domOverlay: { root: document.getElementById('ui-overlay') }
        }}
        store={xrStore}
      />
      
      <Canvas>
        <XR
          store={xrStore}
          referenceSpace="local-floor"
        >
          <Suspense fallback={null}>
            <Environment preset="sunset" />
          </Suspense>
          
          <ambientLight intensity={1.5} />
          <hemisphereLight intensity={1} position={[0.5, 1, 0.25]} />
          
          {showTest ? (
            <TestComponent />
          ) : (
            <AppStateProvider>
              <ItemHangingApp />
            </AppStateProvider>
          )}
        </XR>
      </Canvas>
    </>
  );
}
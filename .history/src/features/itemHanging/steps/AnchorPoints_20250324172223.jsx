import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useControllerInput } from '../../../hooks/useControllerInput';
import { useCustomHitTest } from '../../../hooks/useCustomHitTest';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/ui/Button';
import { TextMesh } from '../../../components/ui/TextMesh';
import { AnchorMarker } from '../../../components/three/markers/AnchorMarker';
import { ObjectMarker } from '../../../components/three/markers/ObjectMarker';
import { ControllerRay } from '../../../components/three/controllers/ControllerRay';

export function AnchorPoints({ 
  objectPoints,
  objectDimensions,
  anchorPoints, 
  setAnchorPoints, 
  onNext, 
  onReset 
}) {
  const [hitPoint, setHitPoint] = useState(null);
  const rightController = useControllerInput('right', {
    onSelect: () => addAnchorPoint(),
  });
  const leftController = useControllerInput('left');
  const panelRef = useRef();
  
  // UI panel follows left controller
  useFrame(() => {
    if (leftController && leftController.controller && panelRef.current) {
      // Position panel above and in front of left controller
      const position = new Vector3().copy(leftController.controller.position);
      position.y += 0.1;
      
      const direction = new Vector3(0, 0, -1).applyQuaternion(leftController.controller.quaternion);
      direction.multiplyScalar(0.2);
      position.add(direction);
      
      panelRef.current.position.copy(position);
      panelRef.current.quaternion.copy(leftController.controller.quaternion);
    }
  });
  
  // Hit testing for placing anchor points
  useCustomHitTest(position => {
    setHitPoint(position);
  });
  
  const addAnchorPoint = () => {
    if (hitPoint && anchorPoints.length < 4) {
      setAnchorPoints([...anchorPoints, hitPoint.clone()]);
    }
  };
  
  const handlePanelDrag = (newPosition) => {
    if (panelRef.current) {
      panelRef.current.position.copy(newPosition);
    }
  };
  
  return (
    <>
      {/* Show the object points */}
      {objectPoints.map((point, index) => (
        <ObjectMarker key={`object-${index}`} position={point} />
      ))}
      
      {/* Anchor markers */}
      {anchorPoints.map((point, index) => (
        <AnchorMarker key={`anchor-${index}`} position={point} />
      ))}
      
      {/* Controller ray */}
      {rightController && rightController.controller && (
        <group position={rightController.controller.position}>
          <ControllerRay />
        </group>
      )}
      
      {/* Floating UI panel */}
      <group ref={panelRef}>
        <Panel width={0.25} height={0.3} onDrag={handlePanelDrag}>
          <TextMesh
            text="Step 3: Anchor Points"
            position={[0, 0.12, 0.001]}
            size={0.022}
          />
          <TextMesh
            text="Place 1-4 anchor points for mounting"
            position={[0, 0.08, 0.001]}
            size={0.014}
          />
          <TextMesh
            text={`Points placed: ${anchorPoints.length}/4`}
            position={[0, 0.04, 0.001]}
            size={0.014}
          />
          
          <TextMesh
            text={`Object: ${objectDimensions.width}" × ${objectDimensions.height}"`}
            position={[0, 0.0, 0.001]}
            size={0.014}
          />
          
          <Button
            text="Next"
            onClick={onNext}
            position={[0, -0.07, 0.001]}
            disabled={anchorPoints.length < 1}
          />
          <Button
            text="Reset"
            onClick={onReset}
            position={[0, -0.12, 0.001]}
            backgroundColor={0xcc3333}
          />
        </Panel>
      </group>
    </>
  );
}
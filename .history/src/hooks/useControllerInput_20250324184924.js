

import { useXR } from '@react-three/xr';
import { useEffect, useCallback, useRef, useMemo } from 'react';

export function useControllerInput(hand = 'right', { onSelect, onSelectEnd, onSqueeze, onSqueezeEnd } = {}) {
  // Get all controller states
  const inputSourceStates = useXR(state => state.inputSourceStates);
  const eventsAttached = useRef(false);
  
  // Find the controller matching the requested hand
  const controller = useMemo(() => {
    if (!inputSourceStates) return null;
    
    return inputSourceStates.find(state => 
      state.type === 'controller' && 
      state.inputSource && 
      state.inputSource.handedness === hand
    );
  }, [inputSourceStates, hand]);
  
  const handleSelect = useCallback((event) => {
    if (onSelect) onSelect(event);
  }, [onSelect]);
  
  const handleSelectEnd = useCallback((event) => {
    if (onSelectEnd) onSelectEnd(event);
  }, [onSelectEnd]);
  
  const handleSqueeze = useCallback((event) => {
    if (onSqueeze) onSqueeze(event);
  }, [onSqueeze]);
  
  const handleSqueezeEnd = useCallback((event) => {
    if (onSqueezeEnd) onSqueezeEnd(event);
  }, [onSqueezeEnd]);
  
  useEffect(() => {
    if (controller && controller.controller && !eventsAttached.current) {
      try {
        controller.controller.addEventListener('selectstart', handleSelect);
        controller.controller.addEventListener('selectend', handleSelectEnd);
        controller.controller.addEventListener('squeezestart', handleSqueeze);
        controller.controller.addEventListener('squeezeend', handleSqueezeEnd);
        
        eventsAttached.current = true;
        
        return () => {
          controller.controller.removeEventListener('selectstart', handleSelect);
          controller.controller.removeEventListener('selectend', handleSelectEnd);
          controller.controller.removeEventListener('squeezestart', handleSqueeze);
          controller.controller.removeEventListener('squeezeend', handleSqueezeEnd);
          eventsAttached.current = false;
        };
      } catch (err) {
        console.error('Error attaching controller events:', err);
      }
    }
  }, [controller, handleSelect, handleSelectEnd, handleSqueeze, handleSqueezeEnd]);
  
  return controller;
}
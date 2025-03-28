/**
 * O3Measure - Constants and Enums
 * This file contains constants, enums, and configuration values used throughout the application
 */

// A-Frame hand gesture types
export const HandGesture = Object.freeze({
  // Base gestures
  NONE: 'none',
  POINTING: 'pointing',      // Index finger extended
  PINCHING: 'pinching',      // Thumb and index finger together
  GRIPPING: 'gripping',      // All fingers closed
  OPEN: 'open',              // All fingers extended
  
  // A-Frame built-in gestures (from hand-tracking-controls)
  THUMB_UP: 'thumb-up',      // Thumb pointed up, fingers closed
  THUMB_DOWN: 'thumb-down',  // Thumb pointed down, fingers closed
  ROCK: 'rock',              // Index and pinky extended
  SCISSORS: 'scissors',      // Index and middle fingers extended
  PAPER: 'paper',            // All fingers extended (same as OPEN)
  
  // Custom gesture states (from enhanced-controller)
  TRACKING_LOST: 'tracking-lost'
});

// AR modes
export const ARMode = Object.freeze({
  DESKTOP: 'desktop',
  AR: 'ar'
});

// Application states
export const AppState = Object.freeze({
  INITIALIZING: 'initializing',
  READY: 'ready',
  AR_ACTIVE: 'ar-active',
  MEASURING: 'measuring',
  ERROR: 'error'
});

// Color constants
export const Colors = Object.freeze({
  PRIMARY: '#15ACCF',
  SECONDARY: '#118A7E',
  WARNING: '#FF7700',
  ERROR: '#FF3333',
  SUCCESS: '#44CC44'
});

// Debug levels
export const DebugLevel = Object.freeze({
  NONE: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
  DEBUG: 4,
  VERBOSE: 5
});
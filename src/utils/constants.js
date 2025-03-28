/**
 * O3Measure - Constants and Enums
 * This file contains constants, enums, and configuration values used throughout the application
 */

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
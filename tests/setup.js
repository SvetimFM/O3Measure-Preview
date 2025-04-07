import { beforeAll } from 'vitest';
import * as THREE from 'three';

// This is a critical setup file for mocking A-Frame and THREE.js globals
beforeAll(() => {
  // Use the actual THREE.js library
  global.THREE = THREE;
  
  // Create mock AFRAME global with THREE reference
  global.AFRAME = {
    THREE: THREE, // Critical: this makes THREE available via AFRAME.THREE
    registerComponent: vi.fn((name, definition) => {
      global.AFRAME.components = global.AFRAME.components || {};
      global.AFRAME.components[name] = definition;
    }),
    registerSystem: vi.fn((name, definition) => {
      global.AFRAME.systems = global.AFRAME.systems || {};
      global.AFRAME.systems[name] = definition;
    }),
    components: {},
    systems: {},
    scenes: []
  };
  
  // Make sure window globals exist for browser environment simulation
  global.window = global.window || {};
  global.window.AFRAME = global.AFRAME;
  global.window.THREE = global.THREE;
  
  // Basic document mock if not provided by jsdom
  global.document = global.document || {
    createElement: vi.fn(() => ({
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      }
    })),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => [])
  };
});
# A-Frame Documentation Overview

This folder contains comprehensive documentation for A-Frame, a web framework for building virtual reality (VR) and augmented reality (AR) experiences.

## Core API (core-api-info/)
Documentation of A-Frame's foundational elements including entities, components, systems, scenes, asset management, and global APIs. These files explain the architecture and basic building blocks of A-Frame applications.

## Controllers (controller-info/)
Information about various controller and interaction components including AR hit testing, item anchoring, hand controls, and laser-based raycasting. These components enable user input and interaction with virtual objects in AR/VR.

## Scene Configuration (scene-config-info/)
Documentation covering visual and performance aspects of A-Frame scenes including camera controls, geometry rendering, object materials, and object pooling. These files explain how to configure and optimize the visual appearance and performance of A-Frame scenes.

## UI Elements (ui-info/)
Contains documentation for user interface components in A-Frame. Currently includes information on text rendering with signed distance field (SDF) fonts for creating legible text in 3D environments.

## Key Files by Category

### Core API
- **entity.md**: Explains A-Frame entities as foundational objects that components attach to
- **component.md**: Details components as reusable modules adding appearance and functionality
- **system.md**: Outlines systems providing global scope and services to components
- **scene.md**: Documents the scene element as the global root object handling WebXR boilerplate
- **asset-management.md**: Explains asset preloading and caching
- **globals.md**: Lists global APIs exposed through window.AFRAME

### Controllers
- **ar-hit-test-for-mixed-reality.md**: Component for positioning virtual objects on real surfaces
- **ar-item-anchroring-in-space.md**: Functionality to fix entities in real-world positions
- **hand-controls.md**: Provides tracked hand models with animated gestures
- **laser-controls-raycasting.md**: Component for cross-platform VR input with laser pointers

### Scene Configuration
- **camera-controls-user-viewport.md**: Camera configuration and manipulation
- **geometry-rendering.md**: A-Frame's geometry primitives and customization options
- **object-pooling.md**: Efficient object reuse for performance optimization
- **object-material-configuration.md**: Material properties for object appearances

### UI Elements
- **text-rendering.md**: Text component for rendering SDF font text in 3D environments
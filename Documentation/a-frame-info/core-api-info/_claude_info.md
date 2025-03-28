# A-Frame Core API File Summaries

## entity.md
Explains A-Frame entities (`<a-entity>`) as foundational placeholder objects that components attach to. Covers entity properties, methods, and events, showing how they serve as containers with position/rotation/scale components.

## component.md
Details components as reusable modules adding appearance, behavior, and functionality to entities. Describes component registration, schema definition, lifecycle methods, and implementation patterns for modular A-Frame applications.

## system.md
Outlines systems providing global scope and services to components. Explains system registration, lifecycle methods, and patterns for managing related components from a centralized system.

## scene.md
Documents `<a-scene>` as the global root object inheriting from Entity. Describes how it handles WebVR/WebXR boilerplate, provides VR interaction methods, and supports scene-wide configurations.

## asset-management.md
Explains A-Frame's asset management system for preloading and caching assets using `<a-assets>`. Covers asset type definitions, CORS handling, timeouts, and asset loading events.

## globals.md
Lists global APIs exposed through window.AFRAME, including component/entity prototypes, registration functions, and utility modules. Briefly explains A-Frame usage in Node.js environments.
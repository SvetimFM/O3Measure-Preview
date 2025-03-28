# A-Frame Controller API File Summaries

## ar-hit-test-for-mixed-reality.md
Component that uses WebXR hit-test API to position virtual objects on real-world surfaces. Creates a reticle at the hit point and can automatically size it to match target objects.

## ar-item-anchroring-in-space.md
Provides functionality to fix entities to positions in the real world using the WebXR Anchors module. Supports persistent anchoring that survives page reloads if the entity has an ID.

## hand-controls.md
Component that provides tracked hand models with animated gestures, wrapping both Vive and Meta Touch controls. Supports different hand styles, colors, and emits various events for different hand poses.

## laser-controls-raycasting.md
Higher-order component that provides a tracked controller with laser/ray cursor for cross-platform VR input and interactions. Configures cursor and raycaster components automatically based on connected controller type.
# O3Measure Technical Context

## Technology Stack

### Core Technologies
- **A-Frame**: Framework for building WebXR experiences
- **Three.js**: 3D library (utilized through A-Frame)
- **WebXR API**: Web standard for AR/VR experiences
- **Vite**: Build tool and development server
- **ES Modules**: Modern JavaScript module system

### Development Environment
- **HTTPS**: Required for WebXR development
- **Vite Dev Server**: Local development with hot module replacement
- **Ngrok**: Tunnel for testing on devices
- **Compatible Devices**: Meta Quest headsets, Android with ARCore

## Technical Requirements

### WebXR Requirements
- HTTPS connection for security
- Compatible browser with WebXR support
- Device with AR capabilities
- Spatial tracking for accurate measurements

### Performance Targets
- 60+ FPS on target devices
- Low latency for AR interactions
- Efficient memory usage for mobile devices
- Optimized render performance

### Browser Compatibility
- Meta Quest Browser
- Chrome for Android (with WebXR enabled)
- Mobile Safari (limited support)

## Development Workflow

### Local Development
- Run `npm run dev` to start development server with HTTPS
- Use `npm run dev -- --host` for device testing on local network
- Ngrok available for external device testing

### Coding Standards
- ES Modules for imports
- 2-space indentation
- Single quotes for strings
- Semicolons at end of statements
- camelCase for variables and functions
- PascalCase for Three.js classes (following Three.js convention)

## Technical Constraints

### WebXR Limitations
- Hit testing precision varies by device
- Plane detection quality depends on lighting and textures
- Limited access to native device features
- Different levels of support across browsers

### A-Frame Considerations
- Component-based architecture needs careful planning
- Performance impact of many entities/components
- Limited debugging tools for WebXR
- DOM-based entity creation and manipulation

## Dependencies

### Core Dependencies
- **aframe**: ^1.7.0 - WebXR/VR framework
- **three**: ^0.173.0 - 3D rendering library (used by A-Frame)
- **express**: ^4.21.2 - For potential server functionality

### Development Dependencies
- **vite**: ^6.0.5 - Build system and dev server
- **vite-plugin-mkcert**: ^1.17.6 - HTTPS certificate generation for local development

## Asset Management
- 3D models stored in assets/models
- Textures stored in assets/textures
- Audio files stored in assets/sounds

## Framework Choices

We've decided to use a pure A-Frame approach for this project:

1. **A-Frame Only**: Using A-Frame's native entity-component architecture without React integration
2. **Feature Components**: Creating custom A-Frame components for each feature
3. **Native Event System**: Using A-Frame's event system for component communication
4. **No External State**: Avoiding external state management libraries

This approach aligns better with A-Frame's design principles and simplifies our architecture.

## Build and Deployment
- `npm run build` creates production build
- `npm run preview` previews production build locally
- Production deployment requires HTTPS hosting
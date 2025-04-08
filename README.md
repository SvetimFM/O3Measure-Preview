# O3Measure - WebXR AR Object Hanging Assistant

O3Measure - an AR application that helps users measure and visualize where to hang objects on walls. Using WebXR and React Three Fiber, the application provides an intuitive step-by-step workflow for precise object placement.

## Features

- Wall selection and measurement
- Object dimensioning
- Anchor point definition
- Visualization of object placement on walls
- Real-time measurements in inches
- Interactive AR UI attached to controllers

## Workflow Steps

1. **Wall Selection**: Place dots to define a wall plane
2. **Object Definition**: Mark dimensions by placing dots at corners
3. **Anchor Selection**: Define mounting points on the object
4. **Wall Projection**: Visualize and position object on the wall

## Technology Stack

- A-Frame for WebXR and 3D rendering
- Three.js (through A-Frame) for 3D math and operations
- Vite for build and development
- Vitest for unit testing

## Development

### Prerequisites

- Node.js and npm
- XR-capable device for testing (Meta Quest, ARCore Android, etc.)

### Running Locally

```bash
# Install dependencies
npm install

# Start development server with HTTPS
npm run dev

# Start development server on LAN (for device testing)
npm run dev -- --host
```

### Testing

The project uses Vitest for testing, with specialized setup for testing A-Frame and WebXR components.

```bash
# Run all unit tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run specific test groups
npm run test:utils      # Test utility functions
npm run test:components # Test A-Frame components
npm run test:state      # Test state management
npm run test:webxr      # Test WebXR integration
```

Tests are organized to mirror the project structure and include:
- Pure utility function tests
- A-Frame component lifecycle tests
- WebXR integration tests
- State management tests

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Future Improvements

The following refactoring opportunities have been identified to improve code quality and maintainability:

1. **Split Large Components:**
   - Refactor anchor-placement.js (860+ lines) into smaller, focused components

2. **Simplify Menu Navigation:**
   - Replace large switch statement in menu-manager.js with data-driven navigation

3. **Optimize DOM Manipulation:**
   - Improve wall-plane.js grid pattern creation using single entity with custom shader

4. **Streamline UI Panel Creation:**
   - Simplify panel creation process in menu-manager.js using A-Frame templating

5. **Standardize Event Handling:**
   - Create consistent event structure for anchor status reporting

6. **Reduce Code Duplication:**
   - Extract common utility function for object lookup in anchor-placement.js

7. **Optimize Vector Conversions:**
   - Reduce redundant conversions in geometry.js functions

8. **Improve Laser Control Logic:**
   - Refactor complex laser control setup into separate component

9. **Simplify State Management:**
   - Replace large switch statement in wall-plane.js with declarative state mapping

10. **Separate Menu Concerns:**
    - Decouple menu stack management from rendering logic

## XR Device Support

- Meta Quest headsets in developer mode
- Android devices with ARCore support (using Chrome)
- Limited support for iOS/Safari

## Browser Requirements

- WebXR-compatible browser
- HTTPS connection (required for WebXR)

## License

Dis Is Ours (TM) License

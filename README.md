# O3Measure - WebXR AR Object Hanging Assistant

O3Measure is an AR application that helps users measure and visualize where to hang objects on walls. Using WebXR and React Three Fiber, the application provides an intuitive step-by-step workflow for precise object placement.

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

- React with [react-three-fiber](https://github.com/pmndrs/react-three-fiber)
- WebXR through [@react-three/xr](https://github.com/pmndrs/react-xr)
- Three.js for 3D rendering
- Vite for build and development

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

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## XR Device Support

- Meta Quest headsets in developer mode
- Android devices with ARCore support (using Chrome)
- Limited support for iOS/Safari

## Browser Requirements

- WebXR-compatible browser
- HTTPS connection (required for WebXR)

## License

MIT License
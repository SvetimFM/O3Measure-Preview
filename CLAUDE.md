# O3Measure Project - Guidelines for Claude

## Build Commands
- `npm run dev` - Start development server with HTTPS
- `npm run build` - Build for production 
- `npm run preview` - Preview production build locally
- `npm run dev -- --host` - Start dev server on LAN for device testing

## Testing
- Device testing requires Quest headset in developer mode
- Use Chrome browser on Android for WebXR testing
- iOS/Safari currently has limited WebXR support

## Code Style Guidelines

### General
- ES Modules for imports (`import * as X from 'y'`)
- 2-space indentation
- Single quotes for strings
- Semicolons at end of statements
- Use sections with comment headers (`// ---------- SECTION NAME ----------`)

### Naming Conventions
- camelCase for variables, functions, and methods
- UPPERCASE for constants
- PascalCase for classes and constructors (from Three.js convention)

### JavaScript Practices
- Group related variables at top of file or function scope
- Use const/let appropriately (prefer const when possible)
- State management through explicit state object patterns
- Use descriptive variable names that indicate purpose and type
- Organize code into logical sections with comments

### Three.js Conventions
- Initialize all 3D objects in the init() function
- Use meaningful names for meshes, materials, and geometry
- Handle user interaction in dedicated event handler functions
- Keep animation loop logic minimal and focused
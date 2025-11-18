# O3Measure - Hand Tracking AR Measuring Tool

![IMG_4434](https://github.com/user-attachments/assets/f8905643-c1e6-4ff1-adbb-558aca942d1e)


> **✅ Production Ready**: O3Measure is now production-ready with enterprise-grade features for professional spatial measurement on Meta Quest devices.

[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/SvetimFM/O3Measure-Preview)
[![Bundle Size](https://img.shields.io/badge/bundle-205KB%20gzipped-success.svg)](https://github.com/SvetimFM/O3Measure-Preview)

O3Measure is a **production-ready WebXR application** for Meta Quest devices that transforms spatial measurement with cutting-edge hand tracking, modern 3D UI, professional export capabilities, and persistent AR anchoring.

## ✨ Key Features

### 📏 **Professional Measurement System**
*   **Modern Spatial Display**: Crisp SDF text rendering with Troika-Three-Text
*   **Multi-Unit Support**: Metric (m/cm/mm) ↔ Imperial (ft/in) with auto-conversion
*   **CAD-Style Visualization**: Professional dimension lines, arrows, and grid overlays
*   **Rectangle Measurement**: 3-point definition with width × height × area calculations
*   **Point-to-Point Distance**: Flexible distance measurement between any points
*   **Angle Measurement**: 3-point angle measurement in degrees
*   **Measurement Templates**: 30+ pre-defined templates (furniture, rooms, appliances)

### 💾 **Enterprise Data Management**
*   **WebXR Spatial Anchors**: Persistent measurements across sessions using WebXR Anchors API
*   **Dual Storage**: localStorage + IndexedDB with auto-migration
*   **Auto-Save**: Configurable auto-save every 30 seconds
*   **Multi-Format Export**:
  - **JSON**: Complete project data with metadata
  - **CSV**: Spreadsheet-compatible tables
  - **PDF**: Professional reports with jsPDF
*   **Cloud-Ready Architecture**: Prepared for cloud sync integration

### 📸 **Documentation & Sharing**
*   **High-Res Screenshots**: Configurable quality (low/medium/high/ultra)
*   **Measurement Annotations**: Overlay measurements on captured photos
*   **Metadata Overlays**: Timestamp, project info, statistics
*   **Branded Exports**: Watermarking and professional formatting

### 🎨 **Modern Spatial UI**
*   **Curved 3D Panels**: Cylindrical panels following field of view
*   **Hand Tracking Integration**: Pinch, poke, grab, and point gestures
*   **Haptic Feedback**: WebXR Gamepad API vibration patterns
*   **Spatial Buttons**: 3D extruded buttons with hover effects
*   **Billboard Labels**: Always face camera for readability

## Requirements

*   WebXR-compatible AR headset (e.g., Meta Quest 3, Quest Pro)
*   Hand tracking support enabled
*   Modern web browser with WebXR support
*   HTTPS connection (required for WebXR)

## Setup

### Development Setup

To run the O3Measure application locally, you will need Node.js and npm installed on your system.

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Start the Development Server:**

    ```bash
    npm run dev
    ```

    The application will be available at `https://localhost:5173` (HTTPS is automatically configured).

3.  **Access from AR Headset:**

    For testing on an AR headset, you have two options:

    **Option A: Local Network (Recommended)**
    ```bash
    npm run dev-host
    ```
    Then access the application using your computer's local IP address from your headset's browser.

    **Option B: Public Tunnel**
    Use a tool like ngrok to create a secure tunnel:
    ```bash
    ngrok http 5173
    ```
    Then use the provided public URL on your headset.

## Usage

![IMG_4436](https://github.com/user-attachments/assets/17d2d602-0c40-4d1a-9f33-f676ea605847)
![IMG_4434](https://github.com/user-attachments/assets/f5ce97f8-fa20-4a24-b799-a8b16b79fc21)
![IMG_4437](https://github.com/user-attachments/assets/0300e23e-bccb-42cb-9b86-ee6ccd92e0ae)
![IMG_4435](https://github.com/user-attachments/assets/088bc961-6b53-4d91-8f2a-1ca2a491d303)

To use the O3Measure application, you will need a WebXR-compatible headset with hand tracking capabilities.

1.  **Open the Application:**

    Open the public URL provided by `ngrok` in the browser of your headset.

2.  **Enter AR Mode:**

    Click the "Start AR" button to enter augmented reality mode.

3.  **Calibrate the Wall:**

    *   The main menu will appear in front of you. Select "Wall Calibration" to begin the calibration process.
    *   Follow the on-screen instructions to align the virtual wall with a physical wall in your environment.

4.  **Define an Object:**


    *   Once the wall is calibrated, you can define objects by selecting "Object Definition" from the main menu.
    *   Use your hands to draw a rectangle on the calibrated wall to define the object.

5.  **Place Anchors:**

    *   After defining an object, you can place anchors on it to create a more accurate representation of its position and orientation.
    *   Select "Anchor Placement" from the main menu and follow the on-screen instructions to place the anchors.

6.  **View Objects:**

    *   You can view a list of all defined objects and their properties by selecting "View Objects" from the main menu.
    *   Drag the object into position and add mount points where the targets are 

## Production Deployment

O3Measure is **production-ready** for Meta Quest devices! 🚀

### Production Features

✅ **PWA Support** - Installable as a Progressive Web App
✅ **Offline Capability** - Service worker for offline functionality
✅ **Performance Optimized** - Optimized build with code splitting and minification
✅ **Error Handling** - Comprehensive error tracking and logging
✅ **Security Headers** - Production-grade security configuration
✅ **Meta Quest Optimized** - Foveated rendering and performance monitoring

### Quick Deploy

```bash
# Install dependencies
npm install

# Generate icons (or use online tool)
npm run generate-icons:convert

# Build for production
npm run build:prod

# Preview production build
npm run preview:prod

# Deploy dist/ folder to your hosting service
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Supported Hosting Platforms

- **Netlify** (Recommended) - Automatic HTTPS and CDN
- **Vercel** - Edge network deployment
- **GitHub Pages** - Free hosting with custom domain
- **Custom Server** - NGINX/Apache configurations provided

## Project Status

This is **version 0.1.0** - production-ready for Meta Quest devices! The application is fully functional and optimized for AR experiences. We welcome feedback and bug reports!

### Roadmap

- [ ] Controller support (currently hand tracking only)
- [ ] Multi-wall calibration
- [ ] Non-rectangular object shapes
- [ ] Save/load functionality
- [ ] Measurement history
- [ ] Export capabilities

## Contributing

Please see our [Contributing Guidelines](CONTRIBUTING.md) for details. Note that due to the current CC BY-NC-ND 4.0 license, code modifications are restricted in this preview release.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [A-Frame](https://aframe.io/) WebXR framework
- Hand tracking powered by WebXR Device API
- UI components using aframe-slice9-component

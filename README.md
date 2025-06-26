# O3Measure - Hand Tracking AR Measuring Tool

> **🚧 Preview Release**: This is an early preview version of O3Measure. Features are still in development and may change. Please report any issues you encounter!

[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)

O3Measure is a WebXR application designed for **augmented reality (AR) headsets with hand tracking** that allows users to measure and define objects in their physical environment using hand tracking. The application provides a user-friendly interface for calibrating walls, defining objects, and placing anchors to create accurate digital representations of physical objects.

## Features

*   **Wall Calibration:** Calibrate a virtual wall to align with a physical wall in your environment.
*   **Object Definition:** Define objects by creating rectangles on the calibrated wall.
*   **Anchor Placement:** Place anchors on defined objects to create a more accurate representation of the object's position and orientation.
*   **Object Viewing:** View a list of all defined objects and their properties.
*   **Hand Tracking:** Interact with the application using hand gestures.

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

## Project Status

This is a **preview release** (v0.1.0). The application is functional but still under active development. We welcome feedback and bug reports!

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
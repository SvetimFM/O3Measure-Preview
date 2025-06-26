# O3Measure - Hand Tracking AR Measuring Tool

O3Measure is a WebXR application designed for **augmented reality (AR) headsets with hand tracking** that allows users to measure and define objects in their physical environment using hand tracking. The application provides a user-friendly interface for calibrating walls, defining objects, and placing anchors to create accurate digital representations of physical objects.

## Features

*   **Wall Calibration:** Calibrate a virtual wall to align with a physical wall in your environment.
*   **Object Definition:** Define objects by creating rectangles on the calibrated wall.
*   **Anchor Placement:** Place anchors on defined objects to create a more accurate representation of the object's position and orientation.
*   **Object Viewing:** View a list of all defined objects and their properties.
*   **Hand Tracking:** Interact with the application using hand gestures.

## Setup

To run the O3Measure application, you will need to have Node.js and npm installed on your system. You will also need to use a tool like `ngrok` to create a secure tunnel to your local server. This is necessary because WebXR has strict CORS (Cross-Origin Resource Sharing) policies that prevent you from accessing local servers directly.

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Start Ngrok:**

    Open a new terminal window and run the following command to create a secure tunnel to your local server on port 3000:

    ```bash
    ngrok http 5173
    ```

    This will provide you with a public URL that you can use to access the application from your headset.

3.  **Start the Development Server:**

    In a separate terminal window, run the following command to start the development server:

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

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

## Contributing

Contributions are welcome! If you have any suggestions or find any issues, please open an issue or submit a pull request.
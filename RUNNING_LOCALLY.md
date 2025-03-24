# Running O3Measure Locally

## Setup and Installation

1. **Prerequisites**
   - Node.js (v14+ recommended)
   - npm (included with Node.js)
   - A device that supports WebXR (Meta Quest, Android with ARCore, etc.)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development Server**
   ```bash
   # Start with HTTPS on localhost
   npm run dev
   
   # Start on your local network (for device testing)
   npm run dev -- --host
   ```

## Testing on Devices

### Using ngrok for Secure Tunneling (Recommended)

[ngrok](https://ngrok.com/) creates secure tunnels to your localhost, bypassing CORS issues and allowing easy testing on devices.

1. **Install ngrok**
   - Sign up for a free account at [ngrok.com](https://ngrok.com/)
   - Download and install ngrok
   - Set up your authtoken: `ngrok config add-authtoken YOUR_TOKEN`

2. **Start your local server**
   ```bash
   npm run dev
   ```

3. **Create a tunnel with ngrok**
   ```bash
   # For HTTP (port 5173 is Vite's default)
   ngrok http 5173
   
   # For HTTPS (required for WebXR)
   ngrok http https://localhost:5173
   ```

4. **Access from any device**
   - ngrok will provide a public URL (e.g., `https://abc123.ngrok.io`)
   - Open this URL on your AR-capable device
   - No certificate warnings, no CORS issues!

### Meta Quest / Quest Pro / Quest 3

1. Enable Developer Mode on your Quest headset:
   - In the Meta Quest mobile app, navigate to Devices → Your Headset → Developer Mode and enable it
   - Restart your headset

2. Access the app from your headset:
   - Open the Quest browser
   - Navigate to your ngrok URL, or
   - If using direct LAN access: `https://YOUR_IP_ADDRESS:PORT` (e.g., `https://192.168.1.100:5173`)
   - Accept any security certificate warning (for direct LAN access)
   - Click "Enter AR" button to start the experience

### Android Devices

1. Use Google Chrome browser (best WebXR support)
2. Navigate to your ngrok URL or development server URL
3. Allow permissions when prompted
4. Enter AR mode

## Troubleshooting

### Certificate Issues
- The app uses self-signed certificates for HTTPS (required for WebXR)
- Using ngrok bypasses certificate warnings
- If accessing directly and still having issues, try:
  ```bash
  # Generate new certificates
  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
  ```

### Network Issues
- Make sure your development machine and testing device are on the same network (for direct LAN access)
- If using ngrok, devices can be on different networks
- Check for firewalls that might block local connections
- Try disabling VPNs temporarily

### CORS Issues
- WebXR API requires secure contexts (HTTPS) which can lead to CORS errors
- Using ngrok resolves most CORS-related problems
- For direct access, make sure your development server is configured to allow necessary CORS headers

### WebXR Support
- Not all browsers support WebXR (particularly iOS Safari)
- Chrome on Android provides the best mobile support
- For Quest, use the built-in browser

## Building for Production

```bash
# Build optimized version
npm run build

# Preview production build locally
npm run preview
```

The production build will be in the `dist` directory, which can be deployed to a web server.
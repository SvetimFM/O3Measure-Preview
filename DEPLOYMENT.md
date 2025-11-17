# O3Measure - Production Deployment Guide

This guide provides instructions for deploying O3Measure to production on Meta Quest devices.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building for Production](#building-for-production)
- [Deployment Options](#deployment-options)
- [Meta Quest Requirements](#meta-quest-requirements)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- All dependencies installed (`npm install`)
- HTTPS hosting (required for WebXR)
- Custom domain (recommended) or hosting provider subdomain

## Building for Production

### 1. Generate Icons

First, generate proper app icons from the SVG template:

```bash
# Option 1: Use an online tool (Recommended)
# Visit https://realfavicongenerator.net/
# Upload public/icons/icon.svg
# Download and extract to public/icons/

# Option 2: Use sharp (if installed)
npm install sharp
npm run generate-icons:convert

# Option 3: Create placeholders (for testing only)
npm run generate-icons
```

### 2. Configure Environment

Create a `.env.production` file (already provided):

```bash
cp .env.example .env.production
```

Update any necessary configuration values.

### 3. Build the Application

```bash
# Production build
npm run build:prod

# The output will be in the dist/ folder
```

### 4. Test Production Build Locally

```bash
# Preview the production build
npm run preview:prod

# Access at https://localhost:4173
# Test on Meta Quest by accessing your local IP
```

## Deployment Options

### Option 1: Netlify (Recommended)

Netlify provides excellent support for static sites with HTTPS.

1. **Connect Repository**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Initialize
   netlify init
   ```

2. **Configure Build Settings**
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
   - Node version: 18+

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Custom Domain**
   - Add custom domain in Netlify dashboard
   - HTTPS is automatically configured

### Option 2: Vercel

Similar to Netlify, Vercel offers seamless deployment:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure**
   - Build command: `npm run build:prod`
   - Output directory: `dist`

### Option 3: GitHub Pages

For free hosting with custom domain support:

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**
   ```json
   "deploy": "npm run build:prod && gh-pages -d dist"
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Configure**
   - Enable HTTPS in repository settings
   - Add custom domain if desired

### Option 4: Custom Server (Advanced)

If hosting on your own server:

1. **Build the app**
   ```bash
   npm run build:prod
   ```

2. **Upload dist/ folder to server**

3. **Configure NGINX** (example):
   ```nginx
   server {
       listen 443 ssl http2;
       server_name o3measure.app;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       root /var/www/o3measure/dist;
       index index.html;

       # Security Headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;

       # CSP for WebXR
       add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://aframe.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self';" always;

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # No cache for service worker
       location = /sw.js {
           add_header Cache-Control "no-cache, no-store, must-revalidate";
       }

       # SPA fallback
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Apache Configuration** (alternative):
   ```apache
   <VirtualHost *:443>
       ServerName o3measure.app
       DocumentRoot /var/www/o3measure/dist

       SSLEngine on
       SSLCertificateFile /path/to/cert.pem
       SSLCertificateKeyFile /path/to/key.pem

       # Security Headers
       Header always set X-Frame-Options "SAMEORIGIN"
       Header always set X-Content-Type-Options "nosniff"
       Header always set X-XSS-Protection "1; mode=block"

       # Cache Control
       <FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$">
           Header set Cache-Control "public, max-age=31536000, immutable"
       </FilesMatch>

       # No cache for service worker
       <Files "sw.js">
           Header set Cache-Control "no-cache, no-store, must-revalidate"
       </Files>

       # SPA fallback
       <Directory /var/www/o3measure/dist>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted

           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>
   </VirtualHost>
   ```

## Meta Quest Requirements

### Device Compatibility

- **Meta Quest 3** (Recommended)
- **Meta Quest Pro**
- **Meta Quest 2** (Supported)

### Browser Requirements

- Use the native **Meta Quest Browser**
- Ensure browser is updated to the latest version
- Hand tracking must be enabled in Quest settings

### Testing on Meta Quest

1. **Enable Developer Mode** (optional but recommended)
   - Install Meta Quest Developer Hub on PC
   - Enable developer mode for advanced debugging

2. **Access the App**
   ```
   https://your-domain.com
   ```

3. **Enable Hand Tracking**
   - Go to Settings → Hands and Controllers
   - Enable Hand Tracking

4. **Launch AR Mode**
   - Open the app in Meta Quest Browser
   - Click "Start AR"
   - Follow on-screen instructions

### Performance Optimization

For best performance on Meta Quest:

- Enable foveated rendering (already configured)
- Keep draw calls under 100
- Optimize textures (use compressed formats)
- Limit triangle count
- Test on actual device, not just desktop

## Post-Deployment

### 1. Verify Deployment

Check the following:

- [ ] HTTPS is working
- [ ] Icons load correctly
- [ ] Service worker registers
- [ ] PWA is installable
- [ ] WebXR features work on Meta Quest
- [ ] Hand tracking is responsive
- [ ] No console errors

### 2. Test on Meta Quest

- [ ] Open app in Meta Quest Browser
- [ ] Enter AR mode successfully
- [ ] Hand tracking works smoothly
- [ ] UI is readable and accessible
- [ ] Performance is smooth (60 FPS target)
- [ ] All menus function correctly

### 3. Monitor Performance

- Check browser console for performance warnings
- Monitor FPS (should maintain 60+ FPS)
- Watch for memory leaks during extended sessions
- Test battery usage

### 4. Analytics (Optional)

Consider adding analytics:

```javascript
// Add to src/utils/analytics.js
// Example: Google Analytics, Plausible, or custom solution
```

### 5. Error Tracking (Optional)

Set up error tracking:

```bash
# Install Sentry (example)
npm install @sentry/browser

# Configure in src/utils/error-handler.js
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSP properly set
- [ ] No sensitive data in client code
- [ ] Dependencies up to date
- [ ] Service worker scoped correctly

## Troubleshooting

### WebXR Not Working

- Ensure HTTPS is enabled
- Check that WebXR features are supported on the device
- Verify browser is up to date
- Check browser console for errors

### Hand Tracking Not Detected

- Enable hand tracking in Quest settings
- Ensure proper lighting conditions
- Check for JavaScript errors
- Verify WebXR permissions

### Performance Issues

- Check FPS in performance monitor
- Reduce draw calls
- Optimize textures and models
- Enable foveated rendering
- Check memory usage

### PWA Not Installing

- Verify manifest.webmanifest is accessible
- Check icons are properly generated
- Ensure HTTPS is working
- Review service worker registration

### Build Failures

```bash
# Clear cache and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build:prod
```

## Update Checklist

When releasing updates:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Test on Meta Quest
4. Build production bundle
5. Deploy to hosting
6. Verify service worker updates
7. Test on device
8. Announce update

## Support

For issues or questions:

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Read the [README.md](README.md)
- Review [CONTRIBUTING.md](CONTRIBUTING.md)

## Additional Resources

- [Meta Quest Developer Documentation](https://developers.meta.com/horizon/documentation/web/)
- [WebXR Device API](https://immersiveweb.dev/)
- [A-Frame Documentation](https://aframe.io/docs/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

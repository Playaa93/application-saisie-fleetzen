# PWA Setup Guide - Field Agents Application

## Overview

The Field Agents application is configured as a Progressive Web App (PWA) that can be installed on Android and iOS smartphones for offline-capable, app-like experience.

## Features

### Core PWA Capabilities
- **Installable**: Add to home screen on Android and iOS
- **Offline Support**: Service worker caches assets for offline use
- **App-like Experience**: Standalone display mode without browser UI
- **Push Notifications**: Support for background notifications
- **Background Sync**: Automatic data synchronization when online

### Technical Configuration
- **App Name**: "Agents Terrain - Field Agents App"
- **Short Name**: "Field Agents"
- **Theme Color**: `#2563eb` (Blue)
- **Background Color**: `#ffffff` (White)
- **Display Mode**: Standalone
- **Orientation**: Portrait-primary

## Installation Instructions

### For Android Users

1. **Open the app in Chrome browser**
   - Navigate to your app URL (e.g., `https://your-domain.com`)

2. **Install the app**
   - Tap the menu icon (three dots) in Chrome
   - Select "Add to Home screen" or "Install app"
   - Confirm the installation

3. **Alternative method**
   - Look for the install banner at the bottom of the screen
   - Tap "Install" when prompted

4. **Launch the app**
   - Find "Field Agents" icon on your home screen
   - Tap to launch in standalone mode

### For iOS Users

1. **Open the app in Safari browser**
   - Navigate to your app URL
   - **Note**: PWA installation only works in Safari on iOS

2. **Add to Home Screen**
   - Tap the Share button (square with arrow pointing up)
   - Scroll down and tap "Add to Home Screen"
   - Edit the name if desired (default: "Field Agents")
   - Tap "Add" in the top right

3. **Launch the app**
   - Find "Field Agents" icon on your home screen
   - Tap to launch

## App Icons

The following icon sizes are configured:

- **72x72**: Badge icon
- **96x96**: Small devices
- **128x128**: Standard mobile
- **144x144**: High-DPI mobile
- **152x152**: iOS devices
- **192x192**: Android (required)
- **384x384**: High-res displays
- **512x512**: Splash screens (required)

### Icon Requirements

All icons should:
- Be PNG format
- Have transparent or white background
- Be placed in `/public/icons/` directory
- Follow the naming convention: `icon-{size}.png`

### Generating Icons

You can generate icons from a single source image using:

**Option 1: Online Tools**
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

**Option 2: CLI Tool**
```bash
npx pwa-asset-generator logo.svg public/icons --icon-only
```

**Option 3: Manual Creation**
- Use design tools (Figma, Sketch, Photoshop)
- Export at exact dimensions
- Optimize with ImageOptim or TinyPNG

## Offline Functionality

### Caching Strategy

The service worker uses a **Network First, Cache Fallback** strategy:

1. **Network First**: Try to fetch from network
2. **Cache on Success**: Store successful responses
3. **Fallback to Cache**: Use cached version if network fails
4. **Offline Page**: Show `/offline` for unavailable pages

### Cached Resources

**Precached on Install**:
- `/` - Home page
- `/offline` - Offline fallback page
- `/manifest.json` - PWA manifest
- `/icons/icon-192x192.png` - App icon
- `/icons/icon-512x512.png` - Large icon

**Runtime Cached**:
- All navigation requests
- API responses (when online)
- Images and assets
- Static resources

### Offline Capabilities

**Available Offline**:
- Previously visited pages
- Cached form data
- Static assets and images
- App shell and UI

**Requires Connection**:
- Fresh data from API
- Form submissions (queued for background sync)
- Real-time updates
- New content

## Service Worker Updates

### Automatic Updates

The service worker automatically checks for updates:

1. **On Navigation**: Checks when user returns to app
2. **Every 24 Hours**: Periodic update checks
3. **Manual Refresh**: Force reload to get latest version

### Manual Update

To force a service worker update:

```javascript
// In browser console or app code
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

### Clear Cache

To clear all caches:

```javascript
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

## Testing PWA Features

### Local Testing

1. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

2. **Test with Chrome DevTools**:
   - Open DevTools (F12)
   - Go to "Application" tab
   - Check "Service Workers" section
   - Check "Manifest" section
   - Test offline mode with "Offline" checkbox

3. **Lighthouse Audit**:
   - Open DevTools
   - Go to "Lighthouse" tab
   - Select "Progressive Web App"
   - Click "Generate report"

### Mobile Testing

1. **Android (Chrome)**:
   - Use Chrome Remote Debugging
   - Connect device via USB
   - Navigate to `chrome://inspect`
   - Test installation flow

2. **iOS (Safari)**:
   - Use Safari Web Inspector
   - Connect device via USB/WiFi
   - Test Add to Home Screen
   - Verify standalone mode

## Deployment Checklist

- [ ] Generate all required icon sizes
- [ ] Create splash screens for iOS
- [ ] Test offline functionality
- [ ] Verify manifest.json
- [ ] Test installation on Android
- [ ] Test installation on iOS
- [ ] Run Lighthouse PWA audit (score > 90)
- [ ] Configure HTTPS (required for PWA)
- [ ] Set up push notification server (optional)
- [ ] Configure background sync endpoints (optional)

## Troubleshooting

### App Not Installing

**Android**:
- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify all required fields in manifest
- Clear Chrome data and retry

**iOS**:
- Must use Safari browser
- Check all meta tags are present
- Verify apple-touch-icon links
- Try clearing Safari cache

### Service Worker Not Registering

1. **Check HTTPS**: PWA requires HTTPS (except localhost)
2. **Check Console**: Look for registration errors
3. **Verify sw.js**: Ensure file is in `/public/sw.js`
4. **Check Scope**: Service worker scope must include app routes

### Offline Mode Not Working

1. **Check Cache**: Verify resources are cached in DevTools
2. **Check Strategy**: Ensure fetch handler is working
3. **Test Network**: Use DevTools offline mode
4. **Check Precache**: Verify PRECACHE_URLS are correct

### Icons Not Showing

1. **Check Paths**: Verify icon paths in manifest.json
2. **Check Files**: Ensure icons exist in `/public/icons/`
3. **Check Format**: Icons must be PNG format
4. **Check Sizes**: Verify exact dimensions (192x192, 512x512)

## Performance Optimization

### Icon Optimization
- Use compressed PNG files
- Consider WebP format for modern browsers
- Optimize with ImageOptim or similar tools
- Target < 50KB per icon

### Cache Optimization
- Limit precache to essential assets only
- Set cache expiration policies
- Clean up old caches on activation
- Monitor cache storage usage

### Bundle Optimization
- Code split routes for lazy loading
- Tree shake unused dependencies
- Minimize JavaScript bundles
- Use Next.js built-in optimizations

## Security Considerations

### HTTPS Requirement
- PWA requires HTTPS in production
- Use Let's Encrypt for free SSL
- Configure SSL redirects

### Content Security Policy
Add CSP headers for enhanced security:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
];
```

### Permissions
- Request permissions only when needed
- Explain why permissions are required
- Handle permission denials gracefully

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Advanced SW)](https://developers.google.com/web/tools/workbox)

## Support

For issues or questions:
- Check DevTools Console for errors
- Review service worker status in Application tab
- Test with Lighthouse PWA audit
- Consult [Web.dev PWA documentation](https://web.dev/progressive-web-apps/)

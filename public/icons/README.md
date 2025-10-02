# App Icons for Field Agents PWA

## Required Icon Sizes

Place the following PNG icons in this directory:

- `icon-72x72.png` - Badge icon (72x72px)
- `icon-96x96.png` - Small devices (96x96px)
- `icon-128x128.png` - Standard mobile (128x128px)
- `icon-144x144.png` - High-DPI mobile (144x144px)
- `icon-152x152.png` - iOS devices (152x152px)
- `icon-180x180.png` - iOS devices (180x180px)
- `icon-192x192.png` - **REQUIRED** Android (192x192px)
- `icon-384x384.png` - High-res displays (384x384px)
- `icon-512x512.png` - **REQUIRED** Splash screens (512x512px)

## Quick Icon Generation

### Option 1: PWA Asset Generator (Recommended)

```bash
# Install globally
npm install -g pwa-asset-generator

# Generate all icons from source image
pwa-asset-generator source-logo.svg . --icon-only --padding "10%"
```

### Option 2: Online Tools

1. **PWA Builder Image Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload your logo/icon (1024x1024 recommended)
   - Download generated icon pack
   - Extract to this directory

2. **RealFaviconGenerator**
   - Visit: https://realfavicongenerator.net/
   - Upload your icon
   - Configure for Android/iOS
   - Download and extract

### Option 3: Manual Creation with ImageMagick

```bash
# From a high-res source (e.g., 1024x1024)
convert source-logo.png -resize 72x72 icon-72x72.png
convert source-logo.png -resize 96x96 icon-96x96.png
convert source-logo.png -resize 128x128 icon-128x128.png
convert source-logo.png -resize 144x144 icon-144x144.png
convert source-logo.png -resize 152x152 icon-152x152.png
convert source-logo.png -resize 180x180 icon-180x180.png
convert source-logo.png -resize 192x192 icon-192x192.png
convert source-logo.png -resize 384x384 icon-384x384.png
convert source-logo.png -resize 512x512 icon-512x512.png
```

## Icon Design Guidelines

### Design Principles
- **Simple**: Clear, recognizable at small sizes
- **Bold**: Strong contrast and colors
- **Unique**: Distinctive from other apps
- **Scalable**: Looks good at all sizes

### Technical Requirements
- **Format**: PNG with transparency
- **Background**: Transparent or solid color
- **Padding**: 10% safe area around edges
- **Color Space**: sRGB
- **Bit Depth**: 24-bit (8-bit per channel) or 32-bit with alpha

### Platform-Specific Considerations

**Android**:
- Supports maskable icons (safe area matters)
- Can have transparent backgrounds
- Material Design principles recommended

**iOS**:
- Automatically adds rounded corners
- Prefers opaque backgrounds
- Should look good with rounded corners

## Placeholder Icons

If you don't have icons yet, you can use these placeholder generators:

### Via URL (for testing)
```json
// In manifest.json
{
  "src": "https://via.placeholder.com/192x192/2563eb/ffffff?text=FA",
  "sizes": "192x192",
  "type": "image/png"
}
```

### Generate Solid Color Placeholders

```bash
# Blue placeholders with "FA" text
convert -size 192x192 xc:#2563eb -gravity center -pointsize 72 -fill white -annotate +0+0 "FA" icon-192x192.png
convert -size 512x512 xc:#2563eb -gravity center -pointsize 200 -fill white -annotate +0+0 "FA" icon-512x512.png
```

## Testing Icons

### Chrome DevTools
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" section
4. Verify all icons load correctly

### Mobile Testing
1. Install PWA on device
2. Check home screen icon
3. Verify splash screen (Android)
4. Test in different themes (light/dark)

## Optimization

### Compress Icons
```bash
# Using pngquant
pngquant --quality 65-80 icon-*.png --ext .png --force

# Using optipng
optipng -o7 icon-*.png
```

### Target Sizes
- Keep each icon under 50KB
- Total icon set should be under 300KB
- Use compression tools to reduce size

## Current Status

⚠️ **ICONS NEEDED**: This directory currently contains placeholder instructions only.

Please generate and add the required icons following the guidelines above.

## Quick Start Script

Save this as `generate-icons.sh`:

```bash
#!/bin/bash

# Check if source image provided
if [ -z "$1" ]; then
  echo "Usage: ./generate-icons.sh <source-image>"
  echo "Example: ./generate-icons.sh logo.png"
  exit 1
fi

SOURCE=$1
SIZES=(72 96 128 144 152 180 192 384 512)

echo "Generating icons from $SOURCE..."

for SIZE in "${SIZES[@]}"; do
  OUTPUT="icon-${SIZE}x${SIZE}.png"
  convert "$SOURCE" -resize ${SIZE}x${SIZE} "$OUTPUT"
  echo "✓ Created $OUTPUT"
done

echo "✓ All icons generated successfully!"
```

Run with:
```bash
chmod +x generate-icons.sh
./generate-icons.sh your-logo.png
```

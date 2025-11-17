/**
 * Icon Generation Script for O3Measure
 *
 * This script creates placeholder PNG icons in various sizes for PWA support.
 * For production, replace with actual high-quality icons using tools like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/
 *
 * Run: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

console.log('📱 Icon Generation for O3Measure');
console.log('================================\n');

// Read the SVG icon
const svgPath = path.join(ICONS_DIR, 'icon.svg');

if (!fs.existsSync(svgPath)) {
  console.error('❌ Error: icon.svg not found at', svgPath);
  console.log('\n⚠️  Please create an SVG icon first or use an online tool to generate icons.');
  process.exit(1);
}

console.log('✅ Found icon.svg');
console.log('\n📋 To generate PNG icons from SVG, use one of these methods:\n');
console.log('Method 1: Online Tool (Recommended)');
console.log('  Visit: https://realfavicongenerator.net/');
console.log('  Upload: public/icons/icon.svg');
console.log('  Download and extract to public/icons/\n');

console.log('Method 2: Using ImageMagick (if installed)');
console.log('  Install: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)');
console.log('  Then run this script with --convert flag\n');

console.log('Method 3: Using sharp (Node.js)');
console.log('  npm install sharp');
console.log('  Then run this script with --convert flag\n');

// Check if conversion is requested
const shouldConvert = process.argv.includes('--convert');

if (shouldConvert) {
  convertIcons();
} else {
  createPlaceholders();
}

/**
 * Create placeholder icon files
 */
function createPlaceholders() {
  console.log('🔄 Creating placeholder files...\n');

  ICON_SIZES.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(ICONS_DIR, filename);

    // Create an empty placeholder file
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, '');
      console.log(`  ✓ Created placeholder: ${filename}`);
    } else {
      console.log(`  ⊘ Already exists: ${filename}`);
    }
  });

  console.log('\n✅ Placeholder creation complete!');
  console.log('\n⚠️  IMPORTANT: Replace placeholder files with actual PNG icons before production deployment.');
  console.log('   Use one of the methods listed above to generate proper icons.\n');
}

/**
 * Convert SVG to PNG using available tools
 */
async function convertIcons() {
  console.log('🔄 Attempting to convert SVG to PNG...\n');

  // Try to use sharp if available
  try {
    const sharp = await import('sharp');
    console.log('✅ Using sharp for conversion\n');

    for (const size of ICON_SIZES) {
      const filename = `icon-${size}x${size}.png`;
      const filepath = path.join(ICONS_DIR, filename);

      await sharp.default(svgPath)
        .resize(size, size)
        .png()
        .toFile(filepath);

      console.log(`  ✓ Generated: ${filename}`);
    }

    console.log('\n✅ Icon conversion complete!\n');
    return;

  } catch (error) {
    console.log('⚠️  sharp not available');
  }

  // If sharp is not available, provide instructions
  console.log('\n❌ Automatic conversion not available.');
  console.log('   Install sharp: npm install sharp');
  console.log('   Or use an online tool as described above.\n');

  createPlaceholders();
}

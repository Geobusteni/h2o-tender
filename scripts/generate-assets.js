/**
 * Generate App Icon and Splash Screen Assets
 * 
 * This script generates basic app icon and splash screen assets for H2O Tender.
 * Run with: node scripts/generate-assets.js
 * 
 * Requirements:
 * - sharp: npm install --save-dev sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp package is required. Install it with:');
  console.error('  npm install --save-dev sharp');
  process.exit(1);
}

const assetsDir = path.join(__dirname, '..', 'assets');
const iconSize = 1024;
const splashWidth = 2048;
const splashHeight = 2732; // iPhone 14 Pro Max size

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple icon with H2O text and water drop
async function generateIcon() {
  const svg = `
    <svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2196F3;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.2}" fill="url(#grad)"/>
      <circle cx="${iconSize * 0.5}" cy="${iconSize * 0.4}" r="${iconSize * 0.15}" fill="#FFFFFF" opacity="0.9"/>
      <path d="M ${iconSize * 0.5} ${iconSize * 0.4} L ${iconSize * 0.5} ${iconSize * 0.65} A ${iconSize * 0.1} ${iconSize * 0.1} 0 0 0 ${iconSize * 0.5} ${iconSize * 0.4} Z" fill="#FFFFFF" opacity="0.9"/>
      <text x="${iconSize * 0.5}" y="${iconSize * 0.85}" font-family="Arial, sans-serif" font-size="${iconSize * 0.2}" font-weight="bold" fill="#FFFFFF" text-anchor="middle">H₂O</text>
    </svg>
  `;

  const iconPath = path.join(assetsDir, 'icon.png');
  await sharp(Buffer.from(svg))
    .resize(iconSize, iconSize)
    .png()
    .toFile(iconPath);
  
  console.log(`✓ Generated icon: ${iconPath}`);
}

// Create splash screen
async function generateSplash() {
  const svg = `
    <svg width="${splashWidth}" height="${splashHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="splashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2196F3;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${splashWidth}" height="${splashHeight}" fill="url(#splashGrad)"/>
      <circle cx="${splashWidth * 0.5}" cy="${splashHeight * 0.4}" r="${splashWidth * 0.15}" fill="#FFFFFF" opacity="0.9"/>
      <path d="M ${splashWidth * 0.5} ${splashHeight * 0.4} L ${splashWidth * 0.5} ${splashHeight * 0.55} A ${splashWidth * 0.1} ${splashWidth * 0.1} 0 0 0 ${splashWidth * 0.5} ${splashHeight * 0.4} Z" fill="#FFFFFF" opacity="0.9"/>
      <text x="${splashWidth * 0.5}" y="${splashHeight * 0.7}" font-family="Arial, sans-serif" font-size="${splashWidth * 0.1}" font-weight="bold" fill="#FFFFFF" text-anchor="middle">H₂O Tender</text>
    </svg>
  `;

  const splashPath = path.join(assetsDir, 'splash.png');
  await sharp(Buffer.from(svg))
    .resize(splashWidth, splashHeight)
    .png()
    .toFile(splashPath);
  
  console.log(`✓ Generated splash: ${splashPath}`);
}

// Generate adaptive icon for Android (foreground)
async function generateAdaptiveIcon() {
  const size = 1024;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="adaptiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2196F3;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#adaptiveGrad)"/>
      <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.15}" fill="#FFFFFF" opacity="0.9"/>
      <path d="M ${size * 0.5} ${size * 0.4} L ${size * 0.5} ${size * 0.65} A ${size * 0.1} ${size * 0.1} 0 0 0 ${size * 0.5} ${size * 0.4} Z" fill="#FFFFFF" opacity="0.9"/>
      <text x="${size * 0.5}" y="${size * 0.85}" font-family="Arial, sans-serif" font-size="${size * 0.2}" font-weight="bold" fill="#FFFFFF" text-anchor="middle">H₂O</text>
    </svg>
  `;

  const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(adaptiveIconPath);
  
  console.log(`✓ Generated adaptive icon: ${adaptiveIconPath}`);
}

// Main execution
async function main() {
  console.log('Generating app assets...\n');
  
  try {
    await generateIcon();
    await generateSplash();
    await generateAdaptiveIcon();
    
    console.log('\n✓ All assets generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated assets in the assets/ directory');
    console.log('2. Update app.json to reference these assets (already configured)');
    console.log('3. For production, consider creating custom designs with a graphic designer');
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exit(1);
  }
}

main();


const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 valid PNG in dark theme background #1A1A2E
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPm/HgAEawHQ6t+P+gAAAABJRU5ErkJggg==',
  'base64'
);

['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'].forEach((file) => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
  }
});

console.log('Assets created successfully.');

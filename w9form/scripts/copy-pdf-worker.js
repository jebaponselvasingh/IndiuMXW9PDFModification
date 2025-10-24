const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
// prefer the ESM build files available in pdfjs-dist build
const src = path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const srcMain = path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.min.mjs');
const destDir = path.join(root, 'public');
const dest = path.join(destDir, 'pdf.worker.min.js');

if (!fs.existsSync(src)) {
  console.error('Source pdf.worker.min.mjs not found at', src);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
// copy worker (rename .mjs -> .js)
fs.copyFileSync(src, dest);
console.log('Copied', src, '->', dest);
// copy main pdf script as pdf.min.js for dynamic import
const destMain = path.join(destDir, 'pdf.min.js');
if (fs.existsSync(srcMain)) {
  fs.copyFileSync(srcMain, destMain);
  console.log('Copied', srcMain, '->', destMain);
} else {
  console.warn('Main pdf.mjs not found at', srcMain);
}

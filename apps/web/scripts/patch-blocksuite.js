/* eslint-disable */
const fs = require('fs');
const path = require('path');

function fixFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    const filePath = path.join(dir, file.toString());
    if (filePath.endsWith('.js') && fs.statSync(filePath).isFile()) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('CheckBoxCkeckSolidIcon')) {
        content = content.replace(/CheckBoxCkeckSolidIcon/g, 'CheckBoxCheckSolidIcon');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Patched:', filePath);
      }
    }
  }
}

const nodeModulesRoot = path.resolve(__dirname, '../../../node_modules/@blocksuite');
const nodeModulesLocal = path.resolve(__dirname, '../node_modules/@blocksuite');
const pnpmStore = path.resolve(__dirname, '../../../node_modules/.pnpm');

fixFiles(nodeModulesRoot);
fixFiles(nodeModulesLocal);

if (fs.existsSync(pnpmStore)) {
  const dirs = fs.readdirSync(pnpmStore);
  for (const d of dirs) {
    if (d.includes('blocksuite')) {
      fixFiles(path.join(pnpmStore, d));
    }
  }
}

console.log('BlockSuite patch complete.');

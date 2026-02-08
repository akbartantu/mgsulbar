const fs = require('fs');
const path = require('path');
const dist = path.join(process.cwd(), 'dist');
const out = path.join(process.cwd(), 'server', 'public');
if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run npm run build first.');
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });
fs.readdirSync(dist).forEach((f) => {
  const src = path.join(dist, f);
  const dest = path.join(out, f);
  fs.cpSync(src, dest, { recursive: true });
});
console.log('Copied dist/ to server/public/');

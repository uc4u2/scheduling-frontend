const fs = require('fs');
const path = 'src/RecruiterDashboard.js';
const text = fs.readFileSync(path, 'utf8');
const startMarker = '            <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>';
const start = text.indexOf(startMarker);
if (start === -1) {
  console.error('start marker not found');
  process.exit(1);
}
const endMarker = '          </Stack>\r\n        </Grid>';
const end = text.indexOf(endMarker, start);
if (end === -1) {
  console.error('end marker not found');
  process.exit(1);
}
const heroBlock = text.substring(start, end + endMarker.length);
console.log('HERO BLOCK START');
console.log(heroBlock);
fs.writeFileSync('current_hero_block.txt', heroBlock);

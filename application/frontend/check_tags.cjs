const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

let openDivs = 0;

for (let i = 1181; i < 1439; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  openDivs += opens - closes;
  if (openDivs < 0) {
    console.log(`Extra closing div at line ${i + 1}: ${line}`);
    break;
  }
}
console.log(`Net open divs at line 1438: ${openDivs}`);

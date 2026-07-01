const fs = require('fs'); 
const b64 = fs.readFileSync('tsports_b64.txt', 'utf8'); 
const js = `const primeTvChannels = [{ "Category": "Sports", "StreamId": "1", "Logo": "${b64}", "Name": "T SPORTS" }];`; 
fs.writeFileSync('channels.js', js);

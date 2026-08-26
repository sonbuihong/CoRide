const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace("router.push(\\`/chat/\\${ride.id}\\` as any)", "router.push(`/chat/${ride.id}` as any)");
fs.writeFileSync(file, txt);

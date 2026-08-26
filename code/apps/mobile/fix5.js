const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace('const formatVnd = (value: number) => `${value.toLocaleString(\'vi-VN\')} đ`;', 'const formatVnd = (value: number) => `${value.toLocaleString(\'vi-VN\')} đ`;\nconst currency = (value: number) => `${value.toLocaleString(\'vi-VN\')}đ`;');

txt = txt.replace(/address=\{ride\.departure \?\? ''\}/g, "address={(ride.departure ?? '') as string}");
txt = txt.replace(/address=\{stop\.address \?\? ''\}/g, "address={(stop.address ?? '') as string}");

let matchCount = 0;
txt = txt.replace(/quickInfoBar: \{/g, (match) => {
  matchCount++;
  if (matchCount > 1) {
    return 'quickInfoBar_DUPLICATE: {';
  }
  return match;
});

fs.writeFileSync(file, txt);

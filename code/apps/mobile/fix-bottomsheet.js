const fs = require('fs');
let file = 'src/components/ui/DraggableBottomSheet.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace('snapPoints?: number[];', 'snapPoints?: (number | string)[];');

txt = txt.replace(
  'return snapPoints.map((p) => `${Math.round(p * 100)}%`);',
  'return snapPoints.map((p) => { if (typeof p === "number") { return p <= 1 ? `${Math.round(p * 100)}%` : p; } return p; });'
);

fs.writeFileSync(file, txt);

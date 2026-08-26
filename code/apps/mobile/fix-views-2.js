const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/<View style=\{styles\.divider\} \/>\s*<\/View>\s*\{\/\*\s*Th/g, '<View style={styles.divider} />\n\n            {/* Th');

txt = txt.replace(/<View style=\{styles\.divider\} \/>\s*\{snapIndex > SNAP_COLLAPSED/g, '<View style={styles.divider} />\n          </View>\n\n          {snapIndex > SNAP_COLLAPSED');

fs.writeFileSync(file, txt);

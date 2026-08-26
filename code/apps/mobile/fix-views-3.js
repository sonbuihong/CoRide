const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/<View style=\{styles\.divider\} \/>\r?\n\s*<\/View>\r?\n\s*\{snapIndex > SNAP_COLLAPSED && \(\r?\n\s*<View style=\{styles\.sheetPadding\}>\r?\n\s*<AppText variant="caption" weight="semibold" style=\{styles\.sectionLabel\}>THÔNG TIN ĐẶT CHỖ/g, 
  '<View style={styles.divider} />\n\n          {snapIndex > SNAP_COLLAPSED && (\n            <View style={styles.sheetPadding}>\n              <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>THÔNG TIN ĐẶT CHỖ');

fs.writeFileSync(file, txt);

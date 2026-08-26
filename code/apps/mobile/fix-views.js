const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

// Fix DriverRideView extra </View>
txt = txt.replace(
  '<View style={styles.divider} />\n            </View>\n  \n            {/*',
  '<View style={styles.divider} />\n  \n            {/*'
);
txt = txt.replace(
  '<View style={styles.divider} />\r\n            </View>\r\n  \r\n            {/*',
  '<View style={styles.divider} />\r\n  \r\n            {/*'
);

// Fix PassengerRideView missing </View>
// The divider is right before {snapIndex > SNAP_COLLAPSED && (
txt = txt.replace(
  '<View style={styles.divider} />\n  \n          {snapIndex > SNAP_COLLAPSED && (\n            <View style={styles.sheetPadding}>\n              <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>',
  '<View style={styles.divider} />\n          </View>\n  \n          {snapIndex > SNAP_COLLAPSED && (\n            <View style={styles.sheetPadding}>\n              <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>'
);
txt = txt.replace(
  '<View style={styles.divider} />\r\n  \r\n          {snapIndex > SNAP_COLLAPSED && (\r\n            <View style={styles.sheetPadding}>\r\n              <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>',
  '<View style={styles.divider} />\r\n          </View>\r\n  \r\n          {snapIndex > SNAP_COLLAPSED && (\r\n            <View style={styles.sheetPadding}>\r\n              <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>'
);

fs.writeFileSync(file, txt);

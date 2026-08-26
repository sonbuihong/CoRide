const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Add `container: { flex: 1, backgroundColor: '#E5E7EB' },`
txt = txt.replace('const styles = StyleSheet.create({', 'const styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: \'#E5E7EB\' },');

// 2. Fix line 976 where undefined is assigned to string.
// Let's find: `address={ride.departure ?? ''}` and make sure it has `as string`
txt = txt.replace(/address=\{ride\.departure \?\? ''\}/g, "address={(ride.departure ?? '') as string}");
txt = txt.replace(/address=\{stop\.address \?\? ''\}/g, "address={(stop.address ?? '') as string}");

// 3. Fix line 1115 duplicate property in styles
// Let's remove any duplicated `quickInfoBar: {`
let matchCount = 0;
txt = txt.replace(/quickInfoBar: \{/g, (match) => {
  matchCount++;
  if (matchCount > 1) {
    return 'quickInfoBar_DUPLICATE: {';
  }
  return match;
});

fs.writeFileSync(file, txt);

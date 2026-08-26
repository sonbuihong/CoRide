const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Remove SNAP_POINTS global constant
txt = txt.replace('const SNAP_POINTS = [0.42, 0.65, 1];\n', '');

// 2. Add state hooks inside PassengerRideView
const hooksToInsert = `
  const [topContentHeight, setTopContentHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const { bottom: safeBottom } = useSafeAreaInsets();
  
  const computedSnapPoints = useMemo(() => {
    const s0 = (topContentHeight > 0 && footerHeight > 0) 
      ? topContentHeight + footerHeight + safeBottom + 32 // Add 32 for some breathing room
      : 0.45; // Default fallback
    return [s0, 0.65, 1];
  }, [topContentHeight, footerHeight, safeBottom]);
`;

txt = txt.replace('const { height: screenHeight } = useWindowDimensions();', hooksToInsert + '\n  const { height: screenHeight } = useWindowDimensions();');

// 3. Replace <View style={styles.ctaContainer}> with <View style={styles.ctaContainer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
txt = txt.replace('<View style={styles.ctaContainer}>', '<View style={styles.ctaContainer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>');

// 4. Replace DraggableBottomSheet snapPoints prop
txt = txt.replace('snapPoints={SNAP_POINTS}', 'snapPoints={computedSnapPoints}');

// 5. Wrap the top content with onLayout
// We need to wrap from <View style={styles.sheetPadding}> to <View style={styles.divider} />
// I will just use regex to replace it.
const topContentStart = '<View style={styles.sheetPadding}>';
const dividerEnd = '<View style={styles.divider} />';
const replacedTopContent = `<View onLayout={(e) => setTopContentHeight(e.nativeEvent.layout.height)}>
            ${topContentStart}`;
const replacedDividerEnd = `${dividerEnd}
          </View>`;
          
txt = txt.replace(topContentStart, replacedTopContent);
txt = txt.replace(dividerEnd, replacedDividerEnd);

fs.writeFileSync(file, txt);

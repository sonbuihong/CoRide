const fs = require('fs');
let file = 'app/ride/[id].tsx';
let txt = fs.readFileSync(file, 'utf8');

// The duplicate starts at:
// import React, { useCallback, useMemo, useState, useRef } from 'react';
// And ends somewhere. Let's just find the first occurrence of `import React` and the second occurrence, and slice it.

let firstReact = txt.indexOf("import React, { useCallback");
let secondReact = txt.indexOf("import React, { useCallback", firstReact + 10);

if (secondReact !== -1) {
  // We need to keep from `firstReact` to `secondReact` (which has the correct imports) OR wait, the duplicate might have been inserted in between.
  // Let's look at the exact duplication:
  
  // It looks like `replace_file_content` replaced:
  // const SNAP_COLLAPSED = 0; ...
  // With the whole block of imports AND the SNAP_POINTS!
  // Wait, let's just find `import React, { useCallback` down to `import { getDirections } from '../../src/services/direction.service';`
  
  // Actually, there's a simpler way.
  // Find `// ─── Helpers ───`
  
  let helpersIdx = txt.indexOf("// ─── Helpers");
  // Everything before helpersIdx is imports.
  // I will just overwrite the top of the file up to helpersIdx with the correct imports!
  
  let correctImports = `import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  Phone,
  Route,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { DraggableBottomSheet, type DraggableBottomSheetRef } from '../../src/components/ui/DraggableBottomSheet';
import { FloatingMyLocation } from '../../src/components/ui/FloatingMyLocation';
import { bookingService, type DriverBookingSummary } from '../../src/services/booking.service';
import { rideService } from '../../src/services/ride.service';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';
import { getDirections } from '../../src/services/direction.service';

`;

  txt = correctImports + txt.substring(helpersIdx);
  fs.writeFileSync(file, txt);
  console.log("Fixed duplicates!");
}

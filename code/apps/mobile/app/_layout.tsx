import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useAuth } from '../src/hooks/useAuth';
import { useAppStore } from '../src/stores/useAppStore';
import { QueryProvider } from '../src/providers/query-provider';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(passenger-tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayoutWrapper() {
  return (
    <QueryProvider>
      <RootLayout />
    </QueryProvider>
  );
}

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const { checkAuth, isLoading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const { appMode } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the login page if the user is not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to the correct home page based on appMode
      router.replace((appMode === 'driver' ? '/(driver-tabs)' : '/(passenger-tabs)') as any);
    }
  }, [isAuthenticated, segments, router, appMode]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false, title: 'Đăng ký' }} />
      <Stack.Screen name="(passenger-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(driver-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ride/create" options={{ headerShown: false }} />
      <Stack.Screen name="dev/mode-prototype" options={{ headerShown: true, title: 'Dev Prototype' }} />
      <Stack.Screen name="ride/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="ride/passenger/[bookingId]" options={{ headerShown: false }} />
      <Stack.Screen name="ride/route-detail" options={{ headerShown: false }} />
      <Stack.Screen name="ride/completed" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="ride/history" options={{ headerShown: false }} />
      <Stack.Screen name="ride/history/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="ride/active-ride" options={{ headerShown: false, title: 'Chuyến đi' }} />
      <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="search-results" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="report-modal" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="review-modal" options={{ presentation: 'transparentModal', headerShown: false }} />
      <Stack.Screen name="cancel-modal" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="chat/[rideId]" options={{ headerShown: false }} />
      </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

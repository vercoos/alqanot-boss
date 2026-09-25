import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from './src/store';
import { useTheme, colors } from './src/theme';
import { loadApiBase } from './src/api';
import { connectSocket, disconnectSocket, startTracking, stopTracking } from './src/socket';
import { checkUpdate } from './src/update';
import Login from './src/screens/Login';
import Harita from './src/screens/Harita';
import Tasdiqlash from './src/screens/Tasdiqlash';
import Tolovlar from './src/screens/Tolovlar';
import Qarzlar from './src/screens/Qarzlar';
import Profil from './src/screens/Profil';
import Yuk from './src/screens/Yuk';
import YukDetail from './src/screens/YukDetail';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('App crash:', error); }
  render() {
    const err = this.state.error;
    if (err) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0B0E12', paddingHorizontal: 20, paddingTop: 60 }}>
          <Text style={{ color: '#F0813F', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Ilovada xatolik</Text>
          <ScrollView>
            <Text style={{ color: '#EDEFF3', fontSize: 13, lineHeight: 19 }}>{String(err.message || err)}</Text>
            <Text style={{ color: 'rgba(237,239,243,0.55)', fontSize: 11, marginTop: 14 }}>{String((err as any).stack || '')}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children as any;
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS: Record<string, [string, string]> = {
  Harita: ['map', 'map-outline'],
  Tasdiqlash: ['checkmark-done', 'checkmark-done-outline'],
  Tolovlar: ['cash', 'cash-outline'],
  Qarzlar: ['wallet', 'wallet-outline'],
  Profil: ['person', 'person-outline'],
};

// Boshliq / bugalter oynasi
function BossTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textDim,
      tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarIcon: ({ focused, color, size }) => {
        const [on, off] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
        return <Ionicons name={(focused ? on : off) as any} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Harita" component={Harita} />
      <Tab.Screen name="Tasdiqlash" component={Tasdiqlash} />
      <Tab.Screen name="Tolovlar" component={Tolovlar} options={{ title: "To'lovlar" }} />
      <Tab.Screen name="Qarzlar" component={Qarzlar} />
      <Tab.Screen name="Profil" component={Profil} />
    </Tab.Navigator>
  );
}

// Kuryer oynasi — harita YO'Q, faqat yuk + pul, fonda GPS
function KuryerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Yuk" component={Yuk} />
      <Stack.Screen name="YukDetail" component={YukDetail} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { hydrated, user, hydrate } = useAuth();
  const { ready, resolved, hydrate: hydrateTheme } = useTheme();

  useEffect(() => { (async () => { await loadApiBase(); hydrateTheme(); hydrate(); })(); }, []);
  useEffect(() => {
    if (user) {
      if (user.role === 'kuryer') startTracking();
      else connectSocket();
      checkUpdate(true);
    } else {
      stopTracking();
      disconnectSocket();
    }
  }, [user]);

  if (!hydrated || !ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const navTheme = resolved === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bgElevated, text: colors.text, primary: colors.primary, border: colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bgElevated, text: colors.text, primary: colors.primary, border: colors.border } };

  const isKuryer = user?.role === 'kuryer';

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <Stack.Screen name="Login" component={Login} />
            ) : isKuryer ? (
              <Stack.Screen name="Kuryer" component={KuryerStack} />
            ) : (
              <Stack.Screen name="Boss" component={BossTabs} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

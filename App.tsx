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
import Dashboard from './src/screens/Dashboard';
import Sale from './src/screens/Sale';
import Harita from './src/screens/Harita';
import Tasdiqlash from './src/screens/Tasdiqlash';
import More from './src/screens/More';
import Clients from './src/screens/Clients';
import Suppliers from './src/screens/Suppliers';
import Warehouse from './src/screens/Warehouse';
import Purchases from './src/screens/Purchases';
import Expenses from './src/screens/Expenses';
import Qaytarish from './src/screens/Qaytarish';
import Report from './src/screens/Report';
import Tolovlar from './src/screens/Tolovlar';
import Qarzlar from './src/screens/Qarzlar';
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
        <View style={{ flex: 1, backgroundColor: '#0E1116', paddingHorizontal: 20, paddingTop: 60 }}>
          <Text style={{ color: '#FF6E33', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Ilovada xatolik</Text>
          <ScrollView>
            <Text style={{ color: '#F3F5F8', fontSize: 13, lineHeight: 19 }}>{String(err.message || err)}</Text>
            <Text style={{ color: 'rgba(243,245,248,0.55)', fontSize: 11, marginTop: 14 }}>{String((err as any).stack || '')}</Text>
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
  Home: ['home', 'home-outline'],
  Sotuv: ['cart', 'cart-outline'],
  Xarita: ['map', 'map-outline'],
  Tasdiqlash: ['checkmark-done', 'checkmark-done-outline'],
  Boshqa: ['grid', 'grid-outline'],
};

function BossTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border, height: 68, paddingBottom: 10, paddingTop: 8 },
      tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarIcon: ({ color, size, focused }) => {
        const [on, off] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
        return <Ionicons name={(focused ? on : off) as any} size={size - 1} color={color} />;
      },
    })}>
      <Tab.Screen name="Home" component={Dashboard} options={{ title: 'Asosiy' }} />
      <Tab.Screen name="Sotuv" component={Sale} />
      <Tab.Screen name="Xarita" component={Harita} />
      <Tab.Screen name="Tasdiqlash" component={Tasdiqlash} />
      <Tab.Screen name="Boshqa" component={More} />
    </Tab.Navigator>
  );
}

function BossRoot() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BossTabs} />
      <Stack.Screen name="Mijozlar" component={Clients} />
      <Stack.Screen name="Yetkazuvchilar" component={Suppliers} />
      <Stack.Screen name="Ombor" component={Warehouse} />
      <Stack.Screen name="Xarid" component={Purchases} />
      <Stack.Screen name="Xarajatlar" component={Expenses} />
      <Stack.Screen name="Qaytarish" component={Qaytarish} />
      <Stack.Screen name="Hisobot" component={Report} />
      <Stack.Screen name="Tolovlar" component={Tolovlar} />
      <Stack.Screen name="Qarzlar" component={Qarzlar} />
    </Stack.Navigator>
  );
}

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
      stopTracking(); disconnectSocket();
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
        <NavigationContainer key={resolved} theme={navTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <Stack.Screen name="Login" component={Login} />
            ) : isKuryer ? (
              <Stack.Screen name="Kuryer" component={KuryerStack} />
            ) : (
              <Stack.Screen name="Boss" component={BossRoot} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

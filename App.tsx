import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useAuth } from './src/store';
import { useTheme, colors } from './src/theme';
import { connectSocket, disconnectSocket } from './src/socket';
import HaritaScreen from './src/screens/Harita';
import LoginScreen from './src/screens/Login';
import LockScreen from './src/screens/Lock';
import DashboardScreen from './src/screens/Dashboard';
import SaleScreen from './src/screens/Sale';
import ClientsScreen from './src/screens/Clients';
import ProfileScreen from './src/screens/Profile';
import ReportScreen from './src/screens/Report';
import SuppliersScreen from './src/screens/Suppliers';
import WarehouseScreen from './src/screens/Warehouse';
import ExpensesScreen from './src/screens/Expenses';
import BuyurtmalarScreen from './src/screens/Buyurtmalar';
import ChekScreen from './src/screens/Chek';
import MijozTarixScreen from './src/screens/MijozTarix';
import QaytarishScreen from './src/screens/Qaytarish';
import TarixScreen from './src/screens/Tarix';
import XaridTarixScreen from './src/screens/XaridTarix';
import YetkazuvchiTarixScreen from './src/screens/YetkazuvchiTarix';

// Startupda kutilmagan render xatosi bo'lsa — bo'sh/oq ekran o'rniga xatoni ko'rsatadi
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
  Mijozlar: ['people', 'people-outline'],
  Boshqa: ['grid', 'grid-outline'],
};

function MainTabs() {
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
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Asosiy' }} />
      <Tab.Screen name="Sotuv" component={SaleScreen} options={{ title: 'Sotuv' }} />
      <Tab.Screen name="Xarita" component={HaritaScreen} options={{ title: 'Xarita' }} />
      <Tab.Screen name="Mijozlar" component={ClientsScreen} options={{ title: 'Mijozlar' }} />
      <Tab.Screen name="Boshqa" component={ProfileScreen} options={{ title: 'Boshqa' }} />
    </Tab.Navigator>
  );
}

function AppRoot() {
  const hydrated = useAuth((s) => s.hydrated);
  const hydrate = useAuth((s) => s.hydrate);
  const user = useAuth((s) => s.user);
  const locked = useAuth((s) => s.locked);
  const themeReady = useTheme((s) => s.ready);
  const themeHydrate = useTheme((s) => s.hydrate);
  const mode = useTheme((s) => s.mode);
  const resolved = useTheme((s) => s.resolved);

  useEffect(() => { Promise.resolve(hydrate()).catch(() => {}); Promise.resolve(themeHydrate()).catch(() => {}); }, [hydrate, themeHydrate]);
  // Kirganda: GPS ruxsatini so'raymiz (xarita "Siz") + jonli socketga ulanamiz (kuryerlar/tasdiqlash)
  useEffect(() => {
    if (user && !locked) {
      Location.requestForegroundPermissionsAsync().catch(() => {});
      connectSocket();
    } else if (!user) {
      disconnectSocket();
    }
  }, [user, locked]);
  if (!hydrated || !themeReady) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const navTheme = { ...(resolved === 'dark' ? DarkTheme : DefaultTheme), colors: { ...(resolved === 'dark' ? DarkTheme.colors : DefaultTheme.colors), background: colors.bg, card: colors.bgElevated, text: colors.text, primary: colors.primary, border: colors.border } };

  return (
    <SafeAreaProvider>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer key={`${mode}-${resolved}`} theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : locked ? (
            <Stack.Screen name="Lock" component={LockScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Hisobot" component={ReportScreen} />
              <Stack.Screen name="Yetkazuvchilar" component={SuppliersScreen} />
              <Stack.Screen name="Ombor" component={WarehouseScreen} />
              <Stack.Screen name="Xarajatlar" component={ExpensesScreen} />
              <Stack.Screen name="Buyurtmalar" component={BuyurtmalarScreen} />
              <Stack.Screen name="Chek" component={ChekScreen} />
              <Stack.Screen name="MijozTarix" component={MijozTarixScreen} />
              <Stack.Screen name="Qaytarish" component={QaytarishScreen} />
              <Stack.Screen name="Tarix" component={TarixScreen} />
              <Stack.Screen name="XaridTarix" component={XaridTarixScreen} />
              <Stack.Screen name="YetkazuvchiTarix" component={YetkazuvchiTarixScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoot />
    </ErrorBoundary>
  );
}

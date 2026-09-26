import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../api';
import { T } from '../components/ui';
import { MAP_HTML } from '../mapHtml';
import { colors, spacing, radii } from '../theme';

function hav(a: number, b: number, c: number, d: number) {
  const R = 6371, p = Math.PI / 180;
  const x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function KuryerXarita() {
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  const watch = useRef<Location.LocationSubscription | null>(null);
  const [ombor, setOmbor] = useState<any>(null);
  const [eta, setEta] = useState<{ km: number; min: number } | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number; speed?: number } | null>(null);

  const inject = (js: string) => { try { web.current?.injectJavaScript(js + ';true;'); } catch {} };

  const loadOmbor = useCallback(async () => {
    try { const o = await api.rootGet('/api/settings/ombor'); setOmbor(o); if (o && ready.current) inject(`window.setOmbor(${JSON.stringify(o)})`); } catch {}
  }, []);

  // Joriy joylashuvni kuzatib boradi (native) — xaritada "Siz" + omborgacha ETA
  const startWatch = useCallback(async () => {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Joylashuv ruxsati kerak', 'Xaritada ko\'rinishingiz va omborgacha masofa uchun ruxsat bering.', [
        { text: 'Bekor', style: 'cancel' }, { text: 'Sozlamalar', onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
      return;
    }
    if (watch.current) return;
    watch.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
      (p) => {
        const m = { lat: p.coords.latitude, lng: p.coords.longitude, speed: p.coords.speed || 0 };
        setMe(m);
        if (ready.current) inject(`window.setMe(${m.lat},${m.lng},${!me})`);
      });
  }, []);

  useFocusEffect(useCallback(() => { loadOmbor(); startWatch(); return () => { watch.current?.remove(); watch.current = null; }; }, [loadOmbor, startWatch]));

  // ETA hisoblash: joriy joy → ombor (mashina tezligi bo'yicha)
  useEffect(() => {
    if (!me || !ombor) { setEta(null); return; }
    const km = hav(me.lat, me.lng, ombor.lat, ombor.lng);
    const v = me.speed && me.speed > 1 ? me.speed * 3.6 : 24; // km/soat
    setEta({ km, min: Math.max(1, Math.round(km / v * 60)) });
  }, [me, ombor]);

  const onMessage = (e: any) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'ready') { ready.current = true; loadOmbor(); if (me) inject(`window.setMe(${me.lat},${me.lng},true)`); }
    } catch {}
  };

  const recenter = () => { if (me) inject(`window.setMe(${me.lat},${me.lng},true)`); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xl" weight="900">Xarita</T>
      </View>

      {/* Ombor ETA banner */}
      <View style={{ position: 'absolute', top: 96, left: 12, right: 12, zIndex: 10, backgroundColor: colors.bgElevated, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.success + '18', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="business" size={20} color={colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <T size="xs" color={colors.textMuted} weight="700">OMBORGACHA</T>
          {!ombor ? <T size="sm" weight="700" color={colors.textDim}>Ombor hali belgilanmagan</T>
            : eta ? <T size="md" weight="900">{eta.min} daqiqa · {eta.km.toFixed(1)} km</T>
              : <T size="sm" weight="700" color={colors.textDim}>Joylashuv aniqlanmoqda…</T>}
        </View>
        {ombor && (
          <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${ombor.lat},${ombor.lng}`).catch(() => {})}
            style={{ backgroundColor: colors.info + '16', borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="navigate" size={15} color={colors.info} /><T size="xs" weight="800" color={colors.info}>Yo'l</T>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <WebView
          ref={web} originWhitelist={['*']} source={{ html: MAP_HTML }} onMessage={onMessage}
          javaScriptEnabled domStorageEnabled geolocationEnabled startInLoadingState
          onGeolocationPermissionsShowPrompt={(_o: any, cb: any) => cb && cb(true, true)}
          renderLoading={() => <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}><ActivityIndicator size="large" color={colors.primary} /></View>}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />
        <TouchableOpacity onPress={recenter} activeOpacity={0.85}
          style={{ position: 'absolute', right: 12, bottom: 20, width: 48, height: 48, borderRadius: 15, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
          <Ionicons name="locate" size={22} color={colors.info} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

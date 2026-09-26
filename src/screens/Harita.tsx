import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../api';
import { connectSocket, getSocket } from '../socket';
import { Header, T, Badge } from '../components/ui';
import { MAP_HTML } from '../mapHtml';
import { colors, spacing, radii } from '../theme';

type Eta = { id: number; name: string; km: number | null; min: number | null; heading?: number | null; speed?: number | null; updated_at?: string };

const DIRS = ['Sh', 'ShShq', 'Shq', 'JShq', 'J', 'JGb', 'Gb', 'ShGb'];
function dirLabel(h?: number | null) {
  if (h == null || isNaN(h)) return null;
  return DIRS[Math.round(((h % 360) / 45)) % 8];
}

function ago(ts?: string) {
  if (!ts) return '—';
  const s = Math.max(0, Math.round((Date.now() - +new Date(ts)) / 1000));
  if (s < 60) return s + ' s oldin';
  if (s < 3600) return Math.round(s / 60) + ' daq oldin';
  return Math.round(s / 3600) + ' soat oldin';
}

export default function Harita() {
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  const [online, setOnline] = useState(false);
  const [etas, setEtas] = useState<Eta[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [ombor, setOmbor] = useState<any>(null);
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState<{ id: number; min: number; km: number } | null>(null);

  const inject = (js: string) => { try { web.current?.injectJavaScript(js + ';true;'); } catch {} };

  // Native joylashuv — ruxsat so'raydi, GPS o'chiq bo'lsa ogohlantiradi (WebView geolocation'ga ishonmaymiz)
  const getPos = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Joylashuv ruxsati kerak', 'Joriy joylashuvni aniqlash uchun ilovaga joylashuv ruxsatini bering.', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Sozlamalar', onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
      return null;
    }
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) { Alert.alert('GPS o\'chiq', 'Iltimos, telefoningizda joylashuv (GPS)ni yoqing.'); return null; }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    } catch {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
      Alert.alert('Joylashuv', 'Joylashuvni aniqlab bo\'lmadi. GPS yoqilganini tekshiring va qayta urining.');
      return null;
    }
  }, []);

  const showMe = useCallback(async () => {
    setLocating(true);
    try { const p = await getPos(); if (p && ready.current) inject(`window.setMe(${p.lat},${p.lng},true)`); }
    finally { setLocating(false); }
  }, [getPos]);

  const loadAll = useCallback(async () => {
    try {
      const [rows, omb] = await Promise.all([
        api.rootGet('/api/couriers/locations').catch(() => []),
        api.rootGet('/api/settings/ombor').catch(() => null),
      ]);
      setOmbor(omb);
      if (ready.current) {
        if (omb) inject(`window.setOmbor(${JSON.stringify(omb)})`);
        inject(`window.setCouriers(${JSON.stringify(rows || [])})`);
      }
    } catch {}
  }, []);

  // Socket — o'zi ulanadi, keyin tinglaydi.
  useEffect(() => {
    let s: any = null; let cleanup = () => {};
    (async () => {
      s = await connectSocket();
      if (!s) return;
      const onLoc = (c: any) => { if (ready.current) inject(`window.updateCourier(${JSON.stringify(c)})`); };
      const onConn = () => setOnline(true);
      const onDisc = () => setOnline(false);
      setOnline(!!s.connected);
      s.on('courier:loc', onLoc); s.on('connect', onConn); s.on('disconnect', onDisc);
      cleanup = () => { s.off('courier:loc', onLoc); s.off('connect', onConn); s.off('disconnect', onDisc); };
    })();
    return () => cleanup();
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onMessage = (e: any) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'ready') { ready.current = true; loadAll(); }
      else if (m.type === 'eta') { setEtas((m.list || []).sort((a: Eta, b: Eta) => (a.min ?? 1e9) - (b.min ?? 1e9))); }
      else if (m.type === 'pick') { saveOmbor(m.lat, m.lng); }
      else if (m.type === 'locate') { showMe(); }
      else if (m.type === 'route') { setRoute({ id: m.id, min: m.min, km: m.km }); }
    } catch {}
  };

  const startPick = () => { setPicking(true); inject('window.enterPickMode()'); };
  const cancelPick = () => { setPicking(false); inject('window.cancelPick()'); };
  const confirmPick = () => { inject('window.confirmPick()'); };

  // Ombor belgilash: joriy joylashuv YOKI xaritadan tanlash
  const omborMenu = () => {
    Alert.alert('Ombor joylashuvi', 'Omborni qanday belgilaysiz?', [
      { text: 'Joriy joylashuvim', onPress: async () => { const p = await getPos(); if (p) saveOmbor(p.lat, p.lng); } },
      { text: 'Xaritadan tanlash', onPress: startPick },
      { text: 'Bekor', style: 'cancel' },
    ]);
  };

  const saveOmbor = async (lat: number, lng: number) => {
    try {
      const o = await api.rootPost('/api/settings/ombor', { lat, lng, name: 'Ombor' });
      setOmbor(o); setPicking(false);
      inject(`window.setOmbor(${JSON.stringify(o)})`);
      inject(`window.setMe(${lat},${lng},false)`);
      Alert.alert('Saqlandi', 'Ombor joylashuvi belgilandi ✓');
    } catch (err: any) { Alert.alert('Xato', err.message); setPicking(false); }
  };

  const focus = (id: number) => { setSel(id); setRoute(null); inject(`window.focusCourier(${id})`); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Xarita" subtitle={`${etas.length} kuryer · ${ombor ? 'ombor belgilangan' : 'ombor belgilanmagan'}`}
        right={<Badge label={online ? 'Online' : 'Ulanmoqda…'} color={online ? colors.success : colors.warning} />} />

      <View style={{ flex: 1 }}>
        <WebView
          ref={web} originWhitelist={['*']} source={{ html: MAP_HTML }} onMessage={onMessage}
          javaScriptEnabled domStorageEnabled geolocationEnabled startInLoadingState
          onGeolocationPermissionsShowPrompt={(_o: any, cb: any) => cb && cb(true, true)}
          renderLoading={() => <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}><ActivityIndicator size="large" color={colors.primary} /></View>}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />

        {/* "Siz" (native GPS) tugmasi — o'ng past */}
        <TouchableOpacity onPress={showMe} activeOpacity={0.85}
          style={{ position: 'absolute', right: 12, bottom: 78, width: 46, height: 46, borderRadius: 14, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
          {locating ? <ActivityIndicator size="small" color={colors.info} /> : <Ionicons name="locate" size={22} color={colors.info} />}
        </TouchableOpacity>

        {picking ? (
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={cancelPick} style={{ flex: 1, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' }}>
              <T weight="800" color={colors.textMuted}>Bekor</T>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmPick} style={{ flex: 2, backgroundColor: colors.success, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <T weight="800" color="#fff">Shu yerni ombor qilish</T>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={omborMenu} style={{ position: 'absolute', top: 12, left: 12, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5, elevation: 3 }}>
            <Ionicons name="business" size={16} color={colors.success} />
            <T size="sm" weight="800" color={colors.success}>{ombor ? "Omborni o'zgartirish" : 'Omborni belgilash'}</T>
          </TouchableOpacity>
        )}
      </View>

      {/* Pastki kuryer ro'yxati — omborga yetib kelish */}
      <View style={{ backgroundColor: colors.bgElevated, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, paddingBottom: 4, maxHeight: 210 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: 6 }}>
          <Ionicons name="navigate" size={15} color={colors.textMuted} />
          <T size="xs" weight="800" color={colors.textMuted} style={{ marginLeft: 6, letterSpacing: 0.6 }}>KURYERLAR · OMBORGA YETIB KELISH</T>
        </View>
        {etas.length === 0 ? (
          <View style={{ paddingVertical: 22, alignItems: 'center' }}>
            <T size="sm" color={colors.textDim} weight="600">Kuryerlar hali joylashuv uzatmagan</T>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 168 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 8 }}>
            {etas.map((c) => (
              <TouchableOpacity key={c.id} activeOpacity={0.85} onPress={() => focus(c.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radii.md, marginBottom: 7, backgroundColor: sel === c.id ? colors.primary + '14' : colors.bgCard, borderWidth: 1, borderColor: sel === c.id ? colors.primary : colors.border }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: (c.speed && c.speed > 0.8 ? colors.success : colors.primary) + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={c.heading != null ? 'navigate' : 'person'} size={17} color={c.speed && c.speed > 0.8 ? colors.success : colors.primary}
                    style={c.heading != null ? { transform: [{ rotate: `${(c.heading || 0) - 45}deg` }] } : undefined} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size="sm" weight="800" numberOfLines={1}>{c.name}</T>
                  <T size="xs" color={colors.textDim} weight="600">
                    {ago(c.updated_at)}
                    {c.speed && c.speed > 0.8 ? ` · ${Math.round(c.speed * 3.6)} km/soat` : ' · turibdi'}
                    {dirLabel(c.heading) ? ` · ${dirLabel(c.heading)}` : ''}
                  </T>
                </View>
                {(() => {
                  const r = sel === c.id && route && route.id === c.id ? route : null;
                  const min = r ? r.min : c.min; const km = r ? r.km : c.km;
                  return min != null ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <T size="md" weight="900" color={colors.primary}>{min} daq</T>
                      <T size="xs" color={colors.textMuted} weight="600">{Number(km).toFixed(1)} km{r ? ' · yo\'l' : ''}</T>
                    </View>
                  ) : (
                    <T size="xs" color={colors.textDim} weight="600">{ombor ? '—' : "ombor yo'q"}</T>
                  );
                })()}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

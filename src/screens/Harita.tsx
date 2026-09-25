import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { connectSocket, getSocket } from '../socket';
import { Header, T, Badge } from '../components/ui';
import { MAP_HTML } from '../mapHtml';
import { colors, spacing, radii } from '../theme';

type Eta = { id: number; name: string; km: number | null; min: number | null; updated_at?: string };

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

  const inject = (js: string) => { try { web.current?.injectJavaScript(js + ';true;'); } catch {} };

  const loadAll = useCallback(async () => {
    try {
      const [rows, omb] = await Promise.all([
        api.get('/api/couriers/locations').catch(() => []),
        api.get('/api/settings/ombor').catch(() => null),
      ]);
      setOmbor(omb);
      if (ready.current) {
        if (omb) inject(`window.setOmbor(${JSON.stringify(omb)})`);
        inject(`window.setCouriers(${JSON.stringify(rows || [])})`);
      }
    } catch {}
  }, []);

  // Socket — o'zi ulanadi (idempotent), keyin tinglaydi. "Ulanmoqda" osilib qolmaydi.
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
    } catch {}
  };

  const startPick = () => { setPicking(true); inject('window.enterPickMode()'); };
  const cancelPick = () => { setPicking(false); inject('window.cancelPick()'); };
  const confirmPick = () => { inject('window.confirmPick()'); };

  const saveOmbor = async (lat: number, lng: number) => {
    try {
      const o = await api.post('/api/settings/ombor', { lat, lng, name: 'Ombor' });
      setOmbor(o); setPicking(false);
      inject(`window.setOmbor(${JSON.stringify(o)})`);
      Alert.alert('Saqlandi', 'Ombor joylashuvi belgilandi');
    } catch (err: any) { Alert.alert('Xato', err.message); setPicking(false); }
  };

  const focus = (id: number) => { setSel(id); inject(`window.focusCourier(${id})`); };

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
          <TouchableOpacity onPress={startPick} style={{ position: 'absolute', top: 12, left: 12, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
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
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size="sm" weight="800" numberOfLines={1}>{c.name}</T>
                  <T size="xs" color={colors.textDim} weight="600">{ago(c.updated_at)}</T>
                </View>
                {c.min != null ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <T size="md" weight="900" color={colors.primary}>{c.min} daq</T>
                    <T size="xs" color={colors.textMuted} weight="600">{c.km?.toFixed(1)} km</T>
                  </View>
                ) : (
                  <T size="xs" color={colors.textDim} weight="600">{ombor ? '—' : "ombor yo'q"}</T>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

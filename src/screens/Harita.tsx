import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { getSocket } from '../socket';
import { T, Badge } from '../components/ui';
import { MAP_HTML } from '../mapHtml';
import { colors, spacing } from '../theme';

export default function Harita() {
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(false);

  const inject = (js: string) => { try { web.current?.injectJavaScript(js + ';true;'); } catch {} };

  const loadAll = useCallback(async () => {
    try {
      const rows = (await api.get('/api/couriers/locations')) || [];
      setCount(rows.length);
      if (ready.current) inject(`window.setCouriers(${JSON.stringify(rows)})`);
    } catch {}
  }, []);

  // Jonli yangilanish (socket)
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onLoc = (c: any) => { if (ready.current) inject(`window.updateCourier(${JSON.stringify(c)})`); };
    const onConn = () => setOnline(true);
    const onDisc = () => setOnline(false);
    setOnline(s.connected);
    s.on('courier:loc', onLoc);
    s.on('connect', onConn);
    s.on('disconnect', onDisc);
    return () => { s.off('courier:loc', onLoc); s.off('connect', onConn); s.off('disconnect', onDisc); };
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const onMessage = (e: any) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'ready') { ready.current = true; loadAll(); }
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <T size="xl" weight="900">Kuryerlar xaritasi</T>
          <T size="xs" color={colors.textMuted} weight="600">{count} ta kuryer · jonli</T>
        </View>
        <Badge label={online ? 'Online' : 'Ulanmoqda…'} color={online ? colors.success : colors.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <WebView
          ref={web}
          originWhitelist={['*']}
          source={{ html: MAP_HTML }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}><ActivityIndicator size="large" color={colors.primary} /></View>}
          style={{ flex: 1, backgroundColor: colors.bg }}
        />
      </View>
    </View>
  );
}

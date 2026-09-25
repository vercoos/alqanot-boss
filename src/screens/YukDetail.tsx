import React, { useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, TextInput, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { T, Button, Card, money, Badge, Header } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';
import { STATUS } from './Yuk';

export default function YukDetail({ route, navigation }: any) {
  const id = route.params?.id;
  const [o, setO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api.get(`/api/orders/${id}`);
      setO(d);
      if (d?.payment?.amount != null) setAmount(String(Math.round(d.payment.amount)));
      else if (d?.total_amount != null) setAmount(String(Math.round(d.total_amount)));
    } catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setStatus = async (status: string) => {
    setBusy(true);
    try { await api.post(`/api/orders/${id}/status`, { status }); await load(); }
    catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setBusy(false); }
  };
  const collect = async () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) { Alert.alert('Pul', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post(`/api/orders/${id}/collect`, { amount: amt }); await load(); Alert.alert('Tayyor', 'Olingan pul belgilandi'); }
    catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setBusy(false); }
  };
  const openNav = () => {
    if (o?.dest_lat == null || o?.dest_lng == null) { Alert.alert('Manzil', 'Koordinata yo\'q'); return; }
    const url = `yandexnavi://build_route_on_map?lat_to=${o.dest_lat}&lon_to=${o.dest_lng}`;
    Linking.canOpenURL(url).then((ok) => Linking.openURL(ok ? url : `https://yandex.uz/maps/?rtext=~${o.dest_lat},${o.dest_lng}&rtt=auto`));
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }}><Header title="Yuk" onBack={() => navigation.goBack()} /><ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /></View>;
  if (!o) return null;

  const st = STATUS[o.status] || STATUS.new;
  const p = o.payment;
  const payLabel = !p ? 'belgilanmagan' : p.status === 'confirmed' ? 'Tasdiqlandi' : 'Kutilmoqda';
  const payColor = !p ? colors.textDim : p.status === 'confirmed' ? colors.success : colors.warning;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={`Yuk №${o.id}`} subtitle={o.client_name || ''} onBack={() => navigation.goBack()}
        right={<Badge label={st.label} color={st.color} />} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <T size="md" weight="700" style={{ flex: 1 }}>{o.dest_address || 'Manzil ko\'rsatilmagan'}</T>
          </View>
          {o.client_phone ? <T size="sm" color={colors.textMuted}>Tel: {o.client_phone}</T> : null}
          {(o.dest_lat != null && o.dest_lng != null) && (
            <Button title="Navigatorда ochish" icon="navigate" variant="ghost" onPress={openNav} style={{ marginTop: 10 }} />
          )}
        </Card>

        <Card style={{ marginBottom: 12 }}>
          <T size="sm" weight="800" color={colors.textMuted} style={{ marginBottom: 8 }}>MAHSULOTLAR</T>
          {(o.items || []).map((it: any) => (
            <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <T size="sm" weight="600" style={{ flex: 1 }} numberOfLines={1}>{it.name}</T>
              <T size="sm" color={colors.textMuted}>{it.qty} × {money(it.price)}</T>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <T size="md" weight="800">Jami</T>
            <T size="md" weight="900" color={colors.primary}>{money(o.total_amount)}</T>
          </View>
        </Card>

        {/* Holat tugmalari */}
        {o.status === 'assigned' && <Button title="Yo'lga chiqdim" icon="car" onPress={() => setStatus('on_way')} loading={busy} style={{ marginBottom: 10 }} />}
        {o.status === 'on_way' && <Button title="Yetkazdim" icon="checkmark-done" variant="success" onPress={() => setStatus('delivered')} loading={busy} style={{ marginBottom: 10 }} />}

        {/* Pul */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <T size="sm" weight="800" color={colors.textMuted}>OLINGAN PUL</T>
            <Badge label={payLabel} color={payColor} />
          </View>
          <T size="xs" color={colors.textMuted} weight="600" style={{ marginBottom: 6 }}>Summa (so'm)</T>
          <TextInput
            value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
            keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim}
            editable={!p || p.status !== 'confirmed'}
            style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 13, paddingHorizontal: 14, color: colors.text, fontSize: fontSize.lg, fontWeight: '800', marginBottom: 12 }}
          />
          {(!p || p.status !== 'confirmed') && <Button title={p ? 'Summani yangilash' : 'Olingan pulni belgilash'} icon="cash" onPress={collect} loading={busy} />}
        </Card>
      </ScrollView>
    </View>
  );
}

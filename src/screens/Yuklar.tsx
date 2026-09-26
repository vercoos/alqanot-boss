import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { getSocket } from '../socket';
import { T, money, kg, Button, Row, Badge } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Yangi', color: colors.info },
  assigned: { label: 'Biriktirilgan', color: colors.warning },
  on_way: { label: "Yo'lda", color: colors.primary },
  delivered: { label: 'Yetkazilgan', color: colors.success },
  canceled: { label: 'Bekor', color: colors.danger },
};

export default function Yuklar() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const load = useCallback(async () => {
    try { setList((await api.rootGet('/api/orders')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const on = () => load();
    s.on('order:assigned', on); s.on('order:update', on);
    return () => { s.off('order:assigned', on); s.off('order:update', on); };
  }, [load]);

  const active = list.filter((o) => o.status !== 'delivered' && o.status !== 'canceled');
  const done = list.filter((o) => o.status === 'delivered' || o.status === 'canceled');

  const Card = (o: any) => {
    const st = STATUS[o.status] || STATUS.new;
    const paid = o.payment_status === 'confirmed';
    return (
      <TouchableOpacity key={o.id} activeOpacity={0.85} onPress={() => openDetail(o.id)}
        style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: 10 }}>
        <Row justify="space-between">
          <View style={{ flex: 1 }}>
            <T size="md" weight="800" numberOfLines={1}>{o.client_name || 'Mijoz'}</T>
            <T size="xs" color={colors.textMuted} weight="600" numberOfLines={1}>{o.dest_address || o.client_phone || '—'}</T>
          </View>
          <Badge label={st.label} color={st.color} />
        </Row>
        <Row justify="space-between" style={{ marginTop: 10 }}>
          <T size="lg" weight="900">{money(o.total_amount)}</T>
          {o.payment_id ? <T size="xs" weight="700" color={paid ? colors.success : colors.warning}>{paid ? 'Pul tasdiqlangan' : 'Pul kiritilgan'}</T>
            : <T size="xs" weight="700" color={colors.textDim}>pul kiritilmagan</T>}
        </Row>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xxl" weight="800">Yuklar</T>
        <T size="sm" color={colors.textMuted} weight="600">{active.length} ta yetkazish · {done.length} ta bajarilgan</T>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {active.length === 0 && done.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="cube-outline" size={48} color={colors.textDim} />
              <T color={colors.textMuted} weight="600" style={{ marginTop: 12 }}>Sizga yuk biriktirilmagan</T>
            </View>
          )}
          {active.map(Card)}
          {done.length > 0 && <T size="xs" weight="800" color={colors.textMuted} style={{ marginTop: 14, marginBottom: 8, letterSpacing: 1 }}>BAJARILGAN</T>}
          {done.map(Card)}
        </ScrollView>
      )}
      <DetailSheet detail={detail} onClose={() => setDetail(null)} onDone={() => { setDetail(null); load(); }} reload={openDetail} />
    </View>
  );

  async function openDetail(id: number) {
    try { setDetail(await api.rootGet(`/api/orders/${id}`)); } catch (e: any) { Alert.alert('Xato', e.message); }
  }
}

function DetailSheet({ detail, onClose, onDone, reload }: any) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (detail) setAmount(detail.payment?.amount ? String(Math.round(detail.payment.amount)) : ''); }, [detail?.id]);
  if (!detail) return null;
  const o = detail;
  const items = o.items || [];
  const st = STATUS[o.status] || STATUS.new;

  const setStatus = async (status: string) => {
    setBusy(true);
    try { await api.rootPost(`/api/orders/${o.id}/status`, { status }); reload(o.id); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const collect = async () => {
    const v = parseFloat(amount) || 0;
    if (v < 0) { Alert.alert('Summa', 'To\'g\'ri summa kiriting'); return; }
    setBusy(true);
    try {
      await api.rootPost(`/api/orders/${o.id}/collect`, { amount: v });
      if (o.status !== 'delivered') await api.rootPost(`/api/orders/${o.id}/status`, { status: 'delivered' });
      Alert.alert('Saqlandi', 'Mijoz puli kiritildi — boshliq tasdiqlaydi'); onDone();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const nav = () => {
    const url = o.dest_lat && o.dest_lng ? `https://www.google.com/maps/dir/?api=1&destination=${o.dest_lat},${o.dest_lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.dest_address || '')}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <T size="lg" weight="800">{o.client_name || 'Mijoz'} · №{o.id}</T>
              <T size="sm" color={colors.textMuted}>{o.dest_address || '—'}</T>
            </View>
            <Badge label={st.label} color={st.color} />
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 10 }}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
            <Row gap={10} style={{ marginBottom: 14 }}>
              {o.client_phone ? <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.client_phone}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.success + '16', borderRadius: radii.md, paddingVertical: 12 }}><Ionicons name="call" size={18} color={colors.success} /><T weight="800" color={colors.success}>Qo'ng'iroq</T></TouchableOpacity> : null}
              <TouchableOpacity onPress={nav} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.info + '16', borderRadius: radii.md, paddingVertical: 12 }}><Ionicons name="navigate" size={18} color={colors.info} /><T weight="800" color={colors.info}>Navigatsiya</T></TouchableOpacity>
            </Row>

            <T size="sm" weight="800" color={colors.textMuted} style={{ marginBottom: 8 }}>YUK (MAHSULOTLAR)</T>
            {items.map((it: any) => (
              <Row key={it.id} justify="space-between" style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <T size="sm" weight="700" style={{ flex: 1 }} numberOfLines={1}>{it.name}</T>
                <T size="sm" color={colors.textMuted} weight="600">{kg(it.qty)} × {money(it.price)}</T>
              </Row>
            ))}
            <Row justify="space-between" style={{ marginTop: 12 }}>
              <T size="md" weight="800">Jami</T><T size="lg" weight="900" color={colors.primary}>{money(o.total_amount)}</T>
            </Row>

            {o.status !== 'delivered' && o.status !== 'canceled' && (
              <View style={{ marginTop: 18 }}>
                {o.status !== 'on_way' && <Button title="Yo'lga chiqdim" icon="car" variant="secondary" onPress={() => setStatus('on_way')} loading={busy} style={{ marginBottom: 10 }} />}
              </View>
            )}

            <T size="sm" weight="800" color={colors.textMuted} style={{ marginTop: 18, marginBottom: 6 }}>MIJOZ BERGAN PUL</T>
            <TextInput value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 16, color: colors.text, fontWeight: '900', fontSize: fontSize.xl, textAlign: 'center', marginBottom: 14 }} />
            <Button title="Yetkazdim + pulni saqlash" icon="checkmark-done" onPress={collect} loading={busy} />
            <T size="xs" color={colors.textDim} style={{ textAlign: 'center', marginTop: 10 }}>Kiritilgan pulni boshliq/bugalter tasdiqlaydi</T>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { getSocket } from '../socket';
import { Header, T, money, kg, Button, Row, Badge } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Tasdiqlash({ navigation }: any) {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  const load = useCallback(async () => {
    try { const d = await api.rootGet('/api/drafts'); setSales(d?.sales || []); setPurchases(d?.purchases || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Ombordan (omborchi) yangi draft kelganda — avtomatik yangilanadi
  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const on = () => load();
    s.on('order:update', on); s.on('purchase:new', on);
    return () => { s.off('order:update', on); s.off('purchase:new', on); };
  }, [load]);

  const total = sales.length + purchases.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Tasdiqlash" subtitle={total ? `${total} ta ombordan kutmoqda` : 'Kutayotgan yo\'q'} onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
        right={total ? <Badge label={String(total)} color={colors.warning} /> : undefined} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {total === 0 && (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="checkmark-done-circle-outline" size={54} color={colors.success} />
              <T color={colors.textMuted} weight="600" style={{ marginTop: 12, textAlign: 'center' }}>Hammasi tasdiqlangan.{'\n'}Omborchi yuk kiritsa, shu yerda avtomatik ko'rinadi.</T>
            </View>
          )}
          {sales.length > 0 && <T size="xs" weight="800" color={colors.textMuted} style={{ marginBottom: 8, letterSpacing: 1 }}>SOTUV (MIJOZGA) — NARX QO'YING</T>}
          {sales.map((o) => <DraftCard key={'s' + o.id} d={o} kind="sale" onPress={() => setEdit({ ...o, kind: 'sale' })} />)}
          {purchases.length > 0 && <T size="xs" weight="800" color={colors.textMuted} style={{ marginTop: 16, marginBottom: 8, letterSpacing: 1 }}>XARID (YETKAZUVCHIDAN) — NARX QO'YING</T>}
          {purchases.map((p) => <DraftCard key={'p' + p.id} d={p} kind="purchase" onPress={() => setEdit({ ...p, kind: 'purchase' })} />)}
        </ScrollView>
      )}
      <ConfirmSheet edit={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />
    </View>
  );
}

function DraftCard({ d, kind, onPress }: any) {
  const who = kind === 'sale' ? d.client_name : d.supplier_name;
  const items = d.items || [];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.warning + '55', padding: spacing.lg, marginBottom: 10 }}>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <T size="md" weight="800" numberOfLines={1}>{who || (kind === 'sale' ? 'Mijoz' : 'Yetkazuvchi')} · №{d.id}</T>
          <T size="xs" color={colors.textMuted} weight="600">{d.created_by_name ? `${d.created_by_name} · ` : ''}{new Date(d.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</T>
        </View>
        <Badge label="narx kerak" color={colors.warning} />
      </Row>
      <View style={{ marginTop: 8 }}>
        {items.slice(0, 4).map((it: any) => (
          <Row key={it.id} justify="space-between" style={{ paddingVertical: 3 }}>
            <T size="sm" weight="600" style={{ flex: 1 }} numberOfLines={1}>{it.name}</T>
            <T size="sm" color={colors.textMuted} weight="700">{kg(it.qty)}</T>
          </Row>
        ))}
        {items.length > 4 && <T size="xs" color={colors.textDim}>+{items.length - 4} ta yana</T>}
      </View>
      <Row gap={6} style={{ marginTop: 10, justifyContent: 'flex-end' }}>
        <Ionicons name="pricetag" size={15} color={colors.primary} />
        <T size="sm" weight="800" color={colors.primary}>Narx qo'yib tasdiqlash</T>
      </Row>
    </TouchableOpacity>
  );
}

function ConfirmSheet({ edit, onClose, onDone }: any) {
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (edit) { setPrices({}); setPaid(''); } }, [edit?.id]);
  if (!edit) return null;
  const items = edit.items || [];
  const total = items.reduce((s: number, it: any) => s + (parseFloat(prices[it.id]) || 0) * (Number(it.qty) || 0), 0);
  const isSale = edit.kind === 'sale';

  const submit = async () => {
    const payload = { items: items.map((it: any) => ({ id: it.id, price: parseFloat(prices[it.id]) || 0 })), paidAmount: parseFloat(paid) || 0 };
    if (payload.items.some((x: any) => !(x.price > 0))) { Alert.alert('Narx', 'Har bir mahsulotga narx qo\'ying'); return; }
    setBusy(true);
    try {
      await api.rootPost(`/api/${isSale ? 'orders' : 'purchases'}/${edit.id}/confirm-price`, payload);
      Alert.alert('Tasdiqlandi', isSale ? 'Sotuv tasdiqlandi — ombordan ayrildi + qarz yozildi' : 'Xarid tasdiqlandi — omborga qo\'shildi + qarz');
      onDone();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal visible={!!edit} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <T size="lg" weight="800">{(isSale ? edit.client_name : edit.supplier_name) || (isSale ? 'Mijoz' : 'Yetkazuvchi')} · №{edit.id}</T>
              <T size="sm" color={colors.textMuted}>{isSale ? 'Sotuv — mijozga narx' : 'Xarid — kelish narxi'}</T>
            </View>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
            {items.map((it: any) => (
              <View key={it.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 10 }}>
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <T weight="700" style={{ flex: 1 }} numberOfLines={1}>{it.name}</T>
                  <T size="sm" color={colors.textMuted} weight="700">{kg(it.qty)}</T>
                </Row>
                <Row gap={8} align="center">
                  <T size="xs" color={colors.textMuted} weight="700">Narx (1 birlik):</T>
                  <TextInput value={(prices[it.id] || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setPrices((p) => ({ ...p, [it.id]: t.replace(/\D/g, '') }))}
                    keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim}
                    style={{ flex: 1, backgroundColor: colors.bgInput, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 10, color: colors.text, fontWeight: '800', textAlign: 'center' }} />
                  <T size="sm" weight="800" color={colors.primary}>{money((parseFloat(prices[it.id]) || 0) * (Number(it.qty) || 0))}</T>
                </Row>
              </View>
            ))}
            <Row justify="space-between" style={{ marginVertical: 12 }}><T size="md" weight="800">Jami</T><T size="xl" weight="900" color={colors.primary}>{money(total)}</T></Row>
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>{isSale ? "Mijoz to'lagan" : "Biz to'ladik"}</T>
            <TextInput value={paid.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setPaid(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, color: colors.text, fontWeight: '800', fontSize: fontSize.md, marginBottom: 16 }} />
            <Button title="Tasdiqlash" icon="checkmark-done" loading={busy} onPress={submit} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

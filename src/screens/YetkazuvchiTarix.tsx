import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '../api';
import { Header, T, money, Button, Input, Row } from '../components/ui';
import { colors, spacing, radii } from '../theme';

const TYPE_LABEL: any = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" };
const PERIODS = [{ k: 'all', l: 'Hammasi' }, { k: 'day', l: 'Bugun' }, { k: 'week', l: 'Hafta' }, { k: 'month', l: 'Oy' }, { k: 'year', l: 'Yil' }];

export default function YetkazuvchiTarix({ route, navigation }: any) {
  const id = route?.params?.id;
  const [d, setD] = useState<any>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [dl, setDl] = useState(false);

  const downloadExcel = async () => {
    setDl(true);
    try {
      const r = await api.get(`/boss/supplier-detail/${id}/excel?period=${period}`);
      const uri = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') + (r.filename || 'yetkazuvchi.xlsx');
      await FileSystem.writeAsStringAsync(uri, r.base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Yetkazuvchi hisoboti (Excel)', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
      } else { Alert.alert('Saqlandi', uri); }
    } catch (e: any) { Alert.alert('Xatolik', e?.message || 'Excel yuklab bo\'lmadi'); } finally { setDl(false); }
  };

  const load = useCallback(async () => {
    try { setD(await api.get(`/boss/supplier-detail/${id}?period=${period}`)); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [id, period]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doPay = async () => {
    if (!(parseFloat(payAmount) > 0)) { Alert.alert('Summa', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post('/boss/payment/supplier', { supplierId: id, amount: parseFloat(payAmount) }); setPayOpen(false); setPayAmount(''); Alert.alert('Tayyor', 'To\'lov yozildi — qarzdan ayrildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const s = d?.supplier;
  const name = route?.params?.name || (s ? (s.organization || [s.firstName, s.lastName].filter(Boolean).join(' ')) : '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={name || 'Yetkazib beruvchi'} subtitle={s?.phone || ''} onBack={() => navigation.goBack()} />
      {loading && !d ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : d ? (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.md }}>
            {PERIODS.map((p) => (
              <TouchableOpacity key={p.k} onPress={() => setPeriod(p.k)} style={{ flex: 1, paddingVertical: 8, borderRadius: radii.sm, backgroundColor: period === p.k ? colors.primary : colors.bgCard, borderWidth: 1, borderColor: period === p.k ? colors.primary : colors.border, alignItems: 'center' }}>
                <T size="xs" weight="800" color={period === p.k ? '#fff' : colors.textMuted}>{p.l}</T>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl }}>
            <T size="sm" color={colors.textMuted} weight="700">Bizning qarzimiz</T>
            <T size="hero" weight="900" color={d.debt > 0 ? colors.danger : colors.success} numberOfLines={1} style={{ marginTop: 4 }}>{money(d.debt)}</T>
            <Row gap={spacing.md} style={{ marginTop: spacing.md }}>
              <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted} weight="600">Jami olingan</T><T size="md" weight="800">{money(d.totalBought)}</T></View>
              <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted} weight="600">Jami to'langan</T><T size="md" weight="800">{money(d.totalPaid)}</T></View>
            </Row>
          </View>

          {d.debt > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Button title="To'lov qilish" icon="cash-outline" onPress={() => { setPayAmount(''); setPayOpen(true); }} />
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            <Button title={dl ? 'Tayyorlanmoqda...' : 'Excel yuklab olish'} variant="secondary" icon="download-outline" onPress={downloadExcel} loading={dl} />
          </View>

          <T size="sm" weight="800" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4, letterSpacing: 1 }}>XARIDLAR ({d.purchases.length})</T>
          {d.purchases.length === 0 && <T size="sm" color={colors.textDim} style={{ marginLeft: 4 }}>Xarid yo'q</T>}
          {d.purchases.map((p: any) => {
            const debt = Math.max(0, (p.total_amount || 0) - (p.paid_amount || 0));
            return (
              <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => navigation.navigate('Chek', { id: p.id, kind: 'purchase' })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.warning + '16', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="download-outline" size={18} color={colors.warning} /></View>
                <View style={{ flex: 1 }}>
                  <T size="sm" weight="800">{money(p.total_amount)}</T>
                  <T size="xs" color={colors.textDim} weight="600">{new Date(p.created_at).toLocaleDateString('ru-RU')} · №{p.id}</T>
                </View>
                {debt > 0 ? <T size="xs" weight="700" color={colors.danger}>qarz {money(debt)}</T> : <T size="xs" weight="700" color={colors.success}>to'liq</T>}
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </TouchableOpacity>
            );
          })}

          <T size="sm" weight="800" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4, letterSpacing: 1 }}>TO'LOVLAR ({d.payments.length})</T>
          {d.payments.length === 0 && <T size="sm" color={colors.textDim} style={{ marginLeft: 4 }}>To'lov yo'q</T>}
          {d.payments.map((p: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.success + '16', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="cash-outline" size={18} color={colors.success} /></View>
              <View style={{ flex: 1 }}>
                <T size="sm" weight="800" color={colors.success}>+{money(p.amount)}</T>
                <T size="xs" color={colors.textDim} weight="600">{new Date(p.created_at).toLocaleDateString('ru-RU')} · {TYPE_LABEL[p.type] || p.type}</T>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : <T color={colors.danger} style={{ marginTop: 40, textAlign: 'center' }}>Yetkazib beruvchi topilmadi</T>}

      <Modal visible={payOpen} transparent animationType="fade" onRequestClose={() => setPayOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
            <T size="lg" weight="800">{name}</T>
            <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.md }}>Bizning qarzimiz: {money(d?.debt || 0)}</T>
            <Input money label="To'lov summasi (so'm)" value={payAmount} onChangeText={setPayAmount} placeholder="0" icon="cash-outline" />
            <TouchableOpacity onPress={() => setPayAmount(String(Math.round(d?.debt || 0)))}><T size="sm" weight="700" color={colors.primary} style={{ marginBottom: 8 }}>To'liq to'lash: {money(d?.debt || 0)}</T></TouchableOpacity>
            {parseFloat(payAmount) > 0 ? <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.md }}>Keyin qoladi: <T size="sm" weight="800" color={colors.text}>{money(Math.max(0, (d?.debt || 0) - parseFloat(payAmount)))}</T></T> : <View style={{ marginBottom: spacing.md }} />}
            <Row gap={spacing.md}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setPayOpen(false)} /></View>
              <View style={{ flex: 1 }}><Button title="To'lash" onPress={doPay} loading={busy} /></View>
            </Row>
          </View>
        </View>
      </Modal>
    </View>
  );
}

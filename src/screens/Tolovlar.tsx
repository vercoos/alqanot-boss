import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { getSocket } from '../socket';
import { T, money, Badge, Button, Card } from '../components/ui';
import { colors, spacing } from '../theme';

export default function Tolovlar() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'pending' | 'confirmed'>('pending');

  const load = useCallback(async () => {
    try { setList((await api.get(`/api/payments?status=${tab}`)) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [tab]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const onPay = () => load();
    s.on('payment:update', onPay);
    return () => { s.off('payment:update', onPay); };
  }, [load]);

  const confirm = async (id: number) => {
    try { await api.post(`/api/payments/${id}/confirm-boss`); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 10, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xl" weight="900">To'lovlar</T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {(['pending', 'confirmed'] as const).map((t) => (
            <Button key={t} title={t === 'pending' ? 'Kutilmoqda' : 'Tasdiqlangan'} variant={tab === t ? 'primary' : 'ghost'} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 9 }} />
          ))}
        </View>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {list.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 60 }}><Ionicons name="cash-outline" size={54} color={colors.textDim} /><T color={colors.textMuted} weight="600" style={{ marginTop: 12 }}>Bo'sh</T></View>}
          {list.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <T size="md" weight="800">Buyurtma №{p.order_id}</T>
                  <T size="xs" color={colors.textMuted} weight="600">{p.courier_name || 'kuryer'} oldi</T>
                </View>
                <T size="lg" weight="900" color={colors.primary}>{money(p.amount)}</T>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                {p.status === 'confirmed'
                  ? <Badge label={p.buxgalter_ok ? 'Bugalter tasdiqladi' : 'Boshliq tasdiqladi'} color={colors.success} />
                  : <Badge label="Kutilmoqda" color={colors.warning} />}
              </View>
              {p.status !== 'confirmed' && <Button title="Tasdiqlayman" icon="checkmark-done" variant="success" onPress={() => confirm(p.id)} style={{ marginTop: 10 }} />}
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

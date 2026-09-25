import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuth } from '../store';
import { checkUpdate } from '../update';
import { T, money, Badge } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Yangi', color: '#5B8DEF' },
  assigned: { label: 'Biriktirildi', color: '#E0A33C' },
  on_way: { label: "Yo'lda", color: '#F0813F' },
  delivered: { label: 'Yetkazildi', color: '#33C08A' },
  canceled: { label: 'Bekor', color: '#E8604C' },
};

export default function Yuk({ navigation }: any) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setList((await api.get('/api/orders')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = list.filter((o) => o.status !== 'delivered' && o.status !== 'canceled');
  const done = list.filter((o) => o.status === 'delivered' || o.status === 'canceled');

  const Row = (o: any) => {
    const st = STATUS[o.status] || STATUS.new;
    const paid = o.payment_status === 'confirmed';
    return (
      <TouchableOpacity key={o.id} activeOpacity={0.85} onPress={() => navigation.navigate('YukDetail', { id: o.id })}
        style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="cube" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <T size="md" weight="800" numberOfLines={1}>{o.client_name || 'Mijoz'} · №{o.id}</T>
            <T size="xs" color={colors.textMuted} weight="600" numberOfLines={1}>{o.dest_address || '—'}</T>
          </View>
          <Badge label={st.label} color={st.color} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <T size="lg" weight="900">{money(o.total_amount)}</T>
          {o.paid_amount != null
            ? <Badge label={paid ? 'Pul tasdiqlandi' : 'Pul: kutilmoqda'} color={paid ? colors.success : colors.warning} />
            : <T size="xs" color={colors.textDim} weight="600">pul belgilanmagan</T>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <T size="xl" weight="900">Yuklar</T>
          <T size="xs" color={colors.textMuted} weight="600">{user?.full_name || 'Kuryer'} · joylashuv uzatilmoqda</T>
        </View>
        <TouchableOpacity onPress={() => checkUpdate(false)}
          style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgInput, marginRight: 8 }}>
          <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Chiqish', 'Rostdan chiqasizmi?', [{ text: 'Yo\'q' }, { text: 'Ha', onPress: () => logout() }])}
          style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgInput }}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {list.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="cube-outline" size={54} color={colors.textDim} />
              <T size="md" color={colors.textMuted} weight="600" style={{ marginTop: 12 }}>Hozircha yuk yo'q</T>
            </View>
          )}
          {active.length > 0 && <T size="sm" weight="800" color={colors.textMuted} style={{ marginBottom: 8 }}>FAOL ({active.length})</T>}
          {active.map(Row)}
          {done.length > 0 && <T size="sm" weight="800" color={colors.textMuted} style={{ marginTop: 12, marginBottom: 8 }}>TUGATILGAN ({done.length})</T>}
          {done.map(Row)}
        </ScrollView>
      )}
    </View>
  );
}

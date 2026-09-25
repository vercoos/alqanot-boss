import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export default function XaridTarix({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setList(await api.get('/boss/purchases') || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Xaridlar tarixi" subtitle="Yetkazuvchidan kelgan yuklar — chekni ko'rish" onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {list.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 60 }}><Ionicons name="download-outline" size={54} color={colors.textDim} /><T size="md" color={colors.textMuted} weight="600" style={{ marginTop: 12 }}>Hali xarid yo'q</T></View>}
          {list.map((p) => {
            const debt = Math.max(0, (p.total_amount || 0) - (p.paid_amount || 0));
            const name = p.organization || [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
            return (
              <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => navigation.navigate('Chek', { id: p.id, kind: 'purchase' })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warning + '16', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="download-outline" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size="sm" weight="800" numberOfLines={1}>{name}</T>
                  <T size="xs" color={colors.textDim} weight="600">{new Date(p.created_at).toLocaleString('ru-RU')} · №{p.id}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T size="sm" weight="900">{money(p.total_amount)}</T>
                  {debt > 0 ? <T size="xs" weight="700" color={colors.danger}>qarz {money(debt)}</T> : <T size="xs" weight="700" color={colors.success}>to'liq</T>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

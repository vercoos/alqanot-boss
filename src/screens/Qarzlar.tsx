import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { T, money, Card } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export default function Qarzlar() {
  const [tab, setTab] = useState<'client' | 'supplier'>('client');
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const [c, s] = await Promise.all([api.get('/api/clients'), api.get('/api/suppliers')]); setClients(c || []); setSuppliers(s || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const clientTotal = clients.reduce((s, c) => s + Math.max(0, Number(c.debt) || 0), 0);
  const supplierTotal = suppliers.reduce((s, x) => s + Math.max(0, Number(x.debt) || 0), 0);
  const list = (tab === 'client' ? clients : suppliers).filter((x) => Math.abs(Number(x.debt) || 0) > 0).sort((a, b) => (b.debt || 0) - (a.debt || 0));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xl" weight="900">Qarzlar</T>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Card style={{ flex: 1 }}>
              <T size="xs" color={colors.textMuted} weight="700">Mijozlar qarzi</T>
              <T size="xl" weight="900" color={colors.warning} style={{ marginTop: 8 }}>{money(clientTotal)}</T>
            </Card>
            <Card style={{ flex: 1 }}>
              <T size="xs" color={colors.textMuted} weight="700">Bizning qarz</T>
              <T size="xl" weight="900" color={colors.danger} style={{ marginTop: 8 }}>{money(supplierTotal)}</T>
            </Card>
          </View>

          <View style={{ flexDirection: 'row', backgroundColor: colors.bgInput, borderRadius: radii.md, padding: 4, marginBottom: 14 }}>
            {(['client', 'supplier'] as const).map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.8}
                style={{ flex: 1, paddingVertical: 11, borderRadius: radii.sm, alignItems: 'center', backgroundColor: tab === t ? colors.bgCard : 'transparent' }}>
                <T weight="800" size="sm" color={tab === t ? colors.text : colors.textMuted}>{t === 'client' ? 'Mijozlar' : 'Yetkazuvchilar'}</T>
              </TouchableOpacity>
            ))}
          </View>

          {list.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 50 }}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <T color={colors.textMuted} weight="600" style={{ marginTop: 10 }}>Qarz yo'q</T>
            </View>
          )}
          {list.map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <T size="md" weight="700" numberOfLines={1}>{x.name}</T>
                {!!x.phone && <T size="xs" color={colors.textMuted} weight="600">{x.phone}</T>}
              </View>
              <T size="md" weight="900" color={(x.debt || 0) > 0 ? colors.danger : colors.success}>{money(x.debt)}</T>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

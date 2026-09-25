import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, StatTile, Row, Section } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export default function Report({ navigation }: any) {
  const [s, setS] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sum, d] = await Promise.all([api.get('/api/report/summary'), api.get('/api/report/daily').catch(() => [])]);
      setS(sum); setDaily(d || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const max = Math.max(1, ...daily.map((d: any) => Math.max(+d.sales || 0, +d.purchases || 0)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Hisobot" onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          <Row gap={spacing.sm} align="stretch">
            <StatTile icon="trending-up" label="Jami sotuv" value={money(s?.sales_total || 0)} tint={colors.success} />
            <StatTile icon="cube" label="Jami xarid" value={money(s?.purchases_total || 0)} tint={colors.info} />
          </Row>
          <Row gap={spacing.sm} align="stretch" style={{ marginTop: spacing.sm }}>
            <StatTile icon="arrow-down-circle" label="Mijoz qarzi" value={money(s?.clients_debt || 0)} tint={colors.danger} />
            <StatTile icon="arrow-up-circle" label="Bizning qarz" value={money(s?.suppliers_debt || 0)} tint={colors.warning} />
          </Row>

          <Section>SO'NGGI KUNLAR</Section>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}>
            <Row gap={16} style={{ marginBottom: 12 }}>
              <Row gap={5}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.primary }} /><T size="xs" color={colors.textMuted} weight="700">Sotuv</T></Row>
              <Row gap={5}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.textDim }} /><T size="xs" color={colors.textMuted} weight="700">Xarid</T></Row>
            </Row>
            {daily.length === 0 ? <T color={colors.textDim} style={{ textAlign: 'center', paddingVertical: 20 }}>Ma'lumot yo'q</T> : (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 }}>
                {daily.map((d: any, i: number) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 }}>
                      <View style={{ width: 7, height: Math.max(2, ((+d.sales || 0) / max) * 120), backgroundColor: colors.primary, borderRadius: 2 }} />
                      <View style={{ width: 7, height: Math.max(2, ((+d.purchases || 0) / max) * 120), backgroundColor: colors.textDim, borderRadius: 2 }} />
                    </View>
                    <T size="xs" color={colors.textDim} style={{ marginTop: 4, fontSize: 9 }}>{d.label || ''}</T>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

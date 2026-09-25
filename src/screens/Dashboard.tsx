import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, RefreshControl, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuth } from '../store';
import { checkUpdate } from '../update';
import { T, money, Row, Section } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export default function Dashboard({ navigation }: any) {
  const user = useAuth((s) => s.user);
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setD(await api.get('/api/dashboard')); setErr(null); }
    catch (e: any) { setErr(e?.message || 'Ma\'lumot yuklanmadi'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]));
  useEffect(() => { const t = setTimeout(() => checkUpdate(true), 2500); return () => clearTimeout(t); }, []);

  const greeting = (() => { const h = new Date().getHours(); return h < 6 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'; })();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 34 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>

      <View style={{ paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T size="sm" color={colors.textMuted} weight="600">{greeting}</T>
          <T size="xxl" weight="800" numberOfLines={1} style={{ marginTop: 2 }}>{user?.full_name || user?.email || 'Boshliq'}</T>
        </View>
        <Image source={require('../../assets/icon.png')} style={{ width: 44, height: 44, borderRadius: 12 }} resizeMode="contain" />
      </View>

      <View style={{ padding: spacing.lg }}>
        {err && !d ? (
          <ErrorBox err={err} onRetry={load} />
        ) : loading && !d ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl }}>
              <Row justify="space-between">
                <T size="sm" color={colors.textMuted} weight="700">Kassa balansi</T>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="wallet-outline" size={17} color={colors.primary} />
                </View>
              </Row>
              <T size="hero" weight="900" numberOfLines={1} style={{ marginTop: 8 }}>{money(d?.balance || 0)}</T>
            </View>

            {d?.pending > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Tasdiqlash')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.warning + '16', borderRadius: radii.md, borderWidth: 1, borderColor: colors.warning + '55', padding: spacing.md, marginTop: spacing.md }}>
                <Ionicons name="alert-circle" size={22} color={colors.warning} />
                <T size="sm" weight="800" style={{ flex: 1 }} color={colors.warning}>{d.pending} ta narx tasdiqlashni kutmoqda</T>
                <Ionicons name="chevron-forward" size={18} color={colors.warning} />
              </TouchableOpacity>
            )}

            <Row gap={spacing.sm} style={{ marginTop: spacing.md }} align="stretch">
              <CountTile iconName="cube-outline" label="Mahsulotlar" val={d?.products} />
              <CountTile iconName="car-outline" label="Yetkazuvchilar" val={d?.suppliers} />
              <CountTile iconName="people-outline" label="Mijozlar" val={d?.clients} />
            </Row>

            <Section>QARZLAR VA SOTUV</Section>
            <MoneyRow icon="arrow-down-circle-outline" label="Mijoz qarzlari" val={money(d?.client_debt || 0)} tint={colors.danger} />
            <MoneyRow icon="arrow-up-circle-outline" label="Yetkazuvchi qarzlari" val={money(d?.supplier_debt || 0)} tint={colors.warning} />
            <MoneyRow icon="trending-up-outline" label={`Bugungi sotuv · ${d?.today_count || 0} ta`} val={money(d?.today_sales || 0)} tint={colors.success} />

            <Section>TEZKOR AMALLAR</Section>
            <Row gap={spacing.md}>
              <Quick icon="cart-outline" label="Yangi sotuv" onPress={() => navigation.navigate('Sotuv')} />
              <Quick icon="map-outline" label="Xarita" onPress={() => navigation.navigate('Xarita')} />
            </Row>
            <Row gap={spacing.md} style={{ marginTop: spacing.md }}>
              <Quick icon="cube-outline" label="Ombor" onPress={() => navigation.navigate('Ombor')} />
              <Quick icon="bar-chart-outline" label="Hisobot" onPress={() => navigation.navigate('Hisobot')} />
            </Row>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function CountTile({ iconName, label, val }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, paddingHorizontal: spacing.md }}>
      <Ionicons name={iconName || 'cube-outline'} size={17} color={colors.textMuted} />
      <T size="xl" weight="900" style={{ marginTop: 8 }}>{val ?? '·'}</T>
      <T size="xs" color={colors.textMuted} weight="600" numberOfLines={1}>{label}</T>
    </View>
  );
}

function MoneyRow({ icon, label, val, tint }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: (tint || colors.primary) + '16', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={19} color={tint || colors.primary} />
      </View>
      <T size="sm" color={colors.textMuted} weight="700" numberOfLines={1} style={{ flex: 1 }}>{label}</T>
      <T size="lg" weight="900" numberOfLines={1}>{val}</T>
    </View>
  );
}

function Quick({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '16', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <T size="md" weight="800">{label}</T>
    </TouchableOpacity>
  );
}

function ErrorBox({ err, onRetry }: any) {
  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
      <Ionicons name="cloud-offline-outline" size={36} color={colors.danger} />
      <T size="md" weight="800" style={{ marginTop: 12, textAlign: 'center' }}>Ma'lumot yuklanmadi</T>
      <T size="sm" color={colors.textMuted} style={{ marginTop: 4, textAlign: 'center' }}>{err}</T>
      <TouchableOpacity onPress={onRetry} style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: radii.pill }}>
        <T size="sm" weight="800" color="#fff">Qayta urinish</T>
      </TouchableOpacity>
    </View>
  );
}

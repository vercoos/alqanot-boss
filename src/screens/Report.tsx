import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '../api';
import { Header, T, money, Button, Row } from '../components/ui';
import { colors, spacing, radii } from '../theme';

const PERIODS = [
  { key: 'day', label: 'Kunlik' },
  { key: 'week', label: 'Haftalik' },
  { key: 'month', label: 'Oylik' },
  { key: 'year', label: 'Yillik' },
];
const kg = (n: number) => (Math.round(Number(n || 0) * 10) / 10).toLocaleString('ru-RU') + ' kg';

export default function Report({ navigation }: any) {
  const [period, setPeriod] = useState('day');
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [dl, setDl] = useState(false);

  const load = useCallback(async (p: string) => {
    setLoading(true); setErr(null);
    try { setD(await api.get(`/boss/report?period=${p}`)); }
    catch (e: any) { setErr(e?.message || 'Ma\'lumot yuklanmadi'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(period); }, [period, load]);

  const downloadExcel = async () => {
    setDl(true);
    try {
      const r = await api.get(`/boss/report/excel?period=${period}`);
      const uri = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') + (r.filename || 'hisobot.xlsx');
      await FileSystem.writeAsStringAsync(uri, r.base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Hisobot (Excel)',
          UTI: 'org.openxmlformats.spreadsheetml.sheet',
        });
      } else { Alert.alert('Saqlandi', uri); }
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message || 'Excel yuklab bo\'lmadi');
    } finally { setDl(false); }
  };

  const prods: any[] = d?.products || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Hisobot" subtitle="To'liq · kunlik · oylik · yillik" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <Row gap={4} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 4 }}>
          {PERIODS.map((p) => (
            <TabBtn key={p.key} label={p.label} active={period === p.key} onPress={() => setPeriod(p.key)} />
          ))}
        </Row>

        {loading && !d ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : err && !d ? (
          <T color={colors.danger} style={{ marginTop: 40, textAlign: 'center' }}>{err}</T>
        ) : d ? (
          <>
            <Sec>SAVDO</Sec>
            <MetricRow icon="cart-outline" label="Sotuv (jami)" val={money(d.salesTotal)} sub={`${d.salesCount} ta · ${kg(d.soldKg)}`} tint={colors.info} />
            <MetricRow icon="cube-outline" label="Xaridlar (jami)" val={money(d.purchasesTotal)} sub={`${d.purchasesCount} ta`} tint={colors.warning} />

            <Sec>FOYDA</Sec>
            <MetricRow icon="trending-up-outline" label="Yalpi foyda" val={money(d.grossProfit)} tint={colors.success} strong />
            <MetricRow icon="remove-circle-outline" label="Xarajatlar" val={money(d.expenses)} sub={`${d.expensesCount} ta`} tint={colors.danger} />
            <MetricRow icon="wallet-outline" label="Sof foyda" val={money(d.netProfit)} tint={d.netProfit >= 0 ? colors.success : colors.danger} strong />

            <Sec>TO'LOVLAR</Sec>
            <MetricRow icon="cash-outline" label="Mijoz to'lovlari" val={money(d.clientPayments)} sub={`${d.clientPaymentsCount} ta`} tint={colors.success} />
            <MetricRow icon="arrow-up-circle-outline" label="Yetkazuvchi to'lovlari" val={money(d.supplierPayments)} tint={colors.warning} />

            <Sec>QAYTARISHLAR</Sec>
            <MetricRow icon="return-down-back-outline" label="Mijozdan qaytdi" val={money(d.returnsClient || 0)} sub={`${d.returnsClientCount || 0} ta`} tint={colors.info} />
            <MetricRow icon="return-up-back-outline" label="Yetkazuvchiga qaytdi" val={money(d.returnsSupplier || 0)} sub={`${d.returnsSupplierCount || 0} ta`} tint={colors.warning} />

            <Sec>UMUMIY HOLAT</Sec>
            <MetricRow icon="server-outline" label="Kassa balansi" val={money(d.balance)} tint={colors.primary} />
            <MetricRow icon="arrow-down-circle-outline" label="Mijoz qarzlari (jami)" val={money(d.clientDebt)} tint={colors.danger} />
            <MetricRow icon="arrow-up-circle-outline" label="Yetkazuvchi qarzlari (jami)" val={money(d.supplierDebt)} tint={colors.warning} />

            {prods.length > 0 && (
              <>
                <Sec>MAHSULOTLAR (KG)</Sec>
                {prods.map((p, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <T size="sm" weight="800" numberOfLines={1}>{p.name}</T>
                      <T size="xs" color={colors.textMuted} weight="600">{kg(p.qty)} · {money(p.revenue)}</T>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <T size="xs" color={colors.textDim} weight="600">foyda</T>
                      <T size="sm" weight="900" color={p.profit >= 0 ? colors.success : colors.danger}>{money(p.profit)}</T>
                    </View>
                  </View>
                ))}
              </>
            )}

            <View style={{ marginTop: spacing.xl }}>
              <Button title={dl ? 'Tayyorlanmoqda...' : 'Excel yuklab olish (to\'liq)'} icon="download-outline" onPress={downloadExcel} loading={dl} />
              <T size="xs" color={colors.textDim} style={{ textAlign: 'center', marginTop: 10 }}>Excel'da: xulosa, mahsulotlar, batafsil sotuv va xaridlar (kimga/kimdan, kg, narx)</T>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Sec({ children }: any) {
  return <T size="sm" weight="800" color={colors.textMuted} style={{ marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: 4, letterSpacing: 1 }}>{children}</T>;
}

function TabBtn({ label, active, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 9, borderRadius: radii.sm, backgroundColor: active ? colors.primary : 'transparent', alignItems: 'center' }}>
      <T size="sm" weight="800" color={active ? '#fff' : colors.textMuted}>{label}</T>
    </TouchableOpacity>
  );
}

function MetricRow({ icon, label, val, sub, tint, strong }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: (tint || colors.primary) + '16', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={tint || colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <T size="sm" color={colors.textMuted} weight="700" numberOfLines={1}>{label}</T>
        {sub ? <T size="xs" color={colors.textDim} weight="600">{sub}</T> : null}
      </View>
      <T size={strong ? 'xl' : 'lg'} weight="900" numberOfLines={1}>{val}</T>
    </View>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { getSocket } from '../socket';
import { T, money, Badge, Button } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

const kg = (n: number) => { const v = Math.round(Number(n || 0) * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); };

export default function Tasdiqlash() {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState<any>(null); // {kind, ...draft}
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const d = await api.get('/api/drafts'); setSales(d.sales || []); setPurchases(d.purchases || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { const s = getSocket(); if (!s) return; const h = () => load(); s.on('order:update', h); s.on('purchase:new', h); return () => { s.off('order:update', h); s.off('purchase:new', h); }; }, [load]);

  const open = (kind: string, d: any) => { setActive({ kind, ...d }); const p: any = {}; (d.items || []).forEach((it: any) => p[it.id] = ''); setPrices(p); setPaid(''); };
  const total = active ? (active.items || []).reduce((s: number, it: any) => s + (Number(it.qty) || 0) * (parseFloat(prices[it.id]) || 0), 0) : 0;

  const confirm = async () => {
    const items = (active.items || []).map((it: any) => ({ id: it.id, price: parseFloat(prices[it.id]) || 0 }));
    if (items.some((x: any) => x.price <= 0)) { Alert.alert('Narx', 'Har bir mahsulotga narx qo\'ying'); return; }
    setBusy(true);
    try {
      const url = active.kind === 'sale' ? `/api/orders/${active.id}/confirm-price` : `/api/purchases/${active.id}/confirm-price`;
      await api.post(url, { items, paidAmount: parseFloat(paid) || 0 });
      setActive(null); load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const all = [...sales.map((x) => ({ ...x, kind: 'sale' })), ...purchases.map((x) => ({ ...x, kind: 'purchase' }))]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xl" weight="900">Tasdiqlash</T>
        <T size="xs" color={colors.textMuted} weight="600">{all.length} ta narx kutmoqda</T>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {all.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="checkmark-done-circle-outline" size={52} color={colors.success} />
              <T color={colors.textMuted} weight="600" style={{ marginTop: 10 }}>Hammasi tasdiqlangan</T>
            </View>
          )}
          {all.map((x) => (
            <TouchableOpacity key={x.kind + x.id} activeOpacity={0.85} onPress={() => open(x.kind, x)}
              style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={x.kind === 'sale' ? 'arrow-up' : 'arrow-down'} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size="md" weight="800">{x.kind === 'sale' ? 'Sotuv' : 'Xarid'} · {x.kind === 'sale' ? (x.client_name || '—') : (x.supplier_name || '—')}</T>
                  <T size="xs" color={colors.textMuted} weight="600" numberOfLines={1}>{(x.items || []).map((it: any) => it.name + ' ' + kg(it.qty)).join(', ')}</T>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!active} transparent animationType="slide" onRequestClose={() => setActive(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '85%' }}>
            {active && <>
              <T size="lg" weight="800" style={{ marginBottom: 4 }}>{active.kind === 'sale' ? 'Sotuvni' : 'Xaridni'} tasdiqlash</T>
              <T size="sm" color={colors.textMuted} weight="600" style={{ marginBottom: 14 }}>{active.kind === 'sale' ? active.client_name : active.supplier_name}</T>
              <ScrollView style={{ maxHeight: 320 }}>
                {(active.items || []).map((it: any) => (
                  <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}><T weight="700">{it.name}</T><T size="xs" color={colors.textMuted}>{kg(it.qty)}</T></View>
                    <TextInput value={prices[it.id]} onChangeText={(t) => setPrices((p) => ({ ...p, [it.id]: t.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad" placeholder="narx" placeholderTextColor={colors.textDim}
                      style={{ width: 130, backgroundColor: colors.bgInput, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 12, color: colors.text, fontWeight: '700', fontSize: fontSize.md, textAlign: 'right' }} />
                  </View>
                ))}
              </ScrollView>
              <View style={{ marginTop: 8 }}>
                <T size="xs" color={colors.textMuted} weight="600" style={{ marginBottom: 6 }}>To'langan summa</T>
                <TextInput value={paid.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setPaid(t.replace(/\D/g, ''))}
                  keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim}
                  style={{ backgroundColor: colors.bgInput, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, paddingHorizontal: 12, color: colors.text, fontWeight: '700', fontSize: fontSize.md }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14 }}>
                <T size="md" weight="800">Jami</T><T size="xl" weight="900" color={colors.primary}>{money(total)}</T>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Button title="Bekor" variant="ghost" onPress={() => setActive(null)} /></View>
                <View style={{ flex: 1.5 }}><Button title="Tasdiqlash" icon="checkmark-done" variant="success" onPress={confirm} loading={busy} /></View>
              </View>
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

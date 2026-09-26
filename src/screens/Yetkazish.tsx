import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, kg, Button, Row, Badge } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Biriktirilmagan', color: colors.textDim },
  assigned: { label: 'Biriktirilgan', color: colors.warning },
  on_way: { label: "Yo'lda", color: colors.primary },
  delivered: { label: 'Yetkazilgan', color: colors.success },
  canceled: { label: 'Bekor', color: colors.danger },
};

export default function Yetkazish({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [o, c] = await Promise.all([
        api.rootGet('/api/orders').catch(() => []),
        api.rootGet('/api/couriers').catch(() => []),
      ]);
      setOrders((o || []).filter((x: any) => x.status !== 'canceled'));
      setCouriers((c || []).filter((x: any) => x.is_active));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = orders.filter((o) => o.status !== 'delivered');
  const done = orders.filter((o) => o.status === 'delivered');

  const assign = async (orderId: number, courierId: number) => {
    try { await api.rootPost(`/api/orders/${orderId}/assign`, { courierId }); setAssignFor(null); load(); Alert.alert('Tayyor', 'Kuryerga biriktirildi ✓'); }
    catch (e: any) { Alert.alert('Xato', e.message); }
  };

  const Card = (o: any) => {
    const st = STATUS[o.status] || STATUS.new;
    return (
      <View key={o.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: 10 }}>
        <Row justify="space-between">
          <View style={{ flex: 1 }}>
            <T size="md" weight="800" numberOfLines={1}>{o.client_name || 'Mijoz'} · №{o.id}</T>
            <T size="xs" color={colors.textMuted} weight="600" numberOfLines={1}>{o.dest_address || o.client_phone || '—'}</T>
          </View>
          <Badge label={st.label} color={st.color} />
        </Row>
        <Row justify="space-between" style={{ marginTop: 10 }}>
          <T size="lg" weight="900" color={colors.primary}>{money(o.total_amount)}</T>
          {o.courier_name
            ? <Row gap={5}><Ionicons name="bicycle" size={15} color={colors.success} /><T size="sm" weight="700" color={colors.success}>{o.courier_name}</T></Row>
            : null}
        </Row>
        {o.status !== 'delivered' && (
          <TouchableOpacity onPress={() => setAssignFor(o)} activeOpacity={0.85}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: o.courier_id ? colors.bgInput : colors.primary, borderRadius: radii.md, paddingVertical: 12 }}>
            <Ionicons name="person-add" size={18} color={o.courier_id ? colors.text : '#fff'} />
            <T weight="800" color={o.courier_id ? colors.text : '#fff'}>{o.courier_id ? "Kuryerni o'zgartirish" : 'Kuryerga biriktirish'}</T>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Yetkazish" subtitle={`${active.length} faol · ${couriers.length} kuryer`} onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {active.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>Faol yetkazish yo'q. "Yangi yetkazish" bilan qo'shing.</T>}
          {active.map(Card)}
          {done.length > 0 && <T size="xs" weight="800" color={colors.textMuted} style={{ marginTop: 14, marginBottom: 8, letterSpacing: 1 }}>YETKAZILGAN</T>}
          {done.slice(0, 20).map(Card)}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => setNewOpen(true)} activeOpacity={0.9}
        style={{ position: 'absolute', right: 18, bottom: 22, height: 56, borderRadius: 28, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, elevation: 7 }}>
        <Ionicons name="add" size={24} color="#fff" /><T weight="900" color="#fff">Yangi yetkazish</T>
      </TouchableOpacity>

      {/* Kuryer tanlash */}
      <Modal visible={!!assignFor} transparent animationType="fade" onRequestClose={() => setAssignFor(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.lg, maxHeight: '70%', overflow: 'hidden' }}>
            <Row justify="space-between" style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <T weight="800">Kuryer tanlang</T>
              <TouchableOpacity onPress={() => setAssignFor(null)}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
            </Row>
            <ScrollView>
              {couriers.length === 0 && <T color={colors.textMuted} style={{ padding: 20, textAlign: 'center' }}>Faol kuryer yo'q</T>}
              {couriers.map((c) => (
                <TouchableOpacity key={c.id} onPress={() => assign(assignFor.id, c.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="bicycle" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T weight="700">{c.full_name}</T>
                    <T size="xs" color={colors.textMuted} weight="600">{c.phone}{c.lat != null ? ' · joylashuv bor' : ' · joylashuv yo\'q'}</T>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NewDelivery visible={newOpen} onClose={() => setNewOpen(false)} onDone={() => { setNewOpen(false); load(); }} couriers={couriers} />
    </View>
  );
}

function NewDelivery({ visible, onClose, onDone, couriers }: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [courier, setCourier] = useState<any>(null);
  const [addr, setAddr] = useState('');
  const [rows, setRows] = useState<any[]>([{ productId: null, qty: '', price: '' }]);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<'client' | 'courier' | number | null>(null);

  React.useEffect(() => {
    if (!visible) return;
    setClient(null); setCourier(null); setAddr(''); setRows([{ productId: null, qty: '', price: '' }]);
    (async () => { try { setClients((await api.get('/boss/clients')) || []); setProducts((await api.get('/boss/products')) || []); } catch {} })();
  }, [visible]);

  const total = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0);
  const setRow = (i: number, k: string, v: any) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const submit = async () => {
    if (!client) { Alert.alert('Mijoz', 'Mijozni tanlang'); return; }
    const items = rows.filter((r) => r.productId && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0)
      .map((r) => ({ productId: r.productId, name: products.find((p) => p.id === r.productId)?.name || 'Mahsulot', qty: parseFloat(r.qty), price: parseFloat(r.price) }));
    if (!items.length) { Alert.alert('Yuk', 'Kamida bitta mahsulot qo\'shing'); return; }
    setBusy(true);
    try {
      const order = await api.rootPost('/api/orders', { clientId: client.id, dest_address: addr || client.phone || null, items, paidAmount: 0 });
      if (courier) await api.rootPost(`/api/orders/${order.id}/assign`, { courierId: courier.id });
      Alert.alert('Tayyor', courier ? `Yetkazish yaratildi va ${courier.full_name}ga biriktirildi` : 'Yetkazish yaratildi (keyin kuryer biriktiring)');
      onDone();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const clientName = (c: any) => [c.first_name, c.last_name].filter(Boolean).join(' ');
  const inp = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, color: colors.text, fontWeight: '700' as const, fontSize: fontSize.md, marginBottom: 12 };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <T size="lg" weight="800" style={{ flex: 1 }}>Yangi yetkazish</T>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Mijoz</T>
            <TouchableOpacity onPress={() => setPick('client')} style={{ flexDirection: 'row', alignItems: 'center', ...inp } as any}>
              <Ionicons name="person-outline" size={18} color={colors.textDim} style={{ marginRight: 8 }} />
              <T weight="700" style={{ flex: 1 }} color={client ? colors.text : colors.textDim}>{client ? clientName(client) : 'Tanlang'}</T>
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
            </TouchableOpacity>

            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Kuryer (ixtiyoriy)</T>
            <TouchableOpacity onPress={() => setPick('courier')} style={{ flexDirection: 'row', alignItems: 'center', ...inp } as any}>
              <Ionicons name="bicycle-outline" size={18} color={colors.textDim} style={{ marginRight: 8 }} />
              <T weight="700" style={{ flex: 1 }} color={courier ? colors.text : colors.textDim}>{courier ? courier.full_name : 'Biriktirilmagan'}</T>
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
            </TouchableOpacity>

            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Manzil</T>
            <TextInput value={addr} onChangeText={setAddr} placeholder="Yetkazish manzili" placeholderTextColor={colors.textDim} style={inp} />

            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Yuk (mahsulotlar)</T>
            {rows.map((r, i) => {
              const p = products.find((x) => x.id === r.productId);
              return (
                <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 10 }}>
                  <Row justify="space-between">
                    <TouchableOpacity onPress={() => setPick(i)} style={{ flex: 1 }}><T weight="700" color={p ? colors.text : colors.textDim}>{p ? p.name : 'Mahsulot tanlang'}</T></TouchableOpacity>
                    {rows.length > 1 && <TouchableOpacity onPress={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>}
                  </Row>
                  <Row gap={8} style={{ marginTop: 8 }}>
                    <TextInput value={r.qty} onChangeText={(t) => setRow(i, 'qty', t.replace(',', '.').replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="miqdor" placeholderTextColor={colors.textDim}
                      style={{ flex: 1, backgroundColor: colors.bgInput, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 11, color: colors.text, fontWeight: '700', textAlign: 'center' }} />
                    <TextInput value={r.price} onChangeText={(t) => setRow(i, 'price', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="narx" placeholderTextColor={colors.textDim}
                      style={{ flex: 1, backgroundColor: colors.bgInput, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 11, color: colors.text, fontWeight: '700', textAlign: 'center' }} />
                  </Row>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setRows((rs) => [...rs, { productId: null, qty: '', price: '' }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} /><T weight="700" color={colors.primary}>Mahsulot qatori</T>
            </TouchableOpacity>

            <Row justify="space-between" style={{ marginVertical: 16 }}><T size="md" weight="800">Jami</T><T size="xl" weight="900" color={colors.primary}>{money(total)}</T></Row>
            <Button title="Yaratish + biriktirish" icon="checkmark-done" loading={busy} onPress={submit} />
          </ScrollView>
        </View>
      </View>

      {/* Universal picker */}
      <Modal visible={pick !== null} transparent animationType="fade" onRequestClose={() => setPick(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.lg, maxHeight: '70%', overflow: 'hidden' }}>
            <Row justify="space-between" style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <T weight="800">{pick === 'client' ? 'Mijoz' : pick === 'courier' ? 'Kuryer' : 'Mahsulot'}</T>
              <TouchableOpacity onPress={() => setPick(null)}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
            </Row>
            <ScrollView>
              {pick === 'client' && clients.map((c) => (
                <TouchableOpacity key={c.id} onPress={() => { setClient(c); setPick(null); }} style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <T weight="700">{clientName(c)}</T><T size="xs" color={colors.textMuted} weight="600">{c.phone}</T>
                </TouchableOpacity>
              ))}
              {pick === 'courier' && couriers.map((c: any) => (
                <TouchableOpacity key={c.id} onPress={() => { setCourier(c); setPick(null); }} style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <T weight="700">{c.full_name}</T><T size="xs" color={colors.textMuted} weight="600">{c.phone}</T>
                </TouchableOpacity>
              ))}
              {typeof pick === 'number' && products.map((p) => (
                <TouchableOpacity key={p.id} onPress={() => { const pr = p; setRow(pick, 'productId', p.id); if (pr?.display_price || pr?.price) setRow(pick, 'price', String(pr.display_price || pr.price)); setPick(null); }} style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <T weight="700">{p.name}</T><T size="xs" color={colors.textMuted} weight="600">qoldiq {kg(p.stock)} {p.unit}</T>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

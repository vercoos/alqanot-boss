import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { T, money, kg, Button, Row } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Sale({ navigation }: any) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try { setSales((await api.get('/api/orders')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xxl" weight="800">Sotuv</T>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 50 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {sales.length === 0 && <T color={colors.textMuted} weight="600" style={{ textAlign: 'center', marginTop: 40 }}>Hozircha sotuv yo'q</T>}
          {sales.map((o) => {
            const debt = Math.max(0, (o.total_amount || 0) - (o.paid_amount || 0));
            return (
              <View key={o.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 10 }}>
                <Row justify="space-between">
                  <T weight="800">{o.client_name || 'Mijoz'} · №{o.id}</T>
                  <T weight="900" color={colors.primary}>{money(o.total_amount)}</T>
                </Row>
                <Row justify="space-between" style={{ marginTop: 6 }}>
                  <T size="xs" color={colors.textMuted} weight="600">To'langan: {money(o.paid_amount || 0)}</T>
                  {debt > 0 ? <T size="xs" weight="700" color={colors.danger}>Qarz: {money(debt)}</T> : <T size="xs" weight="700" color={colors.success}>To'liq</T>}
                </Row>
              </View>
            );
          })}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.9}
        style={{ position: 'absolute', right: 18, bottom: 22, height: 56, borderRadius: 28, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7 }}>
        <Ionicons name="add" size={24} color="#fff" />
        <T weight="900" color="#fff">Yangi sotuv</T>
      </TouchableOpacity>
      <NewSale visible={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />
    </View>
  );
}

function NewSale({ visible, onClose, onDone }: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([{ productId: null, qty: '', price: '' }]);
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  const [pickClient, setPickClient] = useState(false);
  const [pickProdIdx, setPickProdIdx] = useState<number | null>(null);

  React.useEffect(() => {
    if (!visible) return;
    setClientId(null); setRows([{ productId: null, qty: '', price: '' }]); setPaid('');
    (async () => {
      try { setClients((await api.get('/api/clients')) || []); setProducts((await api.get('/api/products')) || []); } catch {}
    })();
  }, [visible]);

  const client = clients.find((c) => c.id === clientId);
  const total = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0);
  const setRow = (i: number, k: string, v: any) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const submit = async () => {
    const items = rows.filter((r) => r.productId && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0)
      .map((r) => ({ productId: r.productId, name: products.find((p) => p.id === r.productId)?.name || 'Mahsulot', qty: parseFloat(r.qty), price: parseFloat(r.price) }));
    if (!clientId) { Alert.alert('Mijoz', 'Mijozni tanlang'); return; }
    if (!items.length) { Alert.alert('Mahsulot', 'Kamida bitta mahsulot qo\'shing'); return; }
    setBusy(true);
    try { await api.post('/api/orders', { clientId, items, paidAmount: parseFloat(paid) || 0 }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <T size="lg" weight="800" style={{ flex: 1 }}>Yangi sotuv</T>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Mijoz</T>
            <TouchableOpacity onPress={() => setPickClient(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, marginBottom: 14 }}>
              <Ionicons name="person-outline" size={18} color={colors.textDim} style={{ marginRight: 8 }} />
              <T weight="700" style={{ flex: 1 }} color={client ? colors.text : colors.textDim}>{client ? client.name : 'Mijozni tanlang'}</T>
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
            </TouchableOpacity>

            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Mahsulotlar</T>
            {rows.map((r, i) => {
              const p = products.find((x) => x.id === r.productId);
              return (
                <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 10 }}>
                  <Row justify="space-between">
                    <TouchableOpacity onPress={() => setPickProdIdx(i)} style={{ flex: 1 }}>
                      <T weight="700" color={p ? colors.text : colors.textDim}>{p ? p.name : 'Mahsulot tanlang'}</T>
                    </TouchableOpacity>
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

            <T size="sm" weight="700" color={colors.textMuted} style={{ marginTop: 8, marginBottom: 6 }}>To'langan summa</T>
            <TextInput value={paid.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setPaid(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, color: colors.text, fontWeight: '800', fontSize: fontSize.md }} />

            <Row justify="space-between" style={{ marginVertical: 16 }}>
              <T size="md" weight="800">Jami</T><T size="xl" weight="900" color={colors.primary}>{money(total)}</T>
            </Row>
            <Button title="Sotuvni saqlash" icon="checkmark" loading={busy} onPress={submit} />
          </ScrollView>
        </View>
      </View>

      <PickerModal visible={pickClient} title="Mijoz tanlang" items={clients.map((c) => ({ id: c.id, label: c.name, sub: c.phone }))}
        onClose={() => setPickClient(false)} onPick={(id: number) => { setClientId(id); setPickClient(false); }} />
      <PickerModal visible={pickProdIdx !== null} title="Mahsulot tanlang" items={products.map((p) => ({ id: p.id, label: p.name, sub: `qoldiq ${kg(p.stock)} ${p.unit}` }))}
        onClose={() => setPickProdIdx(null)} onPick={(id: number) => { if (pickProdIdx !== null) { const pr = products.find((p) => p.id === id); setRow(pickProdIdx, 'productId', id); if (pr?.price) setRow(pickProdIdx, 'price', String(pr.price)); } setPickProdIdx(null); }} />
    </Modal>
  );
}

export function PickerModal({ visible, title, items, onClose, onPick }: any) {
  const [q, setQ] = useState('');
  const list = q ? items.filter((it: any) => (it.label || '').toLowerCase().includes(q.toLowerCase()) || (it.sub || '').includes(q)) : items;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg }}>
        <View style={{ backgroundColor: colors.bg, borderRadius: radii.lg, maxHeight: '75%', overflow: 'hidden' }}>
          <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Row justify="space-between" style={{ marginBottom: 10 }}><T weight="800">{title}</T><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textMuted} /></TouchableOpacity></Row>
            <TextInput value={q} onChangeText={setQ} placeholder="Qidirish" placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.bgInput, borderRadius: radii.sm, padding: 11, color: colors.text, fontWeight: '600' }} />
          </View>
          <ScrollView>
            {list.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', padding: 20 }}>Topilmadi</T>}
            {list.map((it: any) => (
              <TouchableOpacity key={it.id} onPress={() => onPick(it.id)} style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <T weight="700">{it.label}</T>{it.sub ? <T size="xs" color={colors.textMuted} weight="600">{it.sub}</T> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

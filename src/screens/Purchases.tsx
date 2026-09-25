import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, kg, Button, Row } from '../components/ui';
import { PickerModal } from './Sale';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Purchases({ navigation }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api.get('/api/purchases')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Xarid" subtitle={`${rows.length} ta`} onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {rows.map((p) => (
            <View key={p.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
              <Row justify="space-between"><T weight="800">{p.supplier_name || '—'} · №{p.id}</T><T weight="900" color={colors.info}>{money(p.total_amount)}</T></Row>
              <T size="xs" color={colors.textMuted} weight="600" style={{ marginTop: 4 }}>To'langan: {money(p.paid_amount || 0)} · {new Date(p.created_at).toLocaleDateString('ru-RU')}</T>
            </View>
          ))}
          {rows.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>Xarid yo'q</T>}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.9}
        style={{ position: 'absolute', right: 18, bottom: 22, height: 56, borderRadius: 28, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, elevation: 7 }}>
        <Ionicons name="add" size={24} color="#fff" /><T weight="900" color="#fff">Yangi xarid</T>
      </TouchableOpacity>
      <NewPurchase visible={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />
    </View>
  );
}

function NewPurchase({ visible, onClose, onDone }: any) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([{ productId: null, qty: '', price: '' }]);
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  const [pickSup, setPickSup] = useState(false);
  const [pickProdIdx, setPickProdIdx] = useState<number | null>(null);

  React.useEffect(() => {
    if (!visible) return;
    setSupplierId(null); setRows([{ productId: null, qty: '', price: '' }]); setPaid('');
    (async () => { try { setSuppliers((await api.get('/api/suppliers')) || []); setProducts((await api.get('/api/products')) || []); } catch {} })();
  }, [visible]);

  const supplier = suppliers.find((s) => s.id === supplierId);
  const total = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0);
  const setRow = (i: number, k: string, v: any) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const submit = async () => {
    const items = rows.filter((r) => r.productId && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0)
      .map((r) => ({ productId: r.productId, name: products.find((p) => p.id === r.productId)?.name || 'Mahsulot', qty: parseFloat(r.qty), price: parseFloat(r.price) }));
    if (!supplierId) { Alert.alert('Yetkazuvchi', 'Yetkazuvchini tanlang'); return; }
    if (!items.length) { Alert.alert('Mahsulot', 'Kamida bitta mahsulot qo\'shing'); return; }
    setBusy(true);
    try { await api.post('/api/purchases', { supplierId, items, paidAmount: parseFloat(paid) || 0 }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <T size="lg" weight="800" style={{ flex: 1 }}>Yangi xarid (kirim)</T>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Yetkazib beruvchi</T>
            <TouchableOpacity onPress={() => setPickSup(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, marginBottom: 14 }}>
              <Ionicons name="business-outline" size={18} color={colors.textDim} style={{ marginRight: 8 }} />
              <T weight="700" style={{ flex: 1 }} color={supplier ? colors.text : colors.textDim}>{supplier ? supplier.name : 'Tanlang'}</T>
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
            </TouchableOpacity>
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Mahsulotlar (omborga qo'shiladi)</T>
            {rows.map((r, i) => {
              const p = products.find((x) => x.id === r.productId);
              return (
                <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 10 }}>
                  <Row justify="space-between">
                    <TouchableOpacity onPress={() => setPickProdIdx(i)} style={{ flex: 1 }}><T weight="700" color={p ? colors.text : colors.textDim}>{p ? p.name : 'Mahsulot tanlang'}</T></TouchableOpacity>
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
            <Row justify="space-between" style={{ marginVertical: 16 }}><T size="md" weight="800">Jami</T><T size="xl" weight="900" color={colors.info}>{money(total)}</T></Row>
            <Button title="Xaridni saqlash" icon="checkmark" loading={busy} onPress={submit} />
          </ScrollView>
        </View>
      </View>
      <PickerModal visible={pickSup} title="Yetkazuvchi tanlang" items={suppliers.map((s) => ({ id: s.id, label: s.name, sub: s.phone }))}
        onClose={() => setPickSup(false)} onPick={(id: number) => { setSupplierId(id); setPickSup(false); }} />
      <PickerModal visible={pickProdIdx !== null} title="Mahsulot tanlang" items={products.map((p) => ({ id: p.id, label: p.name, sub: `qoldiq ${kg(p.stock)} ${p.unit}` }))}
        onClose={() => setPickProdIdx(null)} onPick={(id: number) => { if (pickProdIdx !== null) { setRow(pickProdIdx, 'productId', id); } setPickProdIdx(null); }} />
    </Modal>
  );
}

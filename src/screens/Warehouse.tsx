import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, kg, Button, Row } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Warehouse({ navigation }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receive, setReceive] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api.get('/api/products')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Ombor" subtitle={`${rows.length} ta mahsulot`} onBack={() => navigation.goBack()}
        right={<TouchableOpacity onPress={() => setAddOpen(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={22} color={colors.primary} /></TouchableOpacity>} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {rows.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <T weight="800">{p.name}</T>
                <T size="xs" color={colors.textMuted} weight="600">Narx: {money(p.price)}</T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T weight="900" color={p.stock <= 0 ? colors.danger : colors.text}>{kg(p.stock)} {p.unit}</T>
              </View>
              <TouchableOpacity onPress={() => setReceive(p)} style={{ backgroundColor: colors.primary + '16', borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 8 }}>
                <T size="xs" weight="800" color={colors.primary}>Qabul</T>
              </TouchableOpacity>
            </View>
          ))}
          {rows.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>Mahsulot yo'q</T>}
        </ScrollView>
      )}
      <ReceiveModal product={receive} onClose={() => setReceive(null)} onDone={() => { setReceive(null); load(); }} />
      <AddProduct visible={addOpen} onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); load(); }} />
    </View>
  );
}

function ReceiveModal({ product, onClose, onDone }: any) {
  const [qty, setQty] = useState(''); const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (product) setQty(''); }, [product]);
  if (!product) return null;
  const submit = async () => {
    const v = parseFloat(qty) || 0; if (v <= 0) { Alert.alert('Miqdor', 'Miqdorni kiriting'); return; }
    setBusy(true);
    try { await api.post('/api/warehouse/receive', { productId: product.id, qty: v }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  return (
    <Modal visible={!!product} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 6 }}><T size="lg" weight="800">Tovar qabul</T><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity></Row>
          <T size="sm" color={colors.textMuted} style={{ marginBottom: 14 }}>{product.name} · hozir {kg(product.stock)} {product.unit}</T>
          <TextInput value={qty} onChangeText={(t) => setQty(t.replace(',', '.').replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder={`Kelgan miqdor (${product.unit})`} placeholderTextColor={colors.textDim} autoFocus
            style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 16, color: colors.text, fontWeight: '900', fontSize: fontSize.xl, textAlign: 'center', marginBottom: 16 }} />
          <Button title="Qabul qilish" icon="checkmark" loading={busy} onPress={submit} />
        </View>
      </View>
    </Modal>
  );
}

function AddProduct({ visible, onClose, onDone }: any) {
  const [name, setName] = useState(''); const [unit, setUnit] = useState('kg'); const [price, setPrice] = useState(''); const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (visible) { setName(''); setUnit('kg'); setPrice(''); } }, [visible]);
  const submit = async () => {
    if (!name.trim()) { Alert.alert('Nom', 'Nomni kiriting'); return; }
    setBusy(true);
    try { await api.post('/api/products', { name: name.trim(), unit: unit.trim() || 'dona', price: parseFloat(price) || 0 }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const inp = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, color: colors.text, fontWeight: '700' as const, fontSize: fontSize.md, marginBottom: 12 };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}><T size="lg" weight="800">Yangi mahsulot</T><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity></Row>
          <TextInput value={name} onChangeText={setName} placeholder="Nomi" placeholderTextColor={colors.textDim} style={inp} />
          <Row gap={12}>
            <TextInput value={unit} onChangeText={setUnit} placeholder="birlik" placeholderTextColor={colors.textDim} style={[inp, { flex: 1 }]} />
            <TextInput value={price} onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))} placeholder="narx" placeholderTextColor={colors.textDim} keyboardType="number-pad" style={[inp, { flex: 2 }]} />
          </Row>
          <Button title="Saqlash" icon="checkmark" loading={busy} onPress={submit} style={{ marginTop: 4 }} />
        </View>
      </View>
    </Modal>
  );
}

import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Card, Row, T, Button, Input, money, kg } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Warehouse({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [pk, setPk] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [np, setNp] = useState<any>({ name: '', price: '', unit: 'kg' });

  const createProduct = async () => {
    if (!np.name.trim() || !(parseFloat(np.price) >= 0)) { Alert.alert('Maydonlar', 'Nom va narx kerak'); return; }
    setBusy(true);
    try { await api.post('/boss/product', { name: np.name.trim(), price: parseFloat(np.price), unit: np.unit }); setNewOpen(false); setNp({ name: '', price: '', unit: 'kg' }); Alert.alert('Tayyor', 'Mahsulot qo\'shildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const load = useCallback(async () => { try { setList(await api.get('/boss/products') || []); } catch {} finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (p: any) => { setEdit(p); setPk({ packLabel: p.pack_label || 'qop', kgAvg: String(p.kg_avg ?? 36), kgMin: String(p.kg_min ?? 34), kgMax: String(p.kg_max ?? 38), isExact: !!p.is_exact, packKg: String(p.pack_kg ?? ''), displayPrice: String(p.display_price ?? '') }); };
  const save = async () => {
    setBusy(true);
    try {
      await api.post(`/boss/packaging/${edit.id}`, { packLabel: pk.packLabel, kgAvg: parseFloat(pk.kgAvg), kgMin: parseFloat(pk.kgMin), kgMax: parseFloat(pk.kgMax), isExact: pk.isExact, packKg: pk.isExact ? parseFloat(pk.packKg) : null, displayPrice: pk.displayPrice ? parseFloat(pk.displayPrice) : null });
      setEdit(null); Alert.alert('Tayyor', 'Qop o\'lchami saqlandi'); load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const filtered = list.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Row justify="space-between" style={{ marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
          <T size="lg" weight="800">Ombor</T>
          <TouchableOpacity onPress={() => setNewOpen(true)}><Ionicons name="add-circle" size={24} color={colors.primary} /></TouchableOpacity>
        </Row>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput value={q} onChangeText={setQ} placeholder="Mahsulot qidirish..." placeholderTextColor={colors.textDim} style={{ flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8 }} />
        </View>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {filtered.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10 }} onPress={() => open(p)}>
              <Row justify="space-between">
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <T size="md" weight="700" numberOfLines={1}>{p.name}</T>
                  <T size="xs" color={colors.textMuted}>Harid narxi: {p.last_purchase_price ? money(p.last_purchase_price) : '—'}</T>
                  <T size="xs" color={colors.textDim}>Mijozga ko'rinish: {p.display_price ? money(p.display_price) : 'belgilanmagan'}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T size="lg" weight="900" color={p.stock <= 0 ? colors.danger : colors.text}>{kg(p.stock)}</T>
                  <T size="xs" color={colors.textMuted}>{p.unit}</T>
                </View>
              </Row>
            </Card>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!edit} transparent animationType="fade" onRequestClose={() => setEdit(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          {edit && (
            <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
              <T size="lg" weight="800" numberOfLines={1}>{edit.name}</T>
              <T size="xs" color={colors.textDim} style={{ marginBottom: spacing.md }}>Qoldiq: {kg(edit.stock)} {edit.unit} · Harid: {edit.last_purchase_price ? money(edit.last_purchase_price) : '—'}</T>

              <Field label="Mijozga ko'rinish narxi (so'm/kg)" value={pk.displayPrice} onChange={(v: string) => setPk({ ...pk, displayPrice: v })} />
              <T size="xs" color={colors.textDim} style={{ marginTop: 2, marginBottom: spacing.md }}>Bo'sh qoldirsangiz — mijoz narx ko'rmaydi (yetkazishда belgilanadi). Harid narxingiz mijozga hech qachon ko'rsatilmaydi.</T>

              <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 8 }}>Qop/karobka o'lchami (mijoz buyurtmasida)</T>
              <Row gap={8} style={{ marginBottom: spacing.md }}>
                <TouchableOpacity onPress={() => setPk({ ...pk, isExact: false })} style={seg(!pk.isExact)}><T weight="700" color={!pk.isExact ? '#fff' : colors.text}>Taxminiy (qop)</T></TouchableOpacity>
                <TouchableOpacity onPress={() => setPk({ ...pk, isExact: true })} style={seg(pk.isExact)}><T weight="700" color={pk.isExact ? '#fff' : colors.text}>Aniq kg</T></TouchableOpacity>
              </Row>
              {pk.isExact ? (
                <Field label="1 dona necha kg" value={pk.packKg} onChange={(v: string) => setPk({ ...pk, packKg: v })} />
              ) : (
                <Row gap={8}>
                  <View style={{ flex: 1 }}><Field label="Min kg" value={pk.kgMin} onChange={(v: string) => setPk({ ...pk, kgMin: v })} /></View>
                  <View style={{ flex: 1 }}><Field label="O'rta" value={pk.kgAvg} onChange={(v: string) => setPk({ ...pk, kgAvg: v })} /></View>
                  <View style={{ flex: 1 }}><Field label="Max kg" value={pk.kgMax} onChange={(v: string) => setPk({ ...pk, kgMax: v })} /></View>
                </Row>
              )}
              <Row gap={spacing.md} style={{ marginTop: spacing.lg }}>
                <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setEdit(null)} /></View>
                <View style={{ flex: 1 }}><Button title="Saqlash" onPress={save} loading={busy} /></View>
              </Row>
            </View>
          )}
        </View>
      </Modal>

      {/* Yangi mahsulot */}
      <Modal visible={newOpen} transparent animationType="fade" onRequestClose={() => setNewOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
            <T size="lg" weight="800" style={{ marginBottom: spacing.md }}>Yangi mahsulot</T>
            <Input label="Nomi" value={np.name} onChangeText={(v) => setNp({ ...np, name: v })} placeholder="Masalan: GRILL" icon="cube-outline" autoCapitalize="characters" />
            <Input money label="Narx (sotish narxi, so'm)" value={np.price} onChangeText={(v) => setNp({ ...np, price: v })} placeholder="0" icon="pricetag-outline" />
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 8 }}>O'lchov birligi</T>
            <Row gap={8} style={{ marginBottom: spacing.lg }}>
              <TouchableOpacity onPress={() => setNp({ ...np, unit: 'kg' })} style={seg(np.unit === 'kg')}><T weight="700" color={np.unit === 'kg' ? '#fff' : colors.text}>Kg</T></TouchableOpacity>
              <TouchableOpacity onPress={() => setNp({ ...np, unit: 'unit' })} style={seg(np.unit === 'unit')}><T weight="700" color={np.unit === 'unit' ? '#fff' : colors.text}>Dona</T></TouchableOpacity>
            </Row>
            <Row gap={spacing.md}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setNewOpen(false)} /></View>
              <View style={{ flex: 1 }}><Button title="Qo'shish" onPress={createProduct} loading={busy} /></View>
            </Row>
          </View>
        </View>
      </Modal>
    </View>
  );
}
function Field({ label, value, onChange }: any) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <T size="xs" color={colors.textMuted} weight="600" style={{ marginBottom: 4 }}>{label}</T>
      <TextInput value={value} onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textDim}
        style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 12, color: colors.text, fontSize: fontSize.lg, fontWeight: '800', textAlign: 'center' }} />
    </View>
  );
}
const seg = (on: boolean): any => ({ flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', backgroundColor: on ? colors.primary : colors.bgInput, borderWidth: 1, borderColor: on ? colors.primary : colors.border });

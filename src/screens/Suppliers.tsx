import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Card, Row, T, Button, Input, money, kg } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Suppliers({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [f, setF] = useState<any>({ firstName: '', lastName: '', phone: '' });
  const [buyOpen, setBuyOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([]);       // [{productId, price, qty}]
  const [paid, setPaid] = useState('');
  const [pickOpen, setPickOpen] = useState(false);
  const [pq, setPq] = useState('');
  const [busy, setBusy] = useState(false);
  const [payS, setPayS] = useState<any>(null);
  const [payAmt, setPayAmt] = useState('');

  const doPaySupplier = async () => {
    if (!(parseFloat(payAmt) > 0)) { Alert.alert('Summa', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post('/boss/payment/supplier', { supplierId: payS.id, amount: parseFloat(payAmt) }); setPayS(null); setPayAmt(''); Alert.alert('Tayyor', 'To\'lov yozildi — qarzdan ayrildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.get('/boss/suppliers'), api.get('/boss/products')]);
      setList(s || []); setProducts(p || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createSupplier = async () => {
    if (!f.firstName.trim() || !f.phone.trim()) { Alert.alert('Maydonlar', 'Ism va telefon kerak'); return; }
    setBusy(true);
    try { await api.post('/boss/supplier-new', f); setAddOpen(false); setF({ firstName: '', lastName: '', phone: '' }); Alert.alert('Tayyor', 'Yetkazib beruvchi qo\'shildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const total = rows.reduce((s, r) => s + (parseFloat(r.price) || 0) * (parseFloat(r.qty) || 0), 0);
  const [psel, setPsel] = useState<Record<number, boolean>>({});
  const pcount = Object.values(psel).filter(Boolean).length;
  const addRows = () => {
    setRows((r) => {
      const ex = new Set(r.map((x) => x.productId));
      const add = products.filter((p) => psel[p.id] && !ex.has(p.id)).map((p) => ({ productId: p.id, name: p.name, price: String(p.last_purchase_price || ''), qty: '' }));
      return [...r, ...add];
    });
    setPickOpen(false); setPq(''); setPsel({});
  };
  const submitPurchase = async () => {
    if (!supplierId) { Alert.alert('Yetkazib beruvchi', 'Tanlang'); return; }
    const prods = rows.filter((r) => parseFloat(r.qty) > 0 && parseFloat(r.price) > 0).map((r) => ({ productId: r.productId, price: parseFloat(r.price), quantity: parseFloat(r.qty) }));
    if (!prods.length) { Alert.alert('Mahsulot', 'Kamida bitta mahsulot (narx+miqdor)'); return; }
    setBusy(true);
    try {
      await api.post('/boss/purchase', { supplierId, paidAmount: parseFloat(paid) || 0, products: prods });
      setBuyOpen(false); setRows([]); setPaid(''); setSupplierId(null);
      Alert.alert('Tayyor', 'Kirim qo\'shildi — ombor va yetkazib beruvchi qarzi yangilandi'); load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Row justify="space-between">
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
          <T size="lg" weight="800">Yetkazib beruvchilar</T>
          <TouchableOpacity onPress={() => setAddOpen(true)}><Ionicons name="person-add" size={24} color={colors.primary} /></TouchableOpacity>
        </Row>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          <TouchableOpacity onPress={() => setBuyOpen(true)} activeOpacity={0.9}>
            <Row gap={12} style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md }}>
              <Ionicons name="download" size={26} color="#fff" />
              <View style={{ flex: 1 }}><T size="md" weight="800" color="#fff">Kirim qo'shish (harid)</T><T size="xs" color="rgba(255,255,255,0.9)">Kelgan tovarni omborga qo'shish</T></View>
              <Ionicons name="chevron-forward" size={22} color="#fff" />
            </Row>
          </TouchableOpacity>
          {list.map((s) => (
            <Card key={s.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('YetkazuvchiTarix', { id: s.id, name: s.organization || `${s.first_name} ${s.last_name}` })}>
              <Row justify="space-between">
                <View style={{ flex: 1 }}><T size="md" weight="700">{s.organization || `${s.first_name} ${s.last_name}`}</T><T size="xs" color={colors.textMuted}>{s.phone}</T></View>
                {s.debt > 0 ? (
                  <TouchableOpacity onPress={() => { setPayS(s); setPayAmt(''); }} style={{ alignItems: 'flex-end' }}>
                    <T size="xs" color={colors.textMuted}>Qarz</T>
                    <T size="md" weight="800" color={colors.danger}>{money(s.debt)}</T>
                    <View style={{ marginTop: 3, backgroundColor: colors.success + '18', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="cash-outline" size={12} color={colors.success} /><T size="xs" weight="800" color={colors.success}>To'lash</T></View>
                  </TouchableOpacity>
                ) : <T size="sm" color={colors.success} weight="700">Qarzsiz</T>}
              </Row>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Yangi yetkazib beruvchi */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
            <T size="lg" weight="800" style={{ marginBottom: spacing.md }}>Yangi yetkazib beruvchi</T>
            <Input label="Ism" value={f.firstName} onChangeText={(v) => setF({ ...f, firstName: v })} placeholder="Ism" icon="person-outline" autoCapitalize="words" />
            <Input label="Familiya" value={f.lastName} onChangeText={(v) => setF({ ...f, lastName: v })} placeholder="Familiya" icon="person-outline" autoCapitalize="words" />
            <Input label="Telefon" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} placeholder="+998..." icon="call-outline" keyboardType="phone-pad" />
            <Row gap={spacing.md}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setAddOpen(false)} /></View>
              <View style={{ flex: 1 }}><Button title="Qo'shish" onPress={createSupplier} loading={busy} /></View>
            </Row>
          </View>
        </View>
      </Modal>

      {/* Kirim (harid) */}
      <Modal visible={buyOpen} animationType="slide" onRequestClose={() => setBuyOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Row justify="space-between"><TouchableOpacity onPress={() => setBuyOpen(false)}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">Kirim (harid)</T><View style={{ width: 26 }} /></Row>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 8 }}>Yetkazib beruvchi</T>
            <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: spacing.lg }}>
              {list.map((s) => (
                <TouchableOpacity key={s.id} onPress={() => setSupplierId(s.id)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md, backgroundColor: supplierId === s.id ? colors.primary : colors.bgInput, borderWidth: 1, borderColor: supplierId === s.id ? colors.primary : colors.border }}>
                  <T size="sm" weight="700" color={supplierId === s.id ? '#fff' : colors.text}>{s.first_name}</T>
                </TouchableOpacity>
              ))}
            </Row>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <T size="sm" weight="700" color={colors.textMuted}>Mahsulotlar</T>
              <TouchableOpacity onPress={() => setPickOpen(true)}><Row gap={4}><Ionicons name="add-circle" size={20} color={colors.primary} /><T size="sm" weight="700" color={colors.primary}>Qo'shish</T></Row></TouchableOpacity>
            </Row>
            {rows.map((r, i) => (
              <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
                <Row justify="space-between"><T size="sm" weight="700" numberOfLines={1} style={{ flex: 1 }}>{r.name}</T><TouchableOpacity onPress={() => setRows(rows.filter((_, j) => j !== i))}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity></Row>
                <Row gap={8} style={{ marginTop: 8 }}>
                  <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Miqdor (kg)</T><TextInput value={r.qty} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, qty: t.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') } : x))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} /></View>
                  <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Narx (so'm/kg)</T><TextInput value={r.price} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, price: t.replace(/[^0-9]/g, '') } : x))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} /></View>
                </Row>
              </View>
            ))}
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: 6 }}>
              <Row justify="space-between" style={{ marginBottom: 10 }}><T size="md" weight="700">Jami summa</T><T size="lg" weight="900" color={colors.primary}>{money(total)}</T></Row>
              <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>To'langan pul</T>
              <TextInput value={paid.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setPaid(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} />
              <Row justify="space-between" style={{ marginTop: 10 }}><T size="md" weight="700">Qarzga qo'shiladi</T><T size="md" weight="900" color={colors.danger}>{money(Math.max(0, total - (parseFloat(paid) || 0)))}</T></Row>
            </View>
            <View style={{ marginTop: spacing.lg }}><Button title="Kirimni saqlash" icon="checkmark-done" onPress={submitPurchase} loading={busy} /></View>
          </ScrollView>
        </View>
      </Modal>

      {/* Mahsulot tanlash (bir nechta) */}
      <Modal visible={pickOpen} animationType="slide" onShow={() => setPsel({})} onRequestClose={() => setPickOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ paddingTop: 56, paddingBottom: 10, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Row justify="space-between" style={{ marginBottom: 10 }}><TouchableOpacity onPress={() => setPickOpen(false)}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">Mahsulotlar (bir nechta)</T><View style={{ width: 26 }} /></Row>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="search" size={18} color={colors.textDim} /><TextInput value={pq} onChangeText={setPq} placeholder="Qidirish..." placeholderTextColor={colors.textDim} style={{ flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8 }} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}>
            {products.filter((p) => !pq || p.name.toLowerCase().includes(pq.toLowerCase())).map((p) => {
              const on = !!psel[p.id];
              return (
                <TouchableOpacity key={p.id} onPress={() => setPsel((s) => ({ ...s, [p.id]: !s[p.id] }))}>
                  <Card style={{ marginBottom: 8, borderWidth: on ? 1.6 : 1, borderColor: on ? colors.primary : colors.border }}>
                    <Row justify="space-between"><View style={{ flex: 1, paddingRight: 10 }}><T size="md" weight="600" numberOfLines={1}>{p.name}</T><T size="xs" color={colors.textMuted}>qoldiq: {kg(p.stock)} kg</T></View><Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? colors.primary : colors.textDim} /></Row>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: 28, backgroundColor: colors.bgElevated, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Button title={pcount ? `Tanlash (${pcount})` : 'Mahsulotlarni belgilang'} icon="checkmark" onPress={addRows} />
          </View>
        </View>
      </Modal>

      {/* Yetkazib beruvchiga to'lov */}
      <Modal visible={!!payS} transparent animationType="fade" onRequestClose={() => setPayS(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          {payS && (
            <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
              <T size="lg" weight="800">{payS.first_name} {payS.last_name}</T>
              <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.md }}>Joriy qarz: {money(payS.debt)}</T>
              <Input money label="To'lov summasi (so'm)" value={payAmt} onChangeText={setPayAmt} placeholder="0" icon="cash-outline" />
              <TouchableOpacity onPress={() => setPayAmt(String(Math.round(payS.debt)))}><T size="sm" weight="700" color={colors.primary} style={{ marginBottom: spacing.md }}>To'liq: {money(payS.debt)}</T></TouchableOpacity>
              <Row gap={spacing.md}>
                <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setPayS(null)} /></View>
                <View style={{ flex: 1 }}><Button title="To'lash" onPress={doPaySupplier} loading={busy} /></View>
              </Row>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
const inp: any = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 12, color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: 4 };

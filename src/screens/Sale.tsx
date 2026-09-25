import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Card, Row, T, Button, money, kg, Header } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Sale({ navigation }: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [pickClient, setPickClient] = useState(false);
  const [pickProd, setPickProd] = useState(false);
  const [cq, setCq] = useState(''); const [pq, setPq] = useState('');
  const [rows, setRows] = useState<any[]>([]);   // [{productId,name,kg,price}]
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.get('/boss/clients'), api.get('/boss/products')])
      .then(([c, p]) => { setClients(c || []); setProducts(p || []); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  // Har focusda qayta yuklaydi — yetkazuvchidan yuk kelgach yangi qoldiq darhol ko'rinadi
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const total = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.kg) || 0) * (parseFloat(r.price) || 0), 0), [rows]);
  const debt = total - (parseFloat(paid) || 0);

  const addProds = (items: any[]) => {
    setRows((r) => {
      const ex = new Set(r.map((x) => x.productId));
      const add = items.filter((p) => !ex.has(p.id)).map((p) => ({ productId: p.id, name: p.name, kg: '', price: String(p.last_purchase_price || p.display_price || '') }));
      return [...r, ...add];
    });
    setPickProd(false); setPq('');
  };
  const submit = async () => {
    if (!client) { Alert.alert('Mijoz', 'Mijozni tanlang'); return; }
    const prods = rows.filter((r) => parseFloat(r.kg) > 0 && parseFloat(r.price) > 0).map((r) => ({ productId: r.productId, quantity: parseFloat(r.kg), price: parseFloat(r.price) }));
    if (!prods.length) { Alert.alert('Mahsulot', 'Kamida bitta mahsulot (kg + narx)'); return; }
    setBusy(true);
    try {
      await api.post('/boss/sale', { clientId: client.id, paidAmount: parseFloat(paid) || 0, products: prods });
      Alert.alert('Tayyor', 'Sotuv yaratildi — qarz, balans va ombor yangilandi', [{ text: 'OK', onPress: () => { setRows([]); setClient(null); setPaid(''); navigation.navigate('Home'); } }]);
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Sotuv" subtitle="Tarozida o'lchangan aniq kg bo'yicha" />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130 }}>
          <Card onPress={() => setPickClient(true)} style={{ marginBottom: spacing.md }}>
            <Row justify="space-between"><View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Mijoz</T><T size="md" weight="800">{client ? `${client.first_name} ${client.last_name}` : 'Tanlang'}</T></View><Ionicons name="chevron-forward" size={20} color={colors.textDim} /></Row>
          </Card>

          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <T size="sm" weight="800" color={colors.textMuted}>MAHSULOTLAR</T>
            <TouchableOpacity onPress={() => setPickProd(true)}><Row gap={4}><Ionicons name="add-circle" size={20} color={colors.primary} /><T size="sm" weight="700" color={colors.primary}>Qo'shish</T></Row></TouchableOpacity>
          </Row>
          {rows.length === 0 && <T size="sm" color={colors.textDim} style={{ textAlign: 'center', paddingVertical: 20 }}>"Qo'shish" bilan mahsulot tanlang</T>}
          {rows.map((r, i) => (
            <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.md, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
              <Row justify="space-between"><T size="md" weight="700" numberOfLines={1} style={{ flex: 1 }}>{r.name}</T><TouchableOpacity onPress={() => setRows(rows.filter((_, j) => j !== i))}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity></Row>
              <Row gap={8} style={{ marginTop: 8 }}>
                <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Kg (aniq)</T><TextInput value={r.kg} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, kg: t.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') } : x))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} /></View>
                <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Narx (so'm/kg)</T><TextInput value={r.price} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, price: t.replace(/[^0-9]/g, '') } : x))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} /></View>
                <View style={{ justifyContent: 'flex-end', minWidth: 80, alignItems: 'flex-end' }}><T size="xs" color={colors.textMuted}>Jami</T><T size="sm" weight="800" color={colors.primary}>{money((parseFloat(r.kg) || 0) * (parseFloat(r.price) || 0))}</T></View>
              </Row>
            </View>
          ))}

          {rows.length > 0 && (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: 6 }}>
              <Row justify="space-between" style={{ marginBottom: 10 }}><T size="md" weight="700">Jami summa</T><T size="lg" weight="900" color={colors.primary}>{money(total)}</T></Row>
              <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 6 }}>Mijoz to'lagan</T>
              <TextInput value={paid.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setPaid(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} />
              <Row justify="space-between" style={{ marginTop: 12 }}><T size="md" weight="700">Qarzga qo'shiladi</T><T size="md" weight="900" color={debt > 0 ? colors.danger : colors.success}>{money(Math.max(0, debt))}</T></Row>
            </View>
          )}
        </ScrollView>
      )}
      {rows.length > 0 && client && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bgElevated, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.lg, paddingBottom: 28 }}>
          <Button title="Sotuvni yaratish" icon="checkmark-done" onPress={submit} loading={busy} />
        </View>
      )}

      <Picker visible={pickClient} title="Mijoz" q={cq} setQ={setCq} data={clients.filter((c) => !cq || `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(cq.toLowerCase()))}
        render={(c: any) => `${c.first_name} ${c.last_name}`} sub={(c: any) => c.phone} onPick={(c: any) => { setClient(c); setPickClient(false); }} onClose={() => setPickClient(false)} />
      <Picker multi visible={pickProd} title="Mahsulotlar (bir nechta)" q={pq} setQ={setPq}
        data={products.filter((p) => p.stock > 0 && (!pq || p.name.toLowerCase().includes(pq.toLowerCase()))).sort((a: any, b: any) => b.stock - a.stock)}
        render={(p: any) => p.name} sub={(p: any) => `qoldiq: ${kg(p.stock)} kg`} onPickMany={addProds} onClose={() => setPickProd(false)} />
    </View>
  );
}

function Picker({ visible, title, q, setQ, data, render, sub, onPick, onPickMany, onClose, multi }: any) {
  const [sel, setSel] = React.useState<Record<number, boolean>>({});
  React.useEffect(() => { if (visible) setSel({}); }, [visible]);
  const count = Object.values(sel).filter(Boolean).length;
  const toggle = (id: number) => setSel((s) => ({ ...s, [id]: !s[id] }));
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: 56, paddingBottom: 10, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Row justify="space-between" style={{ marginBottom: 10 }}><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">{title}</T><View style={{ width: 26 }} /></Row>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="search" size={18} color={colors.textDim} /><TextInput value={q} onChangeText={setQ} placeholder="Qidirish..." placeholderTextColor={colors.textDim} style={{ flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8 }} />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: multi ? 110 : spacing.lg }}>
          {data.map((it: any) => {
            const on = !!sel[it.id];
            return (
              <TouchableOpacity key={it.id} onPress={() => multi ? toggle(it.id) : onPick(it)}>
                <Card style={{ marginBottom: 8, borderWidth: on ? 1.6 : 1, borderColor: on ? colors.primary : colors.border }}>
                  <Row justify="space-between">
                    <View style={{ flex: 1, paddingRight: 10 }}><T size="md" weight="600" numberOfLines={1}>{render(it)}</T><T size="xs" color={colors.textMuted}>{sub(it)}</T></View>
                    {multi && <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? colors.primary : colors.textDim} />}
                  </Row>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {multi && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: 28, backgroundColor: colors.bgElevated, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Button title={count ? `Tanlash (${count})` : 'Mahsulotlarni belgilang'} icon="checkmark" onPress={() => count > 0 && onPickMany(data.filter((it: any) => sel[it.id]))} />
          </View>
        )}
      </View>
    </Modal>
  );
}
const inp: any = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 12, color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: 4 };

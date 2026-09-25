import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, kg, Button, Row, Card } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

const inp: any = { backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 11, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md, fontWeight: '700' };
const cleanKg = (t: string) => t.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
const cleanNum = (t: string) => t.replace(/[^0-9]/g, '');
const fmtNum = (s: string) => (s || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function Qaytarish({ navigation }: any) {
  const [kind, setKind] = useState<'client' | 'supplier'>('client');
  const [settle, setSettle] = useState<'cash' | 'debt'>('cash');
  const [party, setParty] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [partyOpen, setPartyOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [pq, setPq] = useState('');
  const [psel, setPsel] = useState<any>({});

  const load = useCallback(async () => {
    try {
      const [c, s, p] = await Promise.all([api.get('/boss/clients'), api.get('/boss/suppliers'), api.get('/boss/products')]);
      setClients(c || []); setSuppliers(s || []); setProducts(p || []);
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const total = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0), [rows]);
  const partyList = kind === 'client' ? clients : suppliers;

  const setKindReset = (k: 'client' | 'supplier') => { setKind(k); setParty(null); };
  const pName = (x: any) => x?.organization || [x?.first_name, x?.last_name].filter(Boolean).join(' ') || '—';

  const addRows = () => {
    const picked = products.filter((p) => psel[p.id] && !rows.find((r) => r.productId === p.id))
      .map((p) => ({ productId: p.id, name: p.name, qty: '', price: String(p.last_purchase_price || p.display_price || '') }));
    setRows([...rows, ...picked]); setPsel({}); setPickOpen(false);
  };

  const submit = async () => {
    if (!party) { Alert.alert('Tanlash', kind === 'client' ? 'Mijozni tanlang' : 'Yetkazib beruvchini tanlang'); return; }
    const items = rows.filter((r) => parseFloat(r.qty) > 0 && parseFloat(r.price) >= 0).map((r) => ({ productId: r.productId, quantity: parseFloat(r.qty), price: parseFloat(r.price) }));
    if (!items.length) { Alert.alert('Mahsulot', 'Kamida bitta mahsulot (kg + narx)'); return; }
    setBusy(true);
    try {
      await api.post('/boss/return', { kind, partyId: party.id, settle, reason: reason.trim() || undefined, items });
      Alert.alert('Tayyor', 'Qaytarish saqlandi — ombor va ' + (settle === 'cash' ? 'kassa' : 'qarz') + ' yangilandi');
      setRows([]); setParty(null); setReason('');
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const effect = (() => {
    const t = money(total);
    if (kind === 'client') return settle === 'cash' ? `Kassa − ${t}` : `Mijoz qarzi − ${t}`;
    return settle === 'cash' ? `Kassa + ${t}` : `Yetkazuvchi qarzi − ${t}`;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Qaytarish" subtitle="Razvrad — mijoz yoki yetkazuvchi" onBack={() => navigation.goBack()}
        right={<TouchableOpacity onPress={() => setHistOpen(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="time-outline" size={20} color={colors.text} /></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        <Seg options={[{ k: 'client', l: 'Mijozdan qaytdi' }, { k: 'supplier', l: 'Yetkazuvchiga qaytdi' }]} val={kind} onSet={(v: any) => setKindReset(v)} />

        <T size="sm" weight="700" color={colors.textMuted} style={{ marginTop: spacing.lg, marginBottom: 6, marginLeft: 2 }}>{kind === 'client' ? 'Mijoz' : 'Yetkazib beruvchi'}</T>
        <TouchableOpacity onPress={() => setPartyOpen(true)} style={{ ...inp, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T size="md" weight="700" color={party ? colors.text : colors.textDim}>{party ? pName(party) : 'Tanlash...'}</T>
          <Ionicons name="chevron-down" size={18} color={colors.textDim} />
        </TouchableOpacity>

        <Row justify="space-between" style={{ marginTop: spacing.lg, marginBottom: 6 }}>
          <T size="sm" weight="700" color={colors.textMuted}>Mahsulotlar</T>
          <TouchableOpacity onPress={() => setPickOpen(true)}><Row gap={4}><Ionicons name="add-circle" size={20} color={colors.primary} /><T size="sm" weight="700" color={colors.primary}>Qo'shish</T></Row></TouchableOpacity>
        </Row>
        {rows.length === 0 && <T size="sm" color={colors.textDim} style={{ marginLeft: 2, marginBottom: 6 }}>Qaytarilgan mahsulotni qo'shing</T>}
        {rows.map((r, i) => (
          <View key={i} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
            <Row justify="space-between"><T size="sm" weight="700" numberOfLines={1} style={{ flex: 1 }}>{r.name}</T><TouchableOpacity onPress={() => setRows(rows.filter((_, j) => j !== i))}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity></Row>
            <Row gap={8} style={{ marginTop: 8 }}>
              <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Miqdor (kg)</T><TextInput value={r.qty} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, qty: cleanKg(t) } : x))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} /></View>
              <View style={{ flex: 1 }}><T size="xs" color={colors.textMuted}>Narx (so'm/kg)</T><TextInput value={fmtNum(r.price)} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, price: cleanNum(t) } : x))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim} style={inp} /></View>
            </Row>
          </View>
        ))}

        <T size="sm" weight="700" color={colors.textMuted} style={{ marginTop: spacing.lg, marginBottom: 6, marginLeft: 2 }}>Hisob-kitob</T>
        <Seg options={kind === 'client'
          ? [{ k: 'cash', l: 'Pul qaytarildi' }, { k: 'debt', l: 'Qarzdan chegirildi' }]
          : [{ k: 'cash', l: 'Pul qaytarib olindi' }, { k: 'debt', l: 'Qarzdan chegirildi' }]} val={settle} onSet={(v: any) => setSettle(v)} />

        <T size="sm" weight="700" color={colors.textMuted} style={{ marginTop: spacing.lg, marginBottom: 6, marginLeft: 2 }}>Sabab (ixtiyoriy)</T>
        <TextInput value={reason} onChangeText={setReason} placeholder="Masalan: sifatsiz, muddati o'tgan..." placeholderTextColor={colors.textDim} style={{ ...inp, height: 64, textAlignVertical: 'top' }} multiline />

        <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.lg }}>
          <Row justify="space-between"><T size="md" weight="700">Jami summa</T><T size="lg" weight="900" color={colors.primary}>{money(total)}</T></Row>
          <Row justify="space-between" style={{ marginTop: 8 }}><T size="sm" weight="700" color={colors.textMuted}>Ta'sir</T><T size="sm" weight="800" color={colors.text}>{effect}</T></Row>
        </View>

        <View style={{ marginTop: spacing.lg }}><Button title="Qaytarishni saqlash" icon="return-down-back-outline" onPress={submit} loading={busy} /></View>
      </ScrollView>

      <PickerModal visible={partyOpen} title={kind === 'client' ? 'Mijozni tanlang' : 'Yetkazib beruvchini tanlang'} onClose={() => setPartyOpen(false)}
        data={partyList} label={pName} onPick={(x: any) => { setParty(x); setPartyOpen(false); }} />

      <Modal visible={pickOpen} animationType="slide" onShow={() => setPsel({})} onRequestClose={() => setPickOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ paddingTop: 56, paddingBottom: 10, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Row justify="space-between" style={{ marginBottom: 10 }}><TouchableOpacity onPress={() => setPickOpen(false)}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">Mahsulotlar</T><View style={{ width: 26 }} /></Row>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="search" size={18} color={colors.textDim} /><TextInput value={pq} onChangeText={setPq} placeholder="Qidirish..." placeholderTextColor={colors.textDim} style={{ flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8 }} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
            {products.filter((p) => !pq || p.name.toLowerCase().includes(pq.toLowerCase())).map((p) => {
              const on = !!psel[p.id];
              return (
                <TouchableOpacity key={p.id} onPress={() => setPsel((s: any) => ({ ...s, [p.id]: !s[p.id] }))}>
                  <Card style={{ marginBottom: 8, borderWidth: on ? 1.6 : 1, borderColor: on ? colors.primary : colors.border }}>
                    <Row justify="space-between"><View style={{ flex: 1, paddingRight: 10 }}><T size="md" weight="600" numberOfLines={1}>{p.name}</T><T size="xs" color={colors.textMuted}>qoldiq: {kg(p.stock)} kg</T></View><Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? colors.primary : colors.textDim} /></Row>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: 28, backgroundColor: colors.bgElevated, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Button title="Tanlash" icon="checkmark" onPress={addRows} />
          </View>
        </View>
      </Modal>

      <ReturnsHistory visible={histOpen} onClose={() => setHistOpen(false)} />
    </View>
  );
}

function Seg({ options, val, onSet }: any) {
  return (
    <Row gap={4} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 4 }}>
      {options.map((o: any) => (
        <TouchableOpacity key={o.k} onPress={() => onSet(o.k)} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 10, borderRadius: radii.sm, backgroundColor: val === o.k ? colors.primary : 'transparent', alignItems: 'center' }}>
          <T size="sm" weight="800" color={val === o.k ? '#fff' : colors.textMuted}>{o.l}</T>
        </TouchableOpacity>
      ))}
    </Row>
  );
}

function PickerModal({ visible, title, onClose, data, label, onPick }: any) {
  const [s, setS] = useState('');
  const list = (data || []).filter((x: any) => !s || label(x).toLowerCase().includes(s.toLowerCase()) || String(x.phone || '').includes(s));
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: 56, paddingBottom: 10, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Row justify="space-between" style={{ marginBottom: 10 }}><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">{title}</T><View style={{ width: 26 }} /></Row>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="search" size={18} color={colors.textDim} /><TextInput value={s} onChangeText={setS} placeholder="Qidirish..." placeholderTextColor={colors.textDim} style={{ flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8 }} />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {list.map((x: any) => (
            <TouchableOpacity key={x.id} onPress={() => onPick(x)}>
              <Card style={{ marginBottom: 8 }}><Row justify="space-between"><View style={{ flex: 1 }}><T size="md" weight="700" numberOfLines={1}>{label(x)}</T>{x.phone ? <T size="xs" color={colors.textMuted}>{x.phone}</T> : null}</View>{x.debt > 0 ? <T size="sm" weight="800" color={colors.danger}>{money(x.debt)}</T> : null}</Row></Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ReturnsHistory({ visible, onClose }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    api.get('/boss/returns').then((r) => setList(r || [])).catch(() => {}).finally(() => setLoading(false));
  };
  React.useEffect(() => { if (visible) reload(); }, [visible]);
  const del = (r: any) => {
    Alert.alert('Qaytarishni o\'chirish', `${r.party_name || '—'} · ${money(r.total_amount)}\n\nOmbor, kassa va qarz orqaga qaytadi.`, [
      { text: 'Bekor', style: 'cancel' },
      { text: 'O\'chirish', style: 'destructive', onPress: async () => { try { await api.del(`/boss/return/${r.id}`); reload(); } catch (e: any) { Alert.alert('Xato', e.message); } } },
    ]);
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Row justify="space-between"><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">Qaytarishlar tarixi</T><View style={{ width: 26 }} /></Row>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            {list.length === 0 && <T size="sm" color={colors.textDim} style={{ textAlign: 'center', marginTop: 40 }}>Hali qaytarish yo'q</T>}
            {list.map((r) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: (r.kind === 'client' ? colors.info : colors.warning) + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="return-down-back-outline" size={18} color={r.kind === 'client' ? colors.info : colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <T size="sm" weight="800" numberOfLines={1}>{r.party_name || '—'}</T>
                  <T size="xs" color={colors.textDim} weight="600">{new Date(r.created_at).toLocaleDateString('ru-RU')} · {r.kind === 'client' ? 'mijozdan' : 'yetkazuvchiga'} · {r.settle === 'cash' ? 'pul' : 'qarzdan'}{r.reason ? ' · ' + r.reason : ''}</T>
                </View>
                <T size="sm" weight="900">{money(r.total_amount)}</T>
                <TouchableOpacity onPress={() => del(r)} hitSlop={8} style={{ marginLeft: 6, padding: 4 }}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

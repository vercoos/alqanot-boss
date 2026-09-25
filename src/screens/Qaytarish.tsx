import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, kg, Button, Row } from '../components/ui';
import { PickerModal } from './Sale';
import { colors, spacing, radii } from '../theme';

export default function Qaytarish({ navigation }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api.get('/api/returns')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Qaytarish" subtitle={`${rows.length} ta`} onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {rows.map((r) => (
            <View key={r.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
              <Row justify="space-between"><T weight="800">{r.kind === 'client' ? 'Mijozdan' : 'Yetkazuvchiga'} · {r.party_name || '—'}</T><T weight="900" color={colors.warning}>{money(r.total_amount)}</T></Row>
              <T size="xs" color={colors.textMuted} weight="600" style={{ marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString('ru-RU')}</T>
            </View>
          ))}
          {rows.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>Qaytarish yo'q</T>}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.9}
        style={{ position: 'absolute', right: 18, bottom: 22, height: 56, borderRadius: 28, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, elevation: 7 }}>
        <Ionicons name="add" size={24} color="#fff" /><T weight="900" color="#fff">Qaytarish</T>
      </TouchableOpacity>
      <NewReturn visible={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />
    </View>
  );
}

function NewReturn({ visible, onClose, onDone }: any) {
  const [kind, setKind] = useState<'client' | 'supplier'>('client');
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [partyId, setPartyId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([{ productId: null, qty: '', price: '' }]);
  const [busy, setBusy] = useState(false);
  const [pickParty, setPickParty] = useState(false);
  const [pickProdIdx, setPickProdIdx] = useState<number | null>(null);

  const loadParties = async (k: string) => { try { setParties((await api.get(k === 'client' ? '/api/clients' : '/api/suppliers')) || []); } catch {} };
  React.useEffect(() => {
    if (!visible) return;
    setKind('client'); setPartyId(null); setRows([{ productId: null, qty: '', price: '' }]);
    (async () => { await loadParties('client'); try { setProducts((await api.get('/api/products')) || []); } catch {} })();
  }, [visible]);

  const party = parties.find((p) => p.id === partyId);
  const total = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0);
  const setRow = (i: number, k: string, v: any) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));

  const submit = async () => {
    const items = rows.filter((r) => r.productId && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0)
      .map((r) => ({ productId: r.productId, name: products.find((p) => p.id === r.productId)?.name || 'Mahsulot', qty: parseFloat(r.qty), price: parseFloat(r.price) }));
    if (!items.length) { Alert.alert('Mahsulot', 'Mahsulot qo\'shing'); return; }
    setBusy(true);
    try { await api.post('/api/returns', { kind, partyId, items }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <T size="lg" weight="800" style={{ flex: 1 }}>Yangi qaytarish</T>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Row gap={8} style={{ marginBottom: 14 }}>
              {(['client', 'supplier'] as const).map((k) => (
                <TouchableOpacity key={k} onPress={() => { setKind(k); setPartyId(null); loadParties(k); }}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', backgroundColor: kind === k ? colors.primary : colors.bgCard, borderWidth: 1, borderColor: kind === k ? colors.primary : colors.border }}>
                  <T weight="800" color={kind === k ? '#fff' : colors.text}>{k === 'client' ? 'Mijozdan (ombor +)' : 'Yetkazuvchiga (ombor −)'}</T>
                </TouchableOpacity>
              ))}
            </Row>
            <TouchableOpacity onPress={() => setPickParty(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, marginBottom: 14 }}>
              <T weight="700" style={{ flex: 1 }} color={party ? colors.text : colors.textDim}>{party ? party.name : 'Tomonni tanlang'}</T>
              <Ionicons name="chevron-down" size={18} color={colors.textDim} />
            </TouchableOpacity>
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
            <Row justify="space-between" style={{ marginVertical: 16 }}><T size="md" weight="800">Jami</T><T size="xl" weight="900" color={colors.warning}>{money(total)}</T></Row>
            <Button title="Saqlash" icon="checkmark" loading={busy} onPress={submit} />
          </ScrollView>
        </View>
      </View>
      <PickerModal visible={pickParty} title="Tomon tanlang" items={parties.map((p) => ({ id: p.id, label: p.name, sub: p.phone }))}
        onClose={() => setPickParty(false)} onPick={(id: number) => { setPartyId(id); setPickParty(false); }} />
      <PickerModal visible={pickProdIdx !== null} title="Mahsulot tanlang" items={products.map((p) => ({ id: p.id, label: p.name, sub: `qoldiq ${kg(p.stock)} ${p.unit}` }))}
        onClose={() => setPickProdIdx(null)} onPick={(id: number) => { if (pickProdIdx !== null) setRow(pickProdIdx, 'productId', id); setPickProdIdx(null); }} />
    </Modal>
  );
}

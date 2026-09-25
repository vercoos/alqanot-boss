import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, Button, Row } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

// kind: 'client' | 'supplier' — bir ekran ikkalasiga (Clients + Suppliers)
export default function Parties({ navigation, kind = 'client' }: any) {
  const isC = kind === 'client';
  const path = isC ? 'clients' : 'suppliers';
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [payFor, setPayFor] = useState<any>(null);

  const load = useCallback(async () => {
    try { setRows((await api.get(`/api/${path}`)) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [path]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = q ? rows.filter((r) => (r.name || '').toLowerCase().includes(q.toLowerCase()) || (r.phone || '').includes(q)) : rows;
  const totalDebt = rows.reduce((s, r) => s + (Number(r.debt) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={isC ? 'Mijozlar' : 'Yetkazuvchilar'} subtitle={`${rows.length} ta · jami qarz ${money(totalDebt)}`} onBack={navigation ? () => navigation.goBack() : undefined} />
      <View style={{ padding: spacing.lg, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput value={q} onChangeText={setQ} placeholder="Qidirish" placeholderTextColor={colors.textDim}
            style={{ flex: 1, padding: 12, color: colors.text, fontWeight: '600' }} />
        </View>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {list.map((r) => (
            <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => openDetail(r.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary + '16', alignItems: 'center', justifyContent: 'center' }}>
                <T weight="800" color={colors.primary}>{(r.name || '?').slice(0, 1).toUpperCase()}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T weight="800" numberOfLines={1}>{r.name}</T>
                <T size="xs" color={colors.textMuted} weight="600">{r.phone || '—'}</T>
              </View>
              <T weight="900" color={r.debt > 0 ? colors.danger : colors.success}>{money(r.debt || 0)}</T>
            </TouchableOpacity>
          ))}
          {list.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>Topilmadi</T>}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => setAddOpen(true)} activeOpacity={0.9}
        style={{ position: 'absolute', right: 18, bottom: 22, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 7 }}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      <DetailModal kind={kind} detail={detail} onClose={() => setDetail(null)} onPay={() => { setPayFor(detail); setDetail(null); }} />
      <AddModal kind={kind} visible={addOpen} onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); load(); }} />
      <PayModal kind={kind} party={payFor} onClose={() => setPayFor(null)} onDone={() => { setPayFor(null); load(); }} />
    </View>
  );

  async function openDetail(id: number) {
    try { setDetail(await api.get(`/api/${path}/${id}`)); } catch (e: any) { Alert.alert('Xato', e.message); }
  }
}

function DetailModal({ kind, detail, onClose, onPay }: any) {
  const isC = kind === 'client';
  if (!detail) return null;
  const txns = isC ? (detail.sales || []) : (detail.purchases || []);
  const pays = detail.payments || [];
  return (
    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}><T size="lg" weight="800">{detail.name}</T><T size="sm" color={colors.textMuted}>{detail.phone || ''}</T></View>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <View style={{ backgroundColor: (detail.debt > 0 ? colors.danger : colors.success) + '14', borderRadius: radii.md, padding: spacing.md, marginBottom: 16 }}>
              <T size="xs" weight="700" color={colors.textMuted}>{isC ? 'Joriy qarz' : 'Bizning qarz'}</T>
              <T size="xxl" weight="900" color={detail.debt > 0 ? colors.danger : colors.success}>{money(detail.debt || 0)}</T>
            </View>
            <T size="sm" weight="800" color={colors.textMuted} style={{ marginBottom: 8 }}>{isC ? 'SOTUVLAR' : 'XARIDLAR'}</T>
            {txns.length === 0 && <T size="sm" color={colors.textDim} style={{ marginBottom: 10 }}>Yo'q</T>}
            {txns.map((t: any) => (
              <Row key={t.id} justify="space-between" style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <T size="sm" color={colors.textMuted}>№{t.id} · {new Date(t.created_at).toLocaleDateString('ru-RU')}</T>
                <T size="sm" weight="700">{money(t.total_amount)}</T>
              </Row>
            ))}
            <T size="sm" weight="800" color={colors.textMuted} style={{ marginTop: 16, marginBottom: 8 }}>TO'LOVLAR</T>
            {pays.length === 0 && <T size="sm" color={colors.textDim}>Yo'q</T>}
            {pays.map((p: any, i: number) => (
              <Row key={i} justify="space-between" style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <T size="sm" color={colors.textMuted}>{new Date(p.created_at).toLocaleDateString('ru-RU')}</T>
                <T size="sm" weight="700" color={colors.success}>{money(p.amount)}</T>
              </Row>
            ))}
            <Button title={isC ? "To'lov qabul qilish" : "To'lov qilish"} icon="cash" variant="secondary" onPress={onPay} style={{ marginTop: 18 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AddModal({ kind, visible, onClose, onDone }: any) {
  const isC = kind === 'client';
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [addr, setAddr] = useState(''); const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (visible) { setName(''); setPhone(''); setAddr(''); } }, [visible]);
  const submit = async () => {
    if (!name.trim()) { Alert.alert('Nom', 'Nomni kiriting'); return; }
    setBusy(true);
    try { await api.post(`/api/${isC ? 'clients' : 'suppliers'}`, { name: name.trim(), phone, address: addr }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const inp = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, color: colors.text, fontWeight: '700' as const, fontSize: fontSize.md, marginBottom: 12 };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}><T size="lg" weight="800">Yangi {isC ? 'mijoz' : 'yetkazuvchi'}</T><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity></Row>
          <TextInput value={name} onChangeText={setName} placeholder="Nomi" placeholderTextColor={colors.textDim} style={inp} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Telefon" placeholderTextColor={colors.textDim} keyboardType="phone-pad" style={inp} />
          {isC && <TextInput value={addr} onChangeText={setAddr} placeholder="Manzil" placeholderTextColor={colors.textDim} style={inp} />}
          <Button title="Saqlash" icon="checkmark" loading={busy} onPress={submit} style={{ marginTop: 4 }} />
        </View>
      </View>
    </Modal>
  );
}

function PayModal({ kind, party, onClose, onDone }: any) {
  const isC = kind === 'client';
  const [amt, setAmt] = useState(''); const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (party) setAmt(''); }, [party]);
  if (!party) return null;
  const submit = async () => {
    const v = parseFloat(amt) || 0; if (v <= 0) { Alert.alert('Summa', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post(`/api/${isC ? 'clients' : 'suppliers'}/${party.id}/payment`, { amount: v }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  return (
    <Modal visible={!!party} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 6 }}><T size="lg" weight="800">To'lov</T><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity></Row>
          <T size="sm" color={colors.textMuted} style={{ marginBottom: 14 }}>{party.name}</T>
          <TextInput value={amt.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setAmt(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textDim} autoFocus
            style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 16, color: colors.text, fontWeight: '900', fontSize: fontSize.xl, textAlign: 'center', marginBottom: 16 }} />
          <Button title="Saqlash" icon="checkmark" variant="secondary" loading={busy} onPress={submit} />
        </View>
      </View>
    </Modal>
  );
}

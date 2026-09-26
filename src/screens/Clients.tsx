import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Card, Row, T, Button, Input, money } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export default function Clients({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [uname, setUname] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [nf, setNf] = useState<any>({ firstName: '', lastName: '', phone: '', address: '', username: '', password: '' });
  const [payClient, setPayClient] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');

  const doPay = async () => {
    if (!(parseFloat(payAmount) > 0)) { Alert.alert('Summa', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post('/boss/payment/client', { clientId: payClient.id, amount: parseFloat(payAmount) }); setPayClient(null); setPayAmount(''); Alert.alert('Tayyor', 'To\'lov qabul qilindi — qarzdan ayrildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const createNew = async () => {
    if (!nf.firstName.trim() || !nf.phone.trim()) { Alert.alert('Maydonlar', 'Ism va telefon shart'); return; }
    setBusy(true);
    try {
      await api.post('/boss/client-new', nf);
      setNewOpen(false); setNf({ firstName: '', lastName: '', phone: '', address: '', username: '', password: '' });
      Alert.alert('Tayyor', 'Yangi mijoz qo\'shildi' + (nf.username && nf.password ? ' (ilova login bilan)' : '')); load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const load = useCallback(async () => { try { setList(await api.get('/boss/clients') || []); } catch {} finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openEdit = (c: any) => { setEdit(c); setUname(c.username || ''); setPw(''); };
  const save = async () => {
    if (!uname.trim()) { Alert.alert('Login', 'Username kiriting'); return; }
    if (!edit.has_login && !pw) { Alert.alert('Parol', 'Yangi login uchun parol kiriting'); return; }
    setBusy(true);
    try {
      await api.post('/boss/client-auth', { clientId: edit.id, username: uname.trim(), password: pw || undefined, resetPassword: !!pw });
      setEdit(null); Alert.alert('Tayyor', 'Mijoz login ma\'lumoti saqlandi'); load();
    } catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  const filtered = list.filter((c) => !q || `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Row justify="space-between" style={{ marginBottom: 10 }}>
          {navigation?.canGoBack?.() ? <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity> : <View style={{ width: 26 }} />}
          <T size="lg" weight="800">Mijozlar</T>
          <TouchableOpacity onPress={() => setNewOpen(true)}><Ionicons name="person-add" size={24} color={colors.primary} /></TouchableOpacity>
        </Row>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search" size={18} color={colors.textDim} />
          <TextInput value={q} onChangeText={setQ} placeholder="Qidirish..." placeholderTextColor={colors.textDim} style={{ flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8 }} />
        </View>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {filtered.map((c) => (
            <Card key={c.id} style={{ marginBottom: 10 }} onPress={() => navigation.navigate('MijozTarix', { id: c.id, name: `${c.first_name} ${c.last_name}` })}>
              <Row justify="space-between">
                <View style={{ flex: 1 }}>
                  <T size="md" weight="700">{c.first_name} {c.last_name}</T>
                  <T size="xs" color={colors.textMuted}>{c.phone}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {c.debt > 0 ? (
                    <TouchableOpacity onPress={() => { setPayClient(c); setPayAmount(''); }} style={{ alignItems: 'flex-end' }}>
                      <T size="sm" weight="800" color={colors.danger}>{money(c.debt)}</T>
                      <View style={{ marginTop: 3, backgroundColor: colors.success + '18', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="cash-outline" size={12} color={colors.success} /><T size="xs" weight="800" color={colors.success}>To'lash</T>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={c.has_login ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={c.has_login ? colors.success : colors.textDim} />
                      <T size="xs" color={c.has_login ? colors.success : colors.textDim} weight="600">{c.has_login ? 'Login bor' : 'Login yo\'q'}</T>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => openEdit(c)} hitSlop={8} style={{ marginLeft: 10, padding: 4 }}><Ionicons name="key-outline" size={18} color={colors.textDim} /></TouchableOpacity>
              </Row>
            </Card>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!edit} transparent animationType="fade" onRequestClose={() => setEdit(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          {edit && (
            <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
              <T size="lg" weight="800">{edit.first_name} {edit.last_name}</T>
              <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>{edit.has_login ? 'Login ma\'lumotini o\'zgartirish' : 'Ilova uchun login/parol berish'}</T>
              <Input label="Username (login)" value={uname} onChangeText={setUname} placeholder="mijoz_login" icon="person-outline" />
              <Input label={edit.has_login ? 'Yangi parol (bo\'sh — o\'zgarmaydi)' : 'Parol'} value={pw} onChangeText={setPw} placeholder="••••••" secure icon="lock-closed-outline" />
              <Row gap={spacing.md} style={{ marginTop: 4 }}>
                <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setEdit(null)} /></View>
                <View style={{ flex: 1 }}><Button title="Saqlash" onPress={save} loading={busy} /></View>
              </Row>
            </View>
          )}
        </View>
      </Modal>

      {/* Yangi mijoz */}
      <Modal visible={newOpen} animationType="slide" onRequestClose={() => setNewOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ paddingTop: 56, paddingBottom: 10, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Row justify="space-between"><TouchableOpacity onPress={() => setNewOpen(false)}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity><T size="lg" weight="800">Yangi mijoz</T><View style={{ width: 26 }} /></Row>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Input label="Ism *" value={nf.firstName} onChangeText={(v) => setNf({ ...nf, firstName: v })} placeholder="Ism" icon="person-outline" autoCapitalize="words" />
            <Input label="Familiya" value={nf.lastName} onChangeText={(v) => setNf({ ...nf, lastName: v })} placeholder="Familiya" icon="person-outline" autoCapitalize="words" />
            <Input label="Telefon *" value={nf.phone} onChangeText={(v) => setNf({ ...nf, phone: v })} placeholder="+998..." icon="call-outline" keyboardType="phone-pad" />
            <Input label="Manzil" value={nf.address} onChangeText={(v) => setNf({ ...nf, address: v })} placeholder="Manzil" icon="location-outline" autoCapitalize="sentences" />
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginVertical: 8, marginLeft: 4 }}>ILOVA LOGIN (ixtiyoriy)</T>
            <Input label="Login" value={nf.username} onChangeText={(v) => setNf({ ...nf, username: v })} placeholder="mijoz_login" icon="at-outline" />
            <Input label="Parol" value={nf.password} onChangeText={(v) => setNf({ ...nf, password: v })} placeholder="••••••" secure icon="lock-closed-outline" />
            <Button title="Mijoz qo'shish" icon="checkmark-circle" onPress={createNew} loading={busy} />
          </ScrollView>
        </View>
      </Modal>

      {/* Qarz to'lash */}
      <Modal visible={!!payClient} transparent animationType="fade" onRequestClose={() => setPayClient(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          {payClient && (
            <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
              <T size="lg" weight="800">{payClient.first_name} {payClient.last_name}</T>
              <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.md }}>Joriy qarz: {money(payClient.debt)}</T>
              <Input money label="To'lov summasi (so'm)" value={payAmount} onChangeText={setPayAmount} placeholder="0" icon="cash-outline" />
              <TouchableOpacity onPress={() => setPayAmount(String(Math.round(payClient.debt)))}><T size="sm" weight="700" color={colors.primary} style={{ marginBottom: 8 }}>To'liq to'lash: {money(payClient.debt)}</T></TouchableOpacity>
              {parseFloat(payAmount) > 0 ? <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.md }}>To'lovdan keyin qoladi: <T size="sm" weight="800" color={colors.text}>{money(Math.max(0, payClient.debt - parseFloat(payAmount)))}</T></T> : <View style={{ marginBottom: spacing.md }} />}
              <Row gap={spacing.md}>
                <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setPayClient(null)} /></View>
                <View style={{ flex: 1 }}><Button title="Qabul qilish" onPress={doPay} loading={busy} /></View>
              </Row>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Header, T, money, Button, Row } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Expenses({ navigation }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api.get('/api/expenses')) || []); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const total = rows.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Xarajatlar" subtitle={`Jami ${money(total)}`} onBack={() => navigation.goBack()} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {rows.map((e) => (
            <Row key={e.id} justify="space-between" style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
              <View style={{ flex: 1 }}><T weight="700">{e.note || 'Xarajat'}</T><T size="xs" color={colors.textMuted}>{new Date(e.created_at).toLocaleDateString('ru-RU')}</T></View>
              <T weight="900" color={colors.danger}>−{money(e.amount)}</T>
            </Row>
          ))}
          {rows.length === 0 && <T color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>Xarajat yo'q</T>}
        </ScrollView>
      )}
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.9}
        style={{ position: 'absolute', right: 18, bottom: 22, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 7 }}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
      <AddExpense visible={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />
    </View>
  );
}

function AddExpense({ visible, onClose, onDone }: any) {
  const [amt, setAmt] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (visible) { setAmt(''); setNote(''); } }, [visible]);
  const submit = async () => {
    const v = parseFloat(amt) || 0; if (v <= 0) { Alert.alert('Summa', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post('/api/expenses', { amount: v, note }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const inp = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: colors.border, padding: 14, color: colors.text, fontWeight: '700' as const, fontSize: fontSize.md, marginBottom: 12 };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}><T size="lg" weight="800">Yangi xarajat</T><TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></TouchableOpacity></Row>
          <TextInput value={amt.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} onChangeText={(t) => setAmt(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Summa" placeholderTextColor={colors.textDim} style={inp} />
          <TextInput value={note} onChangeText={setNote} placeholder="Izoh (nima uchun)" placeholderTextColor={colors.textDim} style={inp} />
          <Button title="Saqlash" icon="checkmark" loading={busy} onPress={submit} style={{ marginTop: 4 }} />
        </View>
      </View>
    </Modal>
  );
}

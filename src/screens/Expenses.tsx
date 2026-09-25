import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '../api';
import { Card, Row, T, Button, Input, money, Header } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

export default function Expenses({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [newTypeOpen, setNewTypeOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [busy, setBusy] = useState(false);
  const [dl, setDl] = useState(false);

  const downloadExcel = async () => {
    setDl(true);
    try {
      const r = await api.get('/boss/expenses/excel');
      const uri = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') + (r.filename || 'xarajatlar.xlsx');
      await FileSystem.writeAsStringAsync(uri, r.base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Xarajatlar (Excel)', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
      } else { Alert.alert('Saqlandi', uri); }
    } catch (e: any) { Alert.alert('Xatolik', e?.message || 'Excel yuklab bo\'lmadi'); } finally { setDl(false); }
  };

  const load = useCallback(async () => {
    try { const [e, t] = await Promise.all([api.get('/boss/expenses'), api.get('/boss/expense-types')]); setList(e || []); setTypes(t || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addExpense = async () => {
    if (!typeId) { Alert.alert('Turi', 'Harajat turini tanlang'); return; }
    if (!(parseFloat(amount) > 0)) { Alert.alert('Summa', 'Summani kiriting'); return; }
    setBusy(true);
    try { await api.post('/boss/expense', { typeId, amount: parseFloat(amount) }); setAddOpen(false); setAmount(''); setTypeId(null); Alert.alert('Tayyor', 'Harajat kiritildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };
  const addType = async () => {
    if (!newType.trim()) { Alert.alert('Nom', 'Nom kiriting'); return; }
    setBusy(true);
    try { await api.post('/boss/expense-type', { name: newType.trim() }); setNewType(''); setNewTypeOpen(false); Alert.alert('Tayyor', 'Tur qo\'shildi'); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Harajatlar" subtitle="Oylik, yoqilg'i, elektr va boshqalar" onBack={() => navigation.goBack()}
        right={<TouchableOpacity onPress={() => setAddOpen(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          <Button title="Xarajat qo'shish" icon="add-circle-outline" onPress={() => setAddOpen(true)} style={{ marginBottom: spacing.sm }} />
          {list.length > 0 && <Button title={dl ? 'Tayyorlanmoqda...' : 'Excel yuklab olish'} variant="secondary" icon="download-outline" onPress={downloadExcel} loading={dl} style={{ marginBottom: spacing.md }} />}
          {list.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 50 }}><Ionicons name="wallet-outline" size={54} color={colors.textDim} /><T size="md" color={colors.textMuted} weight="600" style={{ marginTop: 12 }}>Hali xarajat yo'q</T></View>}
          {list.map((e) => (
            <Card key={e.id} style={{ marginBottom: 8 }}>
              <Row justify="space-between">
                <View style={{ flex: 1 }}><T size="md" weight="700">{e.type_name || 'Harajat'}</T><T size="xs" color={colors.textDim}>{new Date(e.created_at).toLocaleDateString('uz')}</T></View>
                <T size="md" weight="800" color={colors.danger}>-{money(e.amount)}</T>
              </Row>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Harajat qo'shish */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
            <Row justify="space-between" style={{ marginBottom: spacing.md }}>
              <T size="lg" weight="800">Harajat qo'shish</T>
              <TouchableOpacity onPress={() => { setAddOpen(false); setNewTypeOpen(true); }}><Row gap={4}><Ionicons name="add-circle" size={18} color={colors.primary} /><T size="sm" weight="700" color={colors.primary}>Yangi tur</T></Row></TouchableOpacity>
            </Row>
            <T size="sm" weight="700" color={colors.textMuted} style={{ marginBottom: 8 }}>Turi</T>
            <View style={{ maxHeight: 180 }}>
              <ScrollView>
                <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: spacing.md }}>
                  {types.map((t) => (
                    <TouchableOpacity key={t.id} onPress={() => setTypeId(t.id)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.md, backgroundColor: typeId === t.id ? colors.primary : colors.bgInput, borderWidth: 1, borderColor: typeId === t.id ? colors.primary : colors.border }}>
                      <T size="sm" weight="700" color={typeId === t.id ? '#fff' : colors.text}>{t.name}</T>
                    </TouchableOpacity>
                  ))}
                </Row>
              </ScrollView>
            </View>
            <Input money label="Summa (so'm)" value={amount} onChangeText={setAmount} placeholder="0" icon="cash-outline" />
            <Row gap={spacing.md}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setAddOpen(false)} /></View>
              <View style={{ flex: 1 }}><Button title="Kiritish" onPress={addExpense} loading={busy} /></View>
            </Row>
          </View>
        </View>
      </Modal>

      {/* Yangi tur */}
      <Modal visible={newTypeOpen} transparent animationType="fade" onRequestClose={() => setNewTypeOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
            <T size="lg" weight="800" style={{ marginBottom: spacing.md }}>Yangi harajat turi</T>
            <Input label="Nomi" value={newType} onChangeText={setNewType} placeholder="Masalan: Reklama" icon="pricetag-outline" autoCapitalize="sentences" />
            <Row gap={spacing.md}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => { setNewTypeOpen(false); setAddOpen(true); }} /></View>
              <View style={{ flex: 1 }}><Button title="Qo'shish" onPress={addType} loading={busy} /></View>
            </Row>
          </View>
        </View>
      </Modal>
    </View>
  );
}

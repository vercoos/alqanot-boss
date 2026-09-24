import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { T, money, Badge, Button, Card } from '../components/ui';
import { colors, spacing, radii, fontSize } from '../theme';

const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Yangi', color: '#5B8DEF' }, assigned: { label: 'Biriktirildi', color: '#E0A33C' },
  on_way: { label: "Yo'lda", color: '#F0813F' }, delivered: { label: 'Yetkazildi', color: '#33C08A' }, canceled: { label: 'Bekor', color: '#E8604C' },
};
const inp: any = { backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, paddingHorizontal: 12, color: colors.text, fontSize: fontSize.md, fontWeight: '700' };

export default function Buyurtmalar() {
  const [list, setList] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignFor, setAssignFor] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, c] = await Promise.all([api.get('/api/orders'), api.get('/api/couriers')]);
      setList(o || []); setCouriers(c || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const assign = async (courierId: number) => {
    try { await api.post(`/api/orders/${assignFor.id}/assign`, { courierId }); setAssignFor(null); load(); }
    catch (e: any) { Alert.alert('Xato', e.message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}><T size="xl" weight="900">Buyurtmalar</T><T size="xs" color={colors.textMuted} weight="600">{list.length} ta</T></View>
        <TouchableOpacity onPress={() => setCreating(true)} style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
          {list.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 60 }}><Ionicons name="receipt-outline" size={54} color={colors.textDim} /><T color={colors.textMuted} weight="600" style={{ marginTop: 12 }}>Buyurtma yo'q</T></View>}
          {list.map((o) => {
            const st = STATUS[o.status] || STATUS.new;
            const canAssign = o.status === 'new' || o.status === 'assigned';
            return (
              <Card key={o.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <T size="md" weight="800" numberOfLines={1}>{o.client_name || 'Mijoz'} · №{o.id}</T>
                    <T size="xs" color={colors.textMuted} weight="600" numberOfLines={1}>{o.dest_address || '—'}</T>
                  </View>
                  <Badge label={st.label} color={st.color} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <T size="lg" weight="900">{money(o.total_amount)}</T>
                  <T size="xs" color={colors.textMuted} weight="700">{o.courier_name ? 'Kuryer: ' + o.courier_name : 'biriktirilmagan'}</T>
                </View>
                {canAssign && <Button title={o.courier_name ? 'Boshqa kuryer' : 'Kuryerga berish'} icon="person-add" variant="ghost" onPress={() => setAssignFor(o)} style={{ marginTop: 10 }} />}
              </Card>
            );
          })}
        </ScrollView>
      )}

      {/* Kuryer tanlash */}
      <Modal visible={!!assignFor} transparent animationType="slide" onRequestClose={() => setAssignFor(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '70%' }}>
            <T size="lg" weight="800" style={{ marginBottom: 12 }}>Kuryer tanlang</T>
            <ScrollView>
              {couriers.map((c) => (
                <TouchableOpacity key={c.id} onPress={() => assign(c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person" size={20} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}><T weight="700">{c.full_name}</T><T size="xs" color={colors.textMuted}>{c.lat != null ? 'joylashuv bor' : 'offline'}</T></View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Yopish" variant="ghost" onPress={() => setAssignFor(null)} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>

      <CreateOrder visible={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); }} />
    </View>
  );
}

function CreateOrder({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) {
  const [address, setAddress] = useState('');
  const [rows, setRows] = useState<any[]>([{ name: '', qty: '', price: '' }]);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (visible) { setAddress(''); setRows([{ name: '', qty: '', price: '' }]); } }, [visible]);

  const submit = async () => {
    const items = rows.filter((r) => r.name.trim() && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0)
      .map((r) => ({ name: r.name.trim(), qty: parseFloat(r.qty), price: parseFloat(r.price) }));
    if (!items.length) { Alert.alert('Mahsulot', 'Kamida bitta mahsulot (nom + miqdor + narx)'); return; }
    setBusy(true);
    try { await api.post('/api/orders', { dest_address: address, items }); onDone(); }
    catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '85%' }}>
          <T size="lg" weight="800" style={{ marginBottom: 12 }}>Yangi buyurtma</T>
          <ScrollView>
            <T size="xs" color={colors.textMuted} weight="600" style={{ marginBottom: 6 }}>Manzil</T>
            <TextInput value={address} onChangeText={setAddress} placeholder="Yetkazish manzili" placeholderTextColor={colors.textDim} style={[inp, { marginBottom: 14 }]} />
            {rows.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput value={r.name} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, name: t } : x))} placeholder="Mahsulot" placeholderTextColor={colors.textDim} style={[inp, { flex: 2 }]} />
                <TextInput value={r.qty} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, qty: t.replace(',', '.').replace(/[^0-9.]/g, '') } : x))} placeholder="kg" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" style={[inp, { flex: 1 }]} />
                <TextInput value={r.price} onChangeText={(t) => setRows(rows.map((x, j) => j === i ? { ...x, price: t.replace(/[^0-9]/g, '') } : x))} placeholder="narx" placeholderTextColor={colors.textDim} keyboardType="number-pad" style={[inp, { flex: 1.3 }]} />
              </View>
            ))}
            <Button title="Qator qo'shish" variant="ghost" icon="add" onPress={() => setRows([...rows, { name: '', qty: '', price: '' }])} style={{ marginTop: 4 }} />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}><Button title="Bekor" variant="ghost" onPress={onClose} /></View>
            <View style={{ flex: 1.4 }}><Button title="Yaratish" icon="checkmark" onPress={submit} loading={busy} /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

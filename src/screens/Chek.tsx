import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, Share, TouchableOpacity, Alert, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { api } from '../api';
import { Header, T, money, Button } from '../components/ui';
import { colors, spacing, radii } from '../theme';

const kg = (n: number) => (Math.round(Number(n || 0) * 10) / 10).toLocaleString('ru-RU');

// Chek "qog'oz" ranglari — temadan qat'i nazar oq/qora (skrinshot va rasm uchun toza)
const PAPER = '#FFFFFF';
const INK = '#14181F';
const MUTED = '#5B6472';
const LINE = 'rgba(0,0,0,0.12)';

export default function Chek({ route, navigation }: any) {
  const id = route?.params?.id;
  const isPurchase = route?.params?.kind === 'purchase';
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shotRef = useRef<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setD(await api.get(`/boss/${isPurchase ? 'purchase-detail' : 'sale-detail'}/${id}`)); setErr(null); }
    catch (e: any) { setErr(e?.message || 'Chek topilmadi'); }
    finally { setLoading(false); }
  }, [id, isPurchase]);
  useEffect(() => { load(); }, [load]);

  const party = d ? (isPurchase ? d.supplier : d.client) : null;
  const name = party ? (party.organization || [party.firstName, party.lastName].filter(Boolean).join(' ')) : '';
  const date = d ? new Date(d.createdAt).toLocaleString('ru-RU') : '';
  const partyLabel = isPurchase ? 'Yetkazib beruvchi' : 'Mijoz';
  const title = isPurchase ? 'Xarid cheki' : 'Chek';

  const shareText = () => {
    if (!d) return;
    let t = `Soft Chicken\n\n${partyLabel}: ${name}\nSana: ${date}\n`;
    if (party?.phone) t += `Tel: ${party.phone}\n`;
    t += `\n`;
    d.products.forEach((p: any, i: number) => {
      t += `${i + 1}. ${p.name}\n   ${kg(p.quantity)} kg × ${money(p.price)} = ${money(p.quantity * p.price)}\n`;
    });
    t += `\nJami: ${money(d.totalAmount)}\nTo'langan: ${money(d.paidAmount)}\nQarz: ${money(d.debtRemain)}\n`;
    Share.share({ message: t }).catch(() => {});
  };

  const shareImage = async () => {
    if (!d) return;
    setBusy(true);
    try {
      const uri = await captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Chek (rasm)' });
      } else {
        Alert.alert('Saqlandi', uri);
      }
    } catch (e: any) {
      Alert.alert('Xatolik', 'Rasm yaratib bo\'lmadi');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={title} subtitle={id ? `№ ${id}` : ''} onBack={() => navigation.goBack()}
        right={d ? <TouchableOpacity onPress={shareText} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.text} /></TouchableOpacity> : undefined} />
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} /> :
        err ? <T color={colors.danger} style={{ marginTop: 40, textAlign: 'center' }}>{err}</T> :
          d ? (
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
              <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={{ borderRadius: radii.lg, overflow: 'hidden' }}>
                <View style={{ backgroundColor: PAPER, padding: spacing.xl }}>
                  <Image source={require('../../assets/logo.jpg')} style={{ width: 220, height: 92, resizeMode: 'contain', alignSelf: 'center' }} />
                  <Text style={{ color: MUTED, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 4 }}>{title} № {id}</Text>
                  <View style={{ height: 1, backgroundColor: LINE, marginVertical: spacing.md }} />
                  <Line k={partyLabel} v={name || '—'} />
                  <Line k="Sana" v={date} />
                  {party?.phone ? <Line k="Telefon" v={party.phone} /> : null}
                  <View style={{ height: 1, backgroundColor: LINE, marginVertical: spacing.md }} />

                  {d.products.map((p: any, i: number) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <Text style={{ color: INK, fontSize: 14, fontWeight: '800' }}>{i + 1}. {p.name}</Text>
                      <Text style={{ color: MUTED, fontSize: 13, fontWeight: '600', marginTop: 2 }}>{kg(p.quantity)} kg × {money(p.price)} = <Text style={{ color: INK, fontWeight: '800' }}>{money(p.quantity * p.price)}</Text></Text>
                    </View>
                  ))}

                  <View style={{ height: 1, backgroundColor: LINE, marginVertical: 8 }} />
                  <Line k="Jami summa" v={money(d.totalAmount)} big />
                  <Line k="To'langan" v={money(d.paidAmount)} vColor="#178A54" />
                  <Line k="Qarz" v={money(d.debtRemain)} vColor={d.debtRemain > 0 ? '#CE3B2C' : '#178A54'} />
                  <Text style={{ color: MUTED, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: spacing.lg }}>Rahmat!</Text>
                </View>
              </ViewShot>

              <View style={{ marginTop: spacing.lg }}>
                <Button title={busy ? 'Tayyorlanmoqda...' : 'Rasm qilib yuklash / ulashish'} icon="image-outline" onPress={shareImage} loading={busy} />
              </View>
              <TouchableOpacity onPress={shareText} style={{ marginTop: 12, alignItems: 'center' }}>
                <T size="sm" weight="700" color={colors.primary}>Matn ko'rinishida ulashish</T>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
    </View>
  );
}

function Line({ k, v, big, vColor }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ color: MUTED, fontSize: big ? 15 : 13, fontWeight: '700' }}>{k}</Text>
      <Text style={{ color: vColor || INK, fontSize: big ? 18 : 14, fontWeight: big ? '900' : '800' }} numberOfLines={1}>{v}</Text>
    </View>
  );
}

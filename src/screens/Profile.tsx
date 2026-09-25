import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../store';
import { checkUpdate } from '../update';
import { useTheme, colors, spacing, radii } from '../theme';
import { Card, Row, T, Button } from '../components/ui';

export default function Profile({ navigation }: any) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const hasPin = useAuth((s) => s.hasPin);
  const biometric = useAuth((s) => s.biometric);
  const setPin = useAuth((s) => s.setPin);
  const setBiometric = useAuth((s) => s.setBiometric);
  const mode = useTheme((s) => s.mode);
  const toggleTheme = useTheme((s) => s.toggle);
  const [pinModal, setPinModal] = useState(false);
  const [pin1, setPin1] = useState(''); const [busy, setBusy] = useState(false);

  const savePin = async () => {
    if (pin1.length !== 4) { Alert.alert('PIN', '4 xonali kod'); return; }
    setBusy(true);
    try { await setPin(pin1); setPinModal(false); setPin1(''); Alert.alert('Tayyor', 'PIN o\'rnatildi'); } finally { setBusy(false); }
  };
  const enableBio = async () => {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) { Alert.alert('Biometrika', 'Qurilmada sozlanmagan'); return; }
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Tasdiqlang' });
    if (r.success) { setBiometric(!biometric); Alert.alert('Tayyor', !biometric ? 'Biometrika yoqildi' : 'O\'chirildi'); }
  };
  const themeLabel = mode === 'auto' ? 'Avto' : mode === 'dark' ? 'Tungi' : 'Kunduzgi';
  const themeIcon = mode === 'auto' ? 'contrast' : mode === 'dark' ? 'moon' : 'sunny';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <T size="xxl" weight="900" style={{ marginBottom: spacing.lg }}>Boshqa</T>
      <Card style={{ marginBottom: spacing.md }}>
        <Row gap={14}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="briefcase" size={26} color={colors.primary} /></View>
          <View style={{ flex: 1 }}><T size="lg" weight="800">{user?.name || 'Boshliq'}</T><T size="sm" color={colors.textMuted}>{user?.email}</T></View>
        </Row>
      </Card>
      <T size="sm" weight="700" color={colors.textMuted} style={{ marginVertical: 8, marginLeft: 4 }}>HISOBOT</T>
      <Setting icon="bar-chart-outline" label="Hisobotlar" value="Kunlik · oylik · yillik + Excel" onPress={() => navigation.navigate('Hisobot')} />
      <T size="sm" weight="700" color={colors.textMuted} style={{ marginVertical: 8, marginTop: spacing.lg, marginLeft: 4 }}>BOSHQARUV</T>
      <Setting icon="time-outline" label="Tarix" value="Sotuv · xarid · qaytarish · chek" onPress={() => navigation.navigate('Tarix')} />
      <Setting icon="cube-outline" label="Yetkazib beruvchilar" value="Qarzlar · kirim (kelgan yuk) · to'lov" onPress={() => navigation.navigate('Yetkazuvchilar')} />
      <Setting icon="return-down-back-outline" label="Qaytarish (razvrad)" value="Mijozdan / yetkazuvchiga qaytarish" onPress={() => navigation.navigate('Qaytarish')} />
      <Setting icon="file-tray-stacked-outline" label="Ombor" value="Mahsulotlar · narx · qadoq" onPress={() => navigation.navigate('Ombor')} />
      <Setting icon="receipt-outline" label="Xarajatlar" value="Xarajatlarni yozish" onPress={() => navigation.navigate('Xarajatlar')} />
      <T size="sm" weight="700" color={colors.textMuted} style={{ marginVertical: 8, marginTop: spacing.lg, marginLeft: 4 }}>XAVFSIZLIK</T>
      <Setting icon="keypad" label="PIN kod (ilova qulfi)" value={hasPin ? 'O\'rnatilgan' : 'O\'rnatilmagan'} onPress={() => setPinModal(true)} />
      <Setting icon="finger-print" label="FaceID / Barmoq izi" value={biometric ? 'Yoqilgan' : 'O\'chirilgan'} onPress={enableBio} />
      <T size="sm" weight="700" color={colors.textMuted} style={{ marginVertical: 8, marginTop: spacing.lg, marginLeft: 4 }}>SOZLAMALAR</T>
      <Setting icon={themeIcon} label="Ko'rinish" value={themeLabel} onPress={toggleTheme} />
      <Setting icon="cloud-download-outline" label="Ilovani yangilash" value="Yangi versiyani tekshirish" onPress={() => checkUpdate('bos')} />
      <View style={{ marginTop: spacing.xl }}>
        <Button title="Chiqish" variant="danger" icon="log-out-outline" onPress={() => Alert.alert('Chiqish', 'Rostdan chiqasizmi?', [{ text: 'Yo\'q', style: 'cancel' }, { text: 'Ha', style: 'destructive', onPress: () => logout() }])} />
      </View>
      <T size="xs" color={colors.textDim} style={{ textAlign: 'center', marginTop: spacing.xl }}>Soft Chicken · v2.5.0</T>

      <Modal visible={pinModal} transparent animationType="fade" onRequestClose={() => setPinModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: radii.xl, padding: spacing.xl }}>
            <T size="lg" weight="800" style={{ marginBottom: 4 }}>PIN kod o'rnatish</T>
            <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>Ilovani ochishda 4 xonali kod so'raladi</T>
            <TextInput value={pin1} onChangeText={(t) => setPin1(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4}
              placeholder="••••" placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, padding: 16, fontSize: 26, textAlign: 'center', letterSpacing: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg }} />
            <Row gap={spacing.md}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => { setPinModal(false); setPin1(''); }} /></View>
              <View style={{ flex: 1 }}><Button title="Saqlash" onPress={savePin} loading={busy} /></View>
            </Row>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
function Setting({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '14', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={20} color={colors.primary} /></View>
      <View style={{ flex: 1 }}><T size="md" weight="600">{label}</T><T size="xs" color={colors.textMuted}>{value}</T></View>
      <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
    </TouchableOpacity>
  );
}

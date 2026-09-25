import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../store';
import { T } from '../components/ui';
import { colors, spacing, fontSize } from '../theme';

export default function Lock() {
  const unlockPin = useAuth((s) => s.unlockPin);
  const unlockBio = useAuth((s) => s.unlockBio);
  const logout = useAuth((s) => s.logout);
  const hasPin = useAuth((s) => s.hasPin);
  const biometric = useAuth((s) => s.biometric);
  const [pin, setPin] = useState(''); const [err, setErr] = useState('');

  const tryBio = useCallback(async () => {
    try { const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Kirish uchun tasdiqlang', cancelLabel: 'Bekor' }); if (r.success) unlockBio(); } catch {}
  }, [unlockBio]);
  useEffect(() => { if (biometric) tryBio(); }, [biometric, tryBio]);

  const submit = useCallback(async (full: string) => {
    try { await unlockPin(full); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    catch (e: any) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setErr(e.message); setPin(''); }
  }, [unlockPin]);
  const press = (d: string) => { if (pin.length >= 4) return; const n = pin + d; setPin(n); Haptics.selectionAsync(); if (n.length === 4 && hasPin) submit(n); };
  const del = () => { setPin((p) => p.slice(0, -1)); setErr(''); };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <LinearGradient colors={colors.gradPrimary as any} style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Ionicons name="lock-closed" size={30} color="#fff" />
      </LinearGradient>
      <T size="xl" weight="800">{hasPin ? 'PIN kodni kiriting' : 'Kirish'}</T>
      <T size="sm" color={err ? colors.danger : colors.textMuted} style={{ marginTop: 6, height: 20 }}>{err || 'Boshqaruv paneli'}</T>
      {hasPin && (
        <View style={{ flexDirection: 'row', gap: 16, marginVertical: 28 }}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: i < pin.length ? colors.primary : colors.bgInput, borderWidth: 1, borderColor: i < pin.length ? colors.primary : colors.border }} />)}
        </View>
      )}
      {hasPin ? (
        <View style={{ width: 260, flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {keys.map((k) => {
            if (k === 'bio') return biometric ? <TouchableOpacity key={k} onPress={tryBio} style={kb(false)}><Ionicons name="finger-print" size={26} color={colors.primary} /></TouchableOpacity> : <View key={k} style={{ width: 72, height: 72 }} />;
            if (k === 'del') return <TouchableOpacity key={k} onPress={del} style={kb(false)}><Ionicons name="backspace-outline" size={26} color={colors.text} /></TouchableOpacity>;
            return <TouchableOpacity key={k} onPress={() => press(k)} style={kb(true)} activeOpacity={0.7}><T size="xxl" weight="700">{k}</T></TouchableOpacity>;
          })}
        </View>
      ) : (
        <TouchableOpacity onPress={tryBio} style={{ marginTop: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="finger-print" size={40} color={colors.primary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => logout()} style={{ marginTop: 28 }}><T size="sm" weight="600" color={colors.textMuted}>Boshqa hisob bilan kirish</T></TouchableOpacity>
    </View>
  );
}
const kb = (f: boolean): any => ({ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: f ? colors.bgCard : 'transparent', borderWidth: f ? 1 : 0, borderColor: colors.border });

import React, { useState } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { T, Button, Input, FadeIn } from '../components/ui';
import { colors, spacing } from '../theme';

export default function Login() {
  const login = useAuth((s) => s.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!phone.trim() || !password) { Alert.alert('Kirish', 'Telefon va parolni kiriting'); return; }
    setBusy(true);
    try { await login(phone.trim(), password); }
    catch (e: any) { Alert.alert('Xato', e.message); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FadeIn style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
          </View>
          <T size="hero" weight="900">AL QANOT</T>
          <T size="sm" color={colors.textMuted} weight="600">Login va parol bilan kiring</T>
        </View>
        <Input label="Telefon" value={phone} onChangeText={setPhone} placeholder="901234567" keyboardType="phone-pad" />
        <Input label="Parol" value={password} onChangeText={setPassword} placeholder="••••••" secure />
        <Button title="Kirish" icon="log-in" onPress={submit} loading={busy} style={{ marginTop: 6 }} />
      </FadeIn>
    </KeyboardAvoidingView>
  );
}

import React, { useState } from 'react';
import { View, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { getApiBase, setApiBase } from '../api';
import { T, Button, Input, FadeIn } from '../components/ui';
import { colors, spacing } from '../theme';

export default function Login() {
  const login = useAuth((s) => s.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState(getApiBase());
  const [showServer, setShowServer] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!phone.trim() || !password) { Alert.alert('Kirish', 'Telefon va parolni kiriting'); return; }
    setBusy(true);
    try { await setApiBase(server); await login(phone.trim(), password); }
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
          <T size="sm" color={colors.textMuted} weight="600">Boshliq ilovasi</T>
        </View>
        <Input label="Telefon" value={phone} onChangeText={setPhone} placeholder="901234567" keyboardType="phone-pad" />
        <Input label="Parol" value={password} onChangeText={setPassword} placeholder="••••••" secure />
        {showServer && <Input label="Server manzili" value={server} onChangeText={setServer} placeholder="https://server.uz" />}
        <Button title="Kirish" icon="log-in" onPress={submit} loading={busy} style={{ marginTop: 6 }} />
        <TouchableOpacity onPress={() => setShowServer((v) => !v)} style={{ alignSelf: 'center', marginTop: 16, padding: 8 }}>
          <T size="xs" color={colors.textDim} weight="600">{showServer ? 'Yopish' : 'Server sozlamasi'}</T>
        </TouchableOpacity>
      </FadeIn>
    </KeyboardAvoidingView>
  );
}

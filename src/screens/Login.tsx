import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { Button, Input, T, Row } from '../components/ui';
import { colors, spacing, radii } from '../theme';

const LOGO = require('../../assets/icon.png');

export default function Login() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  const submit = async () => {
    if (!email.trim() || !pw) { setErr('Email va parolni kiriting'); return; }
    setLoading(true); setErr('');
    try { await login(email.trim(), pw); } catch (e: any) { setErr(e.message || 'Kirish xatosi'); } finally { setLoading(false); }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 24 }}>
          <View style={{ width: 148, height: 148, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}>
            <Image source={LOGO} style={{ width: 132, height: 132, borderRadius: 30 }} resizeMode="contain" />
          </View>
          <T size="xxl" weight="900" style={{ marginTop: 18, letterSpacing: 0.5 }}>EL QANOT</T>
          <T size="sm" weight="700" color={colors.textMuted} style={{ marginTop: 2 }}>Boshqaruv tizimi</T>
        </View>
        <View style={{ padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xl }}>
            <T size="lg" weight="800" style={{ marginBottom: 4 }}>Tizimga kirish</T>
            <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>Email yoki telefon va parolingiz bilan kiring</T>
            <Input label="Email yoki telefon" value={email} onChangeText={setEmail} placeholder="email@example.com" icon="mail-outline" keyboardType="email-address" />
            <Input label="Parol" value={pw} onChangeText={setPw} placeholder="••••••" secure icon="lock-closed-outline" />
            {!!err && <Row gap={6} style={{ marginBottom: spacing.md }}><Ionicons name="alert-circle" size={16} color={colors.danger} /><T size="sm" weight="600" color={colors.danger} style={{ flex: 1 }}>{err}</T></Row>}
            <Button title="Kirish" onPress={submit} loading={loading} icon="arrow-forward" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

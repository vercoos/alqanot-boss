import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { Button, Input, T, Row } from '../components/ui';
import { colors, spacing } from '../theme';

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={colors.gradPrimary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: 84, paddingBottom: 48, paddingHorizontal: spacing.xl, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="shield-checkmark" size={38} color="#fff" />
          </View>
          <T size="hero" weight="900" color="#fff">AL QANOT</T>
          <T size="md" weight="700" color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>Boshqaruv tizimi</T>
        </LinearGradient>
        <View style={{ padding: spacing.xl, marginTop: 8 }}>
          <T size="lg" weight="800" style={{ marginBottom: 4 }}>Tizimga kirish</T>
          <T size="sm" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>Email yoki telefon va parolingiz bilan kiring</T>
          <Input label="Email yoki telefon" value={email} onChangeText={setEmail} placeholder="email@example.com" icon="mail-outline" keyboardType="email-address" />
          <Input label="Parol" value={pw} onChangeText={setPw} placeholder="••••••" secure icon="lock-closed-outline" />
          {!!err && <Row gap={6} style={{ marginBottom: spacing.md }}><Ionicons name="alert-circle" size={16} color={colors.danger} /><T size="sm" weight="600" color={colors.danger} style={{ flex: 1 }}>{err}</T></Row>}
          <Button title="Kirish" onPress={submit} loading={loading} icon="arrow-forward" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

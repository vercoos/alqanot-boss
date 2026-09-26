import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { useTheme, colors, spacing, radii } from '../theme';
import { checkUpdate } from '../update';
import { T, Button, Card, Row } from '../components/ui';

export default function KuryerProfil() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const mode = useTheme((s) => s.mode);
  const setMode = useTheme((s) => s.setMode);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xl" weight="900">Profil</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="bicycle" size={34} color={colors.primary} />
          </View>
          <T size="lg" weight="800">{user?.name || 'Kuryer'}</T>
          <T size="sm" color={colors.textMuted} weight="600">{user?.email || user?.phone} · Kuryer</T>
        </Card>

        <T size="sm" weight="800" color={colors.textMuted} style={{ marginBottom: 8, marginLeft: 4, letterSpacing: 1 }}>MAVZU</T>
        <Row gap={8} style={{ marginBottom: 20 }}>
          {(['auto', 'light', 'dark'] as const).map((m) => (
            <TouchableOpacity key={m} onPress={() => setMode(m)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', backgroundColor: mode === m ? colors.primary : colors.bgCard, borderWidth: 1, borderColor: mode === m ? colors.primary : colors.border }}>
              <T weight="800" color={mode === m ? '#fff' : colors.text}>{m === 'auto' ? 'Avto' : m === 'light' ? "Yorug'" : 'Tungi'}</T>
            </TouchableOpacity>
          ))}
        </Row>

        <Button title="Ilovani yangilash" icon="cloud-download-outline" variant="ghost" onPress={() => checkUpdate('bos')} style={{ marginBottom: 12 }} />
        <Button title="Chiqish" icon="log-out-outline" variant="danger"
          onPress={() => Alert.alert('Chiqish', 'Rostdan chiqasizmi?', [{ text: 'Yo\'q', style: 'cancel' }, { text: 'Ha', style: 'destructive', onPress: () => logout() }])} />
      </ScrollView>
    </View>
  );
}

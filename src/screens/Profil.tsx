import React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { useTheme, colors, spacing } from '../theme';
import { T, Button, Card } from '../components/ui';

export default function Profil() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 54, paddingBottom: 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xl" weight="900">Profil</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ marginBottom: 14, alignItems: 'center', paddingVertical: 22 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <T size="lg" weight="800">{user?.full_name || 'Boshliq'}</T>
          <T size="sm" color={colors.textMuted} weight="600">{user?.phone} · {user?.role}</T>
        </Card>

        <T size="sm" weight="800" color={colors.textMuted} style={{ marginBottom: 8 }}>MAVZU</T>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(['auto', 'light', 'dark'] as const).map((m) => (
            <Button key={m} title={m === 'auto' ? 'Avto' : m === 'light' ? 'Yorug\'' : 'Tungi'} variant={mode === m ? 'primary' : 'ghost'} onPress={() => setMode(m)} style={{ flex: 1, paddingVertical: 10 }} />
          ))}
        </View>

        <Button title="Chiqish" icon="log-out" variant="danger"
          onPress={() => Alert.alert('Chiqish', 'Rostdan chiqasizmi?', [{ text: 'Yo\'q' }, { text: 'Ha', onPress: () => logout() }])} />
      </ScrollView>
    </View>
  );
}

import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store';
import { useTheme } from '../theme';
import { checkUpdate } from '../update';
import { T, Row, Section } from '../components/ui';
import { colors, spacing, radii } from '../theme';

const ROLENAME: any = { boss: 'Boshliq', buxgalter: 'Bugalter' };

export default function More({ navigation }: any) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();

  const Item = ({ icon, label, to, tint = colors.primary, badge }: any) => (
    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate(to)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 8 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tint + '16', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <T weight="800" style={{ flex: 1 }}>{label}</T>
      {badge ? <View style={{ backgroundColor: colors.warning, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}><T size="xs" weight="900" color="#fff">{badge}</T></View> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T size="xxl" weight="800">Boshqa</T>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: 8 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <T size="lg" weight="800">{user?.full_name || 'Boshliq'}</T>
            <T size="sm" color={colors.textMuted} weight="600">{user?.email || user?.phone} · {ROLENAME[user?.role || ''] || user?.role}</T>
          </View>
        </View>

        <Section>SAVDO</Section>
        <Item icon="people-outline" label="Mijozlar" to="Mijozlar" />
        <Item icon="cube-outline" label="Yetkazib beruvchilar" to="Yetkazuvchilar" tint={colors.info} />
        <Item icon="cart-outline" label="Xarid (kirim)" to="Xarid" tint={colors.info} />
        <Item icon="archive-outline" label="Ombor" to="Ombor" />
        <Item icon="checkmark-done-outline" label="Tasdiqlash" to="Tasdiqlash" tint={colors.warning} />

        <Section>MOLIYA</Section>
        <Item icon="cash-outline" label="To'lovlar (kuryer puli)" to="Tolovlar" tint={colors.success} />
        <Item icon="wallet-outline" label="Qarzlar" to="Qarzlar" tint={colors.danger} />
        <Item icon="receipt-outline" label="Xarajatlar" to="Xarajatlar" tint={colors.danger} />
        <Item icon="return-down-back-outline" label="Qaytarish" to="Qaytarish" />
        <Item icon="bar-chart-outline" label="Hisobot" to="Hisobot" tint={colors.info} />

        <Section>MAVZU</Section>
        <Row gap={8}>
          {(['auto', 'light', 'dark'] as const).map((m) => (
            <TouchableOpacity key={m} onPress={() => setMode(m)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center', backgroundColor: mode === m ? colors.primary : colors.bgCard, borderWidth: 1, borderColor: mode === m ? colors.primary : colors.border }}>
              <T weight="800" color={mode === m ? '#fff' : colors.text}>{m === 'auto' ? 'Avto' : m === 'light' ? "Yorug'" : 'Tungi'}</T>
            </TouchableOpacity>
          ))}
        </Row>

        <TouchableOpacity onPress={() => checkUpdate(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, marginTop: spacing.lg }}>
          <Ionicons name="cloud-download-outline" size={20} color={colors.textMuted} /><T weight="700" color={colors.textMuted}>Yangilanishni tekshirish</T>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Chiqish', 'Rostdan chiqasizmi?', [{ text: 'Yo\'q' }, { text: 'Ha', onPress: () => logout() }])}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md }}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} /><T weight="700" color={colors.danger}>Chiqish</T>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

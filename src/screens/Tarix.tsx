import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, T } from '../components/ui';
import { colors, spacing, radii } from '../theme';

export default function Tarix({ navigation }: any) {
  const items = [
    { icon: 'cart-outline', tint: colors.primary, label: 'Sotuvlar tarixi', desc: 'Mijozlarga sotilgan — chekni ko\'rish', to: 'Buyurtmalar' },
    { icon: 'download-outline', tint: colors.warning, label: 'Xaridlar tarixi', desc: 'Yetkazuvchidan kelgan yuklar', to: 'XaridTarix' },
    { icon: 'return-down-back-outline', tint: colors.danger, label: 'Qaytarishlar (razvrad)', desc: 'Mijoz / yetkazuvchi qaytargan', to: 'Qaytarish' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Tarix" subtitle="Sotuv · xarid · qaytarish" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {items.map((it) => (
          <TouchableOpacity key={it.to} activeOpacity={0.85} onPress={() => navigation.navigate(it.to)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.lg, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: it.tint + '16', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={it.icon as any} size={23} color={it.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <T size="md" weight="800">{it.label}</T>
              <T size="xs" color={colors.textMuted} weight="600">{it.desc}</T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

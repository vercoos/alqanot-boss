import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ViewStyle, TextStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, fontSize, shadow } from '../theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

// Tekis, minimal sarlavha (gradientsiz, tema ranglari — ikkala temada to'g'ri kontrast)
export function Header({ title, subtitle, right, onBack, tall }: { title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void; tall?: boolean }) {
  return (
    <View style={{ paddingTop: tall ? 62 : 54, paddingBottom: tall ? 18 : 14, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {onBack && <TouchableOpacity onPress={onBack} hitSlop={10} style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={22} color={colors.text} /></TouchableOpacity>}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: tall ? fontSize.xxl : fontSize.xl, fontWeight: '800', letterSpacing: 0.2 }}>{title}</Text>
          {subtitle ? <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: 3, fontWeight: '600' }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function Card({ children, style, onPress, glass }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; glass?: boolean }) {
  const inner = (
    <View style={[{
      backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg,
      borderWidth: 1, borderColor: colors.border,
    }, shadow.card, style]}>{children}</View>
  );
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>{inner}</Pressable> : inner;
}

export function StatTile({ icon, label, value, tint = colors.primary, big }: { icon: any; label: string; value: string; tint?: string; big?: boolean }) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }, shadow.card]}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: tint + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={{ color: colors.text, fontSize: big ? fontSize.hero : fontSize.xl, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10, marginLeft: 4 }}>{String(children).toUpperCase()}</Text>;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, style }: {
  title: string; onPress?: () => void; loading?: boolean; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: any; style?: ViewStyle;
}) {
  const dis = disabled || loading;
  const base: ViewStyle = { height: 56, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: dis ? 0.5 : 1, paddingHorizontal: spacing.lg };
  if (variant === 'primary') {
    return (
      <Pressable disabled={dis} onPress={onPress} style={({ pressed }) => [{ borderRadius: radii.lg, overflow: 'hidden', transform: [{ scale: pressed ? 0.97 : 1 }], shadowColor: colors.primary, shadowOpacity: dis ? 0 : 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: dis ? 0 : 7 }, style]}>
        <LinearGradient colors={colors.gradPrimary as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={base}>
          {loading ? <ActivityIndicator color="#fff" /> : <>{icon && <Ionicons name={icon} size={21} color="#fff" />}<Text style={{ color: '#fff', fontWeight: '900', fontSize: fontSize.md, letterSpacing: 0.4 }}>{title}</Text></>}
        </LinearGradient>
      </Pressable>
    );
  }
  const bg = variant === 'danger' ? colors.danger + '14' : variant === 'ghost' ? 'transparent' : colors.bgInput;
  const fg = variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable disabled={dis} onPress={onPress} style={({ pressed }) => [base, { backgroundColor: bg, borderWidth: variant === 'ghost' ? 1.4 : 0, borderColor: colors.borderStrong, opacity: pressed ? 0.8 : (dis ? 0.5 : 1) }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <>{icon && <Ionicons name={icon} size={20} color={fg} />}<Text style={{ color: fg, fontWeight: '700', fontSize: fontSize.md }}>{title}</Text></>}
    </Pressable>
  );
}

export function Input({ label, value, onChangeText, placeholder, secure, keyboardType, icon, autoCapitalize = 'none', money }: {
  label?: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
  secure?: boolean; keyboardType?: any; icon?: any; autoCapitalize?: any; money?: boolean;
}) {
  const [focus, setFocus] = React.useState(false);
  // money: qo'lda yozilganda raqamni "1 000 000" ko'rinishida ko'rsatadi, qiymatni raqam holida saqlaydi
  const disp = money ? String(value ?? '').replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : value;
  const handle = money ? (t: string) => onChangeText(t.replace(/\D/g, '')) : onChangeText;
  const kbd = money ? 'number-pad' : keyboardType;
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginBottom: 6, fontWeight: '700', marginLeft: 2 }}>{label}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1.4, borderColor: focus ? colors.primary : colors.border, paddingHorizontal: 14 }}>
        {icon && <Ionicons name={icon} size={18} color={focus ? colors.primary : colors.textDim} style={{ marginRight: 8 }} />}
        <TextInput value={disp} onChangeText={handle} placeholder={placeholder} placeholderTextColor={colors.textDim}
          secureTextEntry={secure} keyboardType={kbd} autoCapitalize={autoCapitalize}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: 15, fontWeight: '600' }} />
      </View>
    </View>
  );
}

export function Row({ children, style, justify = 'flex-start', gap = 0, align = 'center' }: {
  children: React.ReactNode; style?: ViewStyle; justify?: any; gap?: number; align?: any;
}) {
  return <View style={[{ flexDirection: 'row', justifyContent: justify, alignItems: align, gap }, style]}>{children}</View>;
}

export function Pill({ label, color = colors.primary, filled }: { label: string; color?: string; filled?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: filled ? color : color + '1E' }}>
      <Text style={{ color: filled ? '#fff' : color, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

export function money(n: number): string {
  return Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

// kg: kasrni 0.1 aniqlikda ko'rsatadi (650.1), butun bo'lsa kasr yo'q (650), float shovqinni tozalaydi
export function kg(n: number): string {
  const v = Math.round(Number(n || 0) * 10) / 10;
  return (Number.isInteger(v) ? v.toString() : v.toFixed(1)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function T({ children, size = 'md', weight = '400', color, style, numberOfLines }: {
  children: React.ReactNode; size?: keyof typeof fontSize; weight?: TextStyle['fontWeight']; color?: string; style?: TextStyle; numberOfLines?: number;
}) {
  return <Text numberOfLines={numberOfLines} style={[{ color: color || colors.text, fontSize: (fontSize as any)[size], fontWeight: weight }, style]}>{children}</Text>;
}

// Badge — nuqtali status yorlig'i (xarita "Online" uchun)
export function Badge({ label, color = colors.primary }: { label: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: color + '1E' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color, fontSize: fontSize.xs, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

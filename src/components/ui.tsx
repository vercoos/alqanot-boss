import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated, TextInput, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, fontSize } from '../theme';

export function money(n: number): string {
  return Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

export function T({ children, size = 'md', weight = '400', color, style, numberOfLines }: {
  children: React.ReactNode; size?: keyof typeof fontSize; weight?: TextStyle['fontWeight']; color?: string; style?: TextStyle; numberOfLines?: number;
}) {
  return <Text numberOfLines={numberOfLines} style={[{ color: color || colors.text, fontSize: fontSize[size], fontWeight: weight, letterSpacing: 0.1 }, style]}>{children}</Text>;
}

// Yumshoq kirish animatsiyasi (opacity + pastdan siljish)
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const o = React.useRef(new Animated.Value(0)).current;
  const ty = React.useRef(new Animated.Value(10)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 340, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity: o, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>;
}

export function Header({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={{ paddingTop: 54, paddingBottom: 16, paddingHorizontal: spacing.lg, backgroundColor: colors.bgElevated, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgInput }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <T size="xl" weight="800">{title}</T>
        {!!subtitle && <T size="xs" color={colors.textMuted} weight="600">{subtitle}</T>}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const base: ViewStyle = { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md };
  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}>{children}</Pressable>;
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, style }: {
  title: string; onPress?: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost' | 'success' | 'danger'; icon?: any; style?: ViewStyle;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'success' ? colors.success : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'ghost' ? colors.text : variant === 'primary' ? colors.onPrimary : '#FFFFFF';
  const border = variant === 'ghost' ? colors.borderStrong : 'transparent';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [
        { backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.5 : 1 },
        style,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <>
        {icon && <Ionicons name={icon} size={18} color={fg} />}
        <T weight="800" color={fg}>{title}</T>
      </>}
    </Pressable>
  );
}

export function Input({ label, value, onChangeText, placeholder, secure, keyboardType }: {
  label?: string; value: string; onChangeText: (t: string) => void; placeholder?: string; secure?: boolean; keyboardType?: any;
}) {
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ marginBottom: spacing.md }}>
      {!!label && <T size="xs" color={colors.textMuted} weight="600" style={{ marginBottom: 6 }}>{label}</T>}
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textDim}
        secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize="none"
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ backgroundColor: colors.bgInput, borderRadius: radii.md, borderWidth: 1, borderColor: focus ? colors.primary : colors.border, paddingVertical: 13, paddingHorizontal: 14, color: colors.text, fontSize: fontSize.md, fontWeight: '600' }}
      />
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: color + '1E' }}>
      <T size="xs" weight="800" color={color}>{label}</T>
    </View>
  );
}

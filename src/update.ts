// Ichki yangilash — /app-api/version bilan tekshiradi; iOS'ga .ipa, Android'ga .apk beradi
import Constants from 'expo-constants';
import { Linking, Alert, Platform } from 'react-native';

const apiBase: string = (Constants.expoConfig?.extra as any)?.apiBase || 'https://sgmeat.uz/app-api';

function cmp(a: string, b: string): number {
  const pa = String(a).split('.').map((n) => parseInt(n) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n) || 0);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return 1; if ((pa[i] || 0) < (pb[i] || 0)) return -1; }
  return 0;
}

export async function checkUpdate(appKey: string, silent = false): Promise<void> {
  const cur = Constants.expoConfig?.version || '1.0.0';
  const isIOS = Platform.OS === 'ios';
  try {
    const r = await fetch(`${apiBase}/version?app=${appKey}`);
    const j = await r.json();
    const v = j?.data;
    if (!v || !v.version) { if (!silent) Alert.alert('Yangilanish', 'Ma\'lumot topilmadi'); return; }
    // Platformaga mos havola: iOS -> .ipa, Android -> .apk (aralashib ketmasin)
    const url: string | null = isIOS ? (v.ipa_url || null) : (v.apk_url || null);
    const hasNew = cmp(v.version, cur) > 0;
    if (hasNew && url) {
      const hint = isIOS
        ? 'Yangi .ipa faylni yuklab olasizmi? (Scarlet/AltStore orqali o\'rnating)'
        : 'Yangi versiyani yuklab olasizmi?';
      Alert.alert(`Yangi versiya · v${v.version}`, (v.notes ? v.notes + '\n\n' : '') + hint, [
        { text: 'Keyinroq', style: 'cancel' },
        { text: 'Yuklab olish', onPress: () => Linking.openURL(url).catch(() => {}) },
      ]);
    } else if (hasNew && !url) {
      if (!silent) Alert.alert('Yangilanish', isIOS ? 'iOS (.ipa) uchun yangi versiya hali tayyorlanmoqda.' : 'Yuklab olish havolasi topilmadi.');
    } else if (!silent) {
      Alert.alert('Yangilanish', `Sizda eng so'nggi versiya (v${cur}).`);
    }
  } catch { if (!silent) Alert.alert('Yangilanish', 'Tekshirib bo\'lmadi — internetni tekshiring'); }
}

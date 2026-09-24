import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { getApiBase } from './api';

const APP_KEY = 'boss';

function cmp(a: string, b: string) {
  const pa = String(a).split('.').map((n) => parseInt(n) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

export async function checkUpdate(silent = false) {
  try {
    const cur = Constants.expoConfig?.version || '1.0.0';
    const res = await fetch(getApiBase() + '/api/version?app=' + APP_KEY);
    const j = await res.json();
    const v = j?.data;
    if (v?.version && v?.url && cmp(v.version, cur) > 0) {
      Alert.alert('Yangi versiya ' + v.version, v.notes || 'Yangilanish mavjud',
        [{ text: 'Keyinroq', style: 'cancel' }, { text: 'Yuklab olish', onPress: () => Linking.openURL(v.url) }]);
    } else if (!silent) {
      Alert.alert('Yangilanish', "Eng so'nggi versiya o'rnatilgan.");
    }
  } catch {
    if (!silent) Alert.alert('Xato', "Yangilanishni tekshirib bo'lmadi");
  }
}

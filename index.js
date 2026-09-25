import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

// Startupdagi yashirin xatoni (modul-yuklanish yoki global) ekranda ko'rsatadi —
// bo'sh/oq ekranda qotib qolish o'rniga aniq sabab chiqadi.
function makeErrorScreen(err) {
  const msg = (err && (err.message || String(err))) || "Noma'lum xato";
  const stack = err && err.stack ? String(err.stack) : '';
  return function ErrorRoot() {
    return (
      <View style={{ flex: 1, backgroundColor: '#0E1116', paddingHorizontal: 20, paddingTop: 60 }}>
        <Text style={{ color: '#FF6E33', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Startup xatosi</Text>
        <ScrollView>
          <Text style={{ color: '#F3F5F8', fontSize: 13, lineHeight: 19 }}>{msg}</Text>
          <Text style={{ color: 'rgba(243,245,248,0.55)', fontSize: 11, marginTop: 14 }}>{stack}</Text>
        </ScrollView>
      </View>
    );
  };
}

// Global (async / uncaught) xatolarni konsolga chiqaradi, standart ishlovni ham saqlaydi
try {
  const eu = global && global.ErrorUtils;
  if (eu && typeof eu.setGlobalHandler === 'function') {
    const prev = typeof eu.getGlobalHandler === 'function' ? eu.getGlobalHandler() : null;
    eu.setGlobalHandler((error, isFatal) => {
      console.error('GLOBAL_ERR', isFatal, error && (error.stack || error.message || error));
      if (prev) { try { prev(error, isFatal); } catch (_) {} }
    });
  }
} catch (_) {}

let Root;
try {
  Root = require('./App').default;
} catch (e) {
  console.error('MODULE_LOAD_ERR', e && (e.stack || e.message || e));
  Root = makeErrorScreen(e);
}

registerRootComponent(Root);

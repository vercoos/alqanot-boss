import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

function makeErrorScreen(err) {
  const msg = (err && (err.message || String(err))) || "Noma'lum xato";
  const stack = err && err.stack ? String(err.stack) : '';
  return function ErrorRoot() {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0E12', paddingHorizontal: 20, paddingTop: 60 }}>
        <Text style={{ color: '#F0813F', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Startup xatosi</Text>
        <ScrollView>
          <Text style={{ color: '#EDEFF3', fontSize: 13, lineHeight: 19 }}>{msg}</Text>
          <Text style={{ color: 'rgba(237,239,243,0.55)', fontSize: 11, marginTop: 14 }}>{stack}</Text>
        </ScrollView>
      </View>
    );
  };
}

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

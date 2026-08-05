import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const LOGO_ASPECT = 366 / 400;

export default function Logo({ size = 72, showName = false }) {
  const width = size * LOGO_ASPECT;
  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width, height: size }}
        resizeMode="contain"
      />
      {showName ? <Text style={styles.nome}>Belle</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nome: { marginTop: 8, fontSize: 18, fontWeight: '800', color: colors.primary },
});

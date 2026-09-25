import React from 'react';
import Parties from './Clients';

export default function Suppliers({ navigation }: any) {
  return <Parties navigation={navigation} kind="supplier" />;
}

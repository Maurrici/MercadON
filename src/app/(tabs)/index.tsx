import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <View>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          MercadON
        </Text>

        <Text>Bem-vindo ao MercadON!</Text>
      </View>
    </SafeAreaView>
  );
}
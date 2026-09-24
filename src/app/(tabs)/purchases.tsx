import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PurchasesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Compras
      </Text>

      <Text>Suas listas de compras aparecerão aqui.</Text>

      <View style={{ marginTop: 24, gap: 16 }}>
        <Pressable
          onPress={() => router.push('/purchases/create')}
        >
          <Text style={{ color: '#16A34A' }}>
            + Cadastrar compra
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/purchases/[id]',
              params: { id: '1' },
            })
          }
        >
          <Text style={{ color: '#16A34A' }}>
            Visualizar compra de exemplo
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
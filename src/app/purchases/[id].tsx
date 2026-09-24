import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DetailsPurchaseScreen() {
  const { id:purchaseId } = useLocalSearchParams<{id: string}>(); 

  const router = useRouter();
  
  return(
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          Detalhes da compra
        </Text>

        <Text>Compra selecionada: {purchaseId}</Text>

        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#16A34A' }}>
            Voltar
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
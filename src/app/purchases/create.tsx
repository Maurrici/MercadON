import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatePurchaseScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={{flex: 1, padding: 24}}>
            <View style={{gap: 16}}>
                <Text style={{fontSize: 24, fontWeight: 'bold'}}>
                    Nova compra
                </Text>

                <Text>
                    O formulário de cadastro será implementado em uma task futura.
                </Text>

                <Pressable onPress={() => router.back()}>
                    <Text style={{ color: '#16A34A' }}>
                        Voltar
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
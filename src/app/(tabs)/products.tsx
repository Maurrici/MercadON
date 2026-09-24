import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductItem } from "@/components/ProductItem";
import type { Product } from "@/domain/models/Product";

export default function ProductScreen() {
  const [productList, setProductList] = useState<Product[]>([
    {
      id: 1,
      name: "Arroz",
      purchased: false,
    },
    {
      id: 2,
      name: "Feijão",
      purchased: false,
    },
    {
      id: 3,
      name: "Leite",
      purchased: false,
    },
  ]);

  function changePurchased(id: number, purchased: boolean) {
    setProductList((current) =>
      current.map((product) =>
        product.id === id ? { ...product, purchased } : product,
      ),
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 24,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          MercadON
        </Text>

        <Text>Minha lista de compras</Text>
      </View>

      <FlatList
        data={productList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductItem product={item} onToggle={changePurchased} />
        )}
        contentContainerStyle={{
          gap: 12,
          paddingTop: 24,
        }}
      />
    </SafeAreaView>
  );
}

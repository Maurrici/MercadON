import { ProductItem } from "@/components/ProductItem";
import { Screen } from "@/components/Screen";
import type { Product } from "@/domain/models/Product";
import { colors, spacing, typography } from '@/theme';
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function ProductScreen() {
  const [productList, setProductList] = useState<Product[]>([
    {
      id: '1',
      name: "Arroz",
      brand: null,
      categoryId: null,
      packageQuantityMilli: null,
      packageUnit: null,
      createdAt: "",
      updatedAt: "",
      deletedAt: null
    },
    {
      id: '2',
      name: "Feijão",
      brand: null,
      categoryId: null,
      packageQuantityMilli: null,
      packageUnit: null,
      createdAt: "",
      updatedAt: "",
      deletedAt: null
    },
    {
      id: '3',
      name: "Leite",
      brand: null,
      categoryId: null,
      packageQuantityMilli: null,
      packageUnit: null,
      createdAt: "",
      updatedAt: "",
      deletedAt: null
    },
  ]);

  function changePurchased(id: string, purchased: boolean) {
    setProductList((current) =>
      current.map((product) =>
        product.id === id ? { ...product, purchased } : product,
      ),
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text
          style={styles.title}
        >
          MercadON
        </Text>

        <Text style={styles.description}>Minha lista de compras</Text>
      </View>

      <FlatList
        data={productList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductItem product={item} onToggle={changePurchased} />
        )}
        contentContainerStyle={styles.container}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.textPrimary,
    fontWeight: '700',
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
  },

  container: {
    gap: spacing.lg,
  },
});

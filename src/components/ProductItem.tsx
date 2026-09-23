import { Checkbox } from "expo-checkbox";
import { Text, View } from "react-native";

import type { Product } from "@/domain/models/Product";

type ProductItemProps = {
  product: Product;
  onToggle: (id: number, purchased: boolean) => void;
};

export function ProductItem({ product, onToggle }: ProductItemProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Checkbox
        value={product.purchased}
        onValueChange={(value) => onToggle(product.id, value)}
      />

      <Text>{product.name}</Text>
    </View>
  );
}

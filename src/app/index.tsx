import { Checkbox } from 'expo-checkbox';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type Product = {
  name: string,
  check: boolean
}

export default function HomeScreen() {
  const [productList, setProductList] = useState<Product[]>([
    {name: "Arroz", check: false},
    {name: "Feijão", check: false},
    {name: "Leite", check: false}
  ])

  const Item = (product: Product) => (
    <View style={{flexDirection: "row"}}>
      <Checkbox 
        value={product.check}
        onValueChange={value => changeCheck(product.name, value)}
      />
      <Text>{product.name}</Text>
    </View>
  )

  const changeCheck = (name: string, value: boolean) => {
    setProductList(currentProductList => {
      return currentProductList.map(p => (
        p.name == name ? {...p, check: value} : p
      ))
    })
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flexDirection: 'row', justifyContent: 'center'}}>
        <View>
          <Text style={{fontSize: 24, fontWeight: "100"}}>MercadON</Text>
          <Text style={{fontSize: 14}}>Minha lista de compras</Text>
          <FlatList 
            data={productList}
            renderItem={({item}) => <Item name={item.name} check={item.check} />}
            keyExtractor={item => item.name}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

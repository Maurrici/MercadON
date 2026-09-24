import { Tabs } from "expo-router"

export default function TabLayout() {
    return(
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#16A34A'
            }}
        >
            <Tabs.Screen
                name='index'
                options={{title: 'Ínicio'}}
            />

            <Tabs.Screen
                name='purchases'
                options={{title: 'Compras'}}
            />

            <Tabs.Screen
                name='products'
                options={{title: 'Produtos'}}
            />
        </Tabs>
    )
}
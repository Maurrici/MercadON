import { colors } from "@/theme"
import { Tabs } from "expo-router"

export default function TabLayout() {
    return(
        <Tabs
          screenOptions={{
            headerShown: false,
        
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
        
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
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
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import DashboardScreen from './src/screens/Dashboard';
import ReportsScreen from './src/screens/Reports';
import TransactionsScreen from './src/screens/Transactions';
import SettingsScreen from './src/screens/Settings';

// DB & Services
import { initDB } from './src/database/db';
import { registerBackgroundFetchAsync } from './src/services/NotificationService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      await initDB();
      await registerBackgroundFetchAsync();
      setDbReady(true);
    }
    setup();
  }, []);

  if (!dbReady) return null; // Or a loading spinner

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName: any = 'view-dashboard';
                if (route.name === 'Reports') iconName = 'chart-bar';
                else if (route.name === 'Transactions') iconName = 'format-list-bulleted';
                else if (route.name === 'Settings') iconName = 'cog';
                return <Icon name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Transactions" component={TransactionsScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

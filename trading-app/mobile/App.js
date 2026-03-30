import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { getToken, clearAuth } from './api';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import StocksScreen from './screens/StocksScreen';
import StockDetailScreen from './screens/StockDetailScreen';
import AlertsScreen from './screens/AlertsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#111827' }
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen
        name="StockDetail"
        component={StockDetailScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function StocksStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#111827' }
      }}
    >
      <Stack.Screen name="StocksHome" component={StocksScreen} />
      <Stack.Screen
        name="StockDetail"
        component={StockDetailScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#111827' }
      }}
    >
      <Stack.Screen name="AlertsHome" component={AlertsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60
        },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'dashboard' : 'dashboard';
          } else if (route.name === 'Stocks') {
            iconName = focused ? 'trending-up' : 'trending-up';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-none';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: 'Tableau de Bord' }}
      />
      <Tab.Screen
        name="Stocks"
        component={StocksStack}
        options={{ title: 'Actions' }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={{ title: 'Alertes' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await getToken();
      if (token) {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (e) {
      console.error('Erreur vérification auth:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    await clearAuth();
    setUser(null);
  };

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#111827' }
        }}
      >
        {!user ? (
          <Stack.Group screenOptions={{ animationEnabled: false }}>
            <Stack.Screen
              name="Login"
              options={{
                animationEnabled: false
              }}
            >
              {props => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ animationEnabled: false }}>
            <Stack.Screen name="MainApp">
              {props => <MainTabs {...props} user={user} onLogout={handleLogout} />}
            </Stack.Screen>
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

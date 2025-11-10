// App.js

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './AuthContext';
import { PRIMARY_COLOR } from './config';

import AuthScreen from './screens/AuthScreen';
import MainAppScreen from './screens/MainAppScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoading, userToken } = useAuth(); 

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false, 
        }}
      >
        {userToken == null ? (
          // User is NOT logged in
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          // User IS logged in
          <>
            <Stack.Screen name="Home" component={MainAppScreen} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                headerShown: true, 
                title: 'My Account',
                headerStyle: { backgroundColor: PRIMARY_COLOR },
                headerTintColor: '#fff'
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Wrap the entire app in the AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
// App.js

import React from 'react';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './AuthContext';
import { PRIMARY_COLOR, BACKGROUND_COLOR, TEXT_COLOR, SURFACE_COLOR } from './config';

import AuthScreen from './screens/AuthScreen';
import MainAppScreen from './screens/MainAppScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// Create a custom Dark Theme for the navigator
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: PRIMARY_COLOR,
    background: BACKGROUND_COLOR,
    card: SURFACE_COLOR,
    text: TEXT_COLOR,
    border: SURFACE_COLOR,
  },
};

function AppNavigator() {
  const { isLoading, userToken } = useAuth(); 

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEXT_COLOR} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      {/* Set the status bar to light text for our dark background */}
      <StatusBar barStyle="light-content" />
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false, 
        }}
      >
        {userToken == null ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={MainAppScreen} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                headerShown: true, 
                title: 'My Account',
                headerStyle: { backgroundColor: SURFACE_COLOR },
                headerTintColor: TEXT_COLOR,
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: BACKGROUND_COLOR 
  },
});
// App.js

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- Import our new helper files ---
import { AuthProvider, useAuth } from './AuthContext';
import { PRIMARY_COLOR } from './config';

// --- Import our three screens ---
import AuthScreen from './screens/AuthScreen';
import MainAppScreen from './screens/MainAppScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// This new component contains all our navigation logic
function AppNavigator() {
  // Get the login state and loading status from our new AuthContext
  const { isLoading, userToken } = useAuth(); 

  // Show a loading spinner while the app checks for a saved token
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
          headerShown: false, // Hide the default header
        }}
      >
        {userToken == null ? (
          // --- User is NOT logged in ---
          // Show the AuthScreen (Login/Register)
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          // --- User IS logged in ---
          // Show the main app screens
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

// This is the final App. We wrap the entire Navigator in the AuthProvider
// so that all screens can access the login state.
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
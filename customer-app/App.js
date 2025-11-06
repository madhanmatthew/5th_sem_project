import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Import New Screens from the screens/ directory ---
// Make sure these paths are correct!
import AuthScreen from './screens/AuthScreen';
import MainAppScreen from './screens/MainAppScreen';
import ProfileScreen from './screens/ProfileScreen';

// --- Configuration ---
const PRIMARY_COLOR = '#6F4E37'; // Sagar Cafe Brown
const Stack = createNativeStackNavigator();

// --- Context for Authentication State (Used across components) ---
const AuthContext = React.createContext();

// --- Main App Component ---
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // --- Initial Check for Token (Runs only once on app launch) ---
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        // Retrieve the user token from AsyncStorage
        token = await AsyncStorage.getItem('userToken');
      } catch (e) {
        console.error('Failed to restore token from storage', e);
      }
      // This token value determines if we show the Auth stack or the Home stack
      setUserToken(token); 
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  // --- Auth Context Value (Functions provided to Login/Profile screens) ---
  const authContext = useMemo(
    () => ({
      // Function to be called after a successful Login/Register
      signIn: async (token) => {
        await AsyncStorage.setItem('userToken', token);
        setUserToken(token); // Update state to trigger navigation to MainAppScreen
      },
      // Function to be called when the user presses Logout
      signOut: async () => {
        await AsyncStorage.removeItem('userToken');
        setUserToken(null); // Update state to trigger navigation back to AuthScreen
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false, // Hide default header for a clean look
            contentStyle: { backgroundColor: '#f5f5f5' } // Consistent background
          }}
        >
          {userToken == null ? (
            // --- User NOT authenticated (Public Stack) ---
            <Stack.Group>
              <Stack.Screen name="Auth" component={AuthScreen} />
            </Stack.Group>
          ) : (
            // --- User IS authenticated (Private/App Stack) ---
            <Stack.Group>
              <Stack.Screen name="Home" component={MainAppScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} 
                options={{ headerShown: true, title: 'My Account' }} 
              />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

// Export the context and color for use in other screens
export { AuthContext, PRIMARY_COLOR };
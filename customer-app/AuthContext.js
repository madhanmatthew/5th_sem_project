// AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Create the context
const AuthContext = createContext();

// 2. Create the Provider (this will wrap your whole app in App.js)
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null); // This will hold user data like name/email

  // This effect runs once when the app starts
  // It checks if a user is already logged in from a previous session
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      let userData;
      try {
        token = await AsyncStorage.getItem('userToken');
        userData = await AsyncStorage.getItem('user_data');
      } catch (e) {
        // Restoring token failed
        console.error("Restoring token failed", e);
      }
      if (token && userData) {
        setUserToken(token);
        setUser(JSON.parse(userData));
      }
      setIsLoading(false);
    };
    bootstrapAsync();
  }, []);
  
  // This is the object that all your screens will be able to access
  const authContext = {
    signIn: async (token, userData) => {
      try {
        setUserToken(token);
        setUser(userData);
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      } catch (e) {
        console.error("Failed to save auth data", e);
      }
    },
    signOut: async () => {
      try {
        setUserToken(null);
        setUser(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user_data');
      } catch (e) {
        console.error("Failed to clear auth data", e);
      }
    },
    user, // Make user data available
    userToken, // Make token available
    isLoading, // Make loading state available
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create the 'useAuth' hook
// This is a shortcut so other files can just call useAuth()
export const useAuth = () => useContext(AuthContext);
// AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './config'; 
import axios from 'axios';

// 1. Create the context
const AuthContext = createContext();

// 2. Create the Provider
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null); 

  // This effect runs once when the app starts
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      let userData;
      try {
        token = await AsyncStorage.getItem('userToken');
        userData = await AsyncStorage.getItem('user_data');
      } catch (e) {
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

  const authContext = {
    signIn: async (token, userData) => {
      setUserToken(token);
      setUser(userData);
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    },
    signOut: async () => {
      setUserToken(null);
      setUser(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user_data');
    },
    user,
    userToken,
    isLoading,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create the 'useAuth' hook
export const useAuth = () => useContext(AuthContext);
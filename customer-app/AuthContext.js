// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null); 

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

export const useAuth = () => useContext(AuthContext);
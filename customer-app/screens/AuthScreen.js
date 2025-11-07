// customer-app/screens/AuthScreen.js

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../AuthContext'; // Import from new context file
import { PRIMARY_COLOR, API_URL } from '../config'; // Import from new config file
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  // Get the signIn function from our new AuthContext
  const { signIn } = useAuth(); 
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    // Check for empty fields
    if (!email || !password || (!isLogin && !name)) {
      return Alert.alert('Validation Error', 'Please fill all required fields.');
    }

    setIsLoading(true);
    // Set the correct API endpoint and data payload
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      // Call the backend
      const response = await axios.post(`${API_URL}${endpoint}`, body);
      const { token, user } = response.data;
      
      if (token && user) {
        // If login is successful, call signIn from our context
        // This will save the token and user, and App.js will auto-navigate
        await signIn(token, user); 
      } else {
        throw new Error("Token or user data not received.");
      }
    } catch (error) {
      console.error('Auth Error:', error);
      // Get the error message from the backend if it exists
      const message = error.response?.data?.message || error.response?.data || 'Could not connect to the server.';
      Alert.alert('Login/Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- THIS IS YOUR NEW SKIP FUNCTION ---
  const handleSkip = () => {
    // We create a fake "Guest" user and a fake token
    const guestUser = { id: 0, name: "Guest", email: "guest@guest.com" };
    const fakeToken = "DEV_SKIP_TOKEN";
    
    // We call signIn to log in as this fake user.
    // This will make the app work without a real backend login.
    signIn(fakeToken, guestUser);
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f5f5f5'}}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.logo}>Sagar Cafe</Text>
          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Your Account'}</Text>
          
          {/* This field only shows when registering */}
          {!isLogin && (
            <TextInput 
              style={styles.input} 
              placeholder="Full Name" 
              value={name} 
              onChangeText={setName} 
              autoCapitalize="words"
            />
          )}
          
          <TextInput 
            style={styles.input} 
            placeholder="Email Address" 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            autoCapitalize="none"
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />

          {isLoading ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleAuth} 
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLogin ? 'LOG IN' : 'REGISTER'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>

          {/* --- YOUR NEW SKIP BUTTON --- */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.switchText}>Skip Login (For Dev)</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES (Your file, unchanged) ---
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20, 
    },
    logo: { 
        fontSize: 36, 
        fontWeight: '900', 
        color: PRIMARY_COLOR, 
        marginBottom: 10 
    },
    title: { 
        fontSize: 24, 
        marginBottom: 30, 
        fontWeight: '600',
        color: '#333'
    },
    input: { 
        width: '100%', 
        padding: 15, 
        marginVertical: 10, 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 8, 
        backgroundColor: 'white',
        fontSize: 16,
    },
    button: { 
        width: '100%', 
        padding: 15, 
        backgroundColor: PRIMARY_COLOR, 
        borderRadius: 8, 
        marginTop: 20,
        minHeight: 55,
        justifyContent: 'center',
    },
    buttonText: { 
        color: 'white', 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: 18 
    },
    switchButton: { 
        marginTop: 20 
    },
    switchText: { 
        color: PRIMARY_COLOR, 
        fontSize: 16 
    },
    skipButton: { // Style for the new skip button
        marginTop: 15,
        padding: 10,
    }
});
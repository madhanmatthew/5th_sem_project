// screens/AuthScreen.js

import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../AuthContext'; 
import API_URL, { PRIMARY_COLOR } from '../config'; 
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const { signIn } = useAuth(); 
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    // Check for empty fields
    if (!email || !password || (!isLogin && !name)) {
      return Alert.alert('Validation Error', 'Please fill all required fields.');
    }

    // Check for password match on register
    if (!isLogin && password !== confirmPassword) {
      return Alert.alert('Validation Error', 'Passwords do not match.');
    }

    setIsLoading(true);
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
      const message = error.response?.data?.message || error.response?.data || 'Could not connect to the server.';
      Alert.alert('Login/Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. The top header (brown) */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Hello!</Text>
        <Text style={styles.headerSubtitle}>Welcome to Sagar Cafe</Text>
        <Text style={styles.headerIcon}>☕</Text>
      </View>

      {/* 2. The white form card */}
      <KeyboardAvoidingView 
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Back button for Register screen */}
          {!isLogin && (
            <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.backButton}>
              <Text style={styles.backButtonText}>&lt; Back to Login</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.formTitle}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          
          {/* --- REGISTRATION FIELDS --- */}
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Full Name" 
                  value={name} 
                  onChangeText={setName} 
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  secureTextEntry 
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📞</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Phone (Optional)" 
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          {/* --- LOGIN FIELDS --- */}
          {isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
              </View>
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* --- SUBMIT BUTTON --- */}
          {isLoading ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleAuth} 
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>
            </TouchableOpacity>
          )}
          
          {/* --- BOTTOM TOGGLE (Only on Login screen) --- */}
          {isLogin && (
            <TouchableOpacity onPress={() => setIsLogin(false)} style={styles.switchButton}>
              <Text style={styles.switchText}>
                Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          )}
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: PRIMARY_COLOR 
  },
  headerContainer: {
    height: '25%',
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 20, 
  },
  headerTitle: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 18,
    marginTop: 5,
  },
  headerIcon: {
    fontSize: 80,
    position: 'absolute',
    right: 20,
    top: 50,
    opacity: 0.3,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, 
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 20, 
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  formTitle: { 
    fontSize: 26, 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    marginVertical: 8,
  },
  inputIcon: {
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#888',
  },
  input: { 
    flex: 1,
    paddingVertical: 15, 
    fontSize: 16,
    color: '#000', // Ensure text is visible
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginVertical: 5,
  },
  forgotText: {
    color: PRIMARY_COLOR,
  },
  button: { 
    width: '100%', 
    padding: 15, 
    backgroundColor: PRIMARY_COLOR, 
    borderRadius: 10, 
    marginTop: 20,
    minHeight: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { 
    color: 'white', 
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  switchButton: { 
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: { 
    color: '#888', 
    fontSize: 16 
  },
  switchTextBold: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
});
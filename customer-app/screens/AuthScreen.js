// screens/AuthScreen.js
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Image 
} from 'react-native';
import { useAuth } from '../AuthContext'; 
// Import API_URL and all the colors from the config file
import API_URL, { 
  SECONDARY_COLOR, 
  TEXT_COLOR, 
  MUTED_COLOR, 
  BACKGROUND_COLOR, 
  SURFACE_COLOR 
} from '../config'; 
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const { signIn } = useAuth(); 
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      return Alert.alert('Validation Error', 'Please fill all required fields.');
    }
    if (!isLogin && password !== confirmPassword) {
      return Alert.alert('Validation Error', 'Passwords do not match.');
    }

    setIsLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, body);
      const { token, user } = response.data;
      if (token && user) {
        await signIn(token, user); 
      } else {
        throw new Error("Token or user data not received.");
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data || 'Could not connect.';
      Alert.alert('Login/Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use safe area with the dark background color
    <SafeAreaView style={styles.container}>
      {/* This view is for the background decorative circle */}
      <View style={styles.gradientCircle} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button for Register screen */}
          {!isLogin && (
            <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.backButton}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </TouchableOpacity>
          )}

          {/* --- LOGO --- */}
          <View style={styles.logoContainer}>
            {/* Make sure to replace this 'uri' with a local 'require', e.g.:
              source={require('../assets/logo.png')}
            */}
            <Image
              source={require('./assets/logo.png')} // <-- REPLACE THIS
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          {/* --- HEADER --- */}
          <Text style={styles.headerTitle}>{isLogin ? 'Login' : 'Create account'}</Text>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
            <Text style={styles.headerSubtitle}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchTextBold}>
                {isLogin ? "Sign up" : "Sign in"}
              </Text>
            </Text>
          </TouchableOpacity>
          
          {/* --- FORM --- */}
          <View style={styles.formContainer}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Name" 
                  placeholderTextColor={MUTED_COLOR} // <-- Use config color
                  value={name} 
                  onChangeText={setName} 
                  autoCapitalize="words"
                  selectionColor={SECONDARY_COLOR} // <-- Use config color
                />
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Email or phone" 
                placeholderTextColor={MUTED_COLOR} // <-- Use config color
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
                selectionColor={SECONDARY_COLOR} // <-- Use config color
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Password" 
                placeholderTextColor={MUTED_COLOR} // <-- Use config color
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
                selectionColor={SECONDARY_COLOR} // <-- Use config color
              />
              {/* Forgot button inside the input */}
              {isLogin && (
                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>FORGOT</Text>
                </TouchableOpacity>
              )}
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Confirm Password" 
                  placeholderTextColor={MUTED_COLOR} // <-- Use config color
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  secureTextEntry 
                  selectionColor={SECONDARY_COLOR} // <-- Use config color
                />
              </View>
            )}

            {isLoading ? (
              <ActivityIndicator size="large" color={SECONDARY_COLOR} style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleAuth} 
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign up'}</Text>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES (Dark Mode Theme from config.js) ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BACKGROUND_COLOR, // True Black
  },
  gradientCircle: {
    position: 'absolute',
    top: -100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: SURFACE_COLOR + '50', // Dark Grey with opacity
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    paddingTop: 20, 
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 5,
  },
  backButtonText: {
    color: MUTED_COLOR, // Light Grey
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  headerTitle: {
    fontSize: 32, 
    fontWeight: 'bold',
    color: TEXT_COLOR, // White
    marginBottom: 5,
  },
  switchButton: {
    marginBottom: 30, 
  },
  headerSubtitle: {
    fontSize: 16,
    color: MUTED_COLOR, // Light Grey
  },
  switchTextBold: {
    color: SECONDARY_COLOR, // Rusty Orange
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_COLOR, // Dark Grey bg
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444', // Subtle border as in your original file
  },
  input: { 
    flex: 1,
    padding: 15, 
    fontSize: 16,
    color: TEXT_COLOR, // White text for typing
  },
  forgotButton: {
    padding: 15,
  },
  forgotText: {
    color: SECONDARY_COLOR, // Rusty Orange
    fontWeight: 'bold',
    fontSize: 12,
  },
  button: { 
    width: '100%', 
    padding: 15, 
    backgroundColor: SECONDARY_COLOR, // Rusty Orange button
    borderRadius: 10, 
    marginTop: 20,
    minHeight: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row', 
  },
  buttonText: { 
    color: TEXT_COLOR, // White text
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
});
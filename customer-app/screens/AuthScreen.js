// screens/AuthScreen.js
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, ImageBackground
} from 'react-native';
import { useAuth } from '../AuthContext'; 
import API_URL, { SECONDARY_COLOR, TEXT_COLOR, MUTED_COLOR, SURFACE_COLOR } from '../config'; 
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

// This is a high-quality, dark coffee bean background
const COFFEE_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1511920183234-2b99723e0f09?q=80&w=1974&auto=format&fit=crop';

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ImageBackground 
          source={{ uri: COFFEE_BACKGROUND_IMAGE }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {!isLogin && (
              <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.backButton}>
                <Text style={styles.backButtonText}>{'< Back to Login'}</Text>
              </TouchableOpacity>
            )}

            {/* This text header replaces the old Image tag */}
            <Text style={styles.headerTitle}>{isLogin ? 'Good Morning' : 'Create Account'}</Text>
            <Text style={styles.headerSubtitle}>{isLogin ? 'Welcome back to Sagar Cafe' : 'Find the best coffee for you'}</Text>
            
            <View style={styles.formContainer}>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Full Name" 
                    placeholderTextColor={MUTED_COLOR}
                    value={name} 
                    onChangeText={setName} 
                    autoCapitalize="words"
                    selectionColor={SECONDARY_COLOR}
                  />
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  placeholderTextColor={MUTED_COLOR}
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  selectionColor={SECONDARY_COLOR}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  placeholderTextColor={MUTED_COLOR}
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  selectionColor={SECONDARY_COLOR}
                />
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Confirm Password" 
                    placeholderTextColor={MUTED_COLOR}
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                    secureTextEntry 
                    selectionColor={SECONDARY_COLOR}
                  />
                </View>
              )}

              {isLogin && (
                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {isLoading ? (
                <ActivityIndicator size="large" color={SECONDARY_COLOR} style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleAuth} 
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>{isLogin ? 'LOG IN' : 'SIGN UP'}</Text>
                </TouchableOpacity>
              )}
              
              {isLogin && (
                <TouchableOpacity onPress={() => setIsLogin(false)} style={styles.switchButton}>
                  <Text style={styles.switchText}>
                    Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES (Dark Mode Theme) ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end', 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between', 
    padding: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: TEXT_COLOR,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginTop: 20, 
  },
  headerSubtitle: {
    fontSize: 18,
    color: MUTED_COLOR,
    marginTop: 5,
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: SURFACE_COLOR,
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444', 
  },
  input: { 
    padding: 15, 
    fontSize: 16,
    color: TEXT_COLOR, 
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  forgotText: {
    color: SECONDARY_COLOR,
  },
  button: { 
    width: '100%', 
    padding: 15, 
    backgroundColor: SECONDARY_COLOR, 
    borderRadius: 10, 
    marginTop: 20,
    minHeight: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { 
    color: TEXT_COLOR, 
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  switchButton: { 
    marginTop: 30,
    alignItems: 'center',
  },
  switchText: { 
    color: MUTED_COLOR, 
    fontSize: 16 
  },
  switchTextBold: {
    color: SECONDARY_COLOR,
    fontWeight: 'bold',
  },
});
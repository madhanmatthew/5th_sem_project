// screens/AuthScreen.js

import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
// Import AuthContext and PRIMARY_COLOR from your new App.js file
import { AuthContext, PRIMARY_COLOR } from '../App'; 

// NOTE: You must use your final deployed API URL here.
const API_URL = 'https://[Your-New-Domain]'; // e.g., 'https://sagarcafebackend.render.com'

export default function AuthScreen() {
    // Get the signIn function from the AuthContext established in App.js
    const { signIn } = useContext(AuthContext); 
    
    // State to toggle between Login and Register views
    const [isLogin, setIsLogin] = useState(true);
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async () => {
        // --- Input Validation ---
        if (!email || !password || (!isLogin && !name)) {
            return Alert.alert('Validation Error', 'Please fill all required fields.');
        }

        setIsLoading(true);
        const endpoint = isLogin ? 'login' : 'register';
        const body = isLogin 
            ? { email, password } 
            : { name, email, password };

        try {
            // --- API Call to Backend ---
            // NOTE: You must implement the POST /api/auth/login and /api/auth/register routes on your Node.js backend!
            const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            // Check if the server responded successfully (status code 200-299)
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Authentication failed!`);
            }

            const data = await response.json();
            
            // --- SUCCESS: Save Token and Navigate ---
            // Assuming your backend returns a 'token' field on successful login/register
            if (data.token) {
                await signIn(data.token); // Calls the function in App.js to save the token and redirect
            } else {
                throw new Error("Token not received from server.");
            }
        } catch (error) {
            console.error('Auth Error:', error);
            Alert.alert('Login/Registration Failed', error.message || 'Could not connect to the authentication server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // KeyboardAvoidingView prevents inputs from being covered by the keyboard
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.logo}>Sagar Cafe</Text>
                <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Your Account'}</Text>
                
                {/* Registration Only Field */}
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

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleAuth} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>{isLogin ? 'LOG IN' : 'REGISTER'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
                    <Text style={styles.switchText}>
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

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
});

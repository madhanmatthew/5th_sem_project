// screens/ProfileScreen.js

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

// --- FIXED IMPORTS ---
// Import from our new helper files, NOT from App.js
import { PRIMARY_COLOR } from '../config';
import { useAuth } from '../AuthContext';


export default function ProfileScreen({ navigation }) {
    // Get the signOut function AND the user data from our new useAuth hook
    const { signOut, user } = useAuth();

    const handleLogout = () => {
        // Call the signOut function
        signOut();
    };

    return (
        <SafeAreaView style={styles.container}>
             {/* Add a simple header to go back */}
             <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.headerButton}>&lt; Back to Menu</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Your Sagar Cafe Account</Text>
                
                <View style={styles.infoBox}>
                    <Text style={styles.sectionHeader}>Account Details</Text>
                    
                    {/* --- FIXED: Use the REAL user data --- */}
                    <Text style={styles.detail}>Name: {user?.name || 'Customer'}</Text>
                    <Text style={styles.detail}>Email: {user?.email || 'No email'}</Text>
                    
                    <Text style={styles.detail}>Joined: November 2025</Text>
                </View>

                <TouchableOpacity style={styles.historyButton}>
                    <Text style={styles.historyButtonText}>View Order History</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} /> {/* Spacer */}
                
                {/* Logout Button */}
                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// --- STYLES (Your file, with additions) ---
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5' 
    },
    // NEW header style
    header: { 
      padding: 15, 
      backgroundColor: '#fff', 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee' 
    },
    headerButton: { 
      color: PRIMARY_COLOR, 
      fontSize: 18, 
    },
    // NEW content wrapper
    content: {
      flex: 1,
      padding: 20,
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: PRIMARY_COLOR, 
        marginBottom: 30,
        textAlign: 'center',
    },
    infoBox: {
        width: '100%',
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        borderLeftWidth: 5,
        borderLeftColor: PRIMARY_COLOR,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    detail: { 
        fontSize: 16, 
        marginBottom: 5, 
        color: '#555' 
    },
    historyButton: {
        backgroundColor: '#eee',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
    },
    historyButtonText: {
        color: PRIMARY_COLOR,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    button: { 
        width: '100%', 
        padding: 15, 
        backgroundColor: '#D9534F', // Standard red for dangerous action (Logout)
        borderRadius: 8, 
        marginTop: 20,
    },
    buttonText: { 
        color: 'white', 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: 18 
    },
});
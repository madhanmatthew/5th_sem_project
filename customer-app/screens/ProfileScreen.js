// screens/ProfileScreen.js

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// Import the AuthContext and PRIMARY_COLOR from the main App.js file
import { AuthContext, PRIMARY_COLOR } from '../App';

export default function ProfileScreen({ navigation }) {
    // Get the signOut function from the AuthContext provided in App.js
    const { signOut } = useContext(AuthContext);

    const handleLogout = () => {
        // Call the signOut function, which deletes the token and sets userToken=null in App.js
        signOut();
        // Optional: you can navigate back to the root of the stack, but setting userToken=null
        // in the main App.js will automatically switch the navigation stack.
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Sagar Cafe Account</Text>
            
            <View style={styles.infoBox}>
                <Text style={styles.sectionHeader}>Account Details</Text>
                {/* NOTE: In a real app, you would fetch and display the user's name/email here */}
                <Text style={styles.detail}>Name: [User Name Placeholder]</Text>
                <Text style={styles.detail}>Email: [User Email Placeholder]</Text>
                <Text style={styles.detail}>Joined: November 2025</Text>
            </View>

            <TouchableOpacity style={styles.historyButton}>
                 <Text style={styles.historyButtonText}>View Order History</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} /> {/* Spacer to push logout button to the bottom */}
            
            {/* Logout Button */}
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>LOGOUT</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20, 
        backgroundColor: '#f5f5f5' 
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

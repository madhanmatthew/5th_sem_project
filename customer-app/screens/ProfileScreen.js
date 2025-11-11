// screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

import { PRIMARY_COLOR, BACKGROUND_COLOR, SURFACE_COLOR, TEXT_COLOR, MUTED_COLOR, SECONDARY_COLOR } from '../config';
import { useAuth } from '../AuthContext';

export default function ProfileScreen({ navigation }) {
    const { signOut, user } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.header}>
               <TouchableOpacity onPress={() => navigation.goBack()}>
                 <Text style={styles.headerButton}>{'< Back to Menu'}</Text>
               </TouchableOpacity>
             </View>

            <View style={styles.content}>
                <Text style={styles.title}>Your Account</Text>
                
                <View style={styles.infoBox}>
                    <Text style={styles.sectionHeader}>Account Details</Text>
                    <Text style={styles.detail}>Name: {user?.name || 'Customer'}</Text>
                    <Text style={styles.detail}>Email: {user?.email || 'No email'}</Text>
                </View>

                <TouchableOpacity style={styles.historyButton}>
                    <Text style={styles.historyButtonText}>View Order History</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} /> 
                
                <TouchableOpacity style={styles.button} onPress={signOut}>
                    <Text style={styles.buttonText}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: BACKGROUND_COLOR 
    },
    header: { 
      padding: 15, 
      backgroundColor: SURFACE_COLOR, 
      borderBottomWidth: 1, 
      borderBottomColor: '#333' 
    },
    headerButton: { 
      color: SECONDARY_COLOR, 
      fontSize: 18, 
    },
    content: {
      flex: 1,
      padding: 20,
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: TEXT_COLOR, 
        marginBottom: 30,
        textAlign: 'center',
    },
    infoBox: {
        width: '100%',
        padding: 15,
        backgroundColor: SURFACE_COLOR,
        borderRadius: 8,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: TEXT_COLOR,
    },
    detail: { 
        fontSize: 16, 
        marginBottom: 5, 
        color: MUTED_COLOR 
    },
    historyButton: {
        backgroundColor: SURFACE_COLOR,
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    historyButtonText: {
        color: SECONDARY_COLOR,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    button: { 
        width: '100%', 
        padding: 15, 
        backgroundColor: '#D9534F', 
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
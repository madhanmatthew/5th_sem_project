// components/OrderStatusView.js
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PRIMARY_COLOR } from '../config';

export const OrderStatusView = ({ activeOrder, setView, onNewOrder }) => {
  if (!activeOrder) {
    return (
      <View style={styles.centered}>
        <Text>No Active Order. Place one now!</Text>
        <TouchableOpacity style={styles.newOrderButton} onPress={() => setView('menu')}>
          <Text style={styles.orderButtonText}>Go to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const statusStyle = styles[`status_${activeOrder.status.toLowerCase()}`] || {};
  return (
    <View style={[styles.statusContainer, statusStyle.container]}>
      <Text style={styles.statusTitle}>Tracking Order #{activeOrder.id}</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />
      <Text style={[styles.statusMessage, statusStyle.text]}>{activeOrder.message}</Text>
      <Text style={styles.statusSubText}>Real-time updates via Socket.io.</Text>
      {['Completed', 'Cancelled'].includes(activeOrder.status) && (
        <TouchableOpacity style={styles.newOrderButton} onPress={() => { onNewOrder(); setView('menu'); }}>
          <Text style={[styles.orderButtonText, statusStyle.buttonText]}>Place a New Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#333' },
  statusTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  statusMessage: { fontSize: 20, textAlign: 'center', marginVertical: 20, fontWeight: '500', color: 'white' },
  statusSubText: { fontSize: 14, color: '#f0f0f0', marginTop: 10 },
  newOrderButton: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginTop: 30, width: '80%' },
  orderButtonText: { color: PRIMARY_COLOR, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  status_pending: { container: { backgroundColor: '#f0ad4e' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_queued: { container: { backgroundColor: '#0275d8' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_preparing: { container: { backgroundColor: '#5bc0de' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_ready: { container: { backgroundColor: '#5cb85c' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_completed: { container: { backgroundColor: '#6c757d' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_cancelled: { container: { backgroundColor: '#d9534f' }, text: { color: 'white' }, buttonText: { color: '#333' } },
});
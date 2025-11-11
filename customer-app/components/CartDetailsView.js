// components/CartDetailsView.js
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY_COLOR } from '../config';

export const CartDetailsView = ({ cart, totalCost, isLoading, setView, placeOrder }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.simpleHeader}>
      <TouchableOpacity onPress={() => setView('menu')}>
        <Text style={{ fontSize: 18, color: PRIMARY_COLOR }}>{'< Back to Menu'}</Text>
      </TouchableOpacity>
    </View>
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.cartDetailsTitle}>Your Order Summary</Text>
      {cart.map((item) => (
        <View key={item.id} style={styles.cartDetailItem}>
          <Text style={styles.cartDetailItemName}>{item.name}</Text>
          <Text style={styles.cartDetailItemQuantity}>x {item.quantity}</Text>
          <Text style={styles.cartDetailItemPrice}>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
    <View style={styles.cartContainer}>
      <Text style={styles.totalText}>Subtotal: ₹{totalCost.toFixed(2)}</Text>
      <TouchableOpacity style={styles.checkoutButton} onPress={placeOrder} disabled={cart.length === 0 || isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>PLACE ORDER</Text>}
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  simpleHeader: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cartDetailsTitle: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 16, marginVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 6 },
  cartDetailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cartDetailItemName: { flex: 3, fontSize: 16 },
  cartDetailItemQuantity: { flex: 1, textAlign: 'center', fontSize: 16 },
  cartDetailItemPrice: { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: 'bold' },
  cartContainer: { padding: 20, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: 'white' },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  checkoutButton: { backgroundColor: PRIMARY_COLOR, padding: 15, borderRadius: 10 },
  orderButtonText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
});
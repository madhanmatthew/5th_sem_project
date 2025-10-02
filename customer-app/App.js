import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Alert, SafeAreaView, TouchableOpacity } from 'react-native';

const API_URL = 'http://192.168.X.X:3001'; // IMPORTANT: REPLACE WITH YOUR COMPUTER'S IP ADDRESS

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch the menu from the backend
  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/api/menu`);
      const data = await response.json();
      setMenu(data);
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      Alert.alert("Error", "Could not fetch menu. Make sure the backend server is running!");
    }
  };

  // useEffect to fetch menu when the app starts
  useEffect(() => {
    fetchMenu();
  }, []);

  // Add an item to the cart
  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        // Increase quantity if item already exists
        return currentCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      // Add new item with quantity 1
      return [...currentCart, { ...item, quantity: 1 }];
    });
  };

  // Place the order
  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before placing an order.");
      return;
    }
    try {
      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      Alert.alert("Success!", "Your order has been placed.");
      setCart([]); // Clear the cart
    } catch (error) {
      console.error("Failed to place order:", error);
      Alert.alert("Error", "Could not place your order.");
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Restaurant Menu</Text>
      </View>

      <FlatList
        data={menu}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <Text style={styles.itemName}>{item.name} - ₹{item.price}</Text>
            <Button title="Add to Cart" onPress={() => addToCart(item)} />
          </View>
        )}
        style={styles.menuList}
      />

      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Your Cart</Text>
        {cart.map(item => (
          <Text key={item.id} style={styles.cartItem}>{item.quantity} x {item.name}</Text>
        ))}
        <Text style={styles.totalText}>Total: ₹{totalCost}</Text>
        <TouchableOpacity style={styles.orderButton} onPress={placeOrder}>
          <Text style={styles.orderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#282c34' },
  headerText: { color: 'white', fontSize: 24, textAlign: 'center', fontWeight: 'bold' },
  menuList: { flex: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 18 },
  cartContainer: { padding: 20, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: 'white' },
  cartTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  cartItem: { fontSize: 16, marginBottom: 5 },
  totalText: { fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'right' },
  orderButton: { backgroundColor: '#5cb85c', padding: 15, borderRadius: 8, marginTop: 10 },
  orderButtonText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
});
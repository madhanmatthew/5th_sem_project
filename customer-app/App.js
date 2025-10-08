import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Alert, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';

// Use localhost because Expo Tunnel will automatically handle the connection.
const API_URL = 'http://localhost:3001';

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  
  // NEW: State to manage the current view and the active order
  const [view, setView] = useState('menu'); // Can be 'menu' or 'orderStatus'
  const [activeOrder, setActiveOrder] = useState(null);

  // --- Functions for Menu and Cart ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/api/menu`);
        const data = await response.json();
        setMenu(data);
      } catch (error) {
        Alert.alert("Connection Error", "Could not fetch menu.");
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        // If item already exists in cart, increase its quantity
        return currentCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      // Otherwise, add the new item to the cart with quantity 1
      return [...currentCart, { ...item, quantity: 1 }];
    });
  };

  // MODIFIED: This function now switches to the order status view after success
  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      const newOrder = await response.json(); // Get the new order details back from the server
      setActiveOrder(newOrder); // Save the active order
      setView('orderStatus'); // Switch to the status view
      setCart([]); // Clear the cart
    } catch (error) {
      Alert.alert("Error", "Could not place your order.");
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- UI Rendering ---

  // The main menu and cart view
  const MenuView = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>Restaurant Menu</Text>
      </View>
      <FlatList
        data={menu}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.dishImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name} - ₹{item.price}</Text>
            </View>
            <View style={styles.addButton}>
              <Button title="Add" onPress={() => addToCart(item)} />
            </View>
          </View>
        )}
        style={styles.menuList}
      />
      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Your Cart</Text>
        {cart.map(item => ( <Text key={item.id} style={styles.cartItem}>{item.quantity} x {item.name}</Text> ))}
        <Text style={styles.totalText}>Total: ₹{totalCost}</Text>
        <TouchableOpacity style={styles.orderButton} onPress={placeOrder}>
          <Text style={styles.orderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // NEW: The component for the Order Status view
  const OrderStatusView = () => {
    // This effect will poll for status updates every 5 seconds
    useEffect(() => {
      const fetchOrderStatus = async () => {
        try {
          const response = await fetch(`${API_URL}/api/orders/${activeOrder.id}`);
          const updatedOrder = await response.json();
          setActiveOrder(updatedOrder);
        } catch (error) {
          console.error("Failed to fetch order status");
        }
      };

      const interval = setInterval(fetchOrderStatus, 5000);
      return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    if (!activeOrder) return null;

    const statusStyle = styles[`status_${activeOrder.status.toLowerCase()}`] || {};

    return (
      <View style={[styles.statusContainer, statusStyle.container]}>
        <Text style={styles.statusTitle}>Tracking Order #{activeOrder.id}</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }}/>
        <Text style={[styles.statusMessage, statusStyle.text]}>{activeOrder.message}</Text>
        <Text style={styles.statusSubText}>This screen will update automatically.</Text>

        {['Completed', 'Cancelled'].includes(activeOrder.status) && (
          <TouchableOpacity 
            style={styles.newOrderButton} 
            onPress={() => {
              setActiveOrder(null);
              setView('menu');
            }}>
            <Text style={[styles.orderButtonText, statusStyle.buttonText]}>Place a New Order</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      {view === 'menu' ? <MenuView /> : <OrderStatusView />}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#282c34' },
  headerText: { color: 'white', fontSize: 24, textAlign: 'center', fontWeight: 'bold' },
  menuList: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white' },
  dishImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '500' },
  addButton: { marginLeft: 10 },
  cartContainer: { padding: 20, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: 'white' },
  cartTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  cartItem: { fontSize: 16, marginBottom: 5 },
  totalText: { fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'right' },
  orderButton: { backgroundColor: '#5cb85c', padding: 15, borderRadius: 8, marginTop: 10 },
  orderButtonText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  
  // NEW: Styles for the Order Status View
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  statusTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  statusMessage: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  statusSubText: { fontSize: 14, color: '#f0f0f0', marginTop: 10 },
  newOrderButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    width: '100%',
  },
  
  // NEW: Dynamic styles based on order status
  status_pending: { container: { backgroundColor: '#f0ad4e' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_queued: { container: { backgroundColor: '#0275d8' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_preparing: { container: { backgroundColor: '#5bc0de' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_ready: { container: { backgroundColor: '#5cb85c' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_completed: { container: { backgroundColor: '#6c757d' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_cancelled: { container: { backgroundColor: '#d9534f' }, text: { color: 'white' }, buttonText: {color: '#333'} },
});


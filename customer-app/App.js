// Change this at the top of your customer-app/App.js file
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Alert, TouchableOpacity, Image, ActivityIndicator, Vibration } from 'react-native';
//import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context'; // CORRECTED IMPORT

// Use localhost because Expo Tunnel will automatically handle the connection.
const API_URL = 'http://20.101.2.126:3001';

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('menu');
  const [activeOrder, setActiveOrder] = useState(null);
  
  // NEW: State for the notification banner
  const [notification, setNotification] = useState(null);

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
        return currentCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...currentCart, { ...item, quantity: 1 }];
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });
      const newOrder = await response.json();
      setActiveOrder(newOrder);
      setView('orderStatus');
      setCart([]);
    } catch (error) {
      Alert.alert("Error", "Could not place your order.");
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- UI Rendering ---

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

  const OrderStatusView = () => {
    // NEW: Use a ref to store the previous status message to detect changes
    const prevMessageRef = useRef();
    
    useEffect(() => {
      prevMessageRef.current = activeOrder?.message;
    }, [activeOrder]);

    useEffect(() => {
      const fetchOrderStatus = async () => {
        try {
          const response = await fetch(`${API_URL}/api/orders/${activeOrder.id}`);
          const updatedOrder = await response.json();

          // NEW: Check if the message has changed
          if (updatedOrder.message !== prevMessageRef.current) {
            Vibration.vibrate(); // Vibrate the phone
            setNotification(updatedOrder.message); // Show the notification banner
            setTimeout(() => setNotification(null), 4000); // Hide banner after 4 seconds
          }
          
          setActiveOrder(updatedOrder);
        } catch (error) {
          console.error("Failed to fetch order status");
        }
      };

      const interval = setInterval(fetchOrderStatus, 5000);
      return () => clearInterval(interval);
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
      {/* NEW: Conditionally render the notification banner */}
      {notification && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      )}
      {view === 'menu' ? <MenuView /> : <OrderStatusView />}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // ... (all your existing styles)
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
  statusContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  statusTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  statusMessage: { fontSize: 20, textAlign: 'center', marginVertical: 20, fontWeight: '500' },
  statusSubText: { fontSize: 14, color: '#f0f0f0', marginTop: 10 },
  newOrderButton: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginTop: 30, width: '100%' },
  status_pending: { container: { backgroundColor: '#f0ad4e' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_queued: { container: { backgroundColor: '#0275d8' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_preparing: { container: { backgroundColor: '#5bc0de' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_ready: { container: { backgroundColor: '#5cb85c' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_completed: { container: { backgroundColor: '#6c757d' }, text: { color: 'white' }, buttonText: {color: '#333'} },
  status_cancelled: { container: { backgroundColor: '#d9534f' }, text: { color: 'white' }, buttonText: {color: '#333'} },

  // NEW: Styles for the notification banner
  notificationBanner: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  notificationText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
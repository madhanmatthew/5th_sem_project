import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Button,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// --- STEP 1: PUT YOUR COMPUTER'S CURRENT IP ADDRESS HERE ---
const SERVER_IP = '192.168.29.123'; // <-- CRITICAL: REPLACE THIS VALUE
const API_URL = `http://${SERVER_IP}:3001`;

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('menu');
  const [activeOrder, setActiveOrder] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/api/menu`);
        const data = await response.json();
        setMenu(data);
      } catch (error) {
        console.error("Fetch Menu Error:", error);
        Alert.alert('Connection Error', 'Could not fetch menu. Please ensure the server is running and the IP address is correct.');
      } finally {
        setIsLoading(false);
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
      console.error("Place Order Error:", error);
      Alert.alert('Error', 'Could not place your order.');
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const MenuView = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#282c34" />
          <Text style={{ marginTop: 10 }}>Loading Menu...</Text>
        </View>
      );
    }
    return (
      <>
        <View style={styles.header}><Text style={styles.headerText}>Restaurant Menu</Text></View>
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.menuItem}>
              <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.dishImage} />
              <View style={styles.itemDetails}><Text style={styles.itemName}>{item.name} - ₹{item.price}</Text></View>
              <View style={styles.addButton}><Button title="Add" onPress={() => addToCart(item)} /></View>
            </View>
          )}
          style={styles.menuList}
        />
        <View style={styles.cartContainer}>
          <Text style={styles.cartTitle}>Your Cart</Text>
          {cart.map(item => (<Text key={item.id} style={styles.cartItem}>{item.quantity} x {item.name}</Text>))}
          <Text style={styles.totalText}>Total: ₹{totalCost.toFixed(2)}</Text>
          <TouchableOpacity style={styles.orderButton} onPress={placeOrder} disabled={cart.length === 0}><Text style={styles.orderButtonText}>Place Order</Text></TouchableOpacity>
        </View>
      </>
    );
  };

  const OrderStatusView = () => {
    const prevMessageRef = useRef();
    useEffect(() => { prevMessageRef.current = activeOrder?.message; }, [activeOrder]);

    useEffect(() => {
      if (!activeOrder?.id) return;

      const fetchOrderStatus = async () => {
        try {
          // --- STEP 2: THIS IS THE NETWORK CALL THAT IS FAILING ---
          const url = `${API_URL}/api/orders/${activeOrder.id}`;
          console.log(`Polling for status update: ${url}`); // <-- ADDED FOR DEBUGGING
          const response = await fetch(url);

          // IMPROVEMENT: Check if the server responded successfully
          if (!response.ok) {
            // This will catch 404 Not Found errors, etc.
            throw new Error(`Server responded with status: ${response.status}`);
          }

          const updatedOrder = await response.json();
          if (updatedOrder.message !== prevMessageRef.current) {
            Vibration.vibrate();
            setNotification(updatedOrder.message);
            setTimeout(() => setNotification(null), 4000);
          }
          setActiveOrder(updatedOrder);
        } catch (error) {
          // This is where the error in your logs is coming from
          console.error('Failed to fetch order status:', error); // <-- BETTER LOGGING
        }
      };

      const interval = setInterval(fetchOrderStatus, 5000);
      return () => clearInterval(interval);
    }, [activeOrder?.id]);

    if (!activeOrder) return null;
    const statusStyle = styles[`status_${activeOrder.status.toLowerCase()}`] || {};

    return (
      <View style={[styles.statusContainer, statusStyle.container]}>
        <Text style={styles.statusTitle}>Tracking Order #{activeOrder.id}</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />
        <Text style={[styles.statusMessage, statusStyle.text]}>{activeOrder.message}</Text>
        <Text style={styles.statusSubText}>This screen will update automatically.</Text>
        {['Completed', 'Cancelled'].includes(activeOrder.status) && (
          <TouchableOpacity style={styles.newOrderButton} onPress={() => { setActiveOrder(null); setView('menu'); }}>
            <Text style={[styles.orderButtonText, statusStyle.buttonText]}>Place a New Order</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {notification && (<View style={styles.notificationBanner}><Text style={styles.notificationText}>{notification}</Text></View>)}
        {view === 'menu' ? <MenuView /> : <OrderStatusView />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  notificationBanner: {
    position: 'absolute',
    top: 50, // Adjusted for better visibility
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

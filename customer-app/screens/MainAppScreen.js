// screens/MainAppScreen.js

import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Vibration, ScrollView, Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import axios from 'axios'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Import from our new helper files ---
import API_URL, { PRIMARY_COLOR } from '../config'; 
import { useAuth } from '../AuthContext';

// --- SOCKET.IO and API CLIENT SETUP ---
// We connect to the socket server one time
const socket = io(API_URL, {
  transports: ['websocket'],
});

// This is a helper function to create an API client that
// automatically includes the user's login token in all requests.
const getApiClient = async () => {
  // Get the token that AuthScreen saved
  const token = await AsyncStorage.getItem('userToken'); 
  return axios.create({
    baseURL: API_URL,
    headers: { 'x-auth-token': token }
  });
};

// --- Main Logic Component (MainAppScreen) ---
export default function MainAppScreen({ navigation }) {
  const [menu, setMenu] = useState([]); // Will be filled from API
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('menu'); // 'menu', 'cartDetails', 'orderStatus'
  const [activeOrder, setActiveOrder] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevMessageRef = useRef();
  
  // Get the logged-in user's data from our context
  const { user } = useAuth();

  // --- Data Fetching (FIXED) ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const apiClient = await getApiClient(); // Use our new authenticated client
        
        // 1. Check for an active order first
        try {
          // This call is now authenticated
          const orderResponse = await apiClient.get('/api/orders/my-order');
          if (orderResponse.data) {
            setActiveOrder(orderResponse.data);
            setView('orderStatus'); // Go straight to tracking
          }
        } catch (orderError) {
          // A 404 "Not Found" error is normal, it just means no active order.
          if (orderError.response && orderError.response.status !== 404) {
             console.log("Could not fetch active order.");
          }
        }
        
        // 2. Fetch the menu from the backend
        // This is now the ONLY source of truth for the menu.
        const menuResponse = await apiClient.get('/api/menu');
        setMenu(menuResponse.data.sort((a, b) => a.id - b.id));

      } catch (err) {
        console.error("Load Data Error:", err);
        Alert.alert('Connection Error', `Could not load data from the server. Please check your backend and reload the app.`);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []); // Runs once on load

  // --- SOCKET.IO INTEGRATION ---
  useEffect(() => {
    prevMessageRef.current = activeOrder?.message;
    // Only track if an order is active AND we are on the status view
    if (!activeOrder?.id || view !== 'orderStatus') return;

    socket.on('connect', () => {
      console.log(`[Socket] Connected. Tracking Order #${activeOrder.id}`);
      socket.emit('trackOrder', activeOrder.id);
    });

    socket.on('order_update', (updatedOrder) => {
      if (updatedOrder.id === activeOrder.id) {
          if (updatedOrder.message !== prevMessageRef.current) {
            Vibration.vibrate(500);
            setNotification(updatedOrder.message);
            setTimeout(() => setNotification(null), 4000);
          }
          setActiveOrder(updatedOrder);
          prevMessageRef.current = updatedOrder.message;
      }
    });

    socket.on('connect_error', (err) => {
      console.log(`[Socket] Connection Error: ${err.message}`);
    });

    // Clean up listeners when component unmounts or view changes
    return () => {
      socket.off('order_update');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [activeOrder?.id, view]);


  // --- Cart and Order Logic (FIXED) ---
  const addToCart = (item) => {
    Vibration.vibrate(50);
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
    setIsLoading(true);
    try {
      const apiClient = await getApiClient(); // Use authenticated client
      
      // Send only the item IDs and quantities, as per your backend's needs
      const orderItems = cart.map(item => ({ id: item.id, quantity: item.quantity }));
      
      const response = await apiClient.post('/api/orders', { items: orderItems });
      
      const newOrder = response.data;
      setActiveOrder(newOrder);
      setView('orderStatus');
      setCart([]);
    } catch (error) {
      console.error("Place Order Error:", error);
      Alert.alert('Error', 'Could not place your order.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // --- View Components (Rendering logic remains the same) ---
  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryItem}>
      <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.categoryImage} />
      <Text style={styles.categoryName}>{item.name}</Text>
    </View>
  );

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.dishImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
        <Text style={styles.itemCategory}>{item.category || 'Cafe Item'}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
        <Text style={styles.addButtonText}>ADD</Text>
      </TouchableOpacity>
    </View>
  );

  const MenuView = () => {
    // Dynamically create the category list from the menu (FIXED)
    const dynamicCategories = menu.reduce((acc, item) => {
      const categoryName = item.category || 'Other Items';
      // Filter out the 'Icon-Asset' category
      if (categoryName !== 'Icon-Asset' && !acc[categoryName]) { 
        acc[categoryName] = { 
          id: categoryName, 
          name: categoryName, 
          image: item.image || '/images/default.png' // Use first item's image
        };
      }
      return acc;
    }, {});
    const categoryList = Object.values(dynamicCategories);
    
    // Group menu items by category (FIXED)
    const groupedMenu = menu.reduce((acc, item) => {
      const category = item.category || 'Other Items';
      // Filter out the 'Icon-Asset' category
      if (category !== 'Icon-Asset') { 
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
      }
      return acc;
    }, {});
    
    if (isLoading) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={{ marginTop: 10 }}>Loading Sagar Cafe Menu...</Text>
          </View>
        );
    }

    return (
      <>
        {/* Top Location Bar and Tabs (UI remains the same) */}
        <View style={styles.topBar}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>📍 Sagar Cafe Location</Text>
            <Text style={styles.locationSubText}>Current: Pune, India</Text>
          </View>
          <TouchableOpacity style={styles.detectLocationButton}>
            <Text style={styles.detectLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.deliveryTabs}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>Dine-in</Text>
            <Text style={styles.tabSubText}>NOW</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Takeaway</Text>
            <Text style={styles.tabSubText}>Ready in 15 mins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Delivery</Text>
            <Text style={styles.tabSubText}>Estimate: 45 mins</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuScrollView}>
          <Text style={styles.cravingText}>What are you craving for?</Text>
          <FlatList
            horizontal
            data={categoryList} // Use dynamic list
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
          />
          <Text style={styles.whatsNewText}>New Arrivals & Specials</Text>
          <FlatList
            horizontal
            data={menu.slice(0, 4)} // Show first 4 items from server
            renderItem={({ item }) => (
              <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.bannerImage} />
            )}
            keyExtractor={(item) => item.id.toString() + '-banner'}
            showsHorizontalScrollIndicator={false}
            style={styles.bannerList}
          />

          {Object.keys(groupedMenu).map(category => (
            <View key={category}>
                <Text style={styles.menuSectionHeader}>{category}</Text>
                <FlatList
                  data={groupedMenu[category]}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderMenuItem}
                  scrollEnabled={false}
                />
            </View>
          ))}
          {/* Add padding at the bottom so the cart overlay doesn't hide content */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </>
    );
  };

  const CartDetailsView = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('menu')}>
          <Text style={[styles.headerText, { fontSize: 18, color: PRIMARY_COLOR }]}>&lt; Back to Menu</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.menuScrollView}>
        <Text style={styles.cartDetailsTitle}>Your Order Summary</Text>
        {cart.map(item => (
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
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.orderButtonText}>PLACE ORDER</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const OrderStatusView = () => {
    if (!activeOrder) return (
        <View style={styles.centered}>
          <Text>No Active Order. Place one now!</Text>
          <TouchableOpacity style={styles.newOrderButton} onPress={() => setView('menu')}>
            <Text style={styles.orderButtonText}>Go to Menu</Text>
          </TouchableOpacity>
        </View>
      );
  
    const statusStyle = styles[`status_${activeOrder.status.toLowerCase()}`] || {};

    return (
      <View style={[styles.statusContainer, statusStyle.container]}>
        <Text style={styles.statusTitle}>Tracking Order #{activeOrder.id}</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />
        <Text style={[styles.statusMessage, statusStyle.text]}>{activeOrder.message}</Text>
        <Text style={styles.statusSubText}>Real-time updates via Socket.io.</Text>
        {['Completed', 'Cancelled'].includes(activeOrder.status) && (
          <TouchableOpacity style={styles.newOrderButton} onPress={() => { setActiveOrder(null); setView('menu'); }}>
            <Text style={[styles.orderButtonText, statusStyle.buttonText]}>Place a New Order</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'menu': return <MenuView />;
      case 'cartDetails': return <CartDetailsView />;
      case 'orderStatus': return <OrderStatusView />;
      default: return <MenuView />;
    }
  };

  // --- Final Render ---
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {notification && (<View style={styles.notificationBanner}><Text style={styles.notificationText}>{notification}</Text></View>)}
        
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          {/* Use the user's name from context */}
          <Text style={styles.profileButtonText}>👤 {user ? user.name : 'Account'}</Text>
        </TouchableOpacity>

        {renderView()}

        {/* Floating Cart Overlay */}
        {cart.length > 0 && view === 'menu' && (
          <View style={styles.floatingCartContainer}>
            <View style={styles.cartSummary}>
              <Text style={styles.cartCountText}>{cart.length} Item(s) in Cart</Text>
              <Text style={styles.cartTotalText}>Total: ₹{totalCost.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.viewCartButton} onPress={() => setView('cartDetails')}>
              <Text style={styles.viewCartButtonText}>VIEW CART</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setView('menu')}><Text style={[styles.navText, view === 'menu' && styles.navActiveText]}>☕ Menu</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setView('orderStatus')}><Text style={[styles.navText, view === 'orderStatus' && styles.navActiveText]}>🧾 Orders</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>🏷️ Offers</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Text style={styles.navText}>👤 Account</Text></TouchableOpacity>
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  menuScrollView: { flex: 1, paddingHorizontal: 0 },
  header: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerText: { color: '#333', fontSize: 20, textAlign: 'center', fontWeight: 'bold' },
  profileButton: {
    position: 'absolute',
    top: 50, // Adjusted for SafeAreaView
    right: 15,
    zIndex: 100,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  profileButtonText: {
      color: PRIMARY_COLOR,
      fontWeight: 'bold',
  },
  topBar: { backgroundColor: PRIMARY_COLOR, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationContainer: { paddingLeft: 10 },
  locationText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  locationSubText: { color: '#f0f0f0', fontSize: 12 },
  detectLocationButton: { backgroundColor: '#fff', padding: 8, borderRadius: 5, marginRight: 10 },
  detectLocationText: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: 14 },
  deliveryTabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: PRIMARY_COLOR },
  tabText: { fontSize: 14, color: '#666', fontWeight: '600' },
  activeTabText: { fontSize: 14, color: PRIMARY_COLOR, fontWeight: 'bold' },
  tabSubText: { fontSize: 10, color: '#999' },
  cravingText: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 15, marginVertical: 15 },
  categoryList: { marginBottom: 15, paddingLeft: 15 },
  categoryItem: { width: 90, alignItems: 'center', marginRight: 10 },
  categoryImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#ccc' },
  categoryName: { fontSize: 12, textAlign: 'center', marginTop: 5, fontWeight: '500' },
  whatsNewText: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 15, marginTop: 5, marginBottom: 10 },
  bannerList: { marginBottom: 20, paddingLeft: 15 },
  bannerImage: { width: 300, height: 150, borderRadius: 8, marginRight: 10, resizeMode: 'cover' },
  menuSectionHeader: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 15, marginTop: 20, marginBottom: 10, color: PRIMARY_COLOR },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white', paddingHorizontal: 15 },
  dishImage: { width: 100, height: 100, borderRadius: 8, marginRight: 15 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  itemPrice: { fontSize: 14, color: '#333' },
  itemCategory: { fontSize: 12, color: '#999' },
  addButton: { 
    backgroundColor: 'white', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 5, 
    borderWidth: 1, 
    borderColor: PRIMARY_COLOR,
    width: 80,
    alignItems: 'center',
  },
  addButtonText: { color: PRIMARY_COLOR, fontWeight: 'bold' },
  floatingCartContainer: {
    backgroundColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 8,
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cartSummary: { flexDirection: 'column' },
  cartCountText: { color: 'white', fontSize: 14 },
  cartTotalText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  viewCartButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  viewCartButtonText: { color: 'white', fontWeight: 'bold' },
  cartDetailsTitle: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 15, marginVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  cartDetailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cartDetailItemName: { flex: 3, fontSize: 16 },
  cartDetailItemQuantity: { flex: 1, textAlign: 'center', fontSize: 16 },
  cartDetailItemPrice: { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: 'bold' },
  cartContainer: { padding: 20, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: 'white' },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  checkoutButton: { backgroundColor: PRIMARY_COLOR, padding: 15, borderRadius: 8 },
  orderButtonText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 5 },
  navItem: { padding: 10, alignItems: 'center' },
  navText: { fontSize: 12, color: '#333' },
  navActiveText: { fontWeight: 'bold', color: PRIMARY_COLOR },
  notificationBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: PRIMARY_COLOR,
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  notificationText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#333' }, 
  statusTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  statusMessage: { fontSize: 20, textAlign: 'center', marginVertical: 20, fontWeight: '500', color: 'white' },
  statusSubText: { fontSize: 14, color: '#f0f0f0', marginTop: 10 },
  newOrderButton: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginTop: 30, width: '80%' },
  status_pending: { container: { backgroundColor: '#f0ad4e' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_queued: { container: { backgroundColor: '#0275d8' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_preparing: { container: { backgroundColor: '#5bc0de' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_ready: { container: { backgroundColor: '#5cb85c' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_completed: { container: { backgroundColor: '#6c757d' }, text: { color: 'white' }, buttonText: { color: '#333' } },
  status_cancelled: { container: { backgroundColor: '#d9534f' }, text: { color: 'white' }, buttonText: { color: '#333' } },
});
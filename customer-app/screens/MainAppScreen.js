// screens/MainAppScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Vibration,
  Alert,
  Platform,
  UIManager,
  TouchableOpacity, // <-- This was the previous fix
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- THIS IS THE CORRECTED IMPORT ---
import API_URL, {
  PRIMARY_COLOR,
  BACKGROUND_COLOR,
  SURFACE_COLOR,
  TEXT_COLOR,
  MUTED_COLOR, // <-- This was the missing import
  SECONDARY_COLOR // <-- Also needed for the cart button
} from '../config';
import { useAuth } from '../AuthContext';

// Import the new components
import { MenuView } from '../components/MenuView';
import { CartDetailsView } from '../components/CartDetailsView';
import { OrderStatusView } from '../components/OrderStatusView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- SOCKET.IO and API CLIENT SETUP ---
const socket = io(API_URL, { transports: ['websocket'] });
const getApiClient = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return axios.create({ baseURL: API_URL, headers: { 'x-auth-token': token } });
};

// --- Main Logic Component ---
export default function MainAppScreen({ navigation }) {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('menu'); // 'menu' | 'cartDetails' | 'orderStatus'
  const [activeOrder, setActiveOrder] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dine-in');

  const { user } = useAuth();
  const prevMessageRef = useRef();

  // Anim values
  const notifyY = useRef(new Animated.Value(-120)).current;
  const cartAnim = useRef(new Animated.Value(0)).current; // bounce

  // Data load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const api = await getApiClient();
        try {
          const r = await api.get('/api/orders/my-order');
          if (r.data) {
            setActiveOrder(r.data);
            setView('orderStatus');
          }
        } catch (e) {
          if (!(e.response && e.response.status === 404)) {
            console.log('Active order check failed');
          }
        }
        const m = await api.get('/api/menu');
        setMenu(m.data.sort((a, b) => a.id - b.id));
      } catch (e) {
        console.error('Load error', e);
        Alert.alert('Connection Error', 'Could not load data from the server.');
      } finally {
        // Add a small delay to show off the shimmer!
        setTimeout(() => setIsLoading(false), 1500);
      }
    };
    load();
  }, []);

  // Socket
  useEffect(() => {
    prevMessageRef.current = activeOrder?.message;
    if (!activeOrder?.id || view !== 'orderStatus') return;

    socket.on('connect', () => {
      console.log(`[Socket] Connected. Tracking Order #${activeOrder.id}`);
      socket.emit('trackOrder', activeOrder.id);
    });

    socket.on('order_update', (updated) => {
      if (updated.id !== activeOrder.id) return;
      if (updated.message !== prevMessageRef.current) {
        Vibration.vibrate(300);
        setNotification(updated.message);
        Animated.timing(notifyY, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
          setTimeout(() => {
            Animated.timing(notifyY, { toValue: -120, duration: 220, useNativeDriver: true }).start(() => {
              setNotification(null);
            });
          }, 3200);
        });
      }
      setActiveOrder(updated);
      prevMessageRef.current = updated.message;
    });

    socket.on('connect_error', (err) => {
      console.log(`[Socket] Connection Error: ${err.message}`);
    });

    return () => {
      socket.off('connect');
      socket.off('order_update');
      socket.off('connect_error');
    };
  }, [activeOrder?.id, view]);

  // Cart bounce on change
  useEffect(() => {
    if (cart.length === 0 || view !== 'menu') return;
    Animated.sequence([
      Animated.timing(cartAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(cartAnim, { toValue: 0, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [cart.length, view]);

  // Actions
  const addToCart = (item) => {
    Vibration.vibrate(40);
    setCart((cur) => {
      const exists = cur.find((c) => c.id === item.id);
      if (exists) return cur.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...cur, { ...item, quantity: 1 }];
    });
  };
  const placeOrder = async () => {
    if (!cart.length) return;
    setIsLoading(true);
    try {
      const api = await getApiClient();
      const items = cart.map((i) => ({ id: i.id, quantity: i.quantity }));
      const r = await api.post('/api/orders', { items });
      setActiveOrder(r.data);
      setView('orderStatus');
      setCart([]);
    } catch (e) {
      console.error('Place order error', e);
      Alert.alert('Error', 'Could not place your order.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const totalCost = cart.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  // --- RENDER SWITCH ---
  const renderView = () => {
    switch (view) {
      case 'menu':
        return (
          <MenuView
            menu={menu}
            isLoading={isLoading}
            user={user}
            navigation={navigation}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            addToCart={addToCart}
          />
        );
      case 'cartDetails':
        return (
          <CartDetailsView
            cart={cart}
            totalCost={totalCost}
            isLoading={isLoading}
            setView={setView}
            placeOrder={placeOrder}
          />
        );
      case 'orderStatus':
        return (
          <OrderStatusView
            activeOrder={activeOrder}
            setView={setView}
            onNewOrder={() => setActiveOrder(null)} 
          />
        );
      default:
        return <MenuView />; // Fallback
    }
  };

  // Floating cart transform
  const cartTranslate = cartAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const cartScale = cartAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Slide-down notification */}
        {notification && (
          <Animated.View style={[styles.notificationBanner, { transform: [{ translateY: notifyY }] }]}>
            <Text style={styles.notificationText}>{notification}</Text>
          </Animated.View>
        )}

        {renderView()}

        {/* Floating Cart */}
        {cart.length > 0 && view === 'menu' && (
          <Animated.View style={[styles.floatingCartContainer, { transform: [{ translateY: cartTranslate }, { scale: cartScale }] }]}>
            <View style={styles.cartSummary}>
              <Text style={styles.cartCountText}>{cart.length} Item(s) in Cart</Text>
              <Text style={styles.cartTotalText}>Total: ₹{totalCost.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.viewCartButton} onPress={() => setView('cartDetails')}>
              <Text style={styles.viewCartButtonText}>VIEW CART</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom nav */}
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

// ---------- STYLES (Dark Mode) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  // Floating cart
  floatingCartContainer: {
    backgroundColor: SURFACE_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    position: 'absolute',
    bottom: 62,
    left: 0,
    right: 0,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  cartSummary: { flexDirection: 'column' },
  cartCountText: { color: MUTED_COLOR, fontSize: 13, opacity: 0.8 },
  cartTotalText: { color: TEXT_COLOR, fontSize: 18, fontWeight: '800' },
  viewCartButton: { backgroundColor: SECONDARY_COLOR, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  viewCartButtonText: { color: TEXT_COLOR, fontWeight: '800' },

  // Bottom nav
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: SURFACE_COLOR, 
    borderTopWidth: 1, 
    borderTopColor: '#333', 
    paddingVertical: 6,
    height: 60,
  },
  navItem: { padding: 10, alignItems: 'center', flex: 1 },
  navText: { fontSize: 12, color: MUTED_COLOR },
  navActiveText: { fontWeight: 'bold', color: SECONDARY_COLOR },

  // Notification
  notificationBanner: { 
    position: 'absolute', 
    top: 0, // Start hidden above screen
    left: 20, 
    right: 20, 
    backgroundColor: SECONDARY_COLOR, 
    padding: 14, 
    borderRadius: 10, 
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  notificationText: { color: TEXT_COLOR, textAlign: 'center', fontWeight: 'bold' },
});
// screens/ProfileScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY_COLOR } from '../config';
import { useAuth } from '../AuthContext';

// ---------- constants ----------
const HEADER_EXPANDED = 220;   // space reserved above content
const AVATAR = 84;

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();

  // ----- scroll-driven animations (transform-only, GPU-friendly) -----
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header parallax (header is absolutely positioned; content has paddingTop)
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -70],   // slide header slightly up
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });
  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -22],
    extrapolate: 'clamp',
  });

  // Entry fade
  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  // Logout bottom sheet
  const [sheet, setSheet] = useState(false);
  const sheetY = useRef(new Animated.Value(300)).current;
  const openSheet = () => {
    setSheet(true);
    Animated.timing(sheetY, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const closeSheet = () =>
    Animated.timing(sheetY, { toValue: 300, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => setSheet(false));

  // Lift effect for list rows
  const LiftRow = ({ icon, title, sub, onPress }) => {
    const v = useRef(new Animated.Value(0)).current;
    const tY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
    const sc = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] });
    return (
      <Animated.View style={{ transform: [{ translateY: tY }, { scale: sc }] }}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPressIn={() => Animated.timing(v, { toValue: 1, duration: 90, useNativeDriver: true }).start()}
          onPressOut={() => Animated.timing(v, { toValue: 0, duration: 110, useNativeDriver: true }).start()}
          onPress={onPress}
          style={styles.row}
        >
          <Text style={styles.rowIcon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{title}</Text>
            {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Data for FlatList (keeps scrolling smooth)
  const sections = useMemo(
    () => ([
      { key: 'hdr', type: 'header' },
      { key: 'section_account', type: 'section', text: 'Account' },
      { key: 'orders', type: 'row', icon: '🧾', title: 'Order History', sub: 'Past orders & invoices' },
      { key: 'offers', type: 'row', icon: '🏷️', title: 'Offers & DineCash', sub: 'Rewards, credits, coupons' },
      { key: 'addresses', type: 'row', icon: '📍', title: 'Saved Addresses', sub: 'Home, office, and more' },
      { key: 'section_prefs', type: 'section', text: 'Preferences' },
      { key: 'noti', type: 'row', icon: '🔔', title: 'Notifications', sub: 'Promos & order updates' },
      { key: 'appearance', type: 'row', icon: '🌗', title: 'Appearance', sub: 'Light / Dark mode' },
      { key: 'logout', type: 'logout' },
      { key: 'spacer', type: 'spacer' },
    ]),
    []
  );

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        // spacer; actual header is absolutely positioned
        return <View style={{ height: HEADER_EXPANDED }} />;
      case 'section':
        return <Text style={styles.sectionTitle}>{item.text}</Text>;
      case 'row':
        return <LiftRow icon={item.icon} title={item.title} sub={item.sub} onPress={() => {}} />;
      case 'logout':
        return (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity onPress={openSheet} activeOpacity={0.92} style={styles.logoutBtn}>
              <Text style={styles.logoutTxt}>LOG OUT</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <View style={{ height: 40 }} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <StatusBar barStyle="light-content" />
      {/* ----- Absolute animated header (no height animation) ----- */}
      <Animated.View style={[styles.headerWrap, { transform: [{ translateY: headerTranslate }], opacity: screenFade }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
          <Animated.Text style={[styles.titleMini, { opacity: titleOpacity }]}>
            {user?.name || 'Customer'}
          </Animated.Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.coverRow}>
          <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }, { translateY: avatarTranslateY }] }]}>
            <Text style={{ fontSize: 34 }}>👤</Text>
          </Animated.View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.nameTxt}>{user?.name || 'Customer'}</Text>
            <Text style={styles.emailTxt}>{user?.email || 'No email'}</Text>
            <Text style={styles.joinTxt}>Joined: November 2025</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>₹200</Text>
            <Text style={styles.statLbl}>DineCash</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>12</Text>
            <Text style={styles.statLbl}>Orders</Text>
          </View>
        </View>
      </Animated.View>

      {/* ----- Scroll content (paddingTop reserves header space) ----- */}
      <Animated.FlatList
        data={sections}
        keyExtractor={(it) => it.key}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 24 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        style={{ opacity: screenFade }}
      />

      {/* ----- Logout bottom sheet (modal) ----- */}
      <Modal transparent visible={sheet} animationType="none" onRequestClose={closeSheet}>
        <Pressable onPress={closeSheet} style={styles.sheetBackdrop}>
          <Pressable onPress={() => {}} style={{ flex: 1 }} />
        </Pressable>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
          <Text style={styles.sheetTitle}>Log out?</Text>
          <Text style={styles.sheetSub}>You’ll need to sign in again to place orders.</Text>
          <View style={styles.sheetRow}>
            <TouchableOpacity onPress={closeSheet} style={[styles.sheetBtn, { backgroundColor: '#e9edf3' }]}>
              <Text style={[styles.sheetBtnTxt, { color: '#333' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { closeSheet(); setTimeout(() => signOut(), 180); }} style={[styles.sheetBtn, { backgroundColor: '#d9534f' }]}>
              <Text style={[styles.sheetBtnTxt, { color: '#fff' }]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  headerWrap: {
    position: 'absolute',
    left: 0, right: 0, top: 0,
    height: HEADER_EXPANDED,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingTop: 6,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  titleMini: { color: 'rgba(255,255,255,0.98)', fontWeight: '800', fontSize: 16 },

  coverRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  avatar: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  nameTxt: { color: '#fff', fontSize: 22, fontWeight: '900' },
  emailTxt: { color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  joinTxt: { color: 'rgba(255,255,255,0.85)', marginTop: 2, fontSize: 12 },

  statsRow: { flexDirection: 'row', marginTop: 16 },
  statCard: {
    flex: 1,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.95)' },

  sectionTitle: { fontSize: 13, color: '#7c8698', fontWeight: '800', paddingHorizontal: 16, marginTop: 12, marginBottom: 6 },

  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef0f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  rowIcon: { fontSize: 20, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: '#15171a' },
  rowSub: { fontSize: 12, color: '#8b95a1', marginTop: 2 },
  rowArrow: { fontSize: 22, color: '#c5c9d2', paddingHorizontal: 6 },

  logoutBtn: { height: 52, backgroundColor: '#d9534f', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoutTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },

  // bottom sheet
  sheetBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#1c1f27',
    padding: 16,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sheetSub: { color: '#c7cbd6', marginTop: 4, marginBottom: 12 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  sheetBtn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetBtnTxt: { fontWeight: '900' },
});

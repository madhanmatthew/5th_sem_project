// components/MenuView.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  Platform,
  UIManager
} from 'react-native';
import API_URL, { PRIMARY_COLOR, SECONDARY_COLOR, BACKGROUND_COLOR, SURFACE_COLOR, TEXT_COLOR, MUTED_COLOR } from '../config';
import { Shimmer } from './Shimmer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HEADER_MAX = 140;
const HEADER_MIN = 64;
const BANNER_HEIGHT = 160;

const PromoSheet = ({ onClose }) => {
  const y = useRef(new Animated.Value(140)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [y]);
  return (
    <Animated.View style={[styles.promoSheet, { transform: [{ translateY: y }] }]}>
      <Text style={styles.promoBadge}>LIMITED OFFER</Text>
      <Text style={styles.promoTitle}>Singles Day Treat!</Text>
      <Text style={styles.promoSubtitle}>Get a FREE* Burger at Sagar's Café</Text>
      <TouchableOpacity style={styles.promoBtn}>
        <Text style={styles.promoBtnTxt}>BOOK NOW</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={styles.promoClose}><Text style={{ color: '#fff' }}>✕</Text></TouchableOpacity>
    </Animated.View>
  );
};

const CategoryChip = ({ item }) => {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  return (
    <Animated.View style={{ transform: [{ scale }], marginRight: 10 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => Animated.timing(press, { toValue: 1, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(press, { toValue: 0, duration: 120, useNativeDriver: true }).start()}
        style={styles.chip}
      >
        <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.chipImg} />
        <Text style={styles.chipText}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MenuCard = ({ item, onAddToCart }) => {
  const lift = useRef(new Animated.Value(0)).current;
  const translate = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] });
  return (
    <Animated.View
      style={[
        styles.menuItem,
        {
          transform: [{ translateY: translate }, { scale }],
          shadowOpacity: lift.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={() => Animated.timing(lift, { toValue: 1, duration: 110, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(lift, { toValue: 0, duration: 160, useNativeDriver: true }).start()}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
        onLongPress={() => onAddToCart(item)}
      >
        <Image source={{ uri: `${API_URL}${item.image}` }} style={styles.dishImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
          <Text style={styles.itemCategory}>{item.category || 'Cafe Item'}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(item)}>
        <Text style={styles.addButtonText}>ADD</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const MenuView = ({ menu, isLoading, user, navigation, activeTab, setActiveTab, addToCart }) => {
  const [promoOpen, setPromoOpen] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(0)).current;
  const tabX = useRef(new Animated.Value(0)).current;
  const bannerIndex = useRef(0);
  const bannerScroll = useRef(null);

  const headerHeight = scrollY.interpolate({ inputRange: [0, HEADER_MAX - HEADER_MIN], outputRange: [HEADER_MAX, HEADER_MIN], extrapolate: 'clamp' });
  const headerTitleOpacity = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' });
  const searchScale = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0.94], extrapolate: 'clamp' });
  const searchTranslate = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, -6], extrapolate: 'clamp' });

  useEffect(() => { Animated.timing(screenFade, { toValue: 1, duration: 350, useNativeDriver: true }).start(); }, []);

  const banners = useMemo(() => menu.slice(0, 5), [menu]);
  useEffect(() => {
    if (!banners.length) return;
    const id = setInterval(() => {
      bannerIndex.current = (bannerIndex.current + 1) % banners.length;
      if (bannerScroll?.current) {
        bannerScroll.current.scrollTo({ x: bannerIndex.current * 320, y: 0, animated: true });
      }
    }, 3000);
    return () => clearInterval(id);
  }, [banners.length]);

  const tabMap = { 'Dine-in': 0, 'Takeaway': 1, 'Delivery': 2 };
  const onChangeTab = (t) => {
    setActiveTab(t);
    Animated.timing(tabX, { toValue: tabMap[t], duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  };

  const dynamicCategories = useMemo(() => {
    const acc = {};
    menu.forEach((item) => {
      const c = item.category || 'Other Items';
      if (c !== 'Icon-Asset' && !acc[c]) acc[c] = { id: c, name: c, image: item.image || '/images/default.png' };
    });
    return Object.values(acc);
  }, [menu]);

  const groupedMenu = useMemo(() => {
    return menu.reduce((acc, item) => {
      const c = item.category || 'Other Items';
      if (c === 'Icon-Asset') return acc;
      if (!acc[c]) acc[c] = [];
      acc[c].push(item);
      return acc;
    }, {});
  }, [menu]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
        <View style={{ paddingTop: 40, paddingHorizontal: 16, backgroundColor: PRIMARY_COLOR, height: HEADER_MAX }}>
          <Shimmer style={{ height: 44, borderRadius: 12, marginTop: 40 }} />
        </View>
        <View style={{ padding: 16 }}>
          <Shimmer style={{ height: BANNER_HEIGHT, borderRadius: 12 }} />
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Shimmer key={i} style={{ width: 90, height: 36, borderRadius: 20, marginRight: 10 }} />
          ))}
        </View>
        <View style={{ paddingTop: 10 }}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Shimmer style={{ height: 110, borderRadius: 12 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <Animated.View style={[styles.headerWrap, { height: headerHeight }]}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>Sagar's Café</Text>
          <TouchableOpacity style={styles.accBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.accText}>👤 {user?.name || 'Account'}</Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={[styles.searchBar, { transform: [{ scale: searchScale }, { translateY: searchTranslate }] }]}>
          <Text style={styles.searchIcon}>🔎</Text>
          <Text style={styles.searchPlaceholder}>Search for dishes & cafés</Text>
        </Animated.View>
        <Animated.Text style={[styles.pinTitle, { opacity: headerTitleOpacity }]}>
          Pune • DineCash ₹200
        </Animated.Text>
      </Animated.View>

      <View style={styles.tabsRow}>
        {['Dine-in', 'Takeaway', 'Delivery'].map((t) => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => onChangeTab(t)}>
            <Text style={[styles.tabTxt, activeTab === t && styles.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.indicatorTrack}>
          <Animated.View
            style={[
              styles.indicator,
              { left: tabX.interpolate({ inputRange: [0, 1, 2], outputRange: ['5%', '38%', '71%'] }) },
            ]}
          />
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        style={{ flex: 1, opacity: screenFade, backgroundColor: BACKGROUND_COLOR }}
      >
        {promoOpen && (
          <PromoSheet onClose={() => setPromoOpen(false)} />
        )}

        {!!banners.length && (
          <View style={{ paddingVertical: 12 }}>
            <ScrollView
              ref={bannerScroll}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {banners.map((b) => (
                <Image key={b.id} source={{ uri: `${API_URL}${b.image}` }} style={styles.banner} />
              ))}
            </ScrollView>
            <View style={styles.pagerRow}>
              {banners.map((_, i) => {
                const active = i === (bannerIndex.current % banners.length);
                return <View key={i} style={[styles.dot, active && styles.dotActive]} />;
              })}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Explore by category</Text>
        <FlatList
          horizontal
          data={dynamicCategories}
          renderItem={({ item }) => <CategoryChip item={item} />}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
        />

        {Object.keys(groupedMenu).map((cat) => (
          <View key={cat} style={{ paddingTop: 2 }}>
            <Text style={styles.menuSectionHeader}>{cat}</Text>
            <FlatList
              data={groupedMenu[cat]}
              keyExtractor={(i) => i.id.toString()}
              renderItem={({ item }) => <MenuCard item={item} onAddToCart={addToCart} />}
              scrollEnabled={false}
            />
          </View>
        ))}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </>
  );
};

// Styles for MenuView (Dark Mode)
const styles = StyleSheet.create({
  headerWrap: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  brand: { color: TEXT_COLOR, fontSize: 22, fontWeight: '800' },
  accBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  accText: { color: TEXT_COLOR, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_COLOR,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  searchIcon: { fontSize: 16, color: MUTED_COLOR },
  searchPlaceholder: { marginLeft: 8, color: MUTED_COLOR },
  pinTitle: { position: 'absolute', right: 16, bottom: 8, color: 'rgba(255,255,255,0.7)' },
  tabsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY_COLOR, paddingVertical: 8, paddingHorizontal: 16, borderBottomColor: '#333', borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabTxt: { color: MUTED_COLOR, fontWeight: '600' },
  tabTxtActive: { color: SECONDARY_COLOR },
  indicatorTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#333' },
  indicator: { position: 'absolute', width: '24%', height: 3, backgroundColor: SECONDARY_COLOR, borderRadius: 2 },
  banner: { width: 320, height: BANNER_HEIGHT, borderRadius: 12, marginRight: 12, resizeMode: 'cover' },
  pagerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555', marginHorizontal: 3 },
  dotActive: { backgroundColor: SECONDARY_COLOR },
  promoSheet: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1c1f27',
    overflow: 'hidden',
  },
  promoBadge: { color: SECONDARY_COLOR, fontWeight: 'bold', marginBottom: 6 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  promoSubtitle: { color: '#d8dde6', marginTop: 2, marginBottom: 12 },
  promoBtn: { backgroundColor: SECONDARY_COLOR, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  promoBtnTxt: { color: TEXT_COLOR, fontWeight: '800' },
  promoClose: { position: 'absolute', right: 10, top: 10, padding: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', paddingHorizontal: 16, marginTop: 10, marginBottom: 8, color: TEXT_COLOR },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE_COLOR, paddingHorizontal: 12, height: 36, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  chipImg: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  chipText: { fontWeight: '600', color: TEXT_COLOR },
  deliveryNotice: { backgroundColor: '#333', padding: 14, marginHorizontal: 16, marginVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#555' },
  deliveryNoticeText: { color: MUTED_COLOR, textAlign: 'center' },
  menuSectionHeader: { fontSize: 20, fontWeight: '800', paddingHorizontal: 16, marginTop: 16, marginBottom: 8, color: SECONDARY_COLOR },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: SURFACE_COLOR,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  dishImage: { width: 100, height: 100, borderRadius: 10, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: TEXT_COLOR },
  itemPrice: { fontSize: 14, color: TEXT_COLOR },
  itemCategory: { fontSize: 12, color: MUTED_COLOR, marginTop: 2 },
  addButton: { backgroundColor: SECONDARY_COLOR, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: TEXT_COLOR, fontWeight: '800' },
});
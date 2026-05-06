import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, Platform, Dimensions,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import LandmarkCard from '../components/LandmarkCard';
import RouteTab from '../components/RouteTab';
import { getNearbyLandmarks, getDistance } from '../services/placesService';
import { announce, stopSpeaking } from '../services/speechService';
import {
  ANNOUNCEMENT_COOLDOWN_MS,
  LOCATION_UPDATE_INTERVAL_MS,
  REFETCH_DISTANCE_THRESHOLD_M,
  GOOGLE_PLACES_API_KEY,
} from '../config';

const MAP_HEIGHT = Dimensions.get('window').height * 0.44;

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'route'
  const [isTracking, setIsTracking] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('Tap Start to begin detecting landmarks');
  const [loading, setLoading] = useState(false);
  const [showRecenter, setShowRecenter] = useState(false);
  const [apiKeySet] = useState(GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY_HERE');

  const mapRef = useRef(null);
  const locationSub = useRef(null);
  const announced = useRef(new Map());
  const lastFetchPos = useRef(null);
  // Use a ref so the location callback always reads the latest value without stale closure
  const centeredRef = useRef(true);

  const animateTo = useCallback((latitude, longitude) => {
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 },
      600,
    );
  }, []);

  const fetchAndAnnounce = useCallback(async (lat, lng) => {
    try {
      const results = await getNearbyLandmarks(lat, lng);
      const withDist = results
        .map((p) => ({
          ...p,
          distance: getDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
        }))
        .sort((a, b) => a.distance - b.distance);

      setLandmarks(withDist);

      const now = Date.now();
      for (const place of withDist) {
        const last = announced.current.get(place.place_id);
        if (!last || now - last > ANNOUNCEMENT_COOLDOWN_MS) {
          announced.current.set(place.place_id, now);
          const dist =
            place.distance < 1000
              ? `${Math.round(place.distance)} meters`
              : `${(place.distance / 1000).toFixed(1)} kilometers`;
          const note = place.editorial_summary?.overview
            ? ` — ${place.editorial_summary.overview}`
            : '';
          announce(`Landmark nearby: ${place.name}, ${dist} away${note}`);
          break;
        }
      }
    } catch (err) {
      console.warn('Landmark fetch failed:', err.message);
    }
  }, []);

  const startTracking = async () => {
    if (!apiKeySet) {
      Alert.alert(
        'API Key Needed',
        'Open src/config.js and replace YOUR_GOOGLE_PLACES_API_KEY_HERE with your real Google Places API key.',
      );
      return;
    }

    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required to detect nearby landmarks.');
      return;
    }

    setLoading(true);
    setStatus('Getting your location…');
    setIsTracking(true);
    centeredRef.current = true;
    setShowRecenter(false);

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 50,
        timeInterval: LOCATION_UPDATE_INTERVAL_MS,
      },
      async ({ coords: { latitude, longitude } }) => {
        setLoading(false);
        setStatus('Tracking • listening for landmarks…');
        setUserLocation({ latitude, longitude });

        if (centeredRef.current) {
          animateTo(latitude, longitude);
        }

        const moved =
          !lastFetchPos.current ||
          getDistance(
            latitude, longitude,
            lastFetchPos.current.lat, lastFetchPos.current.lng,
          ) > REFETCH_DISTANCE_THRESHOLD_M;

        if (moved) {
          lastFetchPos.current = { lat: latitude, lng: longitude };
          fetchAndAnnounce(latitude, longitude);
        }
      },
    );
  };

  const stopTracking = () => {
    locationSub.current?.remove();
    locationSub.current = null;
    stopSpeaking();
    setIsTracking(false);
    setLandmarks([]);
    setUserLocation(null);
    setStatus('Tap Start to begin detecting landmarks');
    setShowRecenter(false);
    announced.current.clear();
    lastFetchPos.current = null;
  };

  const recenter = () => {
    if (userLocation) {
      animateTo(userLocation.latitude, userLocation.longitude);
      centeredRef.current = true;
      setShowRecenter(false);
    }
  };

  useEffect(() => () => locationSub.current?.remove(), []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <Text style={styles.title}>Landmark Guide</Text>
        {!apiKeySet && (
          <Text style={styles.apiWarning}>
            ⚠️ Add your Google Places API key in src/config.js
          </Text>
        )}
        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'live' && styles.tabActive]}
            onPress={() => setActiveTab('live')}
          >
            <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
              📍 Live Tracking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'route' && styles.tabActive]}
            onPress={() => setActiveTab('route')}
          >
            <Text style={[styles.tabText, activeTab === 'route' && styles.tabTextActive]}>
              🗺️ Route Summary
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Route Summary Tab ── */}
      {activeTab === 'route' && <RouteTab />}

      {/* ── Live Tracking Tab ── */}
      {activeTab === 'live' && <>

      {/* ── Map ── */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          onPanDrag={() => {
            centeredRef.current = false;
            if (isTracking) setShowRecenter(true);
          }}
        >
          {landmarks.map((place) => (
            <Marker
              key={place.place_id}
              coordinate={{
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              }}
              pinColor="#007AFF"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{place.name}</Text>
                  {place.editorial_summary?.overview ? (
                    <Text style={styles.calloutDesc} numberOfLines={3}>
                      {place.editorial_summary.overview}
                    </Text>
                  ) : null}
                  {place.distance != null && (
                    <Text style={styles.calloutDist}>
                      {place.distance < 1000
                        ? `${Math.round(place.distance)} m away`
                        : `${(place.distance / 1000).toFixed(1)} km away`}
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Loading badge */}
        {loading && (
          <View style={styles.mapBadge}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.mapBadgeText}>Acquiring location…</Text>
          </View>
        )}

        {/* Re-center button */}
        {showRecenter && (
          <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
            <Text style={styles.recenterIcon}>⊙</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Landmark list ── */}
      <View style={styles.listArea}>
        <Text style={styles.statusLine}>{status}</Text>
        {landmarks.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>
              {landmarks.length} landmark{landmarks.length !== 1 ? 's' : ''} within range
            </Text>
            <FlatList
              data={landmarks}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => <LandmarkCard landmark={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isTracking
                ? '🗺️  Move around — landmarks will appear here'
                : '📍  Start tracking to discover nearby landmarks'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Footer button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, isTracking ? styles.btnStop : styles.btnStart]}
          onPress={isTracking ? stopTracking : startTracking}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {isTracking ? '⏹  Stop Tracking' : '▶  Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      </>}  {/* end live tab */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4ff' },

  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  apiWarning: { fontSize: 12, color: '#FFD60A', marginTop: 4, fontWeight: '600' },

  tabs: {
    flexDirection: 'row', marginTop: 12,
    backgroundColor: '#0d0d1e', borderRadius: 10, padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#aab4d4' },
  tabTextActive: { color: '#fff' },

  mapWrap: { height: MAP_HEIGHT },

  mapBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mapBadgeText: { fontSize: 12, color: '#333' },

  recenterBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterIcon: { fontSize: 22, color: '#007AFF' },

  callout: { width: 210, padding: 8 },
  calloutName: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  calloutDesc: { fontSize: 12, color: '#555', lineHeight: 16, marginBottom: 4 },
  calloutDist: { fontSize: 11, fontWeight: '600', color: '#007AFF' },

  listArea: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  statusLine: { fontSize: 12, color: '#888', marginBottom: 6 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  footer: { padding: 14, paddingBottom: 28 },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnStart: { backgroundColor: '#007AFF' },
  btnStop: { backgroundColor: '#FF3B30' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

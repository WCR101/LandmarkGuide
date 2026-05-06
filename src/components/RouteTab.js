import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import { fetchRouteSummary } from '../services/routeService';
import RouteLandmarkCard from './RouteLandmarkCard';

export default function RouteTab() {
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null); // { landmarks, totalDistance, totalDuration, destinationAddress }
  const [error, setError] = useState(null);

  const getSummary = async () => {
    const dest = destination.trim();
    if (!dest) {
      Alert.alert('Enter a destination', 'Type an address or place name to get your route summary.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to plan a route.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await fetchRouteSummary(loc.coords, dest);
      setSummary(result);
    } catch (err) {
      setError(err.message || 'Something went wrong. Check your API key and destination.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Where are you going?"
          placeholderTextColor="#aaa"
          value={destination}
          onChangeText={setDestination}
          onSubmitEditing={getSummary}
          returnKeyType="search"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.goBtn, loading && styles.goBtnDisabled]}
          onPress={getSummary}
          disabled={loading}
        >
          <Text style={styles.goBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Mapping your route…</Text>
          <Text style={styles.loadingSubtext}>Scanning for landmarks along the way</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary */}
      {summary && !loading && (
        <>
          {/* Route info banner */}
          <View style={styles.routeBanner}>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{summary.totalDistance}</Text>
              <Text style={styles.routeStatLabel}>Distance</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{summary.totalDuration}</Text>
              <Text style={styles.routeStatLabel}>Drive time</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.routeStat, { flex: 2 }]}>
              <Text style={styles.routeStatValue} numberOfLines={1}>{summary.destinationAddress}</Text>
              <Text style={styles.routeStatLabel}>Destination</Text>
            </View>
          </View>

          {summary.landmarks.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>🛣️</Text>
              <Text style={styles.emptyText}>No tourist landmarks found along this route.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>
                {summary.landmarks.length} landmark{summary.landmarks.length !== 1 ? 's' : ''} along your route
              </Text>
              <FlatList
                data={summary.landmarks}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item, index }) => (
                  <RouteLandmarkCard
                    landmark={item}
                    index={index}
                    isLast={index === summary.landmarks.length - 1}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              />
            </>
          )}
        </>
      )}

      {/* Empty state before any search */}
      {!loading && !error && !summary && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>Enter your destination to see what landmarks you'll pass on the way.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },

  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1a1a2e',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  goBtn: {
    backgroundColor: '#007AFF', borderRadius: 12,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  goBtnDisabled: { opacity: 0.5 },
  goBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  routeBanner: {
    flexDirection: 'row', backgroundColor: '#1a1a2e',
    borderRadius: 14, padding: 14, marginBottom: 14,
    alignItems: 'center',
  },
  routeStat: { flex: 1, alignItems: 'center' },
  routeStatValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  routeStatLabel: { fontSize: 11, color: '#aab4d4' },
  divider: { width: 1, height: 32, backgroundColor: '#2e3a5a', marginHorizontal: 8 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  loadingText: { fontSize: 17, fontWeight: '600', color: '#333', marginTop: 14 },
  loadingSubtext: { fontSize: 13, color: '#888', marginTop: 4 },

  errorIcon: { fontSize: 44, marginBottom: 12 },
  errorText: { fontSize: 14, color: '#c0392b', textAlign: 'center', lineHeight: 20 },

  emptyIcon: { fontSize: 56, marginBottom: 14 },
  emptyText: { fontSize: 15, color: '#777', textAlign: 'center', lineHeight: 22 },
});

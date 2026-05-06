import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TYPE_ICON = {
  museum: '🏛️',
  church: '⛪',
  mosque: '🕌',
  park: '🌳',
  stadium: '🏟️',
  university: '🎓',
  zoo: '🦁',
  aquarium: '🐠',
  art_gallery: '🖼️',
  tourist_attraction: '📸',
};

function iconForTypes(types = []) {
  for (const t of types) {
    if (TYPE_ICON[t]) return TYPE_ICON[t];
  }
  return '📍';
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export default function LandmarkCard({ landmark }) {
  const icon = iconForTypes(landmark.types);
  const summary = landmark.editorial_summary?.overview;

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{landmark.name}</Text>
        {summary ? (
          <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
        ) : null}
        {landmark.distance != null ? (
          <Text style={styles.distance}>{formatDistance(landmark.distance)}</Text>
        ) : null}
        {landmark.rating ? (
          <Text style={styles.rating}>★ {landmark.rating.toFixed(1)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 34, marginRight: 12, marginTop: 2 },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  summary: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 4 },
  distance: { fontSize: 12, fontWeight: '600', color: '#007AFF' },
  rating: { fontSize: 12, color: '#f5a623', marginTop: 2 },
});

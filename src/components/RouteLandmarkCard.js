import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TYPE_ICON = {
  museum: '🏛️', church: '⛪', mosque: '🕌', park: '🌳',
  stadium: '🏟️', university: '🎓', zoo: '🦁', aquarium: '🐠',
  art_gallery: '🖼️', tourist_attraction: '📸',
};

function iconForTypes(types = []) {
  for (const t of types) if (TYPE_ICON[t]) return TYPE_ICON[t];
  return '📍';
}

export default function RouteLandmarkCard({ landmark, index, isLast }) {
  const icon = iconForTypes(landmark.types);
  const km = (landmark.distFromStart / 1000).toFixed(1);
  const summary = landmark.editorial_summary?.overview;

  return (
    <View style={styles.row}>
      {/* Timeline column */}
      <View style={styles.timeline}>
        <View style={styles.dot}>
          <Text style={styles.dotNum}>{index + 1}</Text>
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{landmark.name}</Text>
          {summary ? (
            <Text style={styles.desc} numberOfLines={2}>{summary}</Text>
          ) : null}
          <Text style={styles.km}>~{km} km from start</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 4 },
  timeline: { width: 30, alignItems: 'center' },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
  },
  dotNum: { color: '#fff', fontSize: 11, fontWeight: '700' },
  line: { flex: 1, width: 2, backgroundColor: '#c8d8f8', marginVertical: 3 },
  card: {
    flex: 1, flexDirection: 'row',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 11, marginLeft: 8, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 26, marginRight: 10, marginTop: 1 },
  body: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  desc: { fontSize: 12, color: '#666', lineHeight: 16, marginBottom: 3 },
  km: { fontSize: 11, fontWeight: '600', color: '#007AFF' },
});

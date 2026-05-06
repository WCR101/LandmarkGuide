# Landmark Guide
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Original Concept & Vision

This application was conceived and invented by Caitlin Connor-Royer and Dale Royer. All credit for the original idea, concept, and vision belongs entirely to them.

Software development was contributed separately and does not claim ownership of the underlying concept, idea, or intellectual property.

Caitlin Connor-Royer & Dale Royer — Original Inventors

Wes Roddie — Software Developer

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
A React Native (Expo) iOS/Android app that detects nearby landmarks as you drive or walk and announces them aloud — like turn-by-turn navigation, but for points of interest.

## Features

- **Live Tracking** — tracks your GPS and speaks landmark names + descriptions as you approach them
- **Map View** — shows your live position (blue dot) and nearby landmark pins you can tap for details
- **Route Summary** — enter a destination before you leave and see every landmark along the way in order
- **Voice Announcements** — text-to-speech alerts as you pass museums, parks, monuments, and more
- Works alongside Apple Maps, Google Maps, Waze, or any other navigation app

## Screenshots

> Add screenshots here once the app is running.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Google API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project and enable these two APIs:
   - **Places API**
   - **Directions API**
3. Go to **Credentials → Create API Key** and copy it

### 3. Add your API key

Open `src/config.js` and replace the placeholder:

```js
export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY_HERE';
```

### 4. Install Expo Go on your phone

Download **Expo Go** from the App Store (iOS) or Google Play (Android).

### 5. Run the app

```bash
npx expo start
```

Scan the QR code with your iPhone camera (or the Expo Go app on Android). Your phone and PC must be on the same Wi-Fi network.

## Project Structure

```
LandmarkGuide/
├── App.js                        # Entry point
├── src/
│   ├── config.js                 # API key + tunable settings
│   ├── screens/
│   │   └── HomeScreen.js         # Main screen with tabs
│   ├── services/
│   │   ├── placesService.js      # Google Places API + distance math
│   │   ├── routeService.js       # Google Directions + route landmark scan
│   │   └── speechService.js      # Text-to-speech queue
│   └── components/
│       ├── LandmarkCard.js       # Card shown in live tracking list
│       ├── RouteLandmarkCard.js  # Timeline card shown in route summary
│       └── RouteTab.js           # Route Summary tab UI
```

## Configuration

Edit `src/config.js` to tune behavior:

| Setting | Default | Description |
|---|---|---|
| `LANDMARK_RADIUS_METERS` | 500 | Radius to search for landmarks around your position |
| `LOCATION_UPDATE_INTERVAL_MS` | 10000 | How often GPS updates (ms) |
| `ANNOUNCEMENT_COOLDOWN_MS` | 300000 | Wait before re-announcing the same landmark (5 min) |
| `REFETCH_DISTANCE_THRESHOLD_M` | 100 | Minimum movement before re-querying Places |

## Tech Stack

- [Expo](https://expo.dev) / React Native
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) — GPS tracking
- [expo-speech](https://docs.expo.dev/versions/latest/sdk/speech/) — text-to-speech
- [react-native-maps](https://github.com/react-native-maps/react-native-maps) — map view
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) — landmark data
- [Google Directions API](https://developers.google.com/maps/documentation/directions) — route planning

## Publishing to the App Store

When you're ready to publish, you'll need a Mac with Xcode to build the iOS binary, or use [EAS Build](https://docs.expo.dev/build/introduction/) (Expo's cloud build service) which works from Windows.

## License

MIT

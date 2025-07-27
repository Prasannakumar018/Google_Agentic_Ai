import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, {
  Callout,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { LocationService } from "../services/locationService";
import { MoodEvent } from "../services/types";

const mobileMapData: MoodEvent[] = [
  // Same data as above
  {
    sentiment: 6,
    category: "Traffic",
    title: "Traffic Jam on MG Road",
    description:
      "Heavy traffic reported on MG Road due to ongoing construction.",
    location: "MG Road, Bangalore",
    startTime: "2023-10-01T10:00:00Z",
    endTime: "2023-10-01T12:00:00Z",
    media: {
      altText: "Traffic congestion",
      url: "https://picsum.photos/200/200",
    },
    truthnessScore: 0.8,
    author: "Sike",
    source: "Instagram",
  },
];

function sentimentToColor(score: number): string {
  if (score === 0) return "#808080";
  if (score <= 3) return "#ff4444";
  if (score <= 6) return "#ffaa00";
  if (score <= 8) return "#44ff44";
  return "#00ff00";
}

function sentimentToEmoji(score: number): string {
  if (score === 0) return "❔";
  if (score <= 3) return "😢";
  if (score <= 6) return "😐";
  if (score <= 8) return "😊";
  return "😁";
}

export default function MobileMap() {
  const [processedEvents, setProcessedEvents] = useState<MoodEvent[]>([]);
  const [locationService] = useState(
    () => new LocationService(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "")
  );

  useEffect(() => {
    processLocationData();
  }, []);

  const processLocationData = async () => {
    const processed = await Promise.all(
      mobileMapData.map(async (event) => {
        try {
          const geoData = await locationService.geocodeLocation(event.location);
          return {
            ...event,
            lat: geoData.lat,
            lng: geoData.lng,
            bounds: geoData.bounds,
            placeId: geoData.placeId,
            areaType: geoData.areaType,
          };
        } catch (error) {
          console.error(`Error processing location: ${event.location}`, error);
          return event;
        }
      })
    );
    setProcessedEvents(processed);
  };

  const renderMoodArea = (event: MoodEvent, index: number) => {
    if (!event.lat || !event.lng) return null;

    const color = sentimentToColor(event.sentiment);
    const emoji = sentimentToEmoji(event.sentiment);

    if (event.bounds && event.areaType !== "point") {
      const { northeast, southwest } = event.bounds;
      const coordinates = [
        { latitude: northeast.lat, longitude: southwest.lng },
        { latitude: northeast.lat, longitude: northeast.lng },
        { latitude: southwest.lat, longitude: northeast.lng },
        { latitude: southwest.lat, longitude: southwest.lng },
      ];

      return (
        <React.Fragment key={`area-${index}`}>
          <Polygon
            coordinates={coordinates}
            fillColor={color + "4D"} // 30% opacity
            strokeColor={color}
            strokeWidth={2}
          />
          <Marker coordinate={{ latitude: event.lat, longitude: event.lng }}>
            <Text style={{ fontSize: 32 }}>{emoji}</Text>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{event.title}</Text>
                <Text style={styles.calloutText}>
                  Category: {event.category}
                </Text>
                <Text style={styles.calloutText}>{event.description}</Text>
                <Text style={styles.calloutText}>
                  Location: {event.location}
                </Text>
                <Text style={styles.calloutText}>
                  Area Type: {event.areaType || "point"}
                </Text>
                <Text style={styles.calloutText}>
                  Sentiment: {event.sentiment} {emoji}
                </Text>
                <Text style={styles.calloutText}>
                  Author: {event.author} via {event.source}
                </Text>
              </View>
            </Callout>
          </Marker>
        </React.Fragment>
      );
    } else {
      return (
        <Marker
          key={`point-${index}`}
          coordinate={{ latitude: event.lat, longitude: event.lng }}
        >
          <Text style={{ fontSize: 32 }}>{emoji}</Text>
          <Callout>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{event.title}</Text>
              <Text style={styles.calloutText}>Category: {event.category}</Text>
              <Text style={styles.calloutText}>{event.description}</Text>
              <Text style={styles.calloutText}>Location: {event.location}</Text>
              <Text style={styles.calloutText}>
                Sentiment: {event.sentiment} {emoji}
              </Text>
              <Text style={styles.calloutText}>
                Author: {event.author} via {event.source}
              </Text>
            </View>
          </Callout>
        </Marker>
      );
    }
  };

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      // showsBuildings={true}
      // pitchEnabled={true}
      // camera={{
      //   center: {
      //     latitude: 37.78825,
      //     longitude: -122.4324,
      //   },
      //   pitch: 60,
      //   heading: 0,
      //   altitude: 1000,
      //   zoom: 15,
      // }}
    >
      {processedEvents.map((event, idx) => renderMoodArea(event, idx))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  callout: {
    width: 250,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 12,
    marginBottom: 3,
  },
});

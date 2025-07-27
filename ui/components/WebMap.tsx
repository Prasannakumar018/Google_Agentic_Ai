import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
import React, { useEffect, useState } from "react";
import { LocationService } from "../services/locationService";
import { MoodEvent } from "../services/types";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const moodData: MoodEvent[] = [
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
  {
    sentiment: 8,
    category: "Events",
    title: "Street Festival in Koramangala",
    description: "Amazing street food festival happening this weekend!",
    location: "Koramangala, Bangalore",
    startTime: "2023-10-01T18:00:00Z",
    endTime: "2023-10-01T23:00:00Z",
    media: {
      altText: "Street festival",
      url: "https://picsum.photos/200/200",
    },
    truthnessScore: 0.9,
    author: "FoodLover",
    source: "Twitter",
  },
];

function sentimentToColor(score: number): string {
  if (score === 0) return "#808080"; // Gray
  if (score <= 3) return "#ff4444"; // Red
  if (score <= 6) return "#ffaa00"; // Orange
  if (score <= 8) return "#44ff44"; // Green
  return "#00ff00"; // Bright green
}

function sentimentToEmoji(score: number): string {
  if (score === 0) return "❔";
  if (score <= 3) return "😢";
  if (score <= 6) return "😐";
  if (score <= 8) return "😊";
  return "😁";
}

export default function WebMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey:
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
    libraries: [],
  });

  const [selectedEvent, setSelectedEvent] = useState<MoodEvent | null>(null);
  const [processedEvents, setProcessedEvents] = useState<MoodEvent[]>([]);
  const [locationService] = useState(
    () => new LocationService(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "")
  );

  useEffect(() => {
    if (isLoaded) {
      processLocationData();
    }
  }, [isLoaded]);

  const processLocationData = async () => {
    const processed = await Promise.all(
      moodData.map(async (event) => {
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
          return event; // Return original event if geocoding fails
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
      // Render as polygon for areas
      const { northeast, southwest } = event.bounds;
      const polygonPaths = [
        { lat: northeast.lat, lng: southwest.lng },
        { lat: northeast.lat, lng: northeast.lng },
        { lat: southwest.lat, lng: northeast.lng },
        { lat: southwest.lat, lng: southwest.lng },
      ];

      return (
        <React.Fragment key={`area-${index}`}>
          <Polygon
            paths={polygonPaths}
            options={{
              fillColor: color,
              fillOpacity: 0.3,
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
            onClick={() => setSelectedEvent(event)}
          />
          {/* Center marker with emoji */}
          <MarkerF
            position={{ lat: event.lat, lng: event.lng }}
            label={{
              text: emoji,
              fontSize: "24px",
            }}
            onClick={() => setSelectedEvent(event)}
          />
        </React.Fragment>
      );
    } else {
      // Render as circle for points
      return (
        <React.Fragment key={`point-${index}`}>
          <MarkerF
            position={{ lat: event.lat, lng: event.lng }}
            label={{
              text: emoji,
              fontSize: "24px",
            }}
            onClick={() => setSelectedEvent(event)}
          />
        </React.Fragment>
      );
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={{ lat: 12.9716, lng: 77.5946 }}
      zoom={12}
    >
      {processedEvents.map((event, idx) => renderMoodArea(event, idx))}

      {selectedEvent && selectedEvent.lat && selectedEvent.lng && (
        <InfoWindowF
          position={{ lat: selectedEvent.lat, lng: selectedEvent.lng }}
          onCloseClick={() => setSelectedEvent(null)}
        >
          <div style={{ maxWidth: 250 }}>
            <h3>{selectedEvent.title}</h3>
            <p>
              <strong>Category:</strong> {selectedEvent.category}
            </p>
            <p>
              <strong>Description:</strong> {selectedEvent.description}
            </p>
            <p>
              <strong>Location:</strong> {selectedEvent.location}
            </p>
            <p>
              <strong>Area Type:</strong> {selectedEvent.areaType || "point"}
            </p>
            <p>
              <strong>Time:</strong> <br />
              {new Date(selectedEvent.startTime).toLocaleString()} –<br />
              {new Date(selectedEvent.endTime).toLocaleString()}
            </p>
            <p>
              <strong>Truth Score:</strong> {selectedEvent.truthnessScore}{" "}
              <br />
              <strong>Sentiment:</strong> {selectedEvent.sentiment}{" "}
              {sentimentToEmoji(selectedEvent.sentiment)}
            </p>
            <p>
              <strong>Author:</strong> {selectedEvent.author} via{" "}
              {selectedEvent.source}
            </p>
            <img
              src={selectedEvent.media.url}
              alt={selectedEvent.media.altText}
              style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
            />
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}

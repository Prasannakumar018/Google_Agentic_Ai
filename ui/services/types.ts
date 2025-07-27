export type MoodEvent = {
  lat?: number; // Optional since we might get location string instead
  lng?: number;
  sentiment: number;
  category: string;
  title: string;
  description: string;
  location: string; // This is what we'll primarily use
  startTime: string;
  endTime: string;
  media: {
    altText: string;
    url: string;
  };
  truthnessScore: number;
  author: string;
  source: string;
  // Additional fields for area rendering
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  placeId?: string;
  areaType?: "point" | "area" | "route";
};

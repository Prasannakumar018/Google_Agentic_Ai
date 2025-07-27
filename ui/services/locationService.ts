export class LocationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocodeLocation(locationString: string): Promise<{
    lat: number;
    lng: number;
    bounds?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    placeId: string;
    areaType: "point" | "area" | "route";
  }> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          locationString
        )}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        const bounds = result.geometry.bounds || result.geometry.viewport;

        // Determine if this is a point, area, or route based on geometry type
        let areaType: "point" | "area" | "route" = "point";

        if (bounds) {
          const latDiff = bounds.northeast.lat - bounds.southwest.lat;
          const lngDiff = bounds.northeast.lng - bounds.southwest.lng;

          // If the bounds are significant, treat as area
          if (latDiff > 0.001 || lngDiff > 0.001) {
            areaType = result.types.includes("route") ? "route" : "area";
          }
        }

        return {
          lat: location.lat,
          lng: location.lng,
          bounds: bounds
            ? {
                northeast: bounds.northeast,
                southwest: bounds.southwest,
              }
            : undefined,
          placeId: result.place_id,
          areaType,
        };
      }

      throw new Error("No results found");
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  }

  // Generate heatmap points for an area
  generateHeatmapPoints(
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    },
    intensity: number = 1,
    density: number = 10
  ): Array<{ lat: number; lng: number; weight: number }> {
    const points = [];
    const { northeast, southwest } = bounds;

    const latStep = (northeast.lat - southwest.lat) / density;
    const lngStep = (northeast.lng - southwest.lng) / density;

    for (let i = 0; i <= density; i++) {
      for (let j = 0; j <= density; j++) {
        points.push({
          lat: southwest.lat + latStep * i,
          lng: southwest.lng + lngStep * j,
          weight: intensity * (0.5 + Math.random() * 0.5), // Add some randomness
        });
      }
    }

    return points;
  }
}

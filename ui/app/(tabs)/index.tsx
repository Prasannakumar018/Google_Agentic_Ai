// Map.tsx
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function Map() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    async function loadComponent() {
      if (Platform.OS === "web") {
        console.log("Loading WebMap component...");
        // Use a dynamic import for web
        // Ensure the path is correct based on your project structure
        const { default: WebMap } = await import("../../components/WebMap"); // Adjust path if needed
        setComponent(() => WebMap);
      } else {
        console.log("Loading MobileMap component...");
        // For mobile, also use dynamic import to be safe
        // Ensure the path is correct based on your project structure
        const { default: MobileMap } = await import(
          "../../components/MobileMap"
        ); // Adjust path if needed
        setComponent(() => MobileMap);
      }
    }
    loadComponent();
  }, []);

  if (!Component) {
    // You might want to show a loading indicator here
    return null; // Or <Text>Loading Map...</Text> from react-native if on mobile, <div>Loading Map...</div> on web
  }

  return <Component />;
}

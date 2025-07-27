import { ThemedText } from "@/components/ThemedText";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const NAV_ITEMS = [
  { label: "Map", route: "/(tabs)/map" },
  { label: "Feed", route: "/(tabs)/feed" },
  { label: "Profile", route: "/(tabs)/profile" },
];

export function FloatingNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.floatingNavbar}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.replace(item.route as any)}
            style={styles.navButton}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.navItem, isActive && styles.activeNavItem]}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingNavbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 32,
    marginHorizontal: 24,
    paddingVertical: 12,
    shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
  },
  navItem: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    opacity: 0.7,
  },
  activeNavItem: {
    color: "#007AFF",
    opacity: 1,
  },
});

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude react-native-maps from web bundles
config.resolver.platforms = ["ios", "android", "native", "web"];

// Add platform-specific resolver for web
const originalResolverResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    // Return a stub for react-native-maps on web
    return {
      filePath: require.resolve("./MapWebStub.js"),
      type: "sourceFile",
    };
  }

  if (originalResolverResolveRequest) {
    return originalResolverResolveRequest(context, moduleName, platform);
  }

  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });

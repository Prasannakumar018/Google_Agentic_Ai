import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import React from "react";
import { ActivityIndicator } from "react-native";

const LoaderScreen = ({ message = "Loading..." }) => (
  <Center style={{ flex: 1 }}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{ marginTop: 16 }}>{message}</Text>
  </Center>
);

export default LoaderScreen;

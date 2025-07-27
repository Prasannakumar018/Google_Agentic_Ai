import LoaderScreen from "@/components/LoaderScreen";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput } from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    // Simple validation, replace with real auth
    if (username && password) {
      setError("");
      setShowLoader(true);
      setTimeout(() => {
        router.replace("/interests");
      }, 2000);
    } else {
      setError("Please enter username and password.");
    }
  };

  if (showLoader) {
    return <LoaderScreen message="Logging in..." />;
  }

  return (
    <Center style={{ flex: 1, padding: 24 }}>
      <Heading size="3xl" style={{ marginBottom: 24 }}>
        Welcome
      </Heading>
      <Text style={{ marginBottom: 16 }}>Please log in to continue</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
          width: "100%",
        }}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
          width: "100%",
        }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? (
        <Text style={{ color: "red", marginBottom: 12 }}>{error}</Text>
      ) : null}
      <Button onPress={handleLogin} style={{ width: "100%" }}>
        <ButtonText>Login</ButtonText>
      </Button>
    </Center>
  );
}

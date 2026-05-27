import { Stack } from "expo-router";

export default function GruposLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="checkin"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}

import { Stack } from "expo-router";
import React from "react";

export default function GruposLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="checkin"
        options={{ presentation: "modal", gestureEnabled: true }}
      />
    </Stack>
  );
}

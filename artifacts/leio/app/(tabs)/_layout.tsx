import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="biblioteca">
        <Icon sf={{ default: "books.vertical", selected: "books.vertical.fill" }} />
        <Label>Biblioteca</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sessao">
        <Icon sf={{ default: "play.circle", selected: "play.circle.fill" }} />
        <Label>Sessão</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="badges">
        <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
        <Label>Conquistas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grupos">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Grupos</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: isWeb ? 0 : safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.card },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "house.fill" : "house"}
                tintColor={color}
                size={18}
              />
            ) : (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={18}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{
          title: "Biblioteca",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "books.vertical.fill" : "books.vertical"}
                tintColor={color}
                size={18}
              />
            ) : (
              <Ionicons
                name={focused ? "library" : "library-outline"}
                size={18}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="sessao"
        options={{
          title: "Sessão",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "play.circle.fill" : "play.circle"}
                tintColor={color}
                size={32}
              />
            ) : (
              <Ionicons
                name={focused ? "play-circle" : "play-circle-outline"}
                size={32}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: "Conquistas",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "trophy.fill" : "trophy"}
                tintColor={color}
                size={18}
              />
            ) : (
              <Ionicons
                name={focused ? "trophy" : "trophy-outline"}
                size={18}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="grupos"
        options={{
          title: "Grupos",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "person.2.fill" : "person.2"}
                tintColor={color}
                size={18}
              />
            ) : (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={18}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ href: null }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

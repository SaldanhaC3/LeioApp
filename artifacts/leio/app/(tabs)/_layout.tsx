import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { startQuickSession } from "@/utils/startSession";

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
        <Label>Ler</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grupos">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Grupos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
      {/* Conquistas saem da barra: acessíveis pelo Perfil. */}
      <NativeTabs.Trigger name="badges" hidden />
    </NativeTabs>
  );
}

/**
 * Botão central "Ler": leitura em 1 toque. Com um livro em andamento, abre a
 * sessão direto na página atual; sem livro, leva ao seletor de sessão.
 */
function CenterReadButton({ tintColor, focused }: { tintColor?: string; focused?: boolean }) {
  const { getCurrentBook, settings } = useApp();

  const handlePress = () => {
    const current = getCurrentBook();
    if (current) {
      startQuickSession(current, settings.ambientDefault);
    } else {
      router.push("/sessao");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Iniciar leitura"
      style={styles.centerButtonWrap}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name={focused ? "play.circle.fill" : "play.circle"}
          tintColor={tintColor}
          size={32}
        />
      ) : (
        <Ionicons
          name={focused ? "play-circle" : "play-circle-outline"}
          size={32}
          color={tintColor}
        />
      )}
    </Pressable>
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
          title: "Ler",
          tabBarButton: (props) => (
            <CenterReadButton
              tintColor={colors.mutedForeground}
              focused={props.accessibilityState?.selected}
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
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "person.crop.circle.fill" : "person.crop.circle"}
                tintColor={color}
                size={18}
              />
            ) : (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={18}
                color={color}
              />
            ),
        }}
      />
      {/* Conquistas continuam acessíveis (via Perfil), mas fora da barra. */}
      <Tabs.Screen name="badges" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  centerButtonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

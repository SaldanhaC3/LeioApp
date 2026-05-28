import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export interface AuthProfile {
  id: string;
  email: string;
  username: string | null;
  handle: string | null;
  avatarUrl: string | null;
  xp: number;
  folego: number;
}

export interface AuthContextType {
  user: AuthProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<AuthProfile, "username" | "handle" | "avatarUrl">>
  ) => Promise<{ error?: string }>;
  uploadAvatar: (uri: string) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, handle, avatar_url, xp, folego")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    email: "",
    username: data.username ?? null,
    handle: data.handle ?? null,
    avatarUrl: data.avatar_url ?? null,
    xp: data.xp ?? 0,
    folego: data.folego ?? 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          if (profile) {
            setUser({ ...profile, email: session.user.email ?? "" });
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email ?? "",
              username: null,
              handle: null,
              avatarUrl: null,
              xp: 0,
              folego: 0,
            });
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(
          profile
            ? { ...profile, email: session.user.email ?? "" }
            : {
                id: session.user.id,
                email: session.user.email ?? "",
                username: null,
                handle: null,
                avatarUrl: null,
                xp: 0,
                folego: 0,
              }
        );
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = makeRedirectUri({
      scheme: "leio",
      path: "auth-callback",
    });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === "success") {
      await supabase.auth.exchangeCodeForSession(result.url);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<AuthProfile, "username" | "handle" | "avatarUrl">>
    ): Promise<{ error?: string }> => {
      if (!user) return { error: "Not authenticated" };
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...(updates.username !== undefined && { username: updates.username }),
        ...(updates.handle !== undefined && { handle: updates.handle }),
        ...(updates.avatarUrl !== undefined && {
          avatar_url: updates.avatarUrl,
        }),
      });
      if (error) return { error: error.message };
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
      return {};
    },
    [user]
  );

  const uploadAvatar = useCallback(
    async (uri: string): Promise<string | null> => {
      if (!user) return null;
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `${user.id}/avatar_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filename, blob, { contentType: "image/jpeg", upsert: true });
        if (uploadError) return null;
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filename);
        return data.publicUrl;
      } catch {
        return null;
      }
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profile = await fetchProfile(user.id);
    if (profile) setUser({ ...profile, email: user.email });
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOut,
        updateProfile,
        uploadAvatar,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

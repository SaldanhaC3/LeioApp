/**
 * SyncBridge: sits inside both AuthProvider and AppProvider.
 * Triggers a background sync to Supabase whenever the app is loaded
 * and the user is authenticated.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { syncAll } from "@/services/supabaseSync";

export function SyncBridge() {
  const { user } = useAuth();
  const { books, sessions, highlights, vocabulary, xp, folego, isLoaded } = useApp();
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !isLoaded) return;

    // Debounce: at most one sync per 30 seconds
    const now = Date.now();
    if (now - lastSyncRef.current < 30_000) return;
    lastSyncRef.current = now;

    syncAll(user.id, { books, sessions, highlights, vocabulary, xp, folego }).catch(
      (err) => console.warn("[SyncBridge]", err)
    );
  }, [user, isLoaded]);

  return null;
}

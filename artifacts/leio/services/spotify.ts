import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const SPOTIFY_CLIENT_ID =
  process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
export const SPOTIFY_ENABLED = SPOTIFY_CLIENT_ID.length > 0;

const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
];

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const TOKEN_KEY = "leio:spotify:tokens";

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface NowPlaying {
  trackId: string;
  track: string;
  artist: string;
  albumArt?: string;
  energy?: number;
  valence?: number;
  durationMs: number;
  progressMs: number;
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
        (globalThis as { localStorage: Storage }).localStorage.setItem(key, value);
      }
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
        return (globalThis as { localStorage: Storage }).localStorage.getItem(key);
      }
    } catch {}
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageDel(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
        (globalThis as { localStorage: Storage }).localStorage.removeItem(key);
      }
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

export async function saveTokens(t: SpotifyTokens): Promise<void> {
  await storageSet(TOKEN_KEY, JSON.stringify(t));
}

export async function loadTokens(): Promise<SpotifyTokens | null> {
  const raw = await storageGet(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await storageDel(TOKEN_KEY);
}

export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: "leio",
    path: "spotify-callback",
  });
}

export async function startAuthFlow(): Promise<SpotifyTokens | null> {
  if (!SPOTIFY_ENABLED) return null;
  try {
    const redirectUri = getRedirectUri();
    const request = new AuthSession.AuthRequest({
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    });
    await request.makeAuthUrlAsync(DISCOVERY);
    const result = await request.promptAsync(DISCOVERY);
    if (result.type !== "success" || !result.params.code) return null;
    const codeVerifier = request.codeVerifier;
    if (!codeVerifier) return null;
    return await exchangeCodeForToken(result.params.code, codeVerifier, redirectUri);
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<SpotifyTokens | null> {
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: codeVerifier,
    }).toString();
    const res = await fetch(DISCOVERY.tokenEndpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tokens: SpotifyTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    await saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

async function refreshAccessToken(
  refreshToken: string
): Promise<SpotifyTokens | null> {
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID,
    }).toString();
    const res = await fetch(DISCOVERY.tokenEndpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tokens: SpotifyTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    await saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const t = await loadTokens();
  if (!t) return null;
  if (Date.now() < t.expiresAt - 60_000) return t.accessToken;
  const refreshed = await refreshAccessToken(t.refreshToken);
  return refreshed?.accessToken ?? null;
}

async function fetchAudioFeatures(
  token: string,
  trackId: string
): Promise<{ energy?: number; valence?: number }> {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/audio-features/${trackId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    return { energy: data.energy, valence: data.valence };
  } catch {
    return {};
  }
}

export async function fetchNowPlaying(): Promise<NowPlaying | null> {
  const token = await getValidAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 204 || !res.ok) return null;
    const data = await res.json();
    if (!data?.item || !data.is_playing) return null;
    const trackId: string = data.item.id;
    const track: string = data.item.name;
    const artist: string = (data.item.artists ?? [])
      .map((a: { name: string }) => a.name)
      .join(", ");
    const albumArt: string | undefined = data.item.album?.images?.[0]?.url;
    const durationMs: number = data.item.duration_ms ?? 0;
    const progressMs: number = data.progress_ms ?? 0;
    const features = await fetchAudioFeatures(token, trackId);
    return {
      trackId,
      track,
      artist,
      albumArt,
      durationMs,
      progressMs,
      ...features,
    };
  } catch {
    return null;
  }
}

async function playerCommand(
  method: "PUT" | "POST",
  endpoint: string
): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.status === 204 || res.status === 202 || res.ok;
  } catch {
    return false;
  }
}

export async function spotifyPause(): Promise<boolean> {
  return playerCommand("PUT", "pause");
}

export async function spotifyPlay(): Promise<boolean> {
  return playerCommand("PUT", "play");
}

export async function spotifyNext(): Promise<boolean> {
  return playerCommand("POST", "next");
}

export async function spotifyPrevious(): Promise<boolean> {
  return playerCommand("POST", "previous");
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Derive a 2-stop dark gradient from energy + valence.
// Valence -> hue (warm yellow when happy, cool blue when sad)
// Energy  -> saturation/brightness (bigger when intense)
export function deriveGradient(
  energy?: number,
  valence?: number
): [string, string] {
  const e = typeof energy === "number" ? energy : 0.5;
  const v = typeof valence === "number" ? valence : 0.5;
  const hue = Math.round(220 - 170 * v);
  const sat = Math.round(28 + 38 * e);
  const light1 = Math.round(7 + 6 * e);
  const light2 = Math.round(3 + 3 * e);
  return [hsl(hue, sat, light1), hsl((hue + 30) % 360, Math.max(20, sat - 15), light2)];
}

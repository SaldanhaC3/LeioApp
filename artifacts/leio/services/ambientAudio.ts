import { Audio } from "expo-av";

export type AmbientId = "cafe" | "rain" | "library" | "forest" | "fireplace" | "none";

const AMBIENT_ASSETS: Record<string, number> = {
  cafe: require("@/assets/audio/cafe.wav"),
  rain: require("@/assets/audio/rain.wav"),
  library: require("@/assets/audio/library.wav"),
  forest: require("@/assets/audio/forest.wav"),
  fireplace: require("@/assets/audio/fireplace.wav"),
};

let currentSound: Audio.Sound | null = null;
let currentAmbientId: string | null = null;

export async function startAmbient(ambientId: AmbientId): Promise<void> {
  if (ambientId === "none") {
    await stopAmbient();
    return;
  }
  if (currentAmbientId === ambientId && currentSound) return;

  await stopAmbient();

  const asset = AMBIENT_ASSETS[ambientId];
  if (!asset) return;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(asset, {
      isLooping: true,
      volume: 0.45,
    });
    currentSound = sound;
    currentAmbientId = ambientId;
    await sound.playAsync();
  } catch {
    currentSound = null;
    currentAmbientId = null;
  }
}

export async function pauseAmbient(): Promise<void> {
  try {
    if (currentSound) await currentSound.pauseAsync();
  } catch {
    // silent
  }
}

export async function resumeAmbient(): Promise<void> {
  try {
    if (currentSound) await currentSound.playAsync();
  } catch {
    // silent
  }
}

export async function stopAmbient(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }
  } catch {
    // silent
  } finally {
    currentSound = null;
    currentAmbientId = null;
  }
}

export async function setAmbientVolume(volume: number): Promise<void> {
  try {
    if (currentSound) await currentSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
  } catch {
    // silent
  }
}

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
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(asset, {
      isLooping: true,
      volume: 0.45,
    });
    currentSound = sound;
    currentAmbientId = ambientId;
    await sound.playAsync();
  } catch (err) {
    console.error("[ambientAudio] startAmbient error:", err);
    currentSound = null;
    currentAmbientId = null;
  }
}

export async function pauseAmbient(): Promise<void> {
  try {
    if (currentSound) await currentSound.pauseAsync();
  } catch (err) {
    console.error("[ambientAudio] pauseAmbient error:", err);
  }
}

export async function resumeAmbient(): Promise<void> {
  try {
    if (currentSound) await currentSound.playAsync();
  } catch (err) {
    console.error("[ambientAudio] resumeAmbient error:", err);
  }
}

export async function stopAmbient(): Promise<void> {
  const sound = currentSound;
  currentSound = null;
  currentAmbientId = null;
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
  } catch (err) {
    console.error("[ambientAudio] stopAmbient error:", err);
  }
}

export async function setAmbientVolume(volume: number): Promise<void> {
  try {
    if (currentSound) await currentSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
  } catch (err) {
    console.error("[ambientAudio] setAmbientVolume error:", err);
  }
}

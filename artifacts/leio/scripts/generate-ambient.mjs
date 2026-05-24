/**
 * Generates loopable ambient WAV files for the Leio app.
 * Run: node scripts/generate-ambient.mjs
 * Output: assets/audio/*.wav
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../assets/audio");
mkdirSync(OUT, { recursive: true });

const SAMPLE_RATE = 22050;
const DURATION = 12; // seconds — long enough to feel smooth when looping
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

/** Write a 16-bit mono PCM WAV file */
function writeWav(path, samples) {
  const data = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    data[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
  }
  const dataBytes = data.buffer;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataBytes.byteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(dataBytes.byteLength, 40);
  writeFileSync(path, Buffer.concat([header, Buffer.from(dataBytes)]));
  console.log(`  ✓ ${path.split("/").at(-1)} (${(dataBytes.byteLength / 1024).toFixed(0)} KB)`);
}

/** Fade-in + fade-out crossfade to make seamless loop */
function applyLoopFade(samples, fadeSamples = SAMPLE_RATE * 0.4) {
  const out = new Float32Array(samples);
  for (let i = 0; i < fadeSamples; i++) {
    const t = i / fadeSamples;
    out[i] *= t;
    out[out.length - 1 - i] *= t;
  }
  return out;
}

function whiteNoise(n = NUM_SAMPLES) {
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = Math.random() * 2 - 1;
  return s;
}

/** Brown/Brownian noise — richer low-frequency character */
function brownNoise(n = NUM_SAMPLES) {
  const s = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    s[i] = last * 3.5;
  }
  return s;
}

/** Pink noise — mix of white and brown */
function pinkNoise(n = NUM_SAMPLES) {
  const white = whiteNoise(n);
  const brown = brownNoise(n);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = white[i] * 0.45 + brown[i] * 0.55;
  return s;
}

/** Simple IIR low-pass filter */
function lowPass(samples, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  }
  return out;
}

/** High-pass filter */
function highPass(samples, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SAMPLE_RATE;
  const alpha = rc / (rc + dt);
  const out = new Float32Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = alpha * (out[i - 1] + samples[i] - samples[i - 1]);
  }
  return out;
}

function normalize(samples, target = 0.72) {
  let max = 0;
  for (const s of samples) if (Math.abs(s) > max) max = Math.abs(s);
  if (max === 0) return samples;
  const out = new Float32Array(samples.length);
  const scale = target / max;
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * scale;
  return out;
}

function mix(a, b, ratioA = 0.5) {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] * ratioA + b[i] * (1 - ratioA);
  return out;
}

console.log("Generating ambient sounds...");

// 1. CHUVA (Rain) — white noise filtered to mid-high frequencies
{
  let s = whiteNoise();
  s = highPass(s, 200);
  s = lowPass(s, 6000);
  // Layered second texture for depth
  let s2 = whiteNoise();
  s2 = lowPass(s2, 2000);
  s2 = highPass(s2, 100);
  s = mix(s, s2, 0.6);
  s = normalize(s, 0.7);
  s = applyLoopFade(s);
  writeWav(join(OUT, "rain.wav"), s);
}

// 2. CAFÉ — brown noise (crowd murmur) + light pink texture
{
  let crowd = brownNoise();
  crowd = highPass(crowd, 120);
  crowd = lowPass(crowd, 800);
  let texture = pinkNoise();
  texture = lowPass(texture, 400);
  let s = mix(crowd, texture, 0.7);
  s = normalize(s, 0.6);
  s = applyLoopFade(s);
  writeWav(join(OUT, "cafe.wav"), s);
}

// 3. FLORESTA (Forest) — pink noise (wind through leaves) + brown undertone
{
  let leaves = pinkNoise();
  leaves = highPass(leaves, 300);
  leaves = lowPass(leaves, 4000);
  let wind = brownNoise();
  wind = lowPass(wind, 500);
  let s = mix(leaves, wind, 0.65);
  s = normalize(s, 0.65);
  s = applyLoopFade(s);
  writeWav(join(OUT, "forest.wav"), s);
}

// 4. LAREIRA (Fireplace) — brown noise crackling texture
{
  let base = brownNoise();
  base = highPass(base, 60);
  base = lowPass(base, 1200);
  // Add occasional "crackle" spikes
  let crackle = whiteNoise();
  crackle = highPass(crackle, 800);
  for (let i = 0; i < crackle.length; i++) {
    // Suppress most of the crackle, keep only occasional peaks
    crackle[i] = Math.abs(crackle[i]) > 0.85 ? crackle[i] * 0.5 : 0;
  }
  let s = new Float32Array(NUM_SAMPLES);
  for (let i = 0; i < NUM_SAMPLES; i++) s[i] = base[i] * 0.8 + crackle[i] * 0.2;
  s = normalize(s, 0.68);
  s = applyLoopFade(s);
  writeWav(join(OUT, "fireplace.wav"), s);
}

// 5. BIBLIOTECA (Library) — very soft brown noise (HVAC hum) + subtle pink
{
  let hum = brownNoise();
  hum = highPass(hum, 40);
  hum = lowPass(hum, 200);
  let presence = pinkNoise();
  presence = lowPass(presence, 600);
  presence = highPass(presence, 150);
  let s = mix(hum, presence, 0.6);
  s = normalize(s, 0.45); // quieter — library!
  s = applyLoopFade(s);
  writeWav(join(OUT, "library.wav"), s);
}

console.log("Done.");

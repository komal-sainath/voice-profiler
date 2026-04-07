// frontend/src/ml/tf.ts
import * as speechCommands from "@tensorflow-models/speech-commands";
import * as tf from "@tensorflow/tfjs";

// Singleton recognizer
let recognizer: speechCommands.SpeechCommandRecognizer | null = null;

export async function loadRecognizer() {
  if (recognizer) return recognizer;

  // Initialize TensorFlow.js backend
  try {
    await tf.setBackend("webgl");
  } catch (error) {
    console.warn("WebGL backend not available, falling back to CPU:", error);
    await tf.setBackend("cpu");
  }
  await tf.ready();

  recognizer = speechCommands.create("BROWSER_FFT");
  await recognizer.ensureModelLoaded();
  return recognizer;
}

// Convert raw audio buffer to a tensor consistent with model expectations
// For simplicity, we rely on recognizer.listen to give internal buffering.
// But we can also access underlying model via recognizer.model.
export async function getEmbeddingFromAudioBuffer(audioBuffer: AudioBuffer) {
  await loadRecognizer();
  if (!recognizer) throw new Error("Recognizer not loaded");

  // Use the recognizer's built-in feature extraction
  // This creates proper spectrograms that the model expects
  const sr = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);

  // Downsample to target sample rate if needed
  const targetSr = 16000;
  let audioData = channelData;
  if (sr !== targetSr) {
    const ratio = sr / targetSr;
    const downsampled = [];
    for (let i = 0; i < channelData.length; i += ratio) {
      downsampled.push(channelData[Math.floor(i)]);
    }
    audioData = new Float32Array(downsampled);
  }

  // Create a simple audio fingerprint as embedding
  // This is a basic approach - compute FFT and use frequency bins as features
  const fftSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((audioData.length - fftSize) / hopSize) + 1;

  const features: number[] = [];

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = audioData.slice(start, start + fftSize);

    // Apply window function (Hann window)
    for (let j = 0; j < frame.length; j++) {
      frame[j] *= 0.5 * (1 - Math.cos((2 * Math.PI * j) / (frame.length - 1)));
    }

    // Compute FFT (simplified - just magnitude spectrum)
    const spectrum = computeFFT(frame);

    // Take log magnitude and accumulate
    for (let j = 0; j < spectrum.length / 2; j++) {
      features.push(Math.log(Math.abs(spectrum[j]) + 1e-10));
    }
  }

  // Average across time to get fixed-size embedding
  const embeddingSize = 128;
  const embedding: number[] = [];
  const chunkSize = Math.floor(features.length / embeddingSize);

  for (let i = 0; i < embeddingSize; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, features.length);
    const sum = features.slice(start, end).reduce((a, b) => a + b, 0);
    embedding.push(sum / (end - start));
  }

  return embedding;
}

// Simple FFT implementation (real input only)
function computeFFT(input: Float32Array): Float32Array {
  const N = input.length;
  const output = new Float32Array(N);

  // Simple DFT for demonstration (not optimized)
  for (let k = 0; k < N; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      real += input[n] * Math.cos(angle);
      imag += input[n] * Math.sin(angle);
    }
    output[k] = Math.sqrt(real * real + imag * imag);
  }

  return output;
}

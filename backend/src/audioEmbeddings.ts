/**
 * Audio Embedding Module
 * Ports the FFT-based embedding extraction from frontend to backend
 * Handles WAV file parsing, downsampling, and FFT-based feature extraction
 */

/**
 * Parse WAV file buffer and extract PCM samples with sample rate
 */
function parseWAV(buffer: Buffer): {
  samples: Float32Array;
  sampleRate: number;
} {
  // Check for RIFF header
  if (
    buffer[0] !== 0x52 || // 'R'
    buffer[1] !== 0x49 || // 'I'
    buffer[2] !== 0x46 || // 'F'
    buffer[3] !== 0x46 // 'F'
  ) {
    throw new Error("Invalid WAV file: missing RIFF header");
  }

  // Read sample rate (bytes 24-27, little-endian)
  const sampleRate = buffer.readUInt32LE(24);

  // Read bits per sample (bytes 34-35, little-endian)
  const bitsPerSample = buffer.readUInt16LE(34);

  // Read number of channels (bytes 8-9, little-endian)
  const numChannels = buffer.readUInt16LE(8);

  // Find the 'data' subchunk
  let dataStart = -1;
  let dataSize = 0;

  for (let i = 0; i < buffer.length - 8; i++) {
    if (
      buffer[i] === 0x64 && // 'd'
      buffer[i + 1] === 0x61 && // 'a'
      buffer[i + 2] === 0x74 && // 't'
      buffer[i + 3] === 0x61 // 'a'
    ) {
      dataStart = i + 8;
      dataSize = buffer.readUInt32LE(i + 4);
      break;
    }
  }

  if (dataStart === -1) {
    throw new Error("Invalid WAV file: no data chunk found");
  }

  // Extract PCM samples
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = dataSize / (bytesPerSample * numChannels);
  const samples = new Float32Array(numSamples);

  // Read samples from first channel
  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    const offset = dataStart + i * bytesPerSample * numChannels;

    if (bitsPerSample === 16) {
      sample = buffer.readInt16LE(offset);
      sample = sample / 32768; // Normalize 16-bit to [-1, 1]
    } else if (bitsPerSample === 8) {
      sample = buffer.readUInt8(offset);
      sample = (sample - 128) / 128; // Normalize 8-bit unsigned to [-1, 1]
    } else {
      throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
    }

    samples[i] = sample;
  }

  return { samples, sampleRate };
}

/**
 * Downsample audio to target sample rate using linear interpolation
 */
function downsample(
  samples: Float32Array,
  originalSr: number,
  targetSr: number,
): Float32Array {
  if (originalSr === targetSr) return samples;

  const ratio = originalSr / targetSr;
  const newLength = Math.ceil(samples.length / ratio);
  const downsampled = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const index = Math.floor(pos);
    const frac = pos - index;

    // Linear interpolation
    if (index + 1 < samples.length) {
      downsampled[i] = samples[index] * (1 - frac) + samples[index + 1] * frac;
    } else {
      downsampled[i] = samples[index];
    }
  }

  return downsampled;
}

/**
 * Simple FFT implementation (real input only, returns magnitude spectrum)
 * This is the same algorithm used in the frontend
 */
function computeFFT(input: Float32Array): Float32Array {
  const N = input.length;
  const output = new Float32Array(N);

  // Simple DFT - Discrete Fourier Transform
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

/**
 * Extract 128-dimensional embedding from audio samples
 * Uses FFT-based feature extraction matching the frontend algorithm
 */
function extractEmbedding(samples: Float32Array): number[] {
  const fftSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((samples.length - fftSize) / hopSize) + 1;

  const features: number[] = [];

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = samples.slice(start, start + fftSize);

    // Apply Hann window
    for (let j = 0; j < frame.length; j++) {
      frame[j] *= 0.5 * (1 - Math.cos((2 * Math.PI * j) / (frame.length - 1)));
    }

    // Compute FFT and get magnitude spectrum
    const spectrum = computeFFT(frame);

    // Take log magnitude of first half (positive frequencies)
    for (let j = 0; j < spectrum.length / 2; j++) {
      features.push(Math.log(Math.abs(spectrum[j]) + 1e-10));
    }
  }

  // Average across time to get fixed-size 128-D embedding
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

/**
 * Main function: extract embedding from raw audio file buffer
 * Expects WAV format (as produced by browser MediaRecorder)
 */
export function getEmbeddingFromAudio(audioBuffer: Buffer): number[] {
  // Parse WAV file
  const { samples, sampleRate } = parseWAV(audioBuffer);

  // Downsample to 16kHz if needed (matching frontend behavior)
  const targetSr = 16000;
  const downsampled = downsample(samples, sampleRate, targetSr);

  // Extract 128-D embedding using FFT
  const embedding = extractEmbedding(downsampled);

  return embedding;
}

/**
 * Audio conversion utilities
 * Converts audio blobs to WAV format for backend processing
 */

/**
 * Extend Window interface to include webkit AudioContext
 */
interface WebKitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Decode audio blob to PCM samples using Web Audio API
 */
async function decodeBlobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (
    window.AudioContext || (window as WebKitWindow).webkitAudioContext!
  )();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  // Get audio data from first channel
  const channelData = audioBuffer.getChannelData(0);

  // WAV file format: PCM 16-bit
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  writeString(8, "WAVE");

  // fmt sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * blockAlign, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample

  // data sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true); // Data size

  // Write audio samples (mono, convert float to 16-bit PCM)
  let index = 44;
  for (let i = 0; i < length; i++) {
    // Clamp and convert float [-1, 1] to 16-bit PCM [-32768, 32767]
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    const pcmValue = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(index, Math.round(pcmValue), true);
    index += 2;
  }

  return buffer;
}

/**
 * Convert audio blob to WAV format and return as blob
 */
export async function blobToWAV(blob: Blob): Promise<Blob> {
  try {
    const audioBuffer = await decodeBlobToAudioBuffer(blob);
    const wavBuffer = audioBufferToWAV(audioBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch (error) {
    console.error("Error converting audio to WAV:", error);
    throw new Error("Failed to process audio file. Please try again.");
  }
}

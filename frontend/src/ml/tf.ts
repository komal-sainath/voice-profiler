// frontend/src/ml/tf.ts
import * as speechCommands from "@tensorflow-models/speech-commands";
import * as tf from "@tensorflow/tfjs";

// Singleton recognizer
let recognizer: speechCommands.SpeechCommandRecognizer | null = null;

export async function loadRecognizer() {
  if (recognizer) return recognizer;
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

  // Create spectrogram from audioBuffer
  // The speechCommands package expects internal microphone stream.
  // Alternative: use feature extraction through recognizer to get spectrogram.
  // Here, we hack a simple approach: use the underlying model on MFCCs-like features.
  // Fallback: use averaged logits as a proxy embedding.

  const sr = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const tensor = tf.tensor(channelData); // 1D waveform

  // Downsample to ~16kHz if needed
  const targetSr = 16000;
  if (sr !== targetSr) {
    const ratio = sr / targetSr;
    const downsampled = tf.tidy(() => {
      const indices = tf.range(0, channelData.length, ratio).floor().toInt();
      return tf.gather(tensor, indices);
    });
    tensor.dispose();
    const ds = downsampled as tf.Tensor1D;
    const normalized: tf.Tensor<tf.Rank.R1> = tf.div(
      ds,
      tf.scalar(ds.abs().max().dataSync()[0] || 1)
    );
    const padded = padOrTrim(normalized, targetSr); // 1 second window
    const logits = recognizer!.model.predict(
      padded.reshape([1, targetSr, 1])
    ) as tf.Tensor;
    const embedding = tf.tidy(() => tf.mean(logits, 1)); // [1, features]
    const arr = Array.from(embedding.dataSync());
    ds.dispose();
    normalized.dispose();
    padded.dispose();
    logits.dispose();
    embedding.dispose();
    return arr;
  } else {
    const normalized: tf.Tensor<tf.Rank.R1> = tf.div(
      tensor,
      tf.scalar(tensor.abs().max().dataSync()[0] || 1)
    );
    const padded = padOrTrim(normalized, targetSr);
    const logits = recognizer!.model.predict(
      padded.reshape([1, targetSr, 1])
    ) as tf.Tensor;
    const embedding = tf.tidy(() => tf.mean(logits, 1));
    const arr = Array.from(embedding.dataSync());
    tensor.dispose();
    normalized.dispose();
    padded.dispose();
    logits.dispose();
    embedding.dispose();
    return arr;
  }
}

function padOrTrim(wave: tf.Tensor1D, length: number) {
  const size = wave.shape[0];
  if (size > length) {
    return wave.slice(0, length);
  }
  if (size < length) {
    const pad = tf.pad(wave, [[0, length - size]]);
    return pad;
  }
  return wave;
}

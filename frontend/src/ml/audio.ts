// frontend/src/ml/audio.ts

export async function blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

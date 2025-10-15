// backend/src/embeddings.ts

export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (normA * normB);
}

export function bestMatch(
  query: number[],
  candidates: { id: number; name: string; embedding: number[] }[]
) {
  let top = {
    profile: null as null | (typeof candidates)[number],
    score: -Infinity,
  };
  for (const c of candidates) {
    const score = cosineSimilarity(query, c.embedding);
    if (score > top.score) top = { profile: c, score };
  }
  return top;
}

export function l2Normalize(vec: number[]) {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

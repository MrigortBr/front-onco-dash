/**
 * Identificador do navegador (mesma ideia do SIMDASH, lib/auth/fingerprint.ts):
 * um id aleatório gerado uma vez e guardado no localStorage — não é um
 * fingerprint comportamental. Vai no login e no header X-Device-Fingerprint de
 * toda chamada; a API recusa a sessão se ele mudar.
 */
const STORAGE_KEY = "oncodash_device_id";

function randomId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function readDeviceFingerprint(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getDeviceFingerprint(): string {
  const existing = readDeviceFingerprint();
  if (existing) return existing;
  const id = randomId();
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // modo privado sem storage: o id vale só nesta aba
  }
  return id;
}

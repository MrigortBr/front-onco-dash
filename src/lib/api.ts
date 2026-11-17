import { getDeviceFingerprint } from "./fingerprint";

/**
 * Cliente da api-onco-dash. Tudo passa por /api/* (repassado pelo Next para a
 * API), com o cookie de sessão enviado pelo navegador e o id do dispositivo no
 * header X-Device-Fingerprint. O token nunca passa pelo JavaScript.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return [...new Set(m.map(String))].join(" ");
    if (typeof m === "string" && !m.startsWith("ThrottlerException")) return m;
  }
  return fallback;
}

const FALLBACK: Record<number, string> = {
  401: "Sua sessão terminou. Entre novamente.",
  403: "Seu perfil não tem acesso a esta ação.",
  404: "Não encontrado.",
  429: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
};

export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { "X-Device-Fingerprint": getDeviceFingerprint() };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: init.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Não foi possível falar com o servidor. Verifique sua conexão.", 0);
  }

  if (res.status === 204) return undefined as T;
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(messageFrom(body, FALLBACK[res.status] ?? "Algo deu errado. Tente de novo."), res.status);
  }
  return body as T;
}

export const authApi = {
  login: (p: { login: string; senha: string; latitude: number; longitude: number }) =>
    api<{ user: import("./types").SessionUser }>("/auth/login", {
      method: "POST",
      body: { ...p, fingerprint: getDeviceFingerprint() },
    }),
  me: (signal?: AbortSignal) => api<import("./types").SessionUser>("/auth/me", { signal }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  forgotPassword: (login: string) => api<{ message: string }>("/auth/forgot-password", { method: "POST", body: { login } }),
  resetPassword: (token: string, senha: string) =>
    api<{ message: string }>("/auth/reset-password", { method: "POST", body: { token, senha } }),
};

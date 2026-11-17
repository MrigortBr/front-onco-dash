"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, authApi } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

interface SessionContextValue {
  /** undefined = carregando; null = sem sessão. */
  user: SessionUser | null | undefined;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Sessão do usuário no front. O token fica num cookie httpOnly que o
 * JavaScript não lê; quem diz se a sessão vale é a API (/auth/me), que também
 * confere o dispositivo. Perfil e escopo vêm sempre de lá.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const load = useCallback(
    (signal?: AbortSignal) =>
      authApi.me(signal).then(
        (me) => {
          setUser(me);
          setError(null);
        },
        (err: Error) => {
          if (err.name === "AbortError") return;
          // 401 = sem sessão; qualquer outro erro é mostrado na tela.
          setError(err instanceof ApiError && err.status === 401 ? null : err.message);
          setUser(null);
        },
      ),
    [],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // mesmo com erro (sessão já caída), segue para o login
    }
    router.replace("/login");
  }, [router]);

  return (
    <SessionContext.Provider value={{ user, error, refresh: () => load(), logout }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession precisa estar dentro de <SessionProvider>.");
  return ctx;
}

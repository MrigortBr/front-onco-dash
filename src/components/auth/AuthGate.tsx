"use client";

import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { UserProfile } from "@/lib/types";
import { useSession } from "./SessionProvider";

/**
 * Protege as telas logadas: sem sessão, manda para /login (voltando depois
 * para a página pedida). Com `profiles`, só esses perfis veem o conteúdo.
 * É só a camada de tela: toda rota da API valida a sessão e o perfil de novo.
 */
export function AuthGate({ children, profiles }: { children: ReactNode; profiles?: UserProfile[] }) {
  const { user, error } = useSession();

  useEffect(() => {
    if (user === null && !error) {
      const next = window.location.pathname + window.location.search;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, error]);

  if (user === undefined || (user === null && !error)) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Carregando">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user === null) {
    return <p className="rounded-app-md bg-white p-6 text-sm text-red-600 shadow-app-card">{error}</p>;
  }

  if (profiles && (!user.profile || !profiles.includes(user.profile))) {
    return (
      <div className="rounded-app-lg bg-white p-8 text-center shadow-app-card">
        <p className="text-base font-semibold text-slate-700">Seu perfil não tem acesso a esta área.</p>
        <a href="/" className="mt-3 inline-block text-sm font-semibold text-brand-green hover:underline">
          Voltar ao painel
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

import type { ReactNode } from "react";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";

/** Telas logadas: sessão carregada uma vez e compartilhada pelas páginas. */
export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

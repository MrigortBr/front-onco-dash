import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, PublicShell } from "@/components/layout/PublicShell";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const metadata: Metadata = { title: "Ativar conta" };

/** Página pública: quem chega aqui só tem o link do convite. */
export default function ConvitePage() {
  return (
    <PublicShell>
      <AuthCard title="Ativar sua conta" subtitle="Confira seus dados e crie sua senha." wide>
        <Suspense>
          <AcceptInviteForm />
        </Suspense>
      </AuthCard>
    </PublicShell>
  );
}

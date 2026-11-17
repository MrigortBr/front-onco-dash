import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, PublicShell } from "@/components/layout/PublicShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Nova senha" };

export default function RedefinirSenhaPage() {
  return (
    <PublicShell>
      <AuthCard title="Criar nova senha" subtitle="Ao salvar, todas as sessões abertas serão encerradas.">
        <Suspense>
          <ResetForm />
        </Suspense>
      </AuthCard>
    </PublicShell>
  );
}

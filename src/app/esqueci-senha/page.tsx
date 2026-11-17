import type { Metadata } from "next";
import { AuthCard, PublicShell } from "@/components/layout/PublicShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <PublicShell>
      <AuthCard title="Esqueci minha senha" subtitle="Enviaremos um link para você criar uma nova senha.">
        <ForgotForm />
      </AuthCard>
    </PublicShell>
  );
}

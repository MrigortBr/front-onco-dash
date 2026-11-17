import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, PublicShell } from "@/components/layout/PublicShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <PublicShell>
      <AuthCard title="ONCODASH" subtitle="Autorização prévia de medicamentos oncológicos">
        <Suspense>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </PublicShell>
  );
}

import type { Metadata } from "next";
import { AuditPanel } from "@/components/admin/AuditPanel";
import { AuthGate } from "@/components/auth/AuthGate";

export const metadata: Metadata = { title: "Auditoria" };

export default function AuditoriaPage() {
  return (
    <AuthGate profiles={["Desenvolvedor", "Gestor federal"]}>
      <AuditPanel />
    </AuthGate>
  );
}

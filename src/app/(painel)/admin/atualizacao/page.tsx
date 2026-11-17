import type { Metadata } from "next";
import { UpdatesConsole } from "@/components/admin/UpdatesConsole";
import { AuthGate } from "@/components/auth/AuthGate";

export const metadata: Metadata = { title: "Atualização de dados" };

export default function AtualizacaoPage() {
  return (
    <AuthGate profiles={["Desenvolvedor", "Gestor federal"]}>
      <UpdatesConsole />
    </AuthGate>
  );
}

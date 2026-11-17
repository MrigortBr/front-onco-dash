import type { Metadata } from "next";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { AuthGate } from "@/components/auth/AuthGate";

export const metadata: Metadata = { title: "Usuários" };

export default function UsuariosPage() {
  return (
    <AuthGate
      profiles={["Desenvolvedor", "Gestor federal", "Gestor estadual", "Gestor de macrorregião", "Gestor de região de saúde", "Gestor municipal"]}
    >
      <UsersPanel />
    </AuthGate>
  );
}

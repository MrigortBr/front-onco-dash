"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, FormSuccess, PasswordField } from "@/components/ui/Field";
import { authApi } from "@/lib/api";

export function ResetForm() {
  const { token } = useParams<{ token: string }>();
  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirm) return setError("As senhas não coincidem.");
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword(token, senha);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>Senha alterada. Entre com a nova senha.</FormSuccess>
        <Link href="/login" className="text-center text-sm font-semibold text-brand-green hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <PasswordField label="Nova senha" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      <PasswordField
        label="Repita a nova senha"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <p className="-mt-2 text-xs text-slate-500">Mínimo de 8 caracteres.</p>
      <FormError>{error}</FormError>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}

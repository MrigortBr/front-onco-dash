"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError, FormSuccess } from "@/components/ui/Field";
import { authApi } from "@/lib/api";

export function ForgotForm() {
  const [login, setLogin] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!login.trim()) return setError("Informe seu CPF ou e-mail.");
    setSubmitting(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(login.trim());
      setSent(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>{sent}</FormSuccess>
        <p className="text-xs text-slate-500">
          O link vai para o e-mail cadastrado na conta e vale por 1 hora. Confira também a caixa de spam. Se a conta não tiver
          e-mail, fale com o administrador.
        </p>
        <Link href="/login" className="text-center text-sm font-semibold text-brand-green hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field
        label="CPF ou e-mail"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder="000.000.000-00 ou seu.email@saude.gov.br"
        invalid={!!error}
      />
      <FormError>{error}</FormError>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Enviando…" : "Enviar link"}
      </Button>
      <Link href="/login" className="text-center text-xs font-medium text-slate-500 hover:text-brand-green">
        Voltar para o login
      </Link>
    </form>
  );
}

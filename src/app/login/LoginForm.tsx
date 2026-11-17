"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError, PasswordField } from "@/components/ui/Field";
import { authApi } from "@/lib/api";
import { getCurrentPosition } from "@/lib/geo";

/** Só aceita voltar para caminhos internos (evita redirecionar para outro site). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginForm() {
  const params = useSearchParams();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const fail = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !senha) return fail("Informe o CPF (ou e-mail) e a senha.");
    if (!consent) return fail("É necessário autorizar a coleta de IP e localização para continuar.");

    setSubmitting(true);
    setError(null);
    try {
      const geo = await getCurrentPosition();
      await authApi.login({ login: login.trim(), senha, ...geo });
      window.location.assign(safeNext(params.get("next")));
    } catch (err) {
      fail((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${shake ? "animate-app-shake" : ""}`} noValidate>
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
      <PasswordField
        label="Senha"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="••••••••"
        invalid={!!error}
      />
      <div className="-mt-1 flex justify-end">
        <Link href="/esqueci-senha" className="text-xs font-medium text-brand-green hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      <label className="flex items-start gap-2.5 rounded-app-sm bg-app-bg px-3.5 py-3 text-xs leading-relaxed text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 accent-brand-green"
        />
        <span>
          Autorizo a coleta do meu IP e da minha localização durante este acesso, conforme a LGPD. Sem essa permissão não é
          possível entrar.
        </span>
      </label>

      <FormError>{error}</FormError>

      <Button type="submit" disabled={submitting} className="mt-1">
        {submitting ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-xs text-slate-500">Use o mesmo CPF e senha do APAC Onco. Sem acesso? Peça ao gestor responsável.</p>
    </form>
  );
}

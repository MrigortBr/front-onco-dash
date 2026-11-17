"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError, FormSuccess, PasswordField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { InvitePreview } from "@/lib/types";

const formatCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value ?? "—"}</dd>
    </div>
  );
}

export function AcceptInviteForm() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api<InvitePreview>(`/invites/${encodeURIComponent(token)}`)
      .then(setInvite)
      .catch((e: Error) => setLoadError(e.message));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirm) return setError("As senhas não coincidem.");
    if (cpf.replace(/\D/g, "").length !== 11) return setError("Informe um CPF válido (11 dígitos).");
    if (telefone.replace(/\D/g, "").length < 10) return setError("Informe um telefone com DDD.");
    setSubmitting(true);
    setError(null);
    try {
      await api(`/invites/${encodeURIComponent(token)}/accept`, { method: "POST", body: { senha, cpf, telefone } });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <FormError>{loadError}</FormError>
        <Link href="/login" className="text-center text-sm font-semibold text-brand-green hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }
  if (!invite) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>Conta ativada. Entre com o seu CPF e a senha que você criou.</FormSuccess>
        <Link href="/login" className="text-center text-sm font-semibold text-brand-green hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <dl className="grid grid-cols-2 gap-3 rounded-app-md bg-app-bg p-4">
        <Info label="Nome" value={invite.nome} />
        <Info label="E-mail" value={invite.email} />
        <Info label="Perfil" value={invite.profile} />
        <Info label="Recorte" value={invite.scopeLabel ?? "Brasil"} />
      </dl>
      <p className="-mt-1 text-xs text-slate-500">
        Convite válido até {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}. Se algum dado estiver errado, fale com
        quem convidou você antes de ativar.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField label="Crie uma senha" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <PasswordField label="Repita a senha" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Field label="CPF" inputMode="numeric" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" />
        <Field
          label="Telefone"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(formatPhone(e.target.value))}
          placeholder="(81) 99999-0000"
        />
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Senha com no mínimo 8 caracteres. O CPF é guardado criptografado
        {invite.login ? " e precisa ser o mesmo do seu cadastro no APAC Onco" : ""}.
      </p>
      <FormError>{error}</FormError>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Ativando…" : "Ativar conta"}
      </Button>
    </form>
  );
}

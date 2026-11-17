"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Field, FormError, FormSuccess, inputClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import {
  ADMIN_PROFILES,
  PROFILES,
  type CreateInviteResult,
  type InviteOptions,
  type ScopeInput,
  type UserListItem,
  STATUS_LABEL,
  type UserProfile,
  type UserStatus,
} from "@/lib/types";
import { ScopeFields, scopeToInput, trimScopeInput } from "./ScopeFields";

const STATUS_STYLE: Record<UserStatus, string> = {
  ativo: "bg-green-100 text-green-800",
  pendente: "bg-amber-100 text-amber-800",
  expirado: "bg-red-100 text-red-800",
  sem_senha: "bg-slate-200 text-slate-700",
  inativo: "bg-slate-100 text-slate-400 line-through",
};

type Filtro = "todos" | "sem_perfil" | UserStatus;
const FILTROS: Array<[Filtro, string]> = [
  ["todos", "Todos"],
  ["sem_perfil", "Sem perfil no OncoDash"],
  ["ativo", "Ativos"],
  ["sem_senha", "Sem senha"],
  ["pendente", "Convite pendente"],
  ["expirado", "Convite expirado"],
  ["inativo", "Inativos"],
];

/** Envia convite a quem ainda não tem senha (inclusive importados da tb_usuario). */
const podeConvidar = (u: UserListItem) => u.status === "pendente" || u.status === "expirado" || u.status === "sem_senha";

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

/** Convite: nome, cargo, e-mail, perfil e recorte. */
function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: (r: CreateInviteResult) => void }) {
  const [options, setOptions] = useState<InviteOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<UserProfile | "">("");
  const [escopo, setEscopo] = useState<ScopeInput>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // O modal só é montado quando aberto (ver UsersPanel), então o formulário sempre começa vazio.
  useEffect(() => {
    api<InviteOptions>("/users/invite-options")
      .then((o) => {
        setOptions(o);
        setProfile(o.profiles[o.profiles.length - 1] ?? "");
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await api<CreateInviteResult>("/users/invites", {
        method: "POST",
        body: { nome, cargo, email, profile, escopo: trimScopeInput(escopo, profile) },
      });
      onDone(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Convidar usuário" wide>
      {loadError ? (
        <FormError>{loadError}</FormError>
      ) : !options ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Field label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} required />
            <Field label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Perfil de acesso
              <select className={inputClass()} value={profile} onChange={(e) => setProfile(e.target.value as UserProfile)}>
                {options.profiles.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {profile && (
            <ScopeFields
              profile={profile}
              value={escopo}
              onChange={setEscopo}
              fixedScope={options.fixedScope}
              territorio={options.territorio}
            />
          )}
          <p className="text-xs text-slate-500">
            A pessoa recebe um e-mail com o link para ativar a conta (válido por 7 dias). O convidado começa sem permissão de
            convidar outras pessoas.
          </p>
          <FormError>{error}</FormError>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar convite"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Edição (Desenvolvedor e Gestor federal): dados, perfil, recorte e permissões. */
/** Montado com key={user.id}: o estado inicial vem do usuário escolhido. */
function EditModal({ user, onClose, onSaved }: { user: UserListItem; onClose: () => void; onSaved: () => void }) {
  const { user: me } = useSession();
  const [form, setForm] = useState({ nome: user.nome, cargo: user.cargo ?? "", telefone: user.telefone ?? "", email: user.email ?? "" });
  const [profile, setProfile] = useState<UserProfile>(user.profile ?? "Unidade");
  const [canAdd, setCanAdd] = useState(user.canAdd);
  const [canEdit, setCanEdit] = useState(user.canEdit);
  // Sem perfil ainda (ex.: importado): já sugere o CNES que veio da tb_usuario.
  const [escopo, setEscopo] = useState<ScopeInput>(() =>
    !user.profile && user.coCnes ? { ...scopeToInput(user.scope), cnesCodigo: user.coCnes } : scopeToInput(user.scope),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isSelf = me?.id === user.id;
  // Conta do APAC Onco: nome e e-mail vêm de lá pela atualização diária.
  const importado = user.origem === "tb_usuario";
  const assignable = PROFILES.filter((p) => me?.profile === "Desenvolvedor" || (p !== "Desenvolvedor" && p !== "Gestor federal"));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: {
          nome: importado ? undefined : form.nome,
          cargo: form.cargo || undefined,
          email: importado && user.email ? undefined : form.email.trim() || undefined,
          telefone: form.telefone || undefined,
          ...(isSelf ? {} : { profile, canAdd, canEdit, escopo: trimScopeInput(escopo, profile) }),
        },
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Editar ${user.nome}`} wide>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <dl className="grid grid-cols-2 gap-3 rounded-app-md bg-app-bg p-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">CPF / login</dt>
            <dd className="font-medium text-slate-800">{user.login ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">CNES (APAC Onco)</dt>
            <dd className="font-medium text-slate-800">{user.coCnes ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">Origem</dt>
            <dd className="font-medium text-slate-800">{user.origem === "tb_usuario" ? "APAC Onco" : "OncoDash"}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">Situação</dt>
            <dd className="font-medium text-slate-800">{STATUS_LABEL[user.status]}</dd>
          </div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            disabled={importado}
            title={importado ? "Vem do APAC Onco — altere lá" : undefined}
          />
          <Field label="Cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={importado && !!user.email}
            title={importado && user.email ? "Vem do APAC Onco — altere lá" : undefined}
          />
          <Field label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </div>
        {isSelf ? (
          <p className="rounded-app-sm bg-app-bg px-3 py-2 text-xs text-slate-600">Você não pode mudar o próprio perfil ou recorte.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Perfil de acesso
                <select className={inputClass()} value={profile} onChange={(e) => setProfile(e.target.value as UserProfile)}>
                  {assignable.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700">
                <input type="checkbox" className="accent-brand-green" checked={canAdd} onChange={(e) => setCanAdd(e.target.checked)} />
                Pode convidar usuários
              </label>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700">
                <input type="checkbox" className="accent-brand-green" checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} />
                Pode editar dados
              </label>
            </div>
            <ScopeFields profile={profile} value={escopo} onChange={setEscopo} fixedScope={null} />
          </>
        )}
        <FormError>{error}</FormError>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersPanel() {
  const { user: me } = useSession();
  const [users, setUsers] = useState<UserListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [notice, setNotice] = useState<{ text: string; link?: string | null } | null>(null);

  const isAdmin = !!me?.profile && ADMIN_PROFILES.includes(me.profile);

  const load = useCallback(
    () =>
      api<UserListItem[]>("/users").then(
        (list) => {
          setUsers(list);
          setError(null);
        },
        (e: Error) => setError(e.message),
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digitos = q.replace(/\D/g, "");
    if (!users) return users;
    return users.filter((u) => {
      if (filtro === "sem_perfil" && u.profile) return false;
      if (filtro !== "todos" && filtro !== "sem_perfil" && u.status !== filtro) return false;
      if (!q) return true;
      const texto = `${u.nome} ${u.login ?? ""} ${u.email ?? ""} ${u.profile ?? ""} ${u.scopeLabel ?? ""}`.toLowerCase();
      return texto.includes(q) || (digitos.length >= 3 && (u.login ?? "").replace(/\D/g, "").includes(digitos));
    });
  }, [users, search, filtro]);

  const resend = async (u: UserListItem) => {
    try {
      const r = await api<CreateInviteResult>(`/users/${u.id}/resend-invite`, { method: "POST" });
      setNotice({
        text: r.emailSent ? `Convite enviado para ${u.email}.` : `Convite gerado para ${u.email}, mas o e-mail não saiu.`,
        link: r.inviteLink,
      });
      void load();
    } catch (e) {
      setNotice({ text: (e as Error).message });
    }
  };

  return (
    <div className="rounded-app-lg bg-white p-5 shadow-app-card sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-green">Administração</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-800">Usuários</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? "Todos os usuários do OncoDash, inclusive os importados do APAC Onco." : "Usuários dentro do seu recorte."}{" "}
            Quem ainda não tem perfil no OncoDash não consegue entrar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={`${inputClass()} !w-60 !rounded-app-pill !py-2`}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            aria-label="Filtrar usuários"
          >
            {FILTROS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass()} !w-64 !rounded-app-pill !py-2`}
            placeholder="Buscar nome, CPF, e-mail, perfil…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar usuários"
          />
          {me?.canAdd && <Button onClick={() => setInviting(true)}>+ Convidar usuário</Button>}
        </div>
      </div>

      {notice && (
        <div className="mt-4">
          <FormSuccess>
            {notice.text}
            {notice.link && (
              <span className="mt-1 block break-all text-xs">
                Link (só aparece para Desenvolvedor): <a className="underline" href={notice.link}>{notice.link}</a>
              </span>
            )}
          </FormSuccess>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}

      <div className="mt-4 overflow-auto rounded-app-md border border-slate-200 shadow-app-card">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-brand-green text-white">
              {["Nome", "CPF / login", "E-mail", "Perfil", "Recorte", "Situação", "Criado por", "Criado em", ""].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!filtered &&
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-3 py-2">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {filtered?.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 even:bg-slate-50/60 hover:bg-green-50/60">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                  {u.nome}
                  {u.canAdd && <span className="ml-1.5 rounded-app-pill bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">convida</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-600">{u.login ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{u.email ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{u.profile ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{u.scopeLabel ?? "Brasil"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-app-pill px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[u.status]}`}>
                    {STATUS_LABEL[u.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{u.invitedByNome ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{fmtDate(u.createdAt)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  {podeConvidar(u) && me?.canAdd && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void resend(u)}
                      title={u.email ? `Envia o link para ${u.email}` : "Esta conta não tem e-mail: edite e informe um antes"}
                    >
                      {u.status === "sem_senha" ? "Enviar convite" : "Reenviar convite"}
                    </Button>
                  )}
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(u)} className="ml-1">
                      Editar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviting && (
        <InviteModal
          onClose={() => setInviting(false)}
          onDone={(r) => {
            setInviting(false);
            setNotice({
              text: r.emailSent
                ? `Convite enviado para ${r.email}.`
                : `Convite criado para ${r.email}, mas o e-mail não saiu (serviço de e-mail não configurado ou fora do ar).`,
              link: r.inviteLink,
            });
            void load();
          }}
        />
      )}
      {editing && (
        <EditModal
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice({ text: "Usuário atualizado." });
            void load();
          }}
        />
      )}
    </div>
  );
}

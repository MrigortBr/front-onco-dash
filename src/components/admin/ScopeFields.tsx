"use client";

import { inputClass } from "@/components/ui/Field";
import {
  PROFILE_SCOPE_LEVEL,
  SCOPE_LABEL,
  SCOPE_LEVELS,
  type InviteOptions,
  type ScopeInput,
  type ScopeLevel,
  type UserProfile,
  type UserScope,
} from "@/lib/types";

const KEYS: Record<ScopeLevel, { codigo: keyof ScopeInput; nome: keyof ScopeInput; optionsKey: keyof InviteOptions["territorio"]; placeholder: string }> = {
  uf: { codigo: "ufCodigo", nome: "ufNome", optionsKey: "ufs", placeholder: "PE" },
  macrorregiao: { codigo: "macrorregiaoCodigo", nome: "macrorregiaoNome", optionsKey: "macrorregioes", placeholder: "código" },
  regiaoSaude: { codigo: "regiaoSaudeCodigo", nome: "regiaoSaudeNome", optionsKey: "regioesSaude", placeholder: "código" },
  municipio: { codigo: "municipioCodigo", nome: "municipioNome", optionsKey: "municipios", placeholder: "IBGE, 7 dígitos" },
  cnes: { codigo: "cnesCodigo", nome: "cnesNome", optionsKey: "estabelecimentos", placeholder: "7 dígitos" },
};

export function scopeToInput(scope: UserScope | null | undefined): ScopeInput {
  const out: ScopeInput = {};
  if (!scope) return out;
  for (const level of SCOPE_LEVELS) {
    const item = scope[level];
    if (item) {
      out[KEYS[level].codigo] = item.codigo;
      if (item.nome) out[KEYS[level].nome] = item.nome;
    }
  }
  return out;
}

/** Só os campos que valem para o perfil escolhido (do nível UF até o nível do perfil). */
export function trimScopeInput(value: ScopeInput, profile: UserProfile): ScopeInput {
  const target = PROFILE_SCOPE_LEVEL[profile];
  if (!target) return {};
  const max = SCOPE_LEVELS.indexOf(target);
  const out: ScopeInput = {};
  SCOPE_LEVELS.forEach((level, i) => {
    if (i > max) return;
    const { codigo, nome } = KEYS[level];
    if (value[codigo]) out[codigo] = value[codigo]!.trim();
    if (value[nome]) out[nome] = value[nome]!.trim();
  });
  return out;
}

/**
 * Campos de escopo do convite/edição. Os níveis já fixados pelo escopo de quem
 * convida aparecem travados; o nível do próprio perfil é obrigatório (*).
 * Sem opções da base ainda, aceita código e nome digitados.
 */
export function ScopeFields({
  profile,
  value,
  onChange,
  fixedScope,
  territorio,
}: {
  profile: UserProfile;
  value: ScopeInput;
  onChange: (v: ScopeInput) => void;
  fixedScope: UserScope | null;
  territorio?: InviteOptions["territorio"];
}) {
  const target = PROFILE_SCOPE_LEVEL[profile];
  if (!target) {
    return <p className="rounded-app-sm bg-app-bg px-3 py-2 text-xs text-slate-600">Este perfil vê o Brasil inteiro; não tem recorte.</p>;
  }
  const max = SCOPE_LEVELS.indexOf(target);

  return (
    <fieldset className="flex flex-col gap-3 rounded-app-md border border-slate-200 p-4">
      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-600">Recorte nas abas restritas</legend>
      {SCOPE_LEVELS.slice(0, max + 1).map((level) => {
        const keys = KEYS[level];
        const fixed = fixedScope?.[level] ?? null;
        const required = level === target;
        // As opções dos níveis abaixo da UF vêm com a UF em `pai`: mostra só as da UF escolhida.
        const ufEscolhida = fixedScope?.uf?.codigo ?? (value.ufCodigo as string | undefined)?.trim().toUpperCase();
        const options = (territorio?.[keys.optionsKey] ?? []).filter(
          (o) => level === "uf" || !ufEscolhida || !o.pai || o.pai === ufEscolhida,
        );
        const listId = `opts-${level}`;
        return (
          <div key={level} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              {SCOPE_LABEL[level]} {required && <span className="text-red-500">*</span>}
              <input
                className={inputClass()}
                value={fixed ? fixed.codigo : ((value[keys.codigo] as string) ?? "")}
                disabled={!!fixed}
                list={options.length ? listId : undefined}
                placeholder={keys.placeholder}
                onChange={(e) => {
                  const codigo = e.target.value;
                  const match = options.find((o) => o.codigo === codigo);
                  onChange({ ...value, [keys.codigo]: codigo, ...(match ? { [keys.nome]: match.nome } : {}) });
                }}
              />
              {options.length > 0 && (
                <datalist id={listId}>
                  {options.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nome}
                    </option>
                  ))}
                </datalist>
              )}
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Nome
              <input
                className={inputClass()}
                value={fixed ? (fixed.nome ?? "") : ((value[keys.nome] as string) ?? "")}
                disabled={!!fixed}
                placeholder={fixed ? "" : "opcional"}
                onChange={(e) => onChange({ ...value, [keys.nome]: e.target.value })}
              />
            </label>
          </div>
        );
      })}
      {fixedScope && <p className="text-xs text-slate-500">Os campos travados vêm do seu próprio recorte.</p>}
    </fieldset>
  );
}

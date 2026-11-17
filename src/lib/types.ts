/** Tipos espelhando as respostas da api-onco-dash. */
export type UserProfile =
  | "Desenvolvedor"
  | "Gestor federal"
  | "Gestor estadual"
  | "Gestor de macrorregião"
  | "Gestor de região de saúde"
  | "Gestor municipal"
  | "Unidade";

export const PROFILES: UserProfile[] = [
  "Desenvolvedor",
  "Gestor federal",
  "Gestor estadual",
  "Gestor de macrorregião",
  "Gestor de região de saúde",
  "Gestor municipal",
  "Unidade",
];

export type ScopeLevel = "uf" | "macrorregiao" | "regiaoSaude" | "municipio" | "cnes";

export const SCOPE_LEVELS: ScopeLevel[] = ["uf", "macrorregiao", "regiaoSaude", "municipio", "cnes"];

/** Nível de escopo obrigatório de cada perfil (nulo = vê o Brasil inteiro). */
export const PROFILE_SCOPE_LEVEL: Record<UserProfile, ScopeLevel | null> = {
  Desenvolvedor: null,
  "Gestor federal": null,
  "Gestor estadual": "uf",
  "Gestor de macrorregião": "macrorregiao",
  "Gestor de região de saúde": "regiaoSaude",
  "Gestor municipal": "municipio",
  Unidade: "cnes",
};

export const SCOPE_LABEL: Record<ScopeLevel, string> = {
  uf: "UF",
  macrorregiao: "Macrorregião de saúde",
  regiaoSaude: "Região de saúde",
  municipio: "Município",
  cnes: "Unidade (CNES)",
};

export const ADMIN_PROFILES: UserProfile[] = ["Desenvolvedor", "Gestor federal"];

export interface ScopeItem {
  codigo: string;
  nome: string | null;
}

export type UserScope = Record<ScopeLevel, ScopeItem | null>;

export interface SessionUser {
  id: number;
  /** CPF ou login vindo da tb_usuario (APAC Onco). */
  login: string | null;
  email: string | null;
  nome: string;
  cargo: string | null;
  profile: UserProfile | null;
  canEdit: boolean;
  canAdd: boolean;
  scope: UserScope;
}

/** sem_senha: conta sem senha e sem convite (ex.: importada da tb_usuario sem senha). */
export type UserStatus = "ativo" | "pendente" | "expirado" | "sem_senha" | "inativo";

export const STATUS_LABEL: Record<UserStatus, string> = {
  ativo: "ativo",
  pendente: "convite pendente",
  expirado: "convite expirado",
  sem_senha: "sem senha",
  inativo: "inativo",
};

export interface UserListItem {
  id: number;
  nome: string;
  login: string | null;
  email: string | null;
  coCnes: string | null;
  origem: "tb_usuario" | "oncodash";
  telefone: string | null;
  cargo: string | null;
  cpfMasked: string | null;
  profile: UserProfile | null;
  canEdit: boolean;
  canAdd: boolean;
  scope: UserScope;
  scopeLabel: string | null;
  status: UserStatus;
  createdAt: string;
  invitedByNome: string | null;
}

export interface CreateInviteResult extends UserListItem {
  inviteLink: string | null;
  emailSent: boolean;
}

export interface TerritorioOpcao {
  codigo: string;
  nome: string;
  pai?: string;
}

export interface InviteOptions {
  profiles: UserProfile[];
  fixedScope: UserScope | null;
  territorio: {
    ufs: TerritorioOpcao[];
    macrorregioes: TerritorioOpcao[];
    regioesSaude: TerritorioOpcao[];
    municipios: TerritorioOpcao[];
    estabelecimentos: TerritorioOpcao[];
  };
}

/** Campos planos do escopo, como a API recebe. */
export interface ScopeInput {
  ufCodigo?: string;
  ufNome?: string;
  macrorregiaoCodigo?: string;
  macrorregiaoNome?: string;
  regiaoSaudeCodigo?: string;
  regiaoSaudeNome?: string;
  municipioCodigo?: string;
  municipioNome?: string;
  cnesCodigo?: string;
  cnesNome?: string;
}

export interface InvitePreview {
  nome: string;
  email: string | null;
  /** Conta que já tem login (importada): o CPF digitado precisa ser o mesmo. */
  login: string | null;
  cargo: string | null;
  profile: UserProfile | null;
  scopeLabel: string | null;
  expiresAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface LoginAuditItem {
  id: number;
  userId: number;
  nome: string;
  email: string | null;
  profile: UserProfile | null;
  scopeLabel: string | null;
  createdAt: string;
  expiresAt: string;
  status: "ativa" | "encerrada";
  ip: string | null;
  userAgent: string | null;
  latitude: number | null;
  longitude: number | null;
  suspeito: boolean;
  motivosSuspeita: string[];
  distanciaKm: number | null;
}

export interface UserAuditItem {
  id: number;
  createdAt: string;
  acao: string;
  ator: { id: number; nome: string; email: string | null } | null;
  alvo: { id: number; nome: string; email: string | null } | null;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  ip: string | null;
}

export interface ExportAuditItem {
  exportId: string;
  createdAt: string;
  usuario: { id: number; nome: string; email: string | null } | null;
  pagina: string;
  arquivo: string;
  formato: string;
  abas: { nome: string; linhas: number }[];
  totalLinhas: number;
  ip: string | null;
}

export type DataScope =
  | { tipo: "brasil" }
  | { tipo: "filtro"; nivel: ScopeLevel; codigo: string }
  | { tipo: "nada" };

export interface PainelEscopo {
  escopo: DataScope;
  descricao: string | null;
  podeVerCodigoPaciente: boolean;
}

# front-onco-dash

Front do OncoDash (Next.js 16 + Tailwind 4), no padrão visual do SIMDASH e do UMAE.

## Rodar localmente

```bash
cp .env.example .env.local     # API_URL=http://localhost:3001
npm install
npm run dev                    # http://localhost:3000 (a API precisa estar rodando)
```

O front chama a API sempre por `/api/*`, que o Next repassa para `API_URL`. Assim o cookie de sessão (`httpOnly`) fica no próprio endereço do painel e o JavaScript nunca vê o token.

## Telas

| Caminho | Quem vê |
| --- | --- |
| `/login` | público (exige localização e o termo de coleta de IP/localização) |
| `/esqueci-senha`, `/redefinir-senha/[token]` | público |
| `/convite/[token]` | quem recebeu o convite |
| `/` | logado: perfil, recorte e se pode convidar (os painéis de dados entram aqui) |
| `/admin/usuarios` | perfis que convidam (Unidade não) |
| `/admin/auditoria` | Desenvolvedor e Gestor federal |

`src/proxy.ts` só redireciona para `/login` quando falta o cookie; quem valida a sessão é a API em toda chamada.


## Painel

O painel é o do protótipo v2 (HTML + D3), em `public/painel/`, servido na raiz (`/` → `/painel/index.html`, ver
`next.config.ts`). Os gráficos, filtros, listas e exportações são os mesmos do protótipo; o que mudou:

- `js/00-runtime.js`: as fontes de dados começam "carregando" e são preenchidas pela API (`dash.setSource`).
- `oncodash.js`: confere a sessão (sem sessão → `/login`), mostra o usuário com o menu (Usuários, Auditoria,
  Atualização, Sair), carrega `GET /api/painel/solicitacoes` (já no recorte do usuário) e o mapa das UFs, fixa
  perfil/escopo pelo login e registra as exportações na auditoria.
- Pequenos ajustes nos módulos (`js/01..11`): perfil Gestor municipal, nome do estabelecimento no rótulo do CNES e
  distância/rotas que ignoram linhas sem coordenadas.

Campos que o banco do APAC Onco ainda não tem (macrorregião, região de saúde e município do serviço, tipo
CACON/UNACON, região de saúde de residência, coordenadas e distância) aparecem como "Não informado".

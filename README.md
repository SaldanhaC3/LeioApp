# Leio

Leio é um app de leitura gamificado: acompanhe livros, sessões de leitura, metas anuais, desafios e clubes do livro com amigos. O mascote **Capi** guia o usuário pela biblioteca, pelo escaneamento de capas por código de barras e pela geração de "cards de leitura" para compartilhar.

## Estrutura do monorepo

Workspace pnpm com múltiplos pacotes:

```
artifacts/
  leio/            App mobile (Expo / React Native + expo-router)
  api-server/      API HTTP (Express 5)
  leio-pitch/      Deck de apresentação (Vite)
  mockup-sandbox/  Sandbox de UI (Vite)
lib/
  api-spec/        Fonte da verdade da API (OpenAPI)
  api-client-react/ Hooks React gerados via Orval a partir do OpenAPI
  api-zod/         Schemas Zod gerados a partir do OpenAPI
  db/              Schema Drizzle ORM (PostgreSQL)
supabase/
  migrations/      Migrations SQL (schema, RLS, storage) do projeto Supabase
scripts/           Scripts utilitários do workspace
```

## Stack

- **Mobile**: Expo SDK 54, React Native 0.81, expo-router, React 19, Supabase (auth + dados)
- **Backend**: Node.js 24, Express 5, Drizzle ORM sobre PostgreSQL (Supabase)
- **Linguagem**: TypeScript 5.9 em todo o monorepo
- **Validação**: Zod
- **Codegen de API**: Orval, gerando hooks/tipos a partir de `lib/api-spec/openapi.yaml`

## Rodando localmente

Pré-requisitos: Node.js 24, pnpm.

```bash
pnpm install

# App mobile (Expo)
pnpm --filter @workspace/leio run dev

# API server
pnpm --filter @workspace/api-server run dev

# Typecheck de todo o monorepo
pnpm run typecheck

# Build (typecheck + build de todos os pacotes)
pnpm run build
```

### Variáveis de ambiente

| Variável | Onde é usada | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | `api-server`, `lib/db` | Connection string do Postgres/Supabase |
| `EXPO_PUBLIC_SUPABASE_URL` | `artifacts/leio` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `artifacts/leio` | Chave anônima (pública) do Supabase |

## Banco de dados

O schema, as políticas de RLS e a configuração de storage do Supabase vivem em `supabase/migrations/`. Rode-as em ordem contra o projeto Supabase de destino.

Para mudanças de schema locais durante o desenvolvimento: `pnpm --filter @workspace/db run push`.

## Contribuindo

- Regenere hooks/schemas de API após alterar `lib/api-spec/openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Rode `pnpm run typecheck` antes de abrir PR

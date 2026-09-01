# Leio — documento de handoff

Referência central do app mobile **Leio** (`artifacts/leio`) para uma sessão/modelo que
nunca viu este código. Cobre produto, arquitetura, modelo de dados, mapa de telas,
componentes/serviços e pendências conhecidas. Não repete o que já está bem documentado
em outro lugar — só aponta pra lá.

**Outras fontes que valem a pena ler primeiro:**
- [`../../README.md`](../../README.md) — visão do monorepo (mobile + api-server + libs), stack, como rodar.
- [`design/colors.md`](design/colors.md) — paleta de cores oficial e por quê cada token existe.
- [`design/assets-inventory.md`](design/assets-inventory.md) — catálogo de vídeos/imagens/áudio (o que é cada arquivo, quem usa).
- Canvas de design (wireframes de todas as telas, mantido em sincronia manualmente): artifact "Leio Telas Wireframe".

## O que é o app

App de leitura gamificado. Mascote **Capi** (uma capivara) guia o usuário. Pilares:

- **Registrar sessões de leitura** com timer, modo foco, som ambiente e integração Spotify (o clima visual da tela de sessão reage à música tocando).
- **Progressão por constância, não pontos** — "fôlego" é a sequência de dias lendo; a tela de Conquistas e o card de topo focam nisso, XP existe mas é secundário (ver "XP vs. fôlego" abaixo).
- **Adicionar livros** por busca (Open Library), scanner de ISBN ou cadastro manual.
- **Vocabulário** — salvar palavras (com tradução/pronúncia) durante a leitura, num "caderninho".
- **Citações/destaques** — marcar trechos favoritos, viram cards compartilháveis.
- **Grupos de leitura** — grupos por código de convite, check-ins diários, desafios (challenges) competitivos e "clubes do livro" (leitura coletiva de um título com progresso de cada membro).
- **Compartilhamento social** — cards gerados (5 molduras: Stories, Moldura, Clássico, Polaroid, Ficha de biblioteca) a partir de uma sessão ou de um destaque.
- **Conquistas (badges)** e **missões diárias** (geradas deterministicamente por data).

## Arquitetura

- **Expo Router** (`app/` = rotas, arquivo = tela). Ver mapa de telas completo abaixo.
- **Três React Contexts** cobrem todo o estado (sem Redux/Zustand):
  - `AppContext` — livros, sessões, XP/fôlego, badges, missões, vocabulário, highlights, cards compartilhados, configurações, estado do Capi, Spotify, e os "clubes de leitura" dentro de grupos. É o maior e mais central.
  - `BookGroupContext` — grupos, check-ins, streak social, desafios. Não lida com livros/sessões individuais.
  - `AuthContext` — sessão/login (Google OAuth via Supabase), perfil remoto.
- **Persistência é local-first e fragmentada**: `AppContext` e `BookGroupContext` usam **AsyncStorage puro** (sem sincronizar com backend nesses arquivos); só `AuthContext`/`profiles` fala com Supabase diretamente. `services/supabaseSync.ts` + `components/SyncBridge.tsx` fazem upload (local → Supabase, local como fonte da verdade) dos livros/sessões/highlights/vocabulário/perfil, disparado ao carregar o app com usuário autenticado (debounce de 30s). **Não há sync remoto → local** nesses arquivos — se o usuário trocar de aparelho, os dados locais não voltam.
- **Design tokens**: `constants/colors.ts` é a fonte da verdade da paleta, consumida via `useColors()`. Só existe paleta clara hoje (ver `design/colors.md`).

## Mapa de telas (`app/`)

> Nota: existem **dois arquivos de perfil, de propósito diferente** — não é duplicação acidental:
> `app/perfil.tsx` (`PerfilModalScreen`) é o modal aberto a partir da Home (`router.push("/perfil")`);
> `app/(tabs)/perfil.tsx` (`PerfilScreen`) é a aba de perfil da tab bar. Conteúdo parecido, rotas diferentes.

### Autenticação / Onboarding
| Arquivo | O que faz |
|---|---|
| `login.tsx` | Login via Google (`useAuth().signInWithGoogle`). Entrada quando não há `session` (redirect vem do `_layout.tsx`). |
| `profile-setup.tsx` | Cria o perfil (nome, @handle, avatar — foto própria ou usar a Capi). Acionada quando há `session` mas não há `profile`. → `/onboarding`. |
| `onboarding.tsx` | Apresentação inicial (carrossel). Marca `settings.hasCompletedOnboarding`. → `/(tabs)`. |

### Tabs principais
| Arquivo | O que faz |
|---|---|
| `(tabs)/_layout.tsx` | Tab bar + botão central de "iniciar sessão rápida". |
| `(tabs)/index.tsx` | **Home/hub central.** Livro atual, fôlego, tarefa do dia, seus números, metas, resgates. Roda o app-tour de primeira visita (`components/HomeTour.tsx`, ver abaixo). |
| `(tabs)/biblioteca.tsx` | Lista/filtra todos os livros do usuário. |
| `(tabs)/sessao.tsx` | Prepara uma sessão: escolhe livro → configura (página inicial, modo foco, Spotify) → `/sessao-ativa`. |
| `(tabs)/badges.tsx` | Galeria de conquistas + card de constância (dias seguidos). |
| `(tabs)/perfil.tsx` | Aba de perfil (estatísticas, gráficos, calendário). |

### Adicionar livro
`adicionar-livro.tsx` (menu de escolha) → `buscar-livro.tsx` (Open Library) | `escanear-livro.tsx` (câmera/ISBN, cai pra manual se falhar) | `livro-manual.tsx` (formulário).

### Sessão de leitura
`sessao-ativa.tsx` (timer, vídeo da Capi em loop, modo foco, citação, vocabulário) → `conclusao.tsx` (resumo, badges/missões desbloqueadas, agendar próxima sessão) → opcionalmente `compartilhar.tsx` (gerar card) → `meus-cards.tsx` (histórico de cards).

### Grupos / clubes
`(tabs)/grupos/index.tsx` (entrar/criar grupo) → `(tabs)/grupos/[id].tsx` (feed, desafios, clube do livro) → `(tabs)/grupos/checkin.tsx` (check-in diário).

### Perfil / configurações
`perfil.tsx` (modal, ver nota acima), `settings.tsx` (preferências, notificações, Spotify, exportar dados, excluir conta).

### Leitura de arquivo próprio / detalhe de livro
`livro/[id].tsx` (detalhe: progresso, sessões, editar/remover) → `leitor/[id].tsx` (ver/adicionar destaques de um livro cadastrado) | `leitor-arquivo/[bookId].tsx` (leitor de PDF/EPUB importado, com `components/ReaderSettingsPanel.tsx`).

### Infra
`_layout.tsx` (providers globais + roteamento condicional: sem sessão → login, sem perfil → profile-setup, sem onboarding → onboarding), `livro/_layout.tsx`, `+not-found.tsx`.

## Modelo de dados (resumo — ver `contexts/AppContext.tsx` pros tipos completos)

- **`Book`**: título, autor, gênero, páginas, status (`reading`/`read`/`want`/`abandoned`), capa, datas, ritmo (`pace`).
- **`Session`**: livro, página inicial/final, duração, ritmo, data, modo foco.
- **`Highlight`**: trecho salvo de um livro (independente de clube), usado nos cards de compartilhamento.
- **`Badge`** / **`Mission`**: conquistas e missões diárias (geradas por hash determinístico da data).
- **`BookClub`** (dentro de `AppContext`, ligado a um `groupId`): leitura coletiva de um livro num grupo, com progresso por membro e highlights de clube.
- **`AppSettings`**: tema, som, `capiVariant` (campo ainda existe no tipo, mas a UI de escolha foi removida — ver "Pendências"), foto de perfil, meta anual.
- **`ReadingGroup`** / **`GroupCheckIn`** / **`Challenge`** (em `BookGroupContext`): grupos sociais, check-ins diários, desafios competitivos.
- **`Profile`** (em `AuthContext`, tabela `profiles` do Supabase): username, handle, avatar_url, `xp`, `folego` — **espelhados** do estado local, sem código de sync bidirecional nestes arquivos.

**Regras de negócio que não são óbvias pelo nome:**
- XP: +2 por minuto lido, mais bônus de missão/badge.
- Fôlego: +1 a cada sessão registrada (contador cumulativo, não é recalculado por data corrida nestes arquivos).
- Streak de grupo (`getStreak`) é diferente do fôlego: conta dias corridos de check-in a partir de hoje/ontem.
- Livro "atual" = status `reading` com sessão há menos de 14 dias; "abandonado" = mesmo status, 14+ dias sem sessão.
- Vários badges (`concentrado`, `rescue`, `duo`, `goal_crusher`, `diversidade`) estão catalogados em `ALL_BADGES` mas **sem regra de desbloqueio implementada** em `checkAndUnlockBadges` — provavelmente pendentes.

## Componentes e serviços mais importantes

- **`components/CapiMascot.tsx`** — o mascote em si. `state` (humor/animação), `variant` (pele — hoje só a variante `default`/oficial é escolhível pelo usuário; `terror`/`classico`/`romance`/`scifi` são automáticas por gênero do livro durante a sessão).
- **`components/ShareCard.tsx`** — 5 templates de card de compartilhamento (`storiesPhoto`, `framed`, `classic`, `polaroid`, `libraryTicket`).
- **`components/HomeTour.tsx`** — tour guiado de primeira visita à Home (flag `leio.homeTourSeen` no AsyncStorage). Mede posição via `measureInWindow` nativo / `getBoundingClientRect` no web (RN-Web não reflete scroll em `measureInWindow`).
- **`services/ambientAudio.ts`** — som ambiente em loop durante a sessão (café/chuva/biblioteca/floresta/lareira). *A seção de escolha desse som foi removida da tela `sessao.tsx` nesta rodada (ver Pendências) — o serviço continua funcionando via `settings.ambientDefault`.*
- **`services/spotify.ts`** — OAuth/PKCE, "now playing", e `deriveGradient()` que tinge a tela de sessão pelo humor (energy/valence) da música.
- **`services/notifications.ts`** — lembretes diários e `scheduleReadingReminder()` (lembrete pontual, usado em "agendar próxima sessão" na tela de conclusão).
- **`services/supabaseSync.ts`** + **`components/SyncBridge.tsx`** — upload local → Supabase, local como fonte da verdade.
- **`hooks/useColors.ts`** — hook de tema mais usado no app inteiro.

Lista completa e detalhada de todo `components/`, `services/`, `hooks/` e `utils/` está no histórico desta sessão — peça pra regenerar se este arquivo não for suficiente (é fácil re-mapear com uma exploração dirigida do código).

## Vídeos e imagens da Capi

Fundo da sessão de leitura é sempre um vídeo da Capi lendo, em loop, escolhido por gênero do livro (nunca repete o vídeo da sessão anterior — lógica em `app/sessao-ativa.tsx`, função `getVideoPool`/`usePickSessionVideo`). Catálogo completo de qual arquivo mostra o quê: `design/assets-inventory.md`.

## Pendências e decisões conhecidas (não são bugs — são escopo deliberado ou trabalho futuro)

- **Sem vídeo de terror ainda**: o gênero `terror` cai no pool padrão (dia/noite) por falta de clipe dedicado.
- **Sons ambiente removidos da tela de Nova Sessão** (`(tabs)/sessao.tsx`): o serviço (`ambientAudio.ts`) continua existindo e funcional via `settings.ambientDefault`, só a UI de escolha foi tirada — feedback do dono do produto foi "a experiência do lado do cliente ainda não está boa, deixa pra v2".
- **Import de PDF/ePub removido de `livro/[id].tsx`**: a rota `leitor-arquivo/[bookId].tsx` e o serviço `readerFiles.ts` continuam existindo, só o ponto de entrada nessa tela foi removido (mesmo motivo: "sensação de leitura não está boa ainda").
- **Variantes de Capi**: removida a seleção de skin (`vampire`/`erudite`) em Configurações — decisão do dono do produto foi ter uma Capi oficial única, que também é o logo do app e o placeholder padrão de foto de perfil. O tipo `CapiVariant` ainda inclui esses valores (não removidos do código, só da UI) — as variantes automáticas por gênero de livro (`terror`/`classico`/`romance`/`scifi`) continuam ativas e são um conceito diferente (contextual, não escolhido pelo usuário).
- **XP local vs. remoto**: `AppContext` guarda XP/fôlego só em AsyncStorage; `AuthContext`/Supabase tem as mesmas colunas em `profiles`. Não achei código de sincronização bidirecional entre os dois nestes três arquivos de contexto — vale investigar se isso existe em outra camada antes de assumir que está sincronizado.
- **Foco do app mudou de "pontos" (XP) pra "constância" (fôlego/streak)** nesta rodada, a pedido do dono do produto — a tela de Conquistas já reflete isso no card de topo, mas o sistema de XP/nível continua existindo por baixo (usado em vários lugares: missões, badges, compartilhamento). Não foi uma remoção completa do XP, foi uma re-priorização visual.
- **App-tour da Home** roda só uma vez por instalação (flag AsyncStorage `leio.homeTourSeen`) — pra testar de novo, limpar essa chave.

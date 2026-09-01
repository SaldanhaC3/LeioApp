# Paleta de cores

Fonte da verdade: [`../constants/colors.ts`](../constants/colors.ts). Este arquivo documenta
o que cada valor hex significa e por quê — o código só tem os hex.

## Paleta ativa — "Terracota" (2026)

| Nome           | Hex       | Papel na marca                                  |
|----------------|-----------|--------------------------------------------------|
| Jet Black      | `#202C39` | Texto principal, títulos, superfícies escuras     |
| Jet Black 2    | `#283845` | Texto secundário/muted (mais suave que o principal)|
| Dry Sage       | `#B8B08D` | Superfícies neutras (cards secundários, chips inativos) |
| Soft Peach     | `#F2D492` | Fundo principal do app (o "papel" do Leio)        |
| Tangerine Dream| `#F29559` | Cor de destaque — CTAs, XP, progresso, links       |

## Mapeamento pros tokens do tema

`constants/colors.ts` expõe um objeto `light` consumido via `useColors()`. Cada token é
usado assim:

| Token                  | Hex        | De onde vem              | Onde aparece |
|-------------------------|-----------|---------------------------|--------------|
| `background`             | `#F2D492` | Soft Peach                | Fundo de toda tela |
| `foreground` / `text`    | `#202C39` | Jet Black                 | Texto principal sobre `background`/`card` |
| `card`                   | `#FBF3DD` | Soft Peach clareado ~55%  | Fundo de cards sobre `background` |
| `cardForeground`         | `#202C39` | Jet Black                 | Texto sobre `card` |
| `primary` / `primaryForeground` | `#202C39` / `#F2D492` | Jet Black / Soft Peach | Botões escuros, elementos de maior ênfase |
| `secondary` / `muted`    | `#B8B08D` | Dry Sage                  | Superfícies neutras (chips inativos, seção "Na estante") |
| `secondaryForeground` / `mutedForeground` | `#202C39` / `#283845` | Jet Black / Jet Black 2 | Texto sobre superfícies neutras |
| `accent` / `tint` / `volt`| `#F29559` | Tangerine Dream           | CTA principal ("Continuar lendo"), barra de progresso, pílulas de XP |
| `accentForeground`       | `#202C39` | Jet Black                 | Texto/ícone sobre fundo laranja (contraste melhor que branco) |
| `accentText` / `accentBorder` | `#202C39` / `#283845` | Jet Black / Jet Black 2 | Texto e contorno de pílulas translúcidas (`${volt}22`) |
| `coral`                  | `#C97A45` | Tangerine escurecido ~20% | Botão "Encerrar sessão" (precisa se distinguir do `volt`) |
| `destructive`            | `#B3562E` | Tangerine escurecido ~30% com Jet Black | Ações destrutivas ("Excluir minha conta") |
| `border`                 | `#DBD7C6` | Dry Sage clareado ~65%    | Bordas de card, inputs, divisores |
| `input`                  | `#FBF3DD` | = `card`                  | Fundo de campos de texto |

Tons que não existem literalmente na paleta de 5 cores (o `card` claro, o `border` claro, o
`coral`/`destructive` mais escuros) foram **derivados** misturando a cor da paleta mais
próxima com branco ou com Jet Black — pra manter contraste de texto legível (WCAG AA) sem
introduzir uma cor fora da família.

## Regra de contraste (o que NÃO usar)

`Tangerine Dream` (`#F29559`) e `Soft Peach` (`#F2D492`) são próximos em luminância — texto
`accentForeground` **não pode ser um tom claro** sobre `volt`/`accent`, por isso o token usa
Jet Black (escuro) em vez de branco. Ao ajustar qualquer cor de destaque, teste o par
resultante com uma ferramenta de contraste (mínimo 4.5:1 pra texto normal).

## Exceção conhecida: tela de sessão ativa

`app/sessao-ativa.tsx` sempre desenha um fundo escuro (foto dia/noite ou gradiente por
gênero do livro) por cima da tela, independente do tema estar claro. Por isso ela define
localmente:

```ts
const ON_DARK_TEXT = "#FFFFFF";
const ON_DARK_MUTED = "rgba(255,255,255,0.7)";
```

e usa essas constantes pro timer, título/autor do livro e "now playing" — nunca
`colors.foreground`/`colors.mutedForeground` do tema. Isso foi corrigido nesta sessão porque
o tema anterior tornava o timer quase invisível (contraste ~1.5:1) sobre o fundo escuro; se a
paleta mudar de novo, essa tela não precisa mudar junto.

## Molduras de compartilhamento (`components/ShareCard.tsx`)

Até esta rodada, os 3 templates de card compartilhável (`storiesPhoto`/`framed`/`classic`)
tinham cores **hardcoded** (`#CDFF00` lima + preto puro), sobra de uma paleta anterior à
"Papel" — desconectadas do tema vigente. Agora importam `constants/colors.ts` diretamente
(sem hook, já que a paleta é um objeto estático) e mapeiam:

```ts
const VOLT = colors.light.volt;          // destaque (Tangerine Dream)
const BLACK = colors.light.foreground;   // fundo escuro do card (Jet Black)
const OFF_WHITE = colors.light.card;     // texto claro sobre o fundo escuro
const MUTED = colors.light.secondary;    // texto secundário sobre o fundo escuro
```

Os cards continuam de fundo escuro por design (números têm mais impacto assim pra
compartilhamento social) — só as CORES que preenchem esses papéis agora seguem a paleta
viva em vez de fixas. Se a paleta mudar de novo, `ShareCard.tsx` já acompanha sem precisar
editar de novo — igual ao resto do app.

## Histórico de paletas testadas

Documentado pra não perder o racional caso alguém queira voltar atrás ou comparar.

### v1 (original, "Papel")
Creme e marrom — a paleta com que o app foi construído.

| Nome | Hex |
|---|---|
| Fundo (creme) | `#F6EFE0` |
| Texto (marrom escuro) | `#2A2118` |
| Destaque (dourado) | `#D4963C` |
| Alerta (terracota) | `#C75B3E` |

### v2 (explorada, não adotada) — "Tropical"
Testada brevemente antes da paleta final. Descartada em favor da v3 (terracota), que
combinava mais com a identidade "app de leitura aconchegante".

| Nome | Hex |
|---|---|
| Spicy Orange | `#E53D00` |
| Sunbeam Yellow | `#FFE900` |
| Porcelain | `#FCFFF7` |
| Light Sea Green | `#21A0A0` |
| Stormy Teal | `#046865` |

### v3 (ativa) — "Terracota"
Ver tabela no topo deste arquivo.

# Design do Leio

Ponto único pra tudo que é identidade visual do app: paleta de cores, tipografia/espaçamento,
e o inventário de assets (imagens, áudio) que já existem em `../assets`.

- [`colors.md`](./colors.md) — paleta ativa (tokens em `constants/colors.ts`), com o
  histórico de paletas testadas e o racional de cada escolha.
- [`assets-inventory.md`](./assets-inventory.md) — catálogo de toda imagem e áudio já
  usados pelo app: onde cada arquivo mora, quem o referencia no código, e dimensões/peso.
- Tipografia, espaçamento e raios já vivem em [`../constants/theme.ts`](../constants/theme.ts)
  (não duplicados aqui — é a fonte da verdade, com comentários explicando cada escala).

## Como atualizar a paleta

A paleta inteira do app vem de um único lugar: [`../constants/colors.ts`](../constants/colors.ts).
Trocar os 5 valores hex ali propaga pra tudo que usa `useColors()` — não precisa tocar em
telas individuais. As únicas exceções são cores fixas por design (não devem seguir o tema):

- **Tela de sessão ativa** (`app/sessao-ativa.tsx`) sempre renderiza sobre um fundo escuro
  (foto ou gradiente por gênero), então o texto ali usa constantes locais
  `ON_DARK_TEXT`/`ON_DARK_MUTED` (brancas) em vez dos tokens do tema — trocar a paleta não
  deve mexer nessas.
- Vídeo/imagens do mascote Capi (skins) têm cor própria de ilustração; não são recoloridas
  pelo tema.

Depois de trocar a paleta, vale reabrir pelo menos: Login, Home, Biblioteca, uma sessão de
leitura ativa, Conquistas e Configurações — são as telas com mais uso de cor de destaque.

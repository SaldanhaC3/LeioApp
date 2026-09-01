import type { Mission } from "@/contexts/AppContext";

export interface MissionTemplate {
  id: string;
  text: string;
  target: number;
  xpReward: number;
  type: Mission["type"];
}

/**
 * 200+ tarefas do dia. Uma só aparece por dia (ver generateDailyMissions em
 * AppContext.tsx) — o banco é grande pra levar meses até repetir a mesma.
 * Textos misturam clássicos BR/estrangeiros com lançamentos hypados de
 * 2000-2026 (peso maior em 2023-2026), sem citar prêmios/datas específicas
 * que exigiriam verificação factual — só o clima ("todo mundo tá lendo X").
 */

const PAGE_TARGETS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const PAGE_FLAVORS = [
  "Machado escrevia por menos",
  "Guimarães Rosa não teria pressa, mas sua meta tem",
  "Fourth Wing tem 800 — você tá aquecendo",
  "Torto Arado foi lido por milhões, bora chegar lá",
  "Saramago não usava parágrafo, você não tem desculpa",
];

const PAGES_MISSIONS: MissionTemplate[] = PAGE_TARGETS.flatMap((target) =>
  PAGE_FLAVORS.map((flavor, fi) => ({
    id: `pages-${target}-${fi}`,
    text: `Vire ${target} páginas hoje (${flavor})`,
    target,
    xpReward: 10,
    type: "pages" as const,
  }))
);

const SESSION_MISSIONS: MissionTemplate[] = [
  { id: "session-01", text: "Uma sessão de 15min — menos que um rolê no feed", target: 1, xpReward: 10, type: "session" },
  { id: "session-02", text: "Sessão no Modo Foco. A Mulher na Janela não se distraiu — você também não", target: 1, xpReward: 10, type: "session" },
  { id: "session-03", text: "Leia antes das 7h. Carolina Maria de Jesus escrevia de madrugada, entre um turno e outro", target: 1, xpReward: 10, type: "session" },
  { id: "session-04", text: "Sessão depois da meia-noite. Insônia de Bentinho tem uso", target: 1, xpReward: 10, type: "session" },
  { id: "session-05", text: "Uma sessão sem pausar pro celular — nem Capitu desconfiaria de tanto foco", target: 1, xpReward: 10, type: "session" },
  { id: "session-06", text: "Sessão com som ambiente ligado. Chuva, café ou lareira — você escolhe o clima", target: 1, xpReward: 10, type: "session" },
  { id: "session-07", text: "Duas sessões hoje. Travessia de Riobaldo não foi feita de um pulo só", target: 2, xpReward: 20, type: "session" },
  { id: "session-08", text: "Sessão de fim de semana. Intermezzo pede tempo sem pressa", target: 1, xpReward: 10, type: "session" },
  { id: "session-09", text: "Leia no transporte público. Bentinho também lia de trem", target: 1, xpReward: 10, type: "session" },
  { id: "session-10", text: "Sessão de 30min sem trocar de livro no meio", target: 1, xpReward: 10, type: "session" },
  { id: "session-11", text: "Sessão logo depois de acordar — antes do primeiro scroll do dia", target: 1, xpReward: 10, type: "session" },
  { id: "session-12", text: "Leia no Modo Foco por 20min seguidos. Big Brother do Orwell não te vigiou tanto", target: 1, xpReward: 10, type: "session" },
  { id: "session-13", text: "Sessão sem Spotify nem som ambiente — só você e a página, tipo Clarice", target: 1, xpReward: 10, type: "session" },
  { id: "session-14", text: "Uma sessão hoje, nem que seja curta. James de Percival Everett também começa devagar", target: 1, xpReward: 10, type: "session" },
  { id: "session-15", text: "Sessão de almoço — Machado também lia nos intervalos", target: 1, xpReward: 10, type: "session" },
  { id: "session-16", text: "Leia num lugar novo hoje. Mudar de cenário ajuda até o Riobaldo", target: 1, xpReward: 10, type: "session" },
  { id: "session-17", text: "Sessão em Modo Foco de 45min. Yellowface prende assim, sem parar", target: 1, xpReward: 10, type: "session" },
  { id: "session-18", text: "Leia antes de dormir. Menos feed, mais Torto Arado", target: 1, xpReward: 10, type: "session" },
  { id: "session-19", text: "Sessão de sábado de manhã cedo — hora que só a Capi te vê acordado", target: 1, xpReward: 10, type: "session" },
  { id: "session-20", text: "Duas sessões curtas em vez de uma longa. Babel também se lê aos poucos", target: 2, xpReward: 20, type: "session" },
  { id: "session-21", text: "Sessão sem pausar até o alarme tocar. Foco de Capitu, sem dissimulação", target: 1, xpReward: 10, type: "session" },
  { id: "session-22", text: "Leia no intervalo do trabalho. Lima Barreto também escrevia entre expedientes", target: 1, xpReward: 10, type: "session" },
  { id: "session-23", text: "Sessão de chuva lá fora, livro aqui dentro", target: 1, xpReward: 10, type: "session" },
  { id: "session-24", text: "Sessão hoje mesmo se for só 10 min. Tomorrow, and Tomorrow, and Tomorrow também começa num nível só", target: 1, xpReward: 10, type: "session" },
  { id: "session-25", text: "Leia num dia de semana corrido — Eça também escrevia contra o relógio", target: 1, xpReward: 10, type: "session" },
  { id: "session-26", text: "Sessão em Modo Foco pra fechar um capítulo inteiro sem distração", target: 1, xpReward: 10, type: "session" },
  { id: "session-27", text: "Leia de manhã bem cedo. Drummond também madrugava com a lua ainda no céu", target: 1, xpReward: 10, type: "session" },
  { id: "session-28", text: "Sessão hoje ligada ao Spotify — trilha sonora própria pra sua leitura", target: 1, xpReward: 10, type: "session" },
  { id: "session-29", text: "Sessão sem pausa pro banheiro nem pra cozinha — Kafka aguentava menos", target: 1, xpReward: 10, type: "session" },
  { id: "session-30", text: "Leia antes do primeiro compromisso do dia", target: 1, xpReward: 10, type: "session" },
  { id: "session-31", text: "Sessão de fim de tarde — luz de Clarice atravessando a janela", target: 1, xpReward: 10, type: "session" },
  { id: "session-32", text: "Sessão dupla hoje: manhã e noite. Como Riobaldo, sem largar a travessia", target: 2, xpReward: 20, type: "session" },
  { id: "session-33", text: "Leia parado num lugar só, sem trocar de cômodo — Vidas Secas também não sai do lugar rápido", target: 1, xpReward: 10, type: "session" },
  { id: "session-34", text: "Sessão hoje mesmo estando cansado. Fabiano de Vidas Secas também tava", target: 1, xpReward: 10, type: "session" },
  { id: "session-35", text: "Leia num domingo de chuva. Combina com Eliane Brum", target: 1, xpReward: 10, type: "session" },
  { id: "session-36", text: "Sessão em silêncio total — nem passarinho, só página", target: 1, xpReward: 10, type: "session" },
  { id: "session-37", text: "Leia antes de checar qualquer rede social hoje", target: 1, xpReward: 10, type: "session" },
  { id: "session-38", text: "Sessão focada em terminar o capítulo que você parou. Sem trapaça, como Machado pedia", target: 1, xpReward: 10, type: "session" },
  { id: "session-39", text: "Sessão com o celular em outro cômodo — Modo Foco de verdade", target: 1, xpReward: 10, type: "session" },
  { id: "session-40", text: "Leia hoje mesmo sem meta de páginas — só o hábito importa", target: 1, xpReward: 10, type: "session" },
];

const VOCAB_TARGETS = [1, 2, 3];
const VOCAB_FLAVORS = [
  "Capitu agradece o repertório",
  "Coleciona como Bentinho colecionava ciúme",
  "Intermezzo tem camadas — seu vocabulário também",
  "Babel é sobre palavras que mudam mundos — a sua muda frases",
  "Djamila Ribeiro escolhe cada palavra com cuidado, você também pode",
  "Eliane Brum garimpa palavra por palavra em Banzeiro Òkòtó",
  "Guimarães Rosa inventava palavra quando faltava uma — você só anota as que já existem",
  "Clarice escrevia sobre o que as palavras não alcançam — comece pelas que alcançam",
  "Machado tinha um vocabulário enorme, o seu cresce palavra por palavra",
  "Ana Maria Gonçalves pesquisou séculos de vocabulário pra Um Defeito de Cor",
];

const VOCAB_MISSIONS: MissionTemplate[] = VOCAB_TARGETS.flatMap((target) =>
  VOCAB_FLAVORS.map((flavor, fi) => ({
    id: `vocab-${target}-${fi}`,
    text:
      target === 1
        ? `Salve uma palavra nova. ${flavor}`
        : `Salve ${target} palavras novas. ${flavor}`,
    target,
    xpReward: 10,
    type: "vocabulary" as const,
  }))
);

const SHARE_FLAVORS = [
  "Vire influencer de página",
  "Fourth Wing virou trend — sua leitura também pode",
  "O algoritmo chora, Machado sorri",
  "Menos scroll, mais Drummond no feed",
  "Eça aprovaria essa sessão nos Stories",
  "Intermezzo de Sally Rooney também virou card por aí",
  "Marketing orgânico de Machado — cinco cards e ele te agradece",
  "O Problema dos 3 Corpos tem solução, compartilhar sua leitura é mais fácil",
  "Torto Arado merece aparecer no feed de alguém",
  "James de Percival Everett também rendeu card bonito por aí",
  "Yellowface engana todo mundo — seu card de leitura não engana ninguém, é real",
  "Capitu não desconfiou de nada, poste sem medo",
  "Lessons in Chemistry vira química boa nos Stories também",
  "Babel rendeu resenha em todo canto — a sua também merece",
  "Um Defeito de Cor tem quase mil páginas pra render mil cards",
  "Vira card, vira prova de que você realmente leu",
  "A Hora da Estrela também merece um close no feed",
  "Sua sequência de fôlego é mais interessante que a maioria dos stories por aí",
  "Compartilha antes que o hype do livro passe",
  "Card bonito não é vaidade, é arquivo — Clarice guardava tudo também",
];

const SHARE_MISSIONS: MissionTemplate[] = SHARE_FLAVORS.map((flavor, fi) => ({
  id: `share-${fi}`,
  text: `Compartilhe um card. ${flavor}`,
  target: 1,
  xpReward: 10,
  type: "share" as const,
}));

const PACE_TARGETS = [1.0, 1.2, 1.5, 1.8];
const PACE_FLAVORS = [
  "Olhos de ressaca em alta rotação, tipo Capitu",
  "Passe rápido como quem não quer largar o livro",
  "Ritmo de quem já tá no clima de Fourth Wing",
  "Nem o Big Brother do Orwell te acompanharia nesse ritmo",
  "Ritmo de maratona Saramago",
];

const PACE_MISSIONS: MissionTemplate[] = PACE_TARGETS.flatMap((target, ti) =>
  PACE_FLAVORS.map((flavor, fi) => ({
    id: `pace-${ti}-${fi}`,
    text: `Bata ${target.toFixed(1)} págs/min numa sessão. ${flavor}`,
    target,
    xpReward: 10,
    type: "pace" as const,
  }))
);

const LIBRARY_FLAVORS = [
  "O Eça espera há séculos",
  "Sua estante tem espaço pra mais um",
  "Torto Arado não se lê sozinho na prateleira de outra pessoa",
  "Um livro novo hoje, uma travessia amanhã",
  "Guimarães Rosa dizia que travessia é o nome disso — comece uma",
  "James de Percival Everett merece um lugar na sua fila",
  "Marque como 'quero ler' e já é um começo",
  "Babel, Intermezzo, Torto Arado — a fila também é parte da leitura",
  "Toda estante boa começa com um livro só",
  "Um Defeito de Cor tem quase mil páginas — melhor já adicionar cedo",
  "Vidas Secas cabe fácil numa tarde livre — adicione e planeje",
  "Yellowface é rápido de ler, mas primeiro precisa entrar na estante",
  "Lessons in Chemistry combina com uma tarde de sábado — adicione pra não esquecer",
  "Fourth Wing sozinho já enche uma prateleira de expectativa",
  "Machado, Guimarães, Itamar Vieira Jr. — sua estante nacional agradece",
  "Clarice, Conceição, Carolina — nomes que merecem estar na sua lista",
  "Djamila Ribeiro tem título esperando sua atenção",
  "Eliane Brum documentou o Brasil inteiro — comece por um livro dela",
  "O Problema dos 3 Corpos rende trilogia — adicione o primeiro",
  "Toda leitura começa com o toque de 'adicionar'",
];

const LIBRARY_MISSIONS: MissionTemplate[] = LIBRARY_FLAVORS.map((flavor, fi) => ({
  id: `library-${fi}`,
  text: `Adicione um livro à estante. ${flavor}`,
  target: 1,
  xpReward: 10,
  type: "library" as const,
}));

export const MISSION_TEMPLATES: MissionTemplate[] = [
  ...PAGES_MISSIONS,
  ...SESSION_MISSIONS,
  ...VOCAB_MISSIONS,
  ...SHARE_MISSIONS,
  ...PACE_MISSIONS,
  ...LIBRARY_MISSIONS,
];

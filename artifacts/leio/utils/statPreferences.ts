export type StatKey = "pages" | "duration" | "pace" | "streak" | "percent";

export interface StatDef {
  key: StatKey;
  label: string;
  cardLabel: string;
  description: string;
  icon: string;
}

export const ALL_STATS: StatDef[] = [
  {
    key: "pages",
    label: "Páginas",
    cardLabel: "páginas",
    description: "Páginas lidas na sessão",
    icon: "document-text-outline",
  },
  {
    key: "duration",
    label: "Tempo",
    cardLabel: "tempo",
    description: "Duração da sessão",
    icon: "time-outline",
  },
  {
    key: "pace",
    label: "Velocidade",
    cardLabel: "págs/min",
    description: "Ritmo de leitura",
    icon: "speedometer-outline",
  },
  {
    key: "streak",
    label: "Sequência",
    cardLabel: "dias seguidos",
    description: "Dias consecutivos lendo",
    icon: "flame-outline",
  },
  {
    key: "percent",
    label: "Progresso",
    cardLabel: "do livro",
    description: "Porcentagem do livro concluída",
    icon: "pie-chart-outline",
  },
];

export const DEFAULT_STAT_KEYS: StatKey[] = ["pages", "duration", "pace"];
export const STAT_PREFS_STORAGE_KEY = "@leio/share_stat_prefs_v1";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  hasNotificationPermission,
  scheduleDailyReminder,
} from "@/services/notifications";
import {
  clearTokens as clearSpotifyTokens,
  fetchNowPlaying,
  loadTokens as loadSpotifyTokens,
  SPOTIFY_ENABLED,
  startAuthFlow as startSpotifyAuth,
  type NowPlaying,
} from "@/services/spotify";

const NOTIF_ENABLED_KEY = "leio:notifications-enabled";
const CLUBS_KEY = "leio:book-clubs";

export type BookStatus = "reading" | "read" | "want" | "abandoned";
export type CapiVariant = "default" | "vampire" | "erudite" | "terror" | "classico" | "romance" | "scifi";
export type CapiState =
  | "reading"
  | "sad"
  | "celebrating"
  | "sleeping"
  | "surprised"
  | "waving"
  | "motivating";

export interface Book {
  id: string;
  title: string;
  author: string;
  authorGender?: "M" | "F" | "NB";
  authorNationality?: string;
  genre: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  coverColor: string;
  addedAt: string;
  finishedAt?: string;
  lastSessionAt?: string;
  pace?: number;
  isFree?: boolean;
  freeUrl?: string;
  isbn?: string;
  description?: string;
  coverImage?: string;
  authorImage?: string;
  excerpt?: string;
  downloadSources?: { label: string; url: string }[];
  purchasedAt?: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  text: string;
  bgVariant: "volt" | "noir" | "cream" | "coral";
  createdAt: string;
  cfi?: string;
}

export interface Session {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  durationSeconds: number;
  pace: number;
  date: string;
  isFocusMode?: boolean;
  focusExitSeconds?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: string;
  xpReward: number;
}

export interface Mission {
  id: string;
  text: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  type: "pages" | "session" | "share" | "vocabulary" | "pace";
  date: string;
}

export interface VocabularyEntry {
  id: string;
  bookId: string;
  word: string;
  definition: string;
  phonetic?: string;
  savedAt: string;
}

export interface ClubMemberProgress {
  memberName: string;
  currentPage: number;
  totalPages: number;
  lastUpdated: string;
}

export interface ClubHighlight {
  id: string;
  memberName: string;
  page: number;
  quote?: string;
  addedAt: string;
}

export interface BookClub {
  id: string;
  groupId: string;
  bookId?: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverImage?: string;
  bookCoverColor?: string;
  meetingDate: string;
  memberProgress: ClubMemberProgress[];
  highlights: ClubHighlight[];
  closedAt?: string;
}

export type SharedCardTemplateId = "storiesPhoto" | "framed" | "classic";

export interface SharedCard {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverColor: string;
  pages: number;
  durationSeconds: number;
  pace: number;
  template: SharedCardTemplateId;
  sharedAt: string;
  thumbnailUri?: string;
}

export interface AppSettings {
  theme: "dark" | "light";
  soundEffects: boolean;
  ambientDefault: string;
  notificationTime: string;
  capiVariant: CapiVariant;
  hasCompletedOnboarding: boolean;
  hasCompletedCalibration: boolean;
  calibrationPace: number;
}

const GENRE_LABELS: Record<string, string> = {
  romance: "Romance",
  ficcaoCientifica: "Ficção Científica",
  fantasia: "Fantasia",
  terror: "Terror/Suspense",
  literaturaBrasileira: "Literatura Brasileira",
  classicos: "Clássicos",
  filosofia: "Filosofia",
  autoajuda: "Autoajuda",
  negocios: "Negócios",
  biografia: "Biografia",
  historia: "História",
  outros: "Outros",
};

export { GENRE_LABELS };

const COVER_COLORS = [
  "#1A1A2E",
  "#16213E",
  "#0F3460",
  "#533483",
  "#2C3E50",
  "#27AE60",
  "#8E44AD",
  "#E74C3C",
  "#D35400",
  "#1ABC9C",
];

const ALL_BADGES: Badge[] = [
  {
    id: "first_session",
    name: "Capítulo Um",
    description: "Primeira sessão no caderno. Bem-vindo ao clube.",
    icon: "footsteps",
    unlocked: false,
    category: "inicio",
    xpReward: 50,
  },
  {
    id: "speed_reader",
    name: "Capitu Veloz",
    description: "Passou de 2 págs/min. Olhos de ressaca em alta rotação.",
    icon: "flash",
    unlocked: false,
    category: "ritmo",
    xpReward: 75,
  },
  {
    id: "night_owl",
    name: "Insônia de Bentinho",
    description: "Leu depois da meia-noite. O ciúme dorme, você não.",
    icon: "moon",
    unlocked: false,
    category: "habito",
    xpReward: 40,
  },
  {
    id: "early_bird",
    name: "Antes do Galo",
    description: "Abriu o livro antes das 7h. Carolina Maria de Jesus escrevia o Quarto de Despejo de madrugada. Você está no nível.",
    icon: "sunny",
    unlocked: false,
    category: "habito",
    xpReward: 40,
  },
  {
    id: "marathon",
    name: "Maratona Saramago",
    description: "100 páginas num dia. Fourth Wing tem 800 — você tá aquecendo.",
    icon: "fitness",
    unlocked: false,
    category: "volume",
    xpReward: 150,
  },
  {
    id: "folego_7",
    name: "Sete Dias de Riobaldo",
    description: "Uma semana inteira sem largar. Travessia.",
    icon: "flame",
    unlocked: false,
    category: "sequencia",
    xpReward: 100,
  },
  {
    id: "folego_30",
    name: "Travessia de Riobaldo",
    description: "30 dias seguidos. Travessia inteira sem largar o livro.",
    icon: "trophy",
    unlocked: false,
    category: "sequencia",
    xpReward: 500,
  },
  {
    id: "first_book",
    name: "Última Página",
    description: "Fechou seu primeiro livro no app. Sem trapaça.",
    icon: "checkmark-circle",
    unlocked: false,
    category: "conquista",
    xpReward: 100,
  },
  {
    id: "five_books",
    name: "Estante Própria",
    description: "Cinco livros lidos. Já dá pra fingir erudição na mesa do bar.",
    icon: "library",
    unlocked: false,
    category: "conquista",
    xpReward: 200,
  },
  {
    id: "foco_total",
    name: "Sem Olhar pro Lado",
    description: "Sessão no Modo Foco sem fugir. Big Brother orgulhoso.",
    icon: "eye",
    unlocked: false,
    category: "modo",
    xpReward: 80,
  },
  {
    id: "concentrado",
    name: "Disciplina Drummondiana",
    description: "Cinco sessões com foco total. No meio do caminho, leitura.",
    icon: "shield-checkmark",
    unlocked: false,
    category: "modo",
    xpReward: 120,
  },
  {
    id: "rescue",
    name: "Volta do Padre Amaro",
    description: "Resgatou um livro esquecido há 30+ dias. Eça agradece.",
    icon: "heart",
    unlocked: false,
    category: "conquista",
    xpReward: 200,
  },
  {
    id: "polyglot",
    name: "Caderno de Bentinho",
    description: "50 palavras no vocabulário. Coleciona como ele colecionava ciúme.",
    icon: "language",
    unlocked: false,
    category: "vocabulario",
    xpReward: 100,
  },
  {
    id: "duo",
    name: "Capitu & Bentinho",
    description: "Terminou um livro em Leitura em Conjunto. Sem dissimulação.",
    icon: "people",
    unlocked: false,
    category: "social",
    xpReward: 150,
  },
  {
    id: "card_sharer",
    name: "Trecho no Feed",
    description: "Cinco cards compartilhados. Marketing orgânico de Machado.",
    icon: "share-social",
    unlocked: false,
    category: "social",
    xpReward: 75,
  },
  {
    id: "goal_crusher",
    name: "Antes do Prazo",
    description: "Fechou um livro antes do combinado. Kafka invejaria.",
    icon: "calendar-check",
    unlocked: false,
    category: "metas",
    xpReward: 120,
  },
  {
    id: "diversidade",
    name: "Passaporte de Estante",
    description: "Autores de cinco países diferentes. Sem visto, só vista.",
    icon: "globe",
    unlocked: false,
    category: "diversidade",
    xpReward: 100,
  },
];

const SEED_BOOKS: Book[] = [
  {
    id: "book-1",
    title: "O Alquimista",
    author: "Paulo Coelho",
    authorGender: "M",
    authorNationality: "BR",
    genre: "romance",
    totalPages: 244,
    currentPage: 180,
    status: "reading",
    coverColor: "#8B4513",
    addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastSessionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pace: 1.2,
  },
  {
    id: "book-2",
    title: "1984",
    author: "George Orwell",
    authorGender: "M",
    authorNationality: "GB",
    genre: "ficcaoCientifica",
    totalPages: 328,
    currentPage: 328,
    status: "read",
    coverColor: "#2C3E50",
    addedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pace: 1.5,
  },
  {
    id: "book-3",
    title: "A Hora da Estrela",
    author: "Clarice Lispector",
    authorGender: "F",
    authorNationality: "BR",
    genre: "literaturaBrasileira",
    totalPages: 88,
    currentPage: 67,
    status: "reading",
    coverColor: "#6C3483",
    addedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    lastSessionAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    pace: 0.9,
  },
  {
    id: "book-4",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    authorGender: "M",
    authorNationality: "BR",
    genre: "literaturaBrasileira",
    totalPages: 256,
    currentPage: 0,
    status: "want",
    coverColor: "#1A5C2A",
    addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isFree: true,
    freeUrl: "https://www.dominiopublico.gov.br",
  },
  {
    id: "book-5",
    title: "O Processo",
    author: "Franz Kafka",
    authorGender: "M",
    authorNationality: "CZ",
    genre: "classicos",
    totalPages: 246,
    currentPage: 0,
    status: "want",
    coverColor: "#1C1C2E",
    addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const FREE_BOOKS: Book[] = [
  {
    id: "free-1",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    authorGender: "M",
    authorNationality: "BR",
    genre: "literaturaBrasileira",
    totalPages: 256,
    currentPage: 0,
    status: "want",
    coverColor: "#1A5C2A",
    addedAt: new Date().toISOString(),
    isFree: true,
    freeUrl: "https://www.dominiopublico.gov.br/Download/texto/bv000178.pdf",
    excerpt:
      "Uma noite destas, vindo da cidade para o Engenho Novo, encontrei num trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos.\n\nA viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso.\n\n— Continue, disse eu acordando.\n\n— Já acabei, murmurou ele.\n\nE se algum dos meus leitores quiser saber se aquele moço era poeta ou prosador, e o que ele dizia ou cantava, basta que abra estas páginas a um capítulo qualquer, e verá que falo dele e dos versos: chamava-se Escobar, e os versos eram dele.",
    downloadSources: [
      { label: "Domínio Público (PDF)", url: "https://www.dominiopublico.gov.br/Download/texto/bv000178.pdf" },
      { label: "Project Gutenberg (EPUB)", url: "https://www.gutenberg.org/ebooks/55752" },
      { label: "Wikisource", url: "https://pt.wikisource.org/wiki/Dom_Casmurro" },
    ],
  },
  {
    id: "free-2",
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    authorGender: "M",
    authorNationality: "BR",
    genre: "literaturaBrasileira",
    totalPages: 248,
    currentPage: 0,
    status: "want",
    coverColor: "#2C3E50",
    addedAt: new Date().toISOString(),
    isFree: true,
    freeUrl: "https://www.dominiopublico.gov.br/Download/texto/bv000180.pdf",
    excerpt:
      "Algum tempo hesitei se devia abrir estas memórias pelo princípio ou pelo fim, isto é, se poria em primeiro lugar o meu nascimento ou a minha morte. Suposto o uso vulgar seja começar pelo nascimento, duas considerações me levaram a adotar diferente método: a primeira é que eu não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço; a segunda é que o escrito ficaria assim mais galante e mais novo.\n\nMoisés, que também contou a sua morte, não a pôs no introito, mas no cabo: diferença radical entre este livro e o Pentateuco.\n\nDito isto, expirei às duas horas da tarde de uma sexta-feira do mês de agosto de 1869, na minha bela chácara de Catumbi. Tinha uns sessenta e quatro anos, rijos e prósperos, era solteiro, possuía cerca de trezentos contos e fui acompanhado ao cemitério por onze amigos.\n\nOnze amigos! Verdade é que não houve cartas nem anúncios. Acresce que chovia — peneirava uma chuvinha miúda, triste e constante, tão constante e tão triste, que levou um daqueles fiéis da última hora a interpolar esta engenhosa idéia no discurso que proferiu à beira de minha cova.",
    downloadSources: [
      { label: "Domínio Público (PDF)", url: "https://www.dominiopublico.gov.br/Download/texto/bv000180.pdf" },
      { label: "Project Gutenberg (EPUB)", url: "https://www.gutenberg.org/ebooks/54829" },
      { label: "Wikisource", url: "https://pt.wikisource.org/wiki/Mem%C3%B3rias_P%C3%B3stumas_de_Br%C3%A1s_Cubas" },
    ],
  },
  {
    id: "free-3",
    title: "Triste Fim de Policarpo Quaresma",
    author: "Lima Barreto",
    authorGender: "M",
    authorNationality: "BR",
    genre: "literaturaBrasileira",
    totalPages: 192,
    currentPage: 0,
    status: "want",
    coverColor: "#8B4513",
    addedAt: new Date().toISOString(),
    isFree: true,
    freeUrl: "https://www.dominiopublico.gov.br/Download/texto/bv000167.pdf",
    excerpt:
      "Quaresma, Policarpo Quaresma, comumente conhecido por Major Quaresma, dava entrada em casa todos os dias às quatro e um quarto da tarde, com regularidade de relógio. Surgia na estação das Neves, vindo da cidade pelo trem subúrbio das três e quarenta, fazia uma escala curta na venda Do Mata-Borrão, onde tomava o seu vermute, e atalhava por uma travessa, em rumo de casa.\n\nMorava só, com uma irmã solteira, em uma chácara afastada, onde, além das obrigações de Subsecretário do Arsenal de Guerra, se entregava a leituras e ao estudo das coisas pátrias, fossem geográficas, históricas, literárias e sociais.\n\nO major era homem grave, e nas suas palavras e gestos sempre se notava certa solenidade que impunha respeito; mas era também o homem mais simples e bom que se poderia conhecer.\n\nFalava pouco e quase sempre com toda a gente do que tinha lido nos seus livros sobre o Brasil. E o Brasil, para Quaresma, era a maior das nações.",
    downloadSources: [
      { label: "Domínio Público (PDF)", url: "https://www.dominiopublico.gov.br/Download/texto/bv000167.pdf" },
      { label: "Wikisource", url: "https://pt.wikisource.org/wiki/Triste_fim_de_Policarpo_Quaresma" },
    ],
  },
  {
    id: "free-4",
    title: "O Crime do Padre Amaro",
    author: "Eça de Queirós",
    authorGender: "M",
    authorNationality: "PT",
    genre: "classicos",
    totalPages: 420,
    currentPage: 0,
    status: "want",
    coverColor: "#2E4053",
    addedAt: new Date().toISOString(),
    isFree: true,
    freeUrl: "https://www.dominiopublico.gov.br/Download/texto/eq000004.pdf",
    excerpt:
      "Foi num domingo de Páscoa que se soube em Leiria que o pároco da Sé, José Migueis, tinha morrido de madrugada com uma apoplexia. O pároco era um homem sangüíneo e nutrido, considerado a maravilha da Diocese pela sua voracidade gulosa.\n\nContavam-se histórias singulares dum seu enguiço com pão, um leitão recheado de presunto na véspera de S. Luís; outras vezes, na Quaresma, atrás duma porção de feijões frade com cabeça de bacalhau, ficara amarelo e raivoso, suspirando, gemendo, com a barriga estoirada, repetindo:\n\n— Que falta de senso, que falta de senso!\n\nA cidade lamentou-o: era um homem activo, que conhecia bem a sua igreja, prudente, com uma palavra para cada pessoa, hábil na confissão, hábil na pregação, com a missa rezada num ar grave de autoridade.",
    downloadSources: [
      { label: "Domínio Público (PDF)", url: "https://www.dominiopublico.gov.br/Download/texto/eq000004.pdf" },
      { label: "Project Gutenberg (EPUB)", url: "https://www.gutenberg.org/ebooks/16384" },
      { label: "Wikisource", url: "https://pt.wikisource.org/wiki/O_Crime_do_Padre_Amaro" },
    ],
  },
  {
    id: "free-5",
    title: "A Metamorfose",
    author: "Franz Kafka",
    authorGender: "M",
    authorNationality: "CZ",
    genre: "classicos",
    totalPages: 96,
    currentPage: 0,
    status: "want",
    coverColor: "#1C2833",
    addedAt: new Date().toISOString(),
    isFree: true,
    freeUrl: "https://www.gutenberg.org/ebooks/5200",
    excerpt:
      "Quando, certa manhã, Gregor Samsa acordou de sonhos intranquilos, encontrou-se em sua cama metamorfoseado num inseto monstruoso. Estava deitado sobre suas costas duras como couraça e, ao levantar um pouco a cabeça, viu seu ventre abaulado, marrom, dividido por nervuras arqueadas, em cujo topo a coberta, prestes a deslizar de vez, ainda mal se sustinha.\n\nSuas numerosas pernas, lastimavelmente finas em comparação com o volume do resto do corpo, tremulavam desamparadas diante de seus olhos.\n\nQue me aconteceu?, pensou. Não era um sonho. O seu quarto, um autêntico quarto humano, embora um tanto pequeno demais, permanecia calmo entre as quatro paredes bem conhecidas.\n\nAcima da mesa, em que se achava espalhada uma coleção de amostras de fazendas — Samsa era caixeiro-viajante —, estava pendurado o quadro que recentemente havia recortado de uma revista ilustrada e colocara em uma bonita moldura dourada.",
    downloadSources: [
      { label: "Project Gutenberg (EPUB)", url: "https://www.gutenberg.org/ebooks/5200" },
      { label: "Wikisource (PT)", url: "https://pt.wikisource.org/wiki/A_Metamorfose" },
    ],
  },
  {
    id: "free-6",
    title: "Vidas Secas",
    author: "Graciliano Ramos",
    authorGender: "M",
    authorNationality: "BR",
    genre: "literaturaBrasileira",
    totalPages: 176,
    currentPage: 0,
    status: "want",
    coverColor: "#B7950B",
    addedAt: new Date().toISOString(),
    isFree: true,
    freeUrl: "https://www.dominiopublico.gov.br",
    excerpt:
      "Na planície avermelhada os juazeiros alargavam duas manchas verdes. Os infelizes tinham caminhado o dia inteiro, estavam cansados e famintos. Ordinariamente andavam pouco, mas como haviam repousado bastante na areia do rio seco, a viagem progredira bem três léguas.\n\nFazia horas que procuravam uma sombra. A folhagem dos juazeiros apareceu longe, através dos galhos pelados da catinga rala.\n\nArrastaram-se para lá, devagar, sinha Vitória com o filho mais novo escanchado no quarto e o baú de folha na cabeça, Fabiano sombrio, cambaio, o aió a tiracolo, a cuia pendurada numa correia presa ao cinturão, a espingarda de pederneira no ombro.\n\nO menino mais velho e a cachorra Baleia iam atrás. Os juazeiros aproximaram-se, recuaram, sumiram-se. O menino mais velho pôs-se a chorar, sentou-se no chão.",
    downloadSources: [
      { label: "Wikisource (excertos)", url: "https://pt.wikisource.org/wiki/Vidas_secas" },
    ],
  },
];

const SEED_SESSIONS: Session[] = [
  {
    id: "sess-1",
    bookId: "book-1",
    startPage: 160,
    endPage: 180,
    durationSeconds: 1800,
    pace: 1.1,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sess-2",
    bookId: "book-1",
    startPage: 140,
    endPage: 160,
    durationSeconds: 2100,
    pace: 1.0,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sess-3",
    bookId: "book-2",
    startPage: 280,
    endPage: 328,
    durationSeconds: 2700,
    pace: 1.5,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function generateDailyMissions(date: string): Mission[] {
  const dateHash = date.split("T")[0].replace(/-/g, "");
  const hash = parseInt(dateHash) % 10;

  const missionSets: Mission[][] = [
    [
      {
        id: `m1-${date}`,
        text: "Vire 20 páginas hoje (Machado virava mais)",
        target: 20,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "pages",
        date,
      },
      {
        id: `m2-${date}`,
        text: "Uma sessão de 15min — menos que um rolê no feed",
        target: 1,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "session",
        date,
      },
      {
        id: `m3-${date}`,
        text: "Compartilhe um card. Vire influencer de página",
        target: 1,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "share",
        date,
      },
    ],
    [
      {
        id: `m1-${date}`,
        text: "30 páginas hoje. Saramago não usava parágrafo, você não tem desculpa",
        target: 30,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "pages",
        date,
      },
      {
        id: `m2-${date}`,
        text: "Salve uma palavra nova. Capitu agradece o repertório",
        target: 1,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "vocabulary",
        date,
      },
      {
        id: `m3-${date}`,
        text: "Adicione um livro à estante. O Eça espera há séculos",
        target: 1,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "session",
        date,
      },
    ],
    [
      {
        id: `m1-${date}`,
        text: "50 páginas. Torto Arado foi lido por milhões — bora chegar lá",
        target: 50,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "pages",
        date,
      },
      {
        id: `m2-${date}`,
        text: "Sessão no Modo Foco. A Mulher na Janela não se distraiu — você também não",
        target: 1,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "session",
        date,
      },
      {
        id: `m3-${date}`,
        text: "Anote uma palavra. Intermezzo tem camadas — seu vocabulário também",
        target: 1,
        progress: 0,
        xpReward: 10,
        completed: false,
        type: "vocabulary",
        date,
      },
    ],
  ];

  return missionSets[hash % missionSets.length];
}

const LEVELS = [
  { name: "Marcador de Página", minXP: 0 },
  { name: "Leitor de Metrô", minXP: 100 },
  { name: "Devorador de Orelhas", minXP: 300 },
  { name: "Crítico de Mesa de Bar", minXP: 600 },
  { name: "Bibliófilo Indomável", minXP: 1000 },
  { name: "Lenda da Estante", minXP: 2000 },
];

export function getLevel(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[Math.min(i + 1, LEVELS.length - 1)];
      break;
    }
  }
  return { current, next };
}

interface AppContextType {
  books: Book[];
  sessions: Session[];
  badges: Badge[];
  missions: Mission[];
  vocabulary: VocabularyEntry[];
  highlights: Highlight[];
  sharedCards: SharedCard[];
  settings: AppSettings;
  folego: number;
  folegoGuardado: number;
  xp: number;
  cardsSharedCount: number;
  isLoaded: boolean;
  freeBooks: Book[];
  addHighlight: (h: Omit<Highlight, "id" | "createdAt">) => Highlight;
  removeHighlight: (id: string) => void;
  getHighlightsForBook: (bookId: string) => Highlight[];
  addBook: (book: Omit<Book, "id" | "addedAt">) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  removeBook: (id: string) => void;
  addSession: (session: Omit<Session, "id">) => void;
  completeMission: (missionId: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  checkAndUnlockBadges: (session?: Session) => void;
  earnXP: (amount: number) => void;
  addVocabularyEntry: (
    entry: Omit<VocabularyEntry, "id" | "savedAt">
  ) => void;
  removeVocabularyEntry: (id: string) => void;
  progressShareMission: () => boolean;
  addSharedCard: (
    card: Omit<SharedCard, "id" | "sharedAt" | "thumbnailUri">,
    imageUri: string
  ) => Promise<void>;
  getBookById: (id: string) => Book | undefined;
  getAbandoned: () => Book[];
  getCurrentBook: () => Book | undefined;
  capiState: CapiState;
  setCapiState: (state: CapiState) => void;
  spotifyEnabled: boolean;
  spotifyConnected: boolean;
  nowPlaying: NowPlaying | null;
  connectSpotify: () => Promise<boolean>;
  disconnectSpotify: () => Promise<void>;
  setReadingSessionActive: (active: boolean) => void;
  clubs: BookClub[];
  activateClub(groupId: string, bookInfo: Pick<BookClub, "bookId" | "bookTitle" | "bookAuthor" | "bookCoverImage" | "bookCoverColor">, meetingDate: string, memberNames: string[]): void;
  updateClubProgress(bookId: string, newPage: number, totalPages: number, memberName: string): void;
  addClubHighlight(groupId: string, memberName: string, page: number, quote?: string): void;
  closeClub(groupId: string): void;
  getActiveClub(groupId: string): BookClub | null;
  getActiveClubForBook(bookId: string): BookClub | null;
  getClubHistory(groupId: string): BookClub[];
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "@leio_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [badges, setBadges] = useState<Badge[]>(ALL_BADGES);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: "dark",
    soundEffects: true,
    ambientDefault: "cafe",
    notificationTime: "21:00",
    capiVariant: "default",
    hasCompletedOnboarding: false,
    hasCompletedCalibration: false,
    calibrationPace: 1.0,
  });
  const [folego, setFolego] = useState(4);
  const [folegoGuardado, setFolegoGuardado] = useState(2);
  const [xp, setXp] = useState(340);
  const [cardsSharedCount, setCardsSharedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sharedCards, setSharedCards] = useState<SharedCard[]>([]);
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [capiState, setCapiState] = useState<CapiState>("waving");
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [readingSessionActive, setReadingSessionActive] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    loadSpotifyTokens().then((t) => setSpotifyConnected(!!t));
  }, []);

  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (!spotifyConnected || !readingSessionActive) {
      setNowPlaying(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const np = await fetchNowPlaying();
      if (!cancelled) setNowPlaying(np);
    };
    tick();
    pollIntervalRef.current = setInterval(tick, 25000);
    return () => {
      cancelled = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [spotifyConnected, readingSessionActive]);

  const connectSpotify = useCallback(async () => {
    if (!SPOTIFY_ENABLED) return false;
    const tokens = await startSpotifyAuth();
    if (tokens) {
      setSpotifyConnected(true);
      return true;
    }
    return false;
  }, []);

  const disconnectSpotify = useCallback(async () => {
    await clearSpotifyTokens();
    setSpotifyConnected(false);
    setNowPlaying(null);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const enabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
        if (cancelled || enabled !== "true") return;
        const granted = await hasNotificationPermission();
        if (cancelled || !granted) return;
        const [h, m] = (settings.notificationTime ?? "19:00")
          .split(":")
          .map((v) => parseInt(v, 10));
        const hour = Number.isFinite(h) ? h : 19;
        const minute = Number.isFinite(m) ? m : 0;
        await scheduleDailyReminder(hour, minute, folego);
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, settings.notificationTime, folego]);

  async function loadData() {
    try {
      const [raw, clubsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CLUBS_KEY),
      ]);
      if (clubsRaw) setClubs(JSON.parse(clubsRaw));
      if (raw) {
        const data = JSON.parse(raw);
        setBooks(data.books ?? SEED_BOOKS);
        setSessions(data.sessions ?? SEED_SESSIONS);
        // Migrate persisted badges: keep only IDs that still exist in ALL_BADGES,
        // merge with current definitions so removed badges (e.g. "vagao") disappear.
        const validIds = new Set(ALL_BADGES.map((b) => b.id));
        const storedBadgeMap: Record<string, Badge> = {};
        (data.badges ?? []).forEach((b: Badge) => {
          if (validIds.has(b.id)) storedBadgeMap[b.id] = b;
        });
        const migratedBadges = ALL_BADGES.map((b) =>
          storedBadgeMap[b.id]
            ? { ...b, unlocked: storedBadgeMap[b.id].unlocked, unlockedAt: storedBadgeMap[b.id].unlockedAt }
            : b
        );
        setBadges(migratedBadges);
        setVocabulary(data.vocabulary ?? []);
        setHighlights(data.highlights ?? []);
        setSharedCards(data.sharedCards ?? []);
        setSettings(data.settings ?? settings);
        setFolego(data.folego ?? 4);
        setFolegoGuardado(data.folegoGuardado ?? 2);
        setXp(data.xp ?? 340);
        setCardsSharedCount(data.cardsSharedCount ?? 0);

        const today = new Date().toISOString().split("T")[0];
        const savedMissions = data.missions ?? [];
        const todaysMissions = savedMissions.filter((m: Mission) =>
          m.date?.startsWith(today)
        );
        if (todaysMissions.length === 0) {
          setMissions(generateDailyMissions(new Date().toISOString()));
        } else {
          setMissions(savedMissions);
        }
      } else {
        setBooks(SEED_BOOKS);
        setSessions(SEED_SESSIONS);
        setMissions(generateDailyMissions(new Date().toISOString()));
        const unlockedFirst = ALL_BADGES.map((b) =>
          b.id === "first_session" ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() } : b
        );
        setBadges(unlockedFirst);
        await saveData({
          books: SEED_BOOKS,
          sessions: SEED_SESSIONS,
          badges: unlockedFirst,
          vocabulary: [],
          settings,
          folego: 4,
          folegoGuardado: 2,
          xp: 340,
          cardsSharedCount: 0,
          missions: generateDailyMissions(new Date().toISOString()),
        });
      }
    } catch (e) {
      setBooks(SEED_BOOKS);
      setSessions(SEED_SESSIONS);
      setMissions(generateDailyMissions(new Date().toISOString()));
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveData(data: Record<string, unknown>) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // silent
    }
  }

  async function persistClubs(updated: BookClub[]) {
    setClubs(updated);
    try {
      await AsyncStorage.setItem(CLUBS_KEY, JSON.stringify(updated));
    } catch {
      // silent
    }
  }

  function persistState(overrides: Record<string, unknown> = {}) {
    saveData({
      books,
      sessions,
      badges,
      vocabulary,
      highlights,
      sharedCards,
      settings,
      folego,
      folegoGuardado,
      xp,
      cardsSharedCount,
      missions,
      ...overrides,
    });
  }

  const addBook = useCallback(
    (book: Omit<Book, "id" | "addedAt">) => {
      const newBook: Book = {
        ...book,
        id: `book-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };
      const updated = [...books, newBook];
      setBooks(updated);
      persistState({ books: updated });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const updateBook = useCallback(
    (id: string, updates: Partial<Book>) => {
      const updated = books.map((b) => (b.id === id ? { ...b, ...updates } : b));
      setBooks(updated);
      persistState({ books: updated });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const removeBook = useCallback(
    (id: string) => {
      const updated = books.filter((b) => b.id !== id);
      setBooks(updated);
      persistState({ books: updated });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const earnXP = useCallback(
    (amount: number) => {
      const newXp = xp + amount;
      setXp(newXp);
      persistState({ xp: newXp });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const addSession = useCallback(
    (sessionData: Omit<Session, "id">) => {
      const newSession: Session = {
        ...sessionData,
        id: `sess-${Date.now()}`,
      };
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);

      const book = books.find((b) => b.id === sessionData.bookId);
      let updatedBooks = books;
      if (book) {
        updatedBooks = books.map((b) =>
          b.id === sessionData.bookId
            ? {
                ...b,
                currentPage: sessionData.endPage,
                lastSessionAt: sessionData.date,
                pace: sessionData.pace,
                status:
                  sessionData.endPage >= b.totalPages ? "read" : b.status,
                finishedAt:
                  sessionData.endPage >= b.totalPages
                    ? new Date().toISOString()
                    : b.finishedAt,
              }
            : b
        );
        setBooks(updatedBooks);
      }

      const newXp = xp + Math.floor(sessionData.durationSeconds / 60) * 2;
      setXp(newXp);

      const newFolego = folego + 1;
      setFolego(newFolego);

      let missionXpBonus = 0;
      const updatedMissions = missions.map((m) => {
        if (m.completed) return m;
        if (m.type === "session") {
          const newProgress = m.progress + 1;
          const completed = newProgress >= m.target;
          if (completed) missionXpBonus += m.xpReward;
          return { ...m, progress: newProgress, completed };
        }
        if (m.type === "pages") {
          const pages = sessionData.endPage - sessionData.startPage;
          const newProgress = m.progress + pages;
          const completed = newProgress >= m.target;
          if (completed) missionXpBonus += m.xpReward;
          return { ...m, progress: newProgress, completed };
        }
        if (m.type === "pace" && sessionData.pace >= m.target) {
          missionXpBonus += m.xpReward;
          return { ...m, progress: m.target, completed: true };
        }
        return m;
      });
      setMissions(updatedMissions);

      const finalXp = newXp + missionXpBonus;
      if (missionXpBonus > 0) setXp(finalXp);

      persistState({
        sessions: updatedSessions,
        books: updatedBooks,
        xp: finalXp,
        folego: newFolego,
        missions: updatedMissions,
      });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const completeMission = useCallback(
    (missionId: string) => {
      const updated = missions.map((m) =>
        m.id === missionId ? { ...m, completed: true, progress: m.target } : m
      );
      setMissions(updated);
      const mission = missions.find((m) => m.id === missionId);
      if (mission) {
        const newXp = xp + mission.xpReward;
        setXp(newXp);
        persistState({ missions: updated, xp: newXp });
      }
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const checkAndUnlockBadges = useCallback(
    (session?: Session) => {
      const updatedBadges = badges.map((badge) => {
        if (badge.unlocked) return badge;
        let shouldUnlock = false;

        switch (badge.id) {
          case "first_session":
            shouldUnlock = sessions.length >= 1;
            break;
          case "speed_reader":
            shouldUnlock =
              session !== undefined && (session.pace ?? 0) >= 2.0;
            break;
          case "night_owl":
            if (session) {
              const hour = new Date(session.date).getHours();
              shouldUnlock = hour >= 0 && hour < 5;
            }
            break;
          case "early_bird":
            if (session) {
              const hour = new Date(session.date).getHours();
              shouldUnlock = hour >= 5 && hour < 7;
            }
            break;
          case "folego_7":
            shouldUnlock = folego >= 7;
            break;
          case "folego_30":
            shouldUnlock = folego >= 30;
            break;
          case "first_book":
            shouldUnlock = books.some((b) => b.status === "read");
            break;
          case "five_books":
            shouldUnlock = books.filter((b) => b.status === "read").length >= 5;
            break;
          case "foco_total":
            shouldUnlock =
              session !== undefined &&
              !!session.isFocusMode &&
              (session.focusExitSeconds ?? 0) === 0;
            break;
          case "polyglot":
            shouldUnlock = vocabulary.length >= 50;
            break;
          case "marathon":
            if (session) {
              const pages = session.endPage - session.startPage;
              shouldUnlock = pages >= 100;
            }
            break;
        }

        if (shouldUnlock) {
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return badge;
      });

      if (updatedBadges.some((b, i) => b.unlocked !== badges[i].unlocked)) {
        setBadges(updatedBadges);
        persistState({ badges: updatedBadges });
      }
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      const updated = { ...settings, ...updates };
      setSettings(updated);
      persistState({ settings: updated });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const addVocabularyEntry = useCallback(
    (entry: Omit<VocabularyEntry, "id" | "savedAt">) => {
      const newEntry: VocabularyEntry = {
        ...entry,
        id: `vocab-${Date.now()}`,
        savedAt: new Date().toISOString(),
      };
      const updated = [...vocabulary, newEntry];
      setVocabulary(updated);

      let missionXpBonus = 0;
      const updatedMissions = missions.map((m) => {
        if (m.completed || m.type !== "vocabulary") return m;
        const newProgress = m.progress + 1;
        const completed = newProgress >= m.target;
        if (completed) missionXpBonus += m.xpReward;
        return { ...m, progress: newProgress, completed };
      });
      setMissions(updatedMissions);
      const newXp = xp + missionXpBonus;
      if (missionXpBonus > 0) setXp(newXp);

      persistState({ vocabulary: updated, missions: updatedMissions, xp: newXp });
    },
    [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions]
  );

  const addSharedCard = useCallback(
    async (
      card: Omit<SharedCard, "id" | "sharedAt" | "thumbnailUri">,
      imageUri: string
    ) => {
      let thumbnailUri: string | undefined;
      try {
        const dir = `${FileSystem.documentDirectory}leio_cards/`;
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }
        const filename = `card_${Date.now()}.png`;
        const dest = `${dir}${filename}`;
        await FileSystem.copyAsync({ from: imageUri, to: dest });
        thumbnailUri = dest;
      } catch {
        // silent: card saved without image
      }
      const newCard: SharedCard = {
        ...card,
        id: `sc-${Date.now()}`,
        sharedAt: new Date().toISOString(),
        thumbnailUri,
      };
      const updated = [newCard, ...sharedCards];
      setSharedCards(updated);
      persistState({ sharedCards: updated });
    },
    [books, sessions, badges, vocabulary, highlights, sharedCards, settings, folego, folegoGuardado, xp, missions]
  );

  const progressShareMission = useCallback((): boolean => {
    let bonus = 0;
    let badgeUnlocked = false;

    const updatedMissions = missions.map((m) => {
      if (m.completed || m.type !== "share") return m;
      const newProgress = m.progress + 1;
      const completed = newProgress >= m.target;
      if (completed) bonus += m.xpReward;
      return { ...m, progress: newProgress, completed };
    });
    setMissions(updatedMissions);

    const newCount = cardsSharedCount + 1;
    setCardsSharedCount(newCount);

    let updatedBadges = badges;
    if (newCount >= 5) {
      const badge = badges.find((b) => b.id === "card_sharer");
      if (badge && !badge.unlocked) {
        updatedBadges = badges.map((b) =>
          b.id === "card_sharer"
            ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
            : b
        );
        setBadges(updatedBadges);
        bonus += badge.xpReward;
        badgeUnlocked = true;
      }
    }

    const newXp = xp + bonus;
    if (bonus > 0) setXp(newXp);

    persistState({
      missions: updatedMissions,
      xp: newXp,
      cardsSharedCount: newCount,
      badges: updatedBadges,
    });

    return badgeUnlocked;
  }, [books, sessions, badges, vocabulary, settings, folego, folegoGuardado, xp, missions, cardsSharedCount]);

  const getBookById = useCallback(
    (id: string) => books.find((b) => b.id === id) ?? FREE_BOOKS.find((b) => b.id === id),
    [books]
  );

  const getAbandoned = useCallback(
    () =>
      books.filter((b) => {
        if (b.status !== "reading") return false;
        if (!b.lastSessionAt) return false;
        const days =
          (Date.now() - new Date(b.lastSessionAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return days >= 14;
      }),
    [books]
  );

  const getCurrentBook = useCallback(
    () =>
      books.find(
        (b) =>
          b.status === "reading" &&
          (b.lastSessionAt
            ? Date.now() - new Date(b.lastSessionAt).getTime() <
              14 * 24 * 60 * 60 * 1000
            : true)
      ),
    [books]
  );

  const addHighlight = useCallback(
    (h: Omit<Highlight, "id" | "createdAt">) => {
      const newHighlight: Highlight = {
        ...h,
        id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [...highlights, newHighlight];
      setHighlights(updated);
      persistState({ highlights: updated });
      return newHighlight;
    },
    [books, sessions, badges, vocabulary, highlights, settings, folego, folegoGuardado, xp, missions]
  );

  const removeHighlight = useCallback(
    (id: string) => {
      const updated = highlights.filter((h) => h.id !== id);
      setHighlights(updated);
      persistState({ highlights: updated });
    },
    [books, sessions, badges, vocabulary, highlights, settings, folego, folegoGuardado, xp, missions]
  );

  const getHighlightsForBook = useCallback(
    (bookId: string) => highlights.filter((h) => h.bookId === bookId),
    [highlights]
  );

  const activateClub = useCallback(
    (
      groupId: string,
      bookInfo: Pick<BookClub, "bookId" | "bookTitle" | "bookAuthor" | "bookCoverImage" | "bookCoverColor">,
      meetingDate: string,
      memberNames: string[]
    ) => {
      if (clubs.some((c) => c.groupId === groupId && !c.closedAt)) return;
      const newClub: BookClub = {
        id: `club-${Date.now()}`,
        groupId,
        bookId: bookInfo.bookId,
        bookTitle: bookInfo.bookTitle,
        bookAuthor: bookInfo.bookAuthor,
        bookCoverImage: bookInfo.bookCoverImage,
        bookCoverColor: bookInfo.bookCoverColor,
        meetingDate,
        memberProgress: memberNames.map((name) => ({
          memberName: name,
          currentPage: 0,
          totalPages: 0,
          lastUpdated: new Date().toISOString(),
        })),
        highlights: [],
      };
      persistClubs([...clubs, newClub]);
    },
    [clubs]
  );

  const updateClubProgress = useCallback(
    (bookId: string, newPage: number, totalPages: number, memberName: string) => {
      const updated = clubs.map((c) => {
        if (c.bookId !== bookId || c.closedAt) return c;
        const exists = c.memberProgress.some((p) => p.memberName === memberName);
        const newProgress: ClubMemberProgress[] = exists
          ? c.memberProgress.map((p) =>
              p.memberName === memberName
                ? { ...p, currentPage: newPage, totalPages, lastUpdated: new Date().toISOString() }
                : p
            )
          : [
              ...c.memberProgress,
              { memberName, currentPage: newPage, totalPages, lastUpdated: new Date().toISOString() },
            ];
        return { ...c, memberProgress: newProgress };
      });
      persistClubs(updated);
    },
    [clubs]
  );

  const addClubHighlight = useCallback(
    (groupId: string, memberName: string, page: number, quote?: string) => {
      const updated = clubs.map((c) => {
        if (c.groupId !== groupId || c.closedAt) return c;
        const newHighlight: ClubHighlight = {
          id: `chl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          memberName,
          page,
          quote,
          addedAt: new Date().toISOString(),
        };
        return { ...c, highlights: [...c.highlights, newHighlight] };
      });
      persistClubs(updated);
    },
    [clubs]
  );

  const closeClub = useCallback(
    (groupId: string) => {
      const updated = clubs.map((c) =>
        c.groupId === groupId && !c.closedAt ? { ...c, closedAt: new Date().toISOString() } : c
      );
      persistClubs(updated);
    },
    [clubs]
  );

  const getActiveClub = useCallback(
    (groupId: string): BookClub | null =>
      clubs.find((c) => c.groupId === groupId && !c.closedAt) ?? null,
    [clubs]
  );

  const getActiveClubForBook = useCallback(
    (bookId: string): BookClub | null =>
      clubs.find((c) => c.bookId === bookId && !c.closedAt) ?? null,
    [clubs]
  );

  const getClubHistory = useCallback(
    (groupId: string): BookClub[] =>
      clubs
        .filter((c) => c.groupId === groupId && !!c.closedAt)
        .sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? "")),
    [clubs]
  );

  const removeVocabularyEntry = useCallback(
    (id: string) => {
      const updated = vocabulary.filter((v) => v.id !== id);
      setVocabulary(updated);
      persistState({ vocabulary: updated });
    },
    [books, sessions, badges, vocabulary, highlights, settings, folego, folegoGuardado, xp, missions]
  );

  return (
    <AppContext.Provider
      value={{
        books,
        sessions,
        badges,
        missions,
        vocabulary,
        highlights,
        sharedCards,
        addHighlight,
        removeHighlight,
        getHighlightsForBook,
        settings,
        folego,
        folegoGuardado,
        xp,
        cardsSharedCount,
        isLoaded,
        freeBooks: FREE_BOOKS,
        addBook,
        updateBook,
        removeBook,
        addSession,
        completeMission,
        updateSettings,
        checkAndUnlockBadges,
        earnXP,
        addVocabularyEntry,
        removeVocabularyEntry,
        progressShareMission,
        addSharedCard,
        getBookById,
        getAbandoned,
        getCurrentBook,
        capiState,
        setCapiState,
        spotifyEnabled: SPOTIFY_ENABLED,
        spotifyConnected,
        nowPlaying,
        connectSpotify,
        disconnectSpotify,
        setReadingSessionActive,
        clubs,
        activateClub,
        updateClubProgress,
        addClubHighlight,
        closeClub,
        getActiveClub,
        getActiveClubForBook,
        getClubHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

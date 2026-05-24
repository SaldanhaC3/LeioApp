export interface WordLookup {
  word: string;
  phonetic?: string;
  englishDefinition?: string;
  portuguese: string;
  audioUrl?: string;
}

interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string }>;
  }>;
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  matches?: Array<{ translation?: string; quality?: number | string }>;
}

export type LookupOutcome =
  | { kind: "ok"; lookup: WordLookup }
  | { kind: "not-found" }
  | { kind: "network-error" };

type DictResult =
  | {
      ok: true;
      data: {
        phonetic?: string;
        englishDefinition?: string;
        audioUrl?: string;
      } | null;
    }
  | { ok: false };

type TranslationResult =
  | { ok: true; data: string | null }
  | { ok: false };

async function fetchDictionary(word: string): Promise<DictResult> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`
    );
    if (res.status === 404) return { ok: true, data: null };
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as DictionaryApiResponse[];
    const entry = data?.[0];
    if (!entry) return { ok: true, data: null };
    const phonetic =
      entry.phonetic ??
      entry.phonetics?.find((p) => p.text)?.text ??
      undefined;
    const audioUrl =
      entry.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio ??
      undefined;
    const englishDefinition =
      entry.meanings?.[0]?.definitions?.[0]?.definition ?? undefined;
    return { ok: true, data: { phonetic, englishDefinition, audioUrl } };
  } catch {
    return { ok: false };
  }
}

async function fetchTranslation(word: string): Promise<TranslationResult> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        word
      )}&langpair=en|pt-br`
    );
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as MyMemoryResponse;
    const translated = data.responseData?.translatedText?.trim();
    if (translated && translated.toLowerCase() !== word.toLowerCase()) {
      return { ok: true, data: translated };
    }
    const match = data.matches?.find(
      (m) =>
        m.translation && m.translation.toLowerCase() !== word.toLowerCase()
    );
    return { ok: true, data: match?.translation?.trim() ?? translated ?? null };
  } catch {
    return { ok: false };
  }
}

export async function lookupWord(rawWord: string): Promise<LookupOutcome> {
  const word = rawWord.trim().toLowerCase();
  if (!word) return { kind: "not-found" };

  const [dict, pt] = await Promise.all([
    fetchDictionary(word),
    fetchTranslation(word),
  ]);

  // Both transport failures → network error
  if (!dict.ok && !pt.ok) return { kind: "network-error" };

  const dictData = dict.ok ? dict.data : null;
  const ptData = pt.ok ? pt.data : null;

  // Neither source returned any data → genuinely not found
  if (!dictData && !ptData) {
    // If one of them failed at transport level, prefer surfacing that
    if (!dict.ok || !pt.ok) return { kind: "network-error" };
    return { kind: "not-found" };
  }

  return {
    kind: "ok",
    lookup: {
      word,
      phonetic: dictData?.phonetic,
      englishDefinition: dictData?.englishDefinition,
      portuguese: ptData ?? word,
      audioUrl: dictData?.audioUrl,
    },
  };
}

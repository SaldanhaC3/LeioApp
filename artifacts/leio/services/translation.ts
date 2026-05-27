export type SupportedLanguage = "en" | "pt-br" | "es";

export interface WordLookup {
  word: string;
  language: SupportedLanguage;
  definition: string;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  examples?: string[];
  // EN-only: Portuguese translation via MyMemory
  portuguese?: string;
  // EN-only: English definition (kept for backward compat)
  englishDefinition?: string;
}

export type LookupOutcome =
  | { kind: "ok"; lookup: WordLookup }
  | { kind: "not-found" }
  | { kind: "network-error" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── English (dictionaryapi.dev + MyMemory) ───────────────────────────────────

interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  matches?: Array<{ translation?: string; quality?: number | string }>;
}

async function lookupEnglish(word: string): Promise<LookupOutcome> {
  try {
    const [dictRes, ptRes] = await Promise.all([
      fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      ),
      fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|pt-br`
      ),
    ]);

    const dictOk = dictRes.ok || dictRes.status === 404;
    const ptOk = ptRes.ok;

    if (!dictOk && !ptOk) return { kind: "network-error" };

    let phonetic: string | undefined;
    let audioUrl: string | undefined;
    let englishDefinition: string | undefined;
    let partOfSpeech: string | undefined;
    let examples: string[] | undefined;

    if (dictRes.status === 404) {
      // word not in dict
    } else if (dictRes.ok) {
      const data = (await dictRes.json()) as DictionaryApiResponse[];
      const entry = data?.[0];
      if (entry) {
        phonetic =
          entry.phonetic ??
          entry.phonetics?.find((p) => p.text)?.text ??
          undefined;
        audioUrl =
          entry.phonetics?.find((p) => p.audio && p.audio.length > 0)
            ?.audio ?? undefined;
        const meaning = entry.meanings?.[0];
        partOfSpeech = meaning?.partOfSpeech ?? undefined;
        englishDefinition =
          meaning?.definitions?.[0]?.definition ?? undefined;
        const exs = entry.meanings
          ?.flatMap((m) => m.definitions ?? [])
          .map((d) => d.example)
          .filter((e): e is string => !!e)
          .slice(0, 2);
        if (exs && exs.length > 0) examples = exs;
      }
    }

    let portuguese: string | undefined;
    if (ptOk) {
      const ptData = (await ptRes.json()) as MyMemoryResponse;
      const translated = ptData.responseData?.translatedText?.trim();
      if (translated && translated.toLowerCase() !== word.toLowerCase()) {
        portuguese = translated;
      } else {
        const match = ptData.matches?.find(
          (m) =>
            m.translation && m.translation.toLowerCase() !== word.toLowerCase()
        );
        portuguese = match?.translation?.trim() ?? translated;
      }
    }

    if (!englishDefinition && !portuguese) {
      if (!dictOk || !ptOk) return { kind: "network-error" };
      return { kind: "not-found" };
    }

    return {
      kind: "ok",
      lookup: {
        word,
        language: "en",
        definition: englishDefinition ?? portuguese ?? word,
        phonetic,
        audioUrl,
        partOfSpeech,
        examples,
        portuguese: portuguese ?? word,
        englishDefinition,
      },
    };
  } catch {
    return { kind: "network-error" };
  }
}

// ─── Wiktionary (PT-BR and ES) ────────────────────────────────────────────────

interface WiktionaryDefinition {
  definition: string;
  examples?: string[];
}

interface WiktionarySection {
  partOfSpeech?: string;
  definitions?: WiktionaryDefinition[];
}

type WiktionaryResponse = Record<string, WiktionarySection[]>;

async function lookupWiktionary(
  word: string,
  language: "pt-br" | "es"
): Promise<LookupOutcome> {
  const subdomain = language === "pt-br" ? "pt" : "es";
  // The response key is the language code used by Wiktionary
  const langKey = language === "pt-br" ? "pt" : "es";

  try {
    const res = await fetch(
      `https://${subdomain}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    );

    if (res.status === 404) return { kind: "not-found" };
    if (!res.ok) return { kind: "network-error" };

    const data = (await res.json()) as WiktionaryResponse;

    // The API returns entries keyed by language code; try the primary key first
    // then fall back to the first available key
    const sections: WiktionarySection[] | undefined =
      data[langKey] ?? Object.values(data)[0];

    if (!sections || sections.length === 0) return { kind: "not-found" };

    const firstSection = sections[0];
    const rawDef = firstSection?.definitions?.[0]?.definition ?? "";
    const definition = stripHtml(rawDef);

    if (!definition) return { kind: "not-found" };

    const partOfSpeech = firstSection?.partOfSpeech ?? undefined;

    const examples = sections
      .flatMap((s) => s.definitions ?? [])
      .flatMap((d) => d.examples ?? [])
      .map((e) => stripHtml(e))
      .filter((e) => e.length > 0)
      .slice(0, 2);

    return {
      kind: "ok",
      lookup: {
        word,
        language,
        definition,
        partOfSpeech,
        examples: examples.length > 0 ? examples : undefined,
      },
    };
  } catch {
    return { kind: "network-error" };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function lookupWord(
  rawWord: string,
  language: SupportedLanguage = "en"
): Promise<LookupOutcome> {
  const word = rawWord.trim().toLowerCase();
  if (!word) return { kind: "not-found" };

  if (language === "en") return lookupEnglish(word);
  return lookupWiktionary(word, language);
}

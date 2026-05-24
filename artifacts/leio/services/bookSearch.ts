export interface BookSearchResult {
  title: string;
  author: string;
  pages: number;
  coverUrl?: string;
  isbn?: string;
}

const SEARCH_URL = "https://openlibrary.org/search.json";
const BOOKS_URL = "https://openlibrary.org/api/books";

export function normalizeIsbn(query: string): string {
  return query.replace(/[-\s]/g, "").toUpperCase();
}

function isValidIsbn10(s: string): boolean {
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * parseInt(s[i], 10);
  sum += s[9] === "X" ? 10 : parseInt(s[9], 10);
  return sum % 11 === 0;
}

function isValidIsbn13(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(s[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

export function isIsbn(query: string): boolean {
  const cleaned = normalizeIsbn(query);
  return isValidIsbn10(cleaned) || isValidIsbn13(cleaned);
}

interface OpenLibrarySearchDoc {
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  isbn?: string[];
  cover_edition_key?: string;
  edition_key?: string[];
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibrarySearchDoc[];
}

interface OpenLibraryBookData {
  title?: string;
  authors?: { name?: string }[];
  number_of_pages?: number;
  cover?: { small?: string; medium?: string; large?: string };
  identifiers?: { isbn_10?: string[]; isbn_13?: string[] };
}

function buildCoverUrlFromId(coverId?: number): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function buildCoverUrlFromIsbn(isbn?: string): string | undefined {
  if (!isbn) return undefined;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}

export async function searchBookByIsbn(rawIsbn: string): Promise<BookSearchResult[]> {
  const isbn = normalizeIsbn(rawIsbn);
  const url = `${BOOKS_URL}?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Library error: ${response.status}`);
  }
  const data = (await response.json()) as Record<string, OpenLibraryBookData>;
  const key = `ISBN:${isbn}`;
  const entry = data[key];
  if (!entry) return [];
  const author = entry.authors?.[0]?.name ?? "Autor desconhecido";
  const cover = entry.cover?.medium ?? entry.cover?.large ?? entry.cover?.small ?? buildCoverUrlFromIsbn(isbn);
  return [
    {
      title: entry.title ?? "Sem título",
      author,
      pages: entry.number_of_pages ?? 0,
      coverUrl: cover,
      isbn,
    },
  ];
}

export async function searchBooksByQuery(query: string): Promise<BookSearchResult[]> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=20`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Library error: ${response.status}`);
  }
  const data = (await response.json()) as OpenLibrarySearchResponse;
  const docs = data.docs ?? [];
  return docs
    .filter((d) => d.title && d.author_name && d.author_name.length > 0)
    .slice(0, 20)
    .map<BookSearchResult>((d) => {
      const isbn = d.isbn?.[0];
      const coverUrl = buildCoverUrlFromId(d.cover_i) ?? buildCoverUrlFromIsbn(isbn);
      return {
        title: d.title ?? "Sem título",
        author: d.author_name?.join(", ") ?? "Autor desconhecido",
        pages: d.number_of_pages_median ?? 0,
        coverUrl,
        isbn,
      };
    });
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  if (isIsbn(trimmed)) {
    return searchBookByIsbn(trimmed);
  }
  return searchBooksByQuery(trimmed);
}

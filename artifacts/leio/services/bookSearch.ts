export interface BookSearchResult {
  title: string;
  author: string;
  pages: number;
  coverUrl?: string;
  isbn?: string;
}

const SEARCH_URL = "https://openlibrary.org/search.json";
const BOOKS_URL = "https://openlibrary.org/api/books";

export function isIsbn(query: string): boolean {
  const cleaned = query.replace(/[-\s]/g, "");
  return /^\d+$/.test(cleaned) && (cleaned.length === 10 || cleaned.length === 13);
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
  const isbn = rawIsbn.replace(/[-\s]/g, "");
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

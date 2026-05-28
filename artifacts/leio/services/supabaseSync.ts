/**
 * Sync service: pushes local AsyncStorage data to Supabase.
 * Uses local_id as the idempotency key so re-runs are safe.
 * Strategy: upsert everything — local is source of truth during sync.
 */
import { supabase } from "@/lib/supabase";
import type { Book, Session, Highlight, VocabularyEntry } from "@/contexts/AppContext";

type UserId = string;

// ─── Books ──────────────────────────────────────────────────────────────────

function bookToRow(book: Book, userId: UserId) {
  return {
    user_id: userId,
    local_id: book.id,
    title: book.title,
    author: book.author,
    genre: book.genre ?? null,
    total_pages: book.totalPages,
    current_page: book.currentPage,
    status: book.status === "read" ? "read" : book.status === "reading" ? "reading" : book.status === "abandoned" ? "abandoned" : "want",
    cover_color: book.coverColor ?? null,
    added_at: book.addedAt,
    finished_at: book.finishedAt ?? null,
    isbn: book.isbn ?? null,
    description: book.description ?? null,
    cover_image: book.coverImage ?? null,
  };
}

export async function syncBooks(books: Book[], userId: UserId) {
  if (!books.length) return;
  const rows = books.map((b) => bookToRow(b, userId));
  const { error } = await supabase.from("books").upsert(rows, {
    onConflict: "user_id,local_id",
    ignoreDuplicates: false,
  });
  if (error) console.warn("[sync] books:", error.message);
}

// ─── Sessions ────────────────────────────────────────────────────────────────

async function getSupabaseBookId(localBookId: string, userId: UserId): Promise<string | null> {
  const { data } = await supabase
    .from("books")
    .select("id")
    .eq("user_id", userId)
    .eq("local_id", localBookId)
    .single();
  return data?.id ?? null;
}

export async function syncSessions(sessions: Session[], userId: UserId) {
  if (!sessions.length) return;

  for (const s of sessions) {
    const bookId = await getSupabaseBookId(s.bookId, userId);
    if (!bookId) continue;

    const row = {
      user_id: userId,
      book_id: bookId,
      local_id: s.id,
      start_page: s.startPage,
      end_page: s.endPage,
      duration_seconds: s.durationSeconds,
      pace: s.pace,
      date: s.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      is_focus_mode: s.isFocusMode ?? false,
    };

    const { error } = await supabase.from("sessions").upsert(row, {
      onConflict: "user_id,local_id",
      ignoreDuplicates: false,
    });
    if (error) console.warn("[sync] session:", error.message);
  }
}

// ─── Highlights ──────────────────────────────────────────────────────────────

export async function syncHighlights(highlights: Highlight[], userId: UserId) {
  if (!highlights.length) return;

  for (const h of highlights) {
    const bookId = await getSupabaseBookId(h.bookId, userId);
    if (!bookId) continue;

    const row = {
      user_id: userId,
      book_id: bookId,
      local_id: h.id,
      text: h.text,
      bg_variant: h.bgVariant,
    };

    const { error } = await supabase.from("highlights").upsert(row, {
      onConflict: "user_id,local_id",
      ignoreDuplicates: false,
    });
    if (error) console.warn("[sync] highlight:", error.message);
  }
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export async function syncVocabulary(vocabulary: VocabularyEntry[], userId: UserId) {
  if (!vocabulary.length) return;

  for (const v of vocabulary) {
    const bookId = v.bookId ? await getSupabaseBookId(v.bookId, userId) : null;

    const row = {
      user_id: userId,
      book_id: bookId,
      local_id: v.id,
      word: v.word,
      definition: v.definition ?? null,
      phonetic: v.phonetic ?? null,
      saved_at: v.savedAt,
    };

    const { error } = await supabase.from("vocabulary_entries").upsert(row, {
      onConflict: "user_id,local_id",
      ignoreDuplicates: false,
    });
    if (error) console.warn("[sync] vocabulary:", error.message);
  }
}

// ─── Profile XP/Folego ───────────────────────────────────────────────────────

export async function syncProfile(userId: UserId, xp: number, folego: number) {
  const { error } = await supabase
    .from("profiles")
    .update({ xp, folego, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.warn("[sync] profile:", error.message);
}

// ─── Full sync ────────────────────────────────────────────────────────────────

export async function syncAll(
  userId: UserId,
  data: {
    books: Book[];
    sessions: Session[];
    highlights: Highlight[];
    vocabulary: VocabularyEntry[];
    xp: number;
    folego: number;
  }
) {
  await syncBooks(data.books, userId);
  await Promise.all([
    syncSessions(data.sessions, userId),
    syncHighlights(data.highlights, userId),
    syncVocabulary(data.vocabulary, userId),
    syncProfile(userId, data.xp, data.folego),
  ]);
}

import * as FileSystem from "expo-file-system/legacy";

const BOOKS_DIR = `${FileSystem.documentDirectory}books/`;

async function ensureBooksDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BOOKS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
  }
}

function pdfPath(bookId: string): string {
  return `${BOOKS_DIR}${bookId}.pdf`;
}

function epubPath(bookId: string): string {
  return `${BOOKS_DIR}${bookId}.epub`;
}

/**
 * Copy (or move) a file from `uri` to local storage for the given book.
 * Returns the local URI of the saved file.
 */
export async function saveBookFile(
  uri: string,
  bookId: string,
  type: "pdf" | "epub"
): Promise<string> {
  await ensureBooksDir();
  const dest = type === "pdf" ? pdfPath(bookId) : epubPath(bookId);
  // Remove old file with the other extension if it exists
  const otherDest = type === "pdf" ? epubPath(bookId) : pdfPath(bookId);
  const otherInfo = await FileSystem.getInfoAsync(otherDest);
  if (otherInfo.exists) {
    await FileSystem.deleteAsync(otherDest, { idempotent: true });
  }
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

/**
 * Return the local URI for a book file, or null if it does not exist.
 */
export async function getBookFileUri(
  bookId: string,
  type: "pdf" | "epub"
): Promise<string | null> {
  const path = type === "pdf" ? pdfPath(bookId) : epubPath(bookId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

/**
 * Check whether a book file exists (either PDF or ePub).
 * Returns the type of the file found, or null.
 */
export async function bookFileExists(
  bookId: string
): Promise<{ type: "pdf" | "epub" } | null> {
  const pdfInfo = await FileSystem.getInfoAsync(pdfPath(bookId));
  if (pdfInfo.exists) return { type: "pdf" };
  const epubInfo = await FileSystem.getInfoAsync(epubPath(bookId));
  if (epubInfo.exists) return { type: "epub" };
  return null;
}

/**
 * Delete all locally stored files for a book (PDF and ePub).
 */
export async function removeBookFile(bookId: string): Promise<void> {
  await FileSystem.deleteAsync(pdfPath(bookId), { idempotent: true });
  await FileSystem.deleteAsync(epubPath(bookId), { idempotent: true });
}

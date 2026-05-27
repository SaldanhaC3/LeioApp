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

export async function saveBookFile(
  uri: string,
  bookId: string,
  type: "pdf" | "epub"
): Promise<string> {
  await ensureBooksDir();
  const dest = type === "pdf" ? pdfPath(bookId) : epubPath(bookId);
  const otherDest = type === "pdf" ? epubPath(bookId) : pdfPath(bookId);
  const otherInfo = await FileSystem.getInfoAsync(otherDest);
  if (otherInfo.exists) {
    await FileSystem.deleteAsync(otherDest, { idempotent: true });
  }
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function getBookFileUri(
  bookId: string,
  type: "pdf" | "epub"
): Promise<string | null> {
  const path = type === "pdf" ? pdfPath(bookId) : epubPath(bookId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function bookFileExists(
  bookId: string
): Promise<{ type: "pdf" | "epub" } | null> {
  const pdfInfo = await FileSystem.getInfoAsync(pdfPath(bookId));
  if (pdfInfo.exists) return { type: "pdf" };
  const epubInfo = await FileSystem.getInfoAsync(epubPath(bookId));
  if (epubInfo.exists) return { type: "epub" };
  return null;
}

export async function removeBookFile(bookId: string): Promise<void> {
  await FileSystem.deleteAsync(pdfPath(bookId), { idempotent: true });
  await FileSystem.deleteAsync(epubPath(bookId), { idempotent: true });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import type { Book } from "@/contexts/AppContext";

/** Chave única do último som ambiente escolhido (compartilhada com a tela de sessão). */
export const AMBIENT_STORAGE_KEY = "leio:session:last-ambient";

/**
 * Inicia uma sessão de leitura em 1 toque, reaproveitando o último som
 * ambiente salvo e começando da página atual do livro. A configuração
 * detalhada (foco, duração, trilha) continua disponível na tela de Sessão,
 * mas deixa de ser obrigatória no caminho feliz.
 */
export async function startQuickSession(book: Book, ambientDefault = "cafe") {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
  let ambient = ambientDefault;
  try {
    const saved = await AsyncStorage.getItem(AMBIENT_STORAGE_KEY);
    if (saved) ambient = saved;
  } catch {
    // mantém o default
  }
  router.push({
    pathname: "/sessao-ativa",
    params: {
      bookId: book.id,
      startPage: book.currentPage.toString(),
      ambient,
      focusMode: "0",
      focusDuration: "30",
    },
  });
}

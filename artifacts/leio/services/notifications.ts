import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const isSupported = Platform.OS !== "web";

if (isSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const REMINDER_TITLE = "Capi tá te esperando";

const REMINDER_MESSAGES = (folego: number): string[] => [
  `Seu Fôlego de ${folego} dia${folego === 1 ? "" : "s"} precisa de uns minutinhos hoje 📖`,
  "Capi tá com saudade, bora ler um pedacinho?",
  "Tá com pressa? 10 minutinhos já contam. Sem desculpa.",
  "Quem disse que tem que ler 100 páginas? Abre o livro aí.",
  "Sua estante tá te encarando de novo. Devolve o olhar.",
  "Hoje é dia de virar página, não de rolar feed.",
  `Não deixa o Fôlego de ${folego} cair pelo ralo. Cinco minutinhos resolvem.`,
  "A Capi tá lá, parada, te esperando. Vai deixar?",
  "Bora? Promete que é só uma sessãozinha (já sabemos como termina).",
  "Cê vai ler hoje ou não vai? Confia, vai valer a pena.",
];

function pickMessage(folego: number): string {
  const pool = REMINDER_MESSAGES(folego);
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

type PermissionLike = {
  status?: string;
  granted?: boolean;
  canAskAgain?: boolean;
};

function isGranted(p: PermissionLike): boolean {
  if (typeof p.granted === "boolean") return p.granted;
  return p.status === "granted";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    const current = (await Notifications.getPermissionsAsync()) as PermissionLike;
    if (isGranted(current)) return true;
    if (current.canAskAgain === false) return false;
    const req = (await Notifications.requestPermissionsAsync()) as PermissionLike;
    return isGranted(req);
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  folego = 0
): Promise<string | null> {
  if (!isSupported) return null;
  try {
    await cancelAllReminders();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: REMINDER_TITLE,
        body: pickMessage(folego),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (!isSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // silent
  }
}

export async function getScheduledReminders(): Promise<
  Notifications.NotificationRequest[]
> {
  if (!isSupported) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    const current = (await Notifications.getPermissionsAsync()) as PermissionLike;
    return isGranted(current);
  } catch {
    return false;
  }
}

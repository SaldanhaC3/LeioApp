import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  createdBy: string;
  memberUsernames: string[];
  inviteCode: string;
  createdAt: string;
  currentBook?: string;
}

export interface GroupCheckIn {
  id: string;
  groupId: string;
  username: string;
  pagesRead: number;
  mood: "amei" | "bem" | "ok" | "difícil";
  comment?: string;
  date: string; // YYYY-MM-DD
  bookTitle?: string;
}

interface BookGroupContextValue {
  groups: ReadingGroup[];
  checkIns: GroupCheckIn[];
  myUsername: string;

  createGroup(name: string, description: string, emoji: string): ReadingGroup;
  joinGroup(inviteCode: string): ReadingGroup | null;
  leaveGroup(groupId: string): void;
  getGroupById(id: string): ReadingGroup | undefined;

  addCheckIn(
    groupId: string,
    data: Omit<GroupCheckIn, "id" | "username" | "date">
  ): void;
  getCheckInsForGroup(groupId: string, date?: string): GroupCheckIn[];
  hasCheckedInToday(groupId: string): boolean;
  getStreak(groupId: string, username: string): number;

  setMyUsername(name: string): void;
}

const BookGroupContext = createContext<BookGroupContextValue | null>(null);

const GROUPS_KEY = "leio:book-groups";
const CHECKINS_KEY = "leio:group-checkins";
const USERNAME_KEY = "leio:my-username";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function BookGroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<ReadingGroup[]>([]);
  const [checkIns, setCheckIns] = useState<GroupCheckIn[]>([]);
  const [myUsername, setMyUsernameState] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [groupsRaw, checkInsRaw, usernameRaw] = await Promise.all([
        AsyncStorage.getItem(GROUPS_KEY),
        AsyncStorage.getItem(CHECKINS_KEY),
        AsyncStorage.getItem(USERNAME_KEY),
      ]);
      if (groupsRaw) setGroups(JSON.parse(groupsRaw));
      if (checkInsRaw) setCheckIns(JSON.parse(checkInsRaw));
      if (usernameRaw) setMyUsernameState(usernameRaw);
    } catch {
      // silent
    }
  }

  async function persistGroups(updated: ReadingGroup[]) {
    setGroups(updated);
    try {
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    } catch {
      // silent
    }
  }

  async function persistCheckIns(updated: GroupCheckIn[]) {
    setCheckIns(updated);
    try {
      await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(updated));
    } catch {
      // silent
    }
  }

  const setMyUsername = useCallback(async (name: string) => {
    setMyUsernameState(name);
    try {
      await AsyncStorage.setItem(USERNAME_KEY, name);
    } catch {
      // silent
    }
  }, []);

  const createGroup = useCallback(
    (name: string, description: string, emoji: string): ReadingGroup => {
      const newGroup: ReadingGroup = {
        id: generateId(),
        name,
        description,
        emoji,
        createdBy: myUsername,
        memberUsernames: [myUsername],
        inviteCode: generateInviteCode(),
        createdAt: new Date().toISOString(),
      };
      persistGroups([...groups, newGroup]);
      return newGroup;
    },
    [groups, myUsername]
  );

  const joinGroup = useCallback(
    (inviteCode: string): ReadingGroup | null => {
      const group = groups.find(
        (g) => g.inviteCode === inviteCode.toUpperCase().trim()
      );
      if (!group) return null;
      if (group.memberUsernames.includes(myUsername)) return group;
      const updated = groups.map((g) =>
        g.id === group.id
          ? { ...g, memberUsernames: [...g.memberUsernames, myUsername] }
          : g
      );
      persistGroups(updated);
      return updated.find((g) => g.id === group.id) ?? group;
    },
    [groups, myUsername]
  );

  const leaveGroup = useCallback(
    (groupId: string) => {
      const updated = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              memberUsernames: g.memberUsernames.filter(
                (u) => u !== myUsername
              ),
            }
          : g
      );
      persistGroups(updated);
    },
    [groups, myUsername]
  );

  const getGroupById = useCallback(
    (id: string): ReadingGroup | undefined => groups.find((g) => g.id === id),
    [groups]
  );

  const addCheckIn = useCallback(
    (
      groupId: string,
      data: Omit<GroupCheckIn, "id" | "username" | "date">
    ) => {
      const newCheckIn: GroupCheckIn = {
        ...data,
        id: generateId(),
        groupId,
        username: myUsername,
        date: todayString(),
      };
      persistCheckIns([...checkIns, newCheckIn]);
    },
    [checkIns, myUsername]
  );

  const getCheckInsForGroup = useCallback(
    (groupId: string, date?: string): GroupCheckIn[] => {
      return checkIns.filter(
        (c) => c.groupId === groupId && (date ? c.date === date : true)
      );
    },
    [checkIns]
  );

  const hasCheckedInToday = useCallback(
    (groupId: string): boolean => {
      const today = todayString();
      return checkIns.some(
        (c) =>
          c.groupId === groupId &&
          c.username === myUsername &&
          c.date === today
      );
    },
    [checkIns, myUsername]
  );

  const getStreak = useCallback(
    (groupId: string, username: string): number => {
      const groupCheckIns = checkIns
        .filter((c) => c.groupId === groupId && c.username === username)
        .map((c) => c.date)
        .sort()
        .reverse();

      if (groupCheckIns.length === 0) return 0;

      const uniqueDates = [...new Set(groupCheckIns)];
      let streak = 0;
      let current = new Date();
      current.setHours(0, 0, 0, 0);

      // Check if there's a check-in today or yesterday to start the streak
      const todayStr = current.toISOString().split("T")[0];
      const yesterday = new Date(current);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
        return 0;
      }

      // Start from today if checked in today, else from yesterday
      let checkDate = uniqueDates.includes(todayStr) ? current : yesterday;

      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (uniqueDates.includes(dateStr)) {
          streak++;
          checkDate = new Date(checkDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    },
    [checkIns]
  );

  return (
    <BookGroupContext.Provider
      value={{
        groups,
        checkIns,
        myUsername,
        createGroup,
        joinGroup,
        leaveGroup,
        getGroupById,
        addCheckIn,
        getCheckInsForGroup,
        hasCheckedInToday,
        getStreak,
        setMyUsername,
      }}
    >
      {children}
    </BookGroupContext.Provider>
  );
}

export function useBookGroup() {
  const ctx = useContext(BookGroupContext);
  if (!ctx) throw new Error("useBookGroup must be used within BookGroupProvider");
  return ctx;
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STAT_KEYS,
  STAT_PREFS_STORAGE_KEY,
  type StatKey,
} from "@/utils/statPreferences";

export function useStatPreferences() {
  const [selected, setSelected] = useState<StatKey[]>(DEFAULT_STAT_KEYS);

  useEffect(() => {
    AsyncStorage.getItem(STAT_PREFS_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as StatKey[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelected(parsed);
        }
      } catch {}
    });
  }, []);

  const toggle = useCallback((key: StatKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter((k) => k !== key);
        AsyncStorage.setItem(STAT_PREFS_STORAGE_KEY, JSON.stringify(next));
        return next;
      }
      const next = [...prev, key];
      AsyncStorage.setItem(STAT_PREFS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { selected, toggle };
}

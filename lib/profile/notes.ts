export type FreshieNote = {
  userId: string;
  note: string;
  updatedAt: string;
};

const NOTES_STORAGE_KEY = "tamahi_freshie_notes";

export function loadAllFreshieNotes(): Record<string, FreshieNote> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FreshieNote>) : {};
  } catch {
    return {};
  }
}

export function getFreshieNote(userId: string): string {
  const all = loadAllFreshieNotes();
  return all[userId]?.note || "";
}

export function saveFreshieNote(userId: string, note: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadAllFreshieNotes();
    if (!note.trim()) {
      delete all[userId];
    } else {
      all[userId] = {
        userId,
        note: note.trim(),
        updatedAt: new Date().toISOString(),
      };
    }
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

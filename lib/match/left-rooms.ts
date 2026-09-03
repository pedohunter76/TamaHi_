export function isRoomDeparted(roomId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem("tamahi_left_rooms");
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(roomId);
  } catch {
    return false;
  }
}

export function markRoomDeparted(roomId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem("tamahi_left_rooms");
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(roomId)) {
      list.push(roomId);
      sessionStorage.setItem("tamahi_left_rooms", JSON.stringify(list));
    }
  } catch {}
}

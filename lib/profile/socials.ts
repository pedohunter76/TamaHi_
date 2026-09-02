export type UserSocials = {
  instagram?: string;
  facebook?: string;
};

const SOCIALS_STORAGE_KEY = "tamahi_user_socials";

export function loadSavedUserSocials(): UserSocials {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SOCIALS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserSocials) : {};
  } catch {
    return {};
  }
}

export function saveUserSocials(socials: UserSocials): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOCIALS_STORAGE_KEY, JSON.stringify(socials));
  } catch {
    // ignore
  }
}

export function getInstagramUrl(handle: string): string {
  const clean = handle
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  return `https://instagram.com/${clean}`;
}

export function getFacebookUrl(handle: string): string {
  const clean = handle.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  const stripped = clean
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?facebook\.com\//, "");
  return `https://facebook.com/${stripped}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

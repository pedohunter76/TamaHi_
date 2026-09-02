export type FreshieChecklistItem = {
  id: string;
  title: string;
  category: "Academics" | "Campus Life" | "Student Essentials" | "Orgs";
  description: string;
  badge: string;
};

export const DEFAULT_FRESHIE_CHECKLIST: FreshieChecklistItem[] = [
  {
    id: "check-canvas",
    title: "Setup Canvas LMS & FEU Email",
    category: "Academics",
    description: "Activate your official @feu.edu.ph Outlook account and verify enrolled courses on Canvas LMS.",
    badge: "Must Do",
  },
  {
    id: "check-id",
    title: "Claim & Validate Tamaraw RFID ID Card",
    category: "Student Essentials",
    description: "Ensure your physical RFID ID is validated at the NRH Registrar for campus turnstile entry.",
    badge: "Gate Entry",
  },
  {
    id: "check-uniform",
    title: "Check Green & Gold Uniform Schedule",
    category: "Student Essentials",
    description: "Review Institute uniform days and remember Green Wednesday wash day guidelines.",
    badge: "Dress Code",
  },
  {
    id: "check-portal",
    title: "Check Student Portal & Block Class Schedule",
    category: "Academics",
    description: "Screenshot your room assignments, professors, and class days in the FEU Student Portal.",
    badge: "Academics",
  },
  {
    id: "check-library",
    title: "Explore FEU Central Library Silent Study Floor",
    category: "Campus Life",
    description: "Visit the 3rd floor quiet study zone and test the student Wi-Fi connection.",
    badge: "Study Spot",
  },
  {
    id: "check-orgs",
    title: "Discover Recognized Student Organizations",
    category: "Orgs",
    description: "Browse the FEU-USG registered student orgs and attend the freshmen org recruitment fair.",
    badge: "Extracurricular",
  },
];

const CHECKLIST_STORAGE_KEY = "tamahi_freshie_checklist_completed";

export function loadCompletedChecklistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCompletedChecklistIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

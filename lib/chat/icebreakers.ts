export type CustomIcebreaker = {
  id: string;
  text: string;
  category: string;
  createdAt: string;
};

export const DEFAULT_ICEBREAKER_CATEGORIES = [
  "Casual",
  "Gaming",
  "Academics",
  "Orgs & Clubs",
  "Food & Tambayan",
];

export const DIRECT_CAMPUS_ICEBREAKERS: string[] = [
  "What made you choose your course dito sa FEU?",
  "Saan favorite mong tambayan around campus — Grandstand, Pavilion, or FEU Library?",
  "Sinong may klase sa Arts or Tech building? Magkalapit ba buildings natin?",
  "Kamusta first week impressions niyo sa professors and blockmates?",
  "Anong student org or academic club ang balak niyo salihan this semester?",
  "Favorite food spot around FEU/Morayta — Tayuman, FEU Canteen, or Hepa lane?",
  "Are you commuting from nearby or nagdodorm/condo around Morayta?",
  "Ano pinaka inaabangan mong campus event — Tamaraw Fest or UAAP games?",
  "Sinong may night class or Saturday schedule sa inyo?",
  "Sino dito naglalaro ng Valorant, ML, or Roblox pagtapos ng classes?",
];

export const FEU_WOULD_YOU_RATHER: string[] = [
  "Would you rather: 7:30 AM Monday class sa Arts Building OR 6:00 PM Friday lab sa Tech Building?",
  "Would you rather: Hepas Lane quick lunch OR Gastambide food trip with your whole block?",
  "Would you rather: Mag-review sa FEU Library 3rd floor quiet zone OR group study sa Pav Grandstand breeze?",
  "Would you rather: Commute araw-araw via LRT/Jeep OR mag-dorm kasama ang 3 freshie blockmates?",
  "Would you rather: Perfect attendance buong semester OR 100% exam score sa pinakamahirap mong major subject?",
  "Would you rather: Manood ng UAAP Cheerdance live sa MOA Arena OR Tamaraw Fest concert sa Quadrangle?",
  "Would you rather: Heavy rain sa Morayta with baha OR scorching hot 12nn walk between NRH and Tech bldg?",
  "Would you rather: Always ready for surprise recitation OR write a 10-page research paper alone?",
];

export const FEU_CAMPUS_HOT_TAKES: string[] = [
  "Hot Take: Mas masarap ba ang coffee spots sa Morayta kaysa sa mga cafe inside campus?",
  "Hot Take: Pinakamahirap bang institute ang IAS, ICN, or IABF this semester?",
  "Hot Take: Mas productive mag-study mag-isa sa library kaysa mag-group study with friends?",
  "Hot Take: Best tambayan during 3-hour vacant gaps: Pavilion, FEU Library, or Chapel Garden?",
  "Hot Take: Mas sulit ba magbaon ng lunch or mag-food crawl sa Gastambide everyday?",
];

const STORAGE_KEY = "tamahi_custom_icebreakers";

export function loadSavedCustomIcebreakers(): CustomIcebreaker[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed starter custom prompts
      const starters: CustomIcebreaker[] = [
        {
          id: "starter-1",
          text: "Sino dito naglalaro ng ML or Valorant? Tara laro mamaya!",
          category: "Gaming",
          createdAt: new Date().toISOString(),
        },
        {
          id: "starter-2",
          text: "Ano favorite fast food / coffee spot niyo sa Morayta?",
          category: "Food & Tambayan",
          createdAt: new Date().toISOString(),
        },
        {
          id: "starter-3",
          text: "Anong Institute niyo and balak niyo bang sumali sa Student Org?",
          category: "Orgs & Clubs",
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starters));
      return starters;
    }
    return JSON.parse(raw) as CustomIcebreaker[];
  } catch {
    return [];
  }
}

export function saveCustomIcebreaker(
  text: string,
  category: string,
): CustomIcebreaker {
  const current = loadSavedCustomIcebreakers();
  const newItem: CustomIcebreaker = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    category: category.trim() || "Casual",
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newItem;
}

export function deleteCustomIcebreaker(id: string): CustomIcebreaker[] {
  const current = loadSavedCustomIcebreakers();
  const updated = current.filter((item) => item.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

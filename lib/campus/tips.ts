export type CampusTip = {
  id: string;
  category: "Buildings & Shortcuts" | "Study & Wi-Fi Spots" | "Printing & Supplies" | "Dress Code & Guidelines" | "Budget Eats";
  title: string;
  summary: string;
  tip: string;
  location?: string;
  tag: string;
};

export const FEU_CAMPUS_TIPS: CampusTip[] = [
  {
    id: "tip-1",
    category: "Buildings & Shortcuts",
    title: "Rainy Day Gastambide Shortcut",
    summary: "Avoid knee-deep floods on Morayta during heavy monsoon rains.",
    tip: "Pass through the Arts Building ground floor corridor leading directly to Gate 4 / Gastambide exit to keep your shoes dry.",
    location: "Arts Building Ground Floor",
    tag: "Monsoon Hack",
  },
  {
    id: "tip-2",
    category: "Buildings & Shortcuts",
    title: "Nicanor Reyes Hall Elevator Secret",
    summary: "NRH elevators get packed between 8:30 AM and 10:00 AM.",
    tip: "Use the central open spiral staircase for 2nd and 3rd-floor rooms—it saves you 10+ minutes waiting in line.",
    location: "NRH Main Hall",
    tag: "Time Saver",
  },
  {
    id: "tip-3",
    category: "Study & Wi-Fi Spots",
    title: "Library 3rd Floor Quiet Pods",
    summary: "Need pure silence and dedicated AC power outlets for laptop charging?",
    tip: "Head straight to the 3rd floor periodicals & silent research wing. Outlets are mounted on every wooden study table.",
    location: "University Library 3F",
    tag: "Power Outlets",
  },
  {
    id: "tip-4",
    category: "Study & Wi-Fi Spots",
    title: "Pavilion Grandstand Breezy Breezeway",
    summary: "Great open-air spot for group brainstorms and quick breaks.",
    tip: "Connect to 'FEU_Student_Wi-Fi' near the bleachers; signal is strongest right behind the Tamaraw Statue.",
    location: "Pavilion Grandstand",
    tag: "Group Collab",
  },
  {
    id: "tip-5",
    category: "Printing & Supplies",
    title: "Fast Document Printing at R. Papa",
    summary: "Emergency paper submissions and report binding before 7 AM classes.",
    tip: "The printing shops right outside Gate 2 (R. Papa) open at 6:30 AM and offer per-page bulk discounts for syllabus printing.",
    location: "Gate 2 / R. Papa",
    tag: "Rush Print",
  },
  {
    id: "tip-6",
    category: "Dress Code & Guidelines",
    title: "Green Wednesdays & Civilian Attire",
    summary: "Remember FEU's official wash day dress code policy.",
    tip: "Wednesdays are official Tamaraw Green days! You can wear green civilian shirts with decent jeans. Avoid slippers, crop tops, and ripped denim.",
    location: "All Campus Gates",
    tag: "Uniform Rules",
  },
  {
    id: "tip-7",
    category: "Budget Eats",
    title: "Gastambide Food Alley & Hepalane",
    summary: "Affordable meal choices within walking distance between lectures.",
    tip: "Get hearty student meals, silogs, and iced coffees along Gastambide and Lerma St. for ₱60–₱100.",
    location: "Gate 4 Gastambide / Lerma",
    tag: "Student Budget",
  },
];

export function getTipsByCategory(category?: string): CampusTip[] {
  if (!category || category === "All") return FEU_CAMPUS_TIPS;
  return FEU_CAMPUS_TIPS.filter((t) => t.category === category);
}

export function searchCampusTips(query: string): CampusTip[] {
  const q = query.toLowerCase().trim();
  if (!q) return FEU_CAMPUS_TIPS;
  return FEU_CAMPUS_TIPS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.tip.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q) ||
      (t.location && t.location.toLowerCase().includes(q)),
  );
}

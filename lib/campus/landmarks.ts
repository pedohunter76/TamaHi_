export type CampusLandmark = {
  id: string;
  name: string;
  code: string;
  category: "Academic Building" | "Campus Gate" | "Student Hub" | "Food & Tambayan";
  location: string;
  description: string;
  highlights: string[];
};

export const FEU_CAMPUS_LANDMARKS: CampusLandmark[] = [
  {
    id: "lm-nrh",
    name: "Nicanor Reyes Hall (NRH)",
    code: "NRH",
    category: "Academic Building",
    location: "Facing Gate 1 (Morayta)",
    description:
      "The iconic Art Deco flagship building of FEU Manila. Houses the University Administration, Registrar, Cashier, and major IAS/IABF lecture classrooms.",
    highlights: [
      "Art Deco architectural heritage",
      "Registrar & Student Accounts ground floor",
      "Central spiral staircase for fast 2F/3F access",
    ],
  },
  {
    id: "lm-arts",
    name: "Arts Building",
    code: "AB",
    category: "Academic Building",
    location: "Adjacent to NRH & Gate 4 corridor",
    description:
      "Home of the Institute of Arts and Sciences (IAS). Connects directly to the covered walkway towards Gastambide.",
    highlights: [
      "IAS Department offices",
      "Science and speech laboratories",
      "Covered rain shortcut to Gate 4",
    ],
  },
  {
    id: "lm-tech",
    name: "Technology Building",
    code: "TECH",
    category: "Academic Building",
    location: "East campus, near R. Papa & Gate 2",
    description:
      "State-of-the-art facility housing Computer Science, IT, Engineering, Multimedia Arts studios, and high-performance workstation laboratories.",
    highlights: [
      "High-spec PC & Mac labs",
      "Fast Wi-Fi & modern lecture rooms",
      "Tech Org student spaces",
    ],
  },
  {
    id: "lm-ed",
    name: "Education Building",
    code: "ED / EN",
    category: "Academic Building",
    location: "Central quadrangle area",
    description:
      "Houses the Institute of Education (IED) and Institute of Tourism and Hotel Management (ITHM) kitchen/bar demonstration labs.",
    highlights: [
      "Commercial demo kitchens & mock hotel",
      "IED faculty consultation rooms",
    ],
  },
  {
    id: "lm-pav",
    name: "Pavilion & Grandstand",
    code: "PAV",
    category: "Student Hub",
    location: "Campus center / Track oval",
    description:
      "The beating heart of campus student life. An open-air grandstand overlooking the green quadrangle where pep rallies, orgs fairs, and sports happen.",
    highlights: [
      "Breezy bleachers for group study",
      "Tamaraw statue photo spot",
      "UAAP Pep Squad & Drummers practice zone",
    ],
  },
  {
    id: "lm-lib",
    name: "FEU Central Library",
    code: "LIB",
    category: "Student Hub",
    location: "Nicanor Reyes St. side",
    description:
      "Multi-story air-conditioned university library with extensive digital databases, research cubicles, and quiet reading pods with power outlets.",
    highlights: [
      "3rd Floor silent research zone",
      "Dedicated charging outlets on every desk",
      "Electronic catalog & thesis archive",
    ],
  },
  {
    id: "lm-chapel",
    name: "FEU University Chapel",
    code: "CHAPEL",
    category: "Student Hub",
    location: "Lush garden quadrant near NRH",
    description:
      "A peaceful Art Deco chapel featuring historical murals by National Artist Carlos 'Botong' Francisco and vibrant stained-glass artworks.",
    highlights: [
      "Quiet reflection & prayer oasis",
      "National Artist heritage murals",
    ],
  },
  {
    id: "lm-gate1",
    name: "Gate 1 (Morayta / Nicanor Reyes St.)",
    code: "GATE 1",
    category: "Campus Gate",
    location: "Nicanor Reyes St. (Morayta)",
    description:
      "Main university entrance facing Recto footbridge, jeepney lines, and LRT-2 Recto station.",
    highlights: [
      "Official ID swipe turnstiles",
      "Direct entrance to NRH facade",
    ],
  },
  {
    id: "lm-gate2",
    name: "Gate 2 (R. Papa St.)",
    code: "GATE 2",
    category: "Campus Gate",
    location: "R. Papa Street",
    description:
      "Convenient exit for students heading to 24/7 printing shops, bookbinders, photo studios, and art supplies.",
    highlights: [
      "Closest gate to printing & thesis binding",
      "Direct path to Tech Building",
    ],
  },
  {
    id: "lm-gate4",
    name: "Gate 4 (Gastambide St.)",
    code: "GATE 4",
    category: "Campus Gate",
    location: "Gastambide Street",
    description:
      "The ultimate freshie food and dormitory gate. Leads straight to student silog spots, tea shops, and residential condos.",
    highlights: [
      "Gastambide student food alley",
      "Closest access to off-campus dorms",
    ],
  },
  {
    id: "lm-food",
    name: "Morayta & Gastambide Food Hubs",
    code: "FOOD",
    category: "Food & Tambayan",
    location: "Surrounding campus perimeter",
    description:
      "Budget-friendly Tamaraw dining spots featuring budget-friendly ₱60–₱100 student meals, iced coffees, and street foods.",
    highlights: [
      "Gastambide Silogan & Dimsum corners",
      "Hepas Lane snack carts",
      "Coffee & milk tea study nooks",
    ],
  },
];

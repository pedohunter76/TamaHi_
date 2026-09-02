export type Institute = {
  shortName: string;
  fullName: string;
  buildingLocation?: string;
  tagline?: string;
  courses: readonly string[];
};

export const INSTITUTES: readonly Institute[] = [
  {
    shortName: "IABF",
    fullName: "Institute of Accounts, Business, and Finance (IABF)",
    buildingLocation: "Nicanor Reyes Hall (NRH) 2F/3F",
    tagline: "Tamaraw Business & Finance Leaders",
    courses: [
      "BS Accountancy",
      "BS Business Administration",
      "Financial Management",
      "Marketing Management",
      "Entrepreneurial Management",
      "BS Business Economics",
      "BS Internal Auditing",
      "BS Human Resource and Organizational Development",
    ],
  },
  {
    shortName: "IARFA",
    fullName: "Institute of Architecture and Fine Arts (IARFA)",
    buildingLocation: "Law Building & Art Studios",
    tagline: "Creatives, Architects & Designers",
    courses: [
      "BS Architecture",
      "Building Construction",
      "Human Settlement",
      "Urban Design",
      "BFA Studio Arts",
      "BFA Visual Communication",
    ],
  },
  {
    shortName: "IAS",
    fullName: "Institute of Arts and Sciences (IAS)",
    buildingLocation: "Arts Building & Science Wings",
    tagline: "Thinkers, Communicators & Scientists",
    courses: [
      "BS Applied Mathematics",
      "Data Science",
      "Information Technology",
      "Mathematical Finance",
      "BS Biology",
      "Medical Biology",
      "Microbiology",
      "Systematic Biology",
      "BS Chemistry",
      "BA Communication",
      "Digital Film and Media Production",
      "Multimedia Journalism",
      "Strategic Communications",
      "BA Language and Literature Studies",
      "English Language Studies",
      "Literature Studies and Creative Writing",
      "BA Interdisciplinary Studies",
      "BA International Studies",
      "BA Political Science",
      "BS Psychology",
    ],
  },
  {
    shortName: "IE",
    fullName: "Institute of Education (IE)",
    buildingLocation: "Education Building (ED) & Gym",
    tagline: "Educators, Mentors & Sports Leaders",
    courses: [
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education — English",
      "Bachelor of Secondary Education — Mathematics",
      "Bachelor of Secondary Education — Science",
      "Bachelor of Special Needs Education",
      "BS Exercise and Sports Sciences",
      "Fitness and Sports Management",
      "Bachelor of Physical Education",
    ],
  },
  {
    shortName: "IHSN",
    fullName: "Institute of Health Sciences and Nursing (IHSN)",
    buildingLocation: "Nursing Building & Hospital Labs",
    tagline: "Healthcare & Clinical Care Professionals",
    courses: [
      "BS Nursing",
      "BS Medical Technology",
      "BS Nutrition and Dietetics",
      "BS Pharmacy",
    ],
  },
  {
    shortName: "ITHM",
    fullName: "Institute of Tourism and Hotel Management (ITHM)",
    buildingLocation: "Education Building Demo Kitchens",
    tagline: "Hospitality, Tourism & Culinary Arts",
    courses: [
      "BS Hospitality Management",
      "Cruise Line Management",
      "Culinary Arts and Kitchen Operations",
      "Hotel Industry Analytics",
      "Hotel and Resorts Operation",
      "BS Tourism Management",
      "Travel and Tours Management",
      "Airline Operations and Management",
      "Tourism Foreign Relations and Diplomacy",
      "Tourism Digital Content Creation and Marketing",
    ],
  },
];

export function findInstitute(fullName: string): Institute | undefined {
  return INSTITUTES.find(
    (institute) =>
      institute.fullName === fullName || institute.shortName === fullName,
  );
}

export function getInstituteShortName(
  fullNameOrShort?: string | null,
): string | null {
  if (!fullNameOrShort?.trim()) return null;
  const match = findInstitute(fullNameOrShort.trim());
  return match?.shortName ?? fullNameOrShort.trim();
}

export function formatMemberDisplayName(
  nickname?: string | null,
  institute?: string | null,
): string {
  const name = nickname?.trim() || "Freshie";
  const shortInstitute = getInstituteShortName(institute);

  if (shortInstitute) {
    return `${name} - ${shortInstitute}`;
  }

  return name;
}


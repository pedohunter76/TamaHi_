export type VibeQuestion = {
  id: string;
  question: string;
  options: readonly string[];
};

export const VIBE_COUNT = 5;

export const VIBE_QUESTIONS: readonly VibeQuestion[] = [
  {
    id: "v01",
    question: "Where are you during your vacant period?",
    options: ["uwi / dorm", "Lerma (YB)", "tambay lib", "bilyaran"],
  },
  {
    id: "v02",
    question:
      "What do you usually do when your next class is still 2 hours away?",
    options: ["tulog", "kain sa paligid", "chika with friends", "scroll hanggang uwian"],
  },
  {
    id: "v03",
    question: "Where do you usually eat after class?",
    options: ["sa canteen", "sa labas ng FEU", "convenience store", "somewhere near Morayta"],
  },
  {
    id: "v04",
    question: "What's your usual move when your prof is absent?",
    options: ["uwi agad", "tambay with friends", "tulog / scroll", "gawin na requirements"],
  },
  {
    id: "v05",
    question: "Where are you most likely to be after your last class?",
    options: ["uwi na agad", "tambay with friends", "gala sa España", "inom agad"],
  },
];

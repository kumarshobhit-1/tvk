export const IBPS_SITE = {
  siteName: "The Victory Key",
  siteUrl: "https://thevictorykey.com",
  pagePath: "/ibps",
  canonicalUrl: "https://thevictorykey.com/ibps/",
  ogImageUrl: "https://thevictorykey.com/ibps/opengraph-image",
};

export const ibpsBreadcrumbs = [
  { name: "Home", href: "/" },
  { name: "IBPS", href: "/ibps" },
];

export const ibpsHeroBadges = [
  "301 vacancies",
  "New pattern: PK in Prelims",
  "Registration 1–21 July 2026",
];

export const ibpsHeroStats = [
  { value: "\u20B9 48,480", label: "Starting basic pay" },
  { value: "80:20", label: "Main : Interview merit" },
  { value: "11", label: "Participating banks" },
];

console.log(ibpsHeroStats[0].value);

export const ibpsOverviewCards = [
  {
    title: "Post & body",
    description:
      "IT Officer (Scale I) under IBPS CRP SPL-XVI with All-India posting across participating banks.",
  },
  {
    title: "Two-tier online exam",
    description:
      "Preliminary → Main → Interview. Professional Knowledge is now tested in the Prelims too.",
  },
  {
    title: "What decides your rank",
    description:
      "Only the Main Professional Knowledge score builds merit; Prelims is a qualifying gate.",
  },
  {
    title: "Application fee",
    description: "₹175 for SC/ST/PwBD and ₹850 for all other candidates.",
  },
  {
    title: "Age band",
    description: "20 to 30 years as on 01.07.2026, with category relaxations.",
  },
  {
    title: "Negative marking",
    description: "0.25 marks are deducted for every wrong answer in objective tests.",
  },
];

export const importantDates = [
  ["Notification released", "01 Jul 2026"],
  ["Online registration + fee payment", "01 – 21 Jul 2026"],
  ["Application edit window", "2 days after close"],
  ["Prelims call letters", "Aug 2026"],
  ["Online Preliminary exam", "Aug 2026 (tent. 29 Aug)"],
  ["Prelims result", "Sep / Oct 2026"],
  ["Main call letter", "Oct 2026"],
  ["Online Main exam", "Nov 2026 (tent. 01 Nov)"],
  ["Interview", "Nov / Dec 2026"],
  ["Provisional allotment", "Jan 2027"],
] as const;

export const vacancyRows = [
  ["Bank of India", 16, 8, 29, 11, 46, 110],
  ["Punjab National Bank", 15, 8, 27, 10, 40, 100],
  ["Central Bank of India", 8, 3, 13, 5, 21, 50],
  ["Indian Overseas Bank", 3, 1, 6, 2, 13, 25],
  ["Punjab & Sind Bank", 4, 3, 7, 0, 2, 16],
] as const;

export const vacancyTotals = {
  sc: 46,
  st: 23,
  obc: 82,
  ews: 28,
  ur: 122,
  total: 301,
};

export const eligibilityBullets = [
  "Indian citizen; or subject of Nepal/Bhutan; or eligible Tibetan refugee / person of Indian origin with a Govt. certificate.",
  "Age: 20 to 30 years as on 01.07.2026 (born 02 Jul 1996 to 01 Jul 2006, both inclusive).",
  "Degree result must be declared on or before 21 July 2026.",
];

export const eligibleDegrees = [
  "4-year B.E./B.Tech in Computer Science, Computer Applications, IT, Electronics, Electronics & Telecommunication, Electronics & Communication, or Electronics & Instrumentation.",
  "Post-Graduate degree in any of the same disciplines.",
  "DOEACC 'B' level.",
];

export const ageRelaxationRows = [
  ["SC / ST", "+5 years"],
  ["OBC (Non-Creamy Layer)", "+3 years"],
  ["Persons with Benchmark Disabilities", "+10 years"],
  ["Ex-Servicemen", "+5 years"],
] as const;

export const feeRows = [
  ["SC / ST / PwBD", "₹175"],
  ["General / OBC / EWS", "₹850"],
  ["Edit-window correction (if used)", "₹200"],
] as const;

export const prelimsPatternRows = [
  ["English Language", "English", 25, 25, "20 min"],
  ["Reasoning", "Eng & Hindi", 25, 25, "20 min"],
  ["Quantitative Aptitude", "Eng & Hindi", 25, 25, "20 min"],
  ["Professional Knowledge", "Eng & Hindi", 25, 50, "20 min"],
] as const;

export const mainObjectiveRows = [
  ["English Language", "English", 30, 30, "25 min"],
  ["Reasoning", "Eng & Hindi", 40, 40, "35 min"],
  ["Quantitative Aptitude", "Eng & Hindi", 30, 30, "25 min"],
  ["Professional Knowledge (Obj.)", "Eng & Hindi", 50, 100, "40 min"],
] as const;

export const mainDescriptiveRows = [["Descriptive Paper (English)", "English", 2, 25, "30 min"]] as const;

export const syllabusSections = [
  {
    key: "PK",
    title: "Professional Knowledge — IT (core priority)",
    items: [
      "Computer fundamentals & digital electronics: number systems, logic gates, Boolean algebra, K-maps, combinational & sequential circuits, computer organization & architecture.",
      "Programming & OOP: C, C++, Java, Python; classes, inheritance, polymorphism, encapsulation, abstraction.",
      "Data structures & algorithms: arrays, linked lists, stacks, queues, trees, graphs, hashing, heaps; sorting, searching, Big-O, greedy, divide & conquer, dynamic programming.",
      "Operating systems: processes, threads, scheduling, deadlocks, memory management, paging, virtual memory, file systems, OS security.",
      "DBMS: ER model, keys, normalization, transactions, ACID, concurrency, indexing; SQL; data warehousing & mining.",
      "Computer networks & communication: OSI & TCP/IP, LAN/WAN, topologies, switching, routing, protocols, common ports, internet & web technologies.",
      "Software engineering: SDLC models, software testing, compiler design basics.",
      "Security: cyber & information security; cryptography, hashing, digital signatures, PKI.",
      "Emerging technology: cloud computing, AI, machine learning basics, and recent developments in IT.",
      "IT governance & compliance: IT governance, IT Act 2000 & amendments, disaster recovery / BCP basics.",
    ],
  },
  {
    key: "EN",
    title: "English Language",
    items: [
      "Reading comprehension, cloze test, para jumbles, error spotting, sentence improvement, fillers, vocabulary, word usage.",
      "Descriptive paper: essay / letter / précis-type — 2 questions, 25 marks, 30 minutes.",
    ],
  },
  {
    key: "RE",
    title: "Reasoning",
    items: [
      "Puzzles & seating arrangement, syllogism, blood relations, direction sense, coding-decoding, inequality, order & ranking, input-output, data sufficiency, logical reasoning.",
    ],
  },
  {
    key: "QA",
    title: "Quantitative Aptitude",
    items: [
      "Data interpretation, number series, simplification/approximation, quadratic equations; arithmetic — percentage, ratio, average, profit & loss, SI/CI, time-speed-distance, time & work; permutation-combination & probability.",
    ],
  },
];

export const salarySummary = {
  basicPay: "₹48,480",
  scale: "₹48,480 - 2000/7 - 62,480 - 2340/2 - 67,160 - 2680/7 - ₹85,920",
  note:
    "On top of basic pay, an IT Officer gets DA, HRA and other allowances as per each bank's rules.",
};

export const selectionSteps = [
  {
    title: "Clear Prelims",
    description:
      "Meet the cut-off in each of the four sections to be shortlisted for the Main.",
  },
  {
    title: "Clear the Main",
    description:
      "Meet each sectional cut-off and score high on Professional Knowledge, which alone decides your merit rank.",
  },
  {
    title: "Interview",
    description: "100 marks; qualify at 40% (35% for SC/ST/OBC/PwBD).",
  },
  {
    title: "Final merit",
    description:
      "Main : Interview weighted 80:20; allotment is merit-cum-preference and final.",
  },
];

export const strategyPoints = [
  {
    title: "PK-first depth",
    description:
      "Full notes and MCQ banks across DBMS, Networks, OS, DSA, OOP, COA and security.",
  },
  {
    title: "New-pattern mocks",
    description:
      "Sectional and full-length tests mirroring the 2026 structure — PK in Prelims and the 225-mark Main.",
  },
  {
    title: "PYQ-mapped revision",
    description:
      "Previous-year questions converted, tagged and drilled so you practise what actually repeats.",
  },
  {
    title: "Descriptive & interview prep",
    description:
      "Essay/letter practice and mock interviews so the final 20% doesn't cost you the rank.",
  },
];

export const faqItems = [
  {
    question: "Is Professional Knowledge in the IBPS SO IT Officer 2026 Prelims?",
    answer:
      "Yes. Under the revised 2026 pattern, Professional Knowledge is tested in the Prelims — 25 questions for 50 marks in 20 minutes — in addition to English, Reasoning and Quantitative Aptitude.",
  },
  {
    question: "What decides the final merit for IBPS SO IT Officer?",
    answer:
      "Only the Main exam's Professional Knowledge score builds your merit rank — every other Main section is qualifying, and Prelims marks are not counted. The final list combines the Main and Interview in an 80:20 ratio.",
  },
  {
    question: "Is the third Main section Quantitative Aptitude or General Awareness for IT Officer?",
    answer:
      "For IT Officer it is Quantitative Aptitude (30 questions, 30 marks, 25 minutes). General Awareness is the third section only for the Law Officer and Rajbhasha Adhikari posts.",
  },
  {
    question: "What is the age limit for IBPS SO IT Officer 2026?",
    answer:
      "20 to 30 years as on 01.07.2026 — born between 02 July 1996 and 01 July 2006. Relaxations: +5 years SC/ST and Ex-Servicemen, +3 OBC-NCL, +10 PwBD.",
  },
  {
    question: "What is the IBPS SO IT Officer salary?",
    answer:
      "The starting basic pay is ₹48,480 on a scale rising to ₹85,920, plus DA, HRA and other allowances as per each bank's rules, so in-hand is higher than basic.",
  },
  {
    question: "How many IBPS SO IT Officer vacancies are there in 2026?",
    answer:
      "301 IT Officer (Scale I) vacancies are notified so far (indicative), and the number may rise as Indian Bank, UCO Bank and Union Bank of India have not reported yet.",
  },
  {
    question: "Is there negative marking in IBPS SO IT Officer 2026?",
    answer:
      "Yes — 0.25 marks are deducted for every wrong answer in both the Prelims and Main objective tests. There is no penalty for un-attempted questions.",
  },
  {
    question: "Does the IBPS SO IT Officer Main exam have a descriptive paper?",
    answer:
      "Yes. The Main includes a Descriptive Paper in English — 2 questions for 25 marks in 30 minutes — bringing the Main grand total to 225 marks in 155 minutes.",
  },
  {
    question: "What is the IBPS SO IT Officer 2026 application fee and last date?",
    answer:
      "The fee is ₹175 for SC/ST/PwBD and ₹850 for all others (incl. GST). Online registration is open from 1 July to 21 July 2026 on ibps.in.",
  },
];

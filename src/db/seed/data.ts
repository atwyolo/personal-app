/**
 * Initial content, taken from docs/design/shared/content.ts (English only, other locales fall back; topics are translated).
 * Values marked TODO(owner) are design placeholders, not facts. Edit them later in the admin.
 */
import type { PageKey } from "@/db/queries/meta";
import type { Locale } from "@/shared/lib/locales";
import { boldParagraph, bulletList, doc, paragraph } from "@/shared/lib/rich-text";

export const domains = [
  { key: "core", label: "Core" },
  { key: "frameworks", label: "Frameworks" },
  { key: "frontend", label: "Frontend" },
  { key: "tools", label: "Tools" },
] as const;

type DomainKey = (typeof domains)[number]["key"];

const byDomain: Record<DomainKey, string[]> = {
  core: ["JavaScript", "TypeScript", "HTML5", "CSS3", "SASS"],
  frameworks: ["React", "React Native", "Next.js", "Nest.js", "Express"],
  frontend: [
    "Redux", "Redux Toolkit", "RTK Query", "GraphQL", "React Testing Library", "Formik", "React Hook Form",
    "Yup", "Zod", "WebSocket", "Socket.io", "Material UI", "Mantine", "Tailwind", "Lodash", "Cypress", "Jest",
    "styled-components", "CSS-in-JS",
  ],
  tools: [
    "Docker", "Docker Compose", "Kubernetes", "OpenLens", "WebStorm", "Postman", "Git", "Jira", "Figma",
    "Chrome DevTools", "Swagger", "Xcode", "Claude Code",
  ],
};

/** Hero chips, in display order. Their position here becomes their `sort`. */
const mainSkills = ["React", "Redux", "Next.js", "Nest.js", "TypeScript", "Express"];

/** "My top skills" on the home page. */
const topSkills = ["React", "Next.js", "TypeScript", "Redux Toolkit", "Nest.js", "GraphQL", "Jest", "Tailwind"];

/** Known levels from the design. Every other skill is 6. TODO(owner): set real levels. */
const levels: Record<string, number> = {
  React: 9,
  "Next.js": 9,
  TypeScript: 8,
  "Redux Toolkit": 8,
  "Nest.js": 7,
};

/** Explicit order: hero chips first, then the skills with known levels, then the rest. */
const pinned = [...mainSkills, ...Object.keys(levels).filter((name) => !mainSkills.includes(name))];

export const skills = (Object.keys(byDomain) as DomainKey[]).flatMap((domain) =>
  byDomain[domain].map((name) => ({
    name,
    domain,
    level: levels[name] ?? 6,
    main: mainSkills.includes(name),
    top: topSkills.includes(name),
    sort: pinned.includes(name) ? pinned.indexOf(name) : 100,
  })),
);

export const profile = {
  photoUrl:
    "https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/rXcYu8eejMYRp7vIq0LflWxtPtHx6xAZ8_nOpxiKeG2h_8qFJQ_tAMvrtAiLqsoEJN5xM3MOjWnY74ct052qnkve.jpg",
  whatsappPhone: "+37493310039",
  email: "mikhail.aleksandrov.job@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/mikhail-aleksandrov-job",
  en: {
    name: "Mikhail Aleksandrov",
    headline: "Senior Frontend Software Engineer, 8+ years",
    jobTitle: "Senior Frontend Software Engineer",
    aboutShort: doc(
      paragraph(
        "I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js, most recently at Glovo, Sony PlayStation and EPAM.",
      ),
      boldParagraph("A few results I'm proud of:"),
      bulletList([
        "At EPAM, I helped migrate an e-commerce store from PHP to Next.js, which raised conversion by 12.4% and made pages load 37% faster.",
        "At Glovo, I introduced unit testing that cut production defects by 23%, and shipped an offline mode that increased average session time by 17%.",
        "At Sony PlayStation, I helped build an in-game notification system from scratch, hired and onboarded 3 developers, and brought test coverage to 95%.",
      ]),
    ),
    // `?download=1` is the blob's download URL: `<a download>` is ignored cross-origin.
    cvUrl: "https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/Mikhail_Aleksandrov_Frontend.pdf?download=1",
  },
};

const JOB_ROLE = "Senior Frontend Software Engineer";

export const experience = [
  {
    slug: "glovo",
    company: "Glovo",
    role: JOB_ROLE,
    startDate: "2024-11-01",
    endDate: "2026-10-01",
    imageUrl: "https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/glovo.png",
    skills: ["Next.js", "TypeScript", "Mantine", "React Hook Form", "Jest"], // TODO(owner): confirm
    descriptionShort:
      "Built an AI-powered chat for user support and set up frontend monitoring. Introduced unit testing that cut production defects by 23%. Shipped an offline mode that increased average session time by 17%.",
    descriptionFull: doc(
      bulletList([
        "Built an AI-powered chat for user support.",
        "Introduced unit testing across the team, cutting production defects by 23%.",
        "Set up frontend monitoring and alerting.",
        "Shipped an offline mode that increased average session time by 17%.",
      ]),
    ),
  },
  {
    slug: "sony",
    company: "Sony PlayStation",
    role: JOB_ROLE,
    startDate: "2023-08-01",
    endDate: "2024-11-01",
    skills: ["React", "TypeScript", "Redux Toolkit", "WebSocket", "Jest"], // TODO(owner): confirm
    descriptionShort:
      "Helped build the in-game notification system from scratch. Hired and onboarded 3 developers to the team. Brought test coverage to 95%.",
    descriptionFull: doc(
      bulletList([
        "Helped design and build the in-game notification system from the ground up.",
        "Hired and onboarded 3 developers to the team.",
        "Brought test coverage to 95%.",
      ]),
    ),
  },
  {
    slug: "epam",
    company: "EPAM",
    role: JOB_ROLE,
    startDate: "2021-07-01",
    endDate: "2023-08-01",
    skills: ["Next.js", "React", "Redux", "GraphQL"], // TODO(owner): confirm
    descriptionShort:
      "Migrated an e-commerce store from PHP to Next.js without losing SEO. The migration raised conversion by 12.4%. Pages started loading 37% faster.",
    descriptionFull: doc(
      bulletList([
        "Migrated the storefront from PHP to Next.js page by page.",
        "Kept URLs, metadata and sitemaps intact, so search rankings held.",
        "Raised conversion by 12.4% and made pages load 37% faster.",
      ]),
    ),
  },
];

/** Blog topics in display order. The only seed content translated into every locale. */
export const postTopics: { key: string; labels: Record<Locale, string> }[] = [
  {
    key: "technical",
    labels: {
      en: "Technical",
      ru: "Технологии",
      pt: "Técnico",
      es: "Técnico",
      de: "Technik",
      fr: "Technique",
      ja: "技術",
      pl: "Techniczne",
    },
  },
  {
    key: "software",
    labels: {
      en: "Software",
      ru: "Разработка",
      pt: "Software",
      es: "Software",
      de: "Software",
      fr: "Logiciel",
      ja: "ソフトウェア",
      pl: "Oprogramowanie",
    },
  },
  {
    key: "hobby",
    labels: {
      en: "Hobby",
      ru: "Хобби",
      pt: "Hobby",
      es: "Aficiones",
      de: "Hobby",
      fr: "Loisirs",
      ja: "趣味",
      pl: "Hobby",
    },
  },
];

/** Demo posts from the design. TODO(owner): replace with real posts. */
export const posts = [
  {
    slug: "php-to-nextjs-without-losing-seo",
    topic: "technical",
    publishedAt: "2026-10-12",
    title: "Moving an e-commerce store from PHP to Next.js without losing SEO",
    contentShort:
      "How we migrated page by page behind a proxy, kept every URL and sitemap entry intact, and measured each step. The result was a 12.4% lift in conversion and pages 37% faster. Plus the three mistakes I would avoid next time.",
    tags: ["Next.js", "SEO", "Migration"],
  },
  {
    slug: "offline-mode-in-react",
    topic: "technical",
    publishedAt: "2026-09-28",
    title: "Offline mode in a React app: what actually matters",
    contentShort:
      "A service worker is only half the story. Here is how we queued actions made offline, resolved conflicts when the connection came back, and told users what was happening without alarming them.",
    tags: ["React", "PWA", "Offline"],
  },
  {
    slug: "unit-tests-a-team-keeps-writing",
    topic: "software",
    publishedAt: "2026-09-09",
    title: "Unit tests a team keeps writing",
    contentShort:
      "Coverage targets alone don't change habits. This is the policy that took a team to 95% coverage: what we test first, what we skip on purpose, and how code review keeps it honest.",
    tags: ["Testing", "Jest", "Team process"],
  },
  // Demo posts 4–11 (owner, 2026-11-03): the three texts above in turn, so the blog list has filters and pages to show.
  {
    slug: "demo-post-4",
    topic: "technical",
    publishedAt: "2026-08-24",
    title: "Moving an e-commerce store from PHP to Next.js without losing SEO",
    contentShort:
      "How we migrated page by page behind a proxy, kept every URL and sitemap entry intact, and measured each step. The result was a 12.4% lift in conversion and pages 37% faster. Plus the three mistakes I would avoid next time.",
    tags: ["React", "TypeScript", "Performance"],
  },
  {
    slug: "demo-post-5",
    topic: "software",
    publishedAt: "2026-08-07",
    title: "Offline mode in a React app: what actually matters",
    contentShort:
      "A service worker is only half the story. Here is how we queued actions made offline, resolved conflicts when the connection came back, and told users what was happening without alarming them.",
    tags: ["Team process", "Testing"],
  },
  {
    slug: "demo-post-6",
    topic: "technical",
    publishedAt: "2026-07-21",
    title: "Unit tests a team keeps writing",
    contentShort:
      "Coverage targets alone don't change habits. This is the policy that took a team to 95% coverage: what we test first, what we skip on purpose, and how code review keeps it honest.",
    tags: ["Next.js", "React", "CSS"],
  },
  {
    slug: "demo-post-7",
    topic: "software",
    publishedAt: "2026-07-03",
    title: "Moving an e-commerce store from PHP to Next.js without losing SEO",
    contentShort:
      "How we migrated page by page behind a proxy, kept every URL and sitemap entry intact, and measured each step. The result was a 12.4% lift in conversion and pages 37% faster. Plus the three mistakes I would avoid next time.",
    tags: ["Team process", "Jest"],
  },
  {
    slug: "demo-post-8",
    topic: "technical",
    publishedAt: "2026-06-16",
    title: "Offline mode in a React app: what actually matters",
    contentShort:
      "A service worker is only half the story. Here is how we queued actions made offline, resolved conflicts when the connection came back, and told users what was happening without alarming them.",
    tags: ["React", "TypeScript"],
  },
  {
    slug: "demo-post-9",
    topic: "software",
    publishedAt: "2026-05-30",
    title: "Unit tests a team keeps writing",
    contentShort:
      "Coverage targets alone don't change habits. This is the policy that took a team to 95% coverage: what we test first, what we skip on purpose, and how code review keeps it honest.",
    tags: ["Testing", "Team process", "TypeScript"],
  },
  {
    slug: "demo-post-10",
    topic: "technical",
    publishedAt: "2026-05-12",
    title: "Moving an e-commerce store from PHP to Next.js without losing SEO",
    contentShort:
      "How we migrated page by page behind a proxy, kept every URL and sitemap entry intact, and measured each step. The result was a 12.4% lift in conversion and pages 37% faster. Plus the three mistakes I would avoid next time.",
    tags: ["Next.js", "Performance"],
  },
  {
    slug: "demo-post-11",
    topic: "software",
    publishedAt: "2026-04-25",
    title: "Offline mode in a React app: what actually matters",
    contentShort:
      "A service worker is only half the story. Here is how we queued actions made offline, resolved conflicts when the connection came back, and told users what was happening without alarming them.",
    tags: ["Team process", "Jest"],
  },
];

/** The interview on the About page. Bracketed text is the design's placeholder for the owner's own words. */
export const aboutPairs = [
  {
    slug: "who",
    linkText: "Who I am",
    questionTitle: "Who I am",
    questionMessage: "Who are you, in two sentences?",
    answerTitle: "I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js.",
    answerMessage: doc(
      paragraph(
        "Most recently at Glovo, Sony PlayStation and EPAM. [2–3 sentences: where you are based, how you got into frontend and what kind of products you enjoy building.]",
      ),
    ),
  },
  {
    slug: "how",
    linkText: "How I work",
    questionTitle: "How I work",
    questionMessage: "How do you like to work?",
    answerTitle: "I own the whole cycle, from the first talk with the product owner to an automated release.",
    answerMessage: doc(
      paragraph(
        "Beyond writing code, I have 2 years of team leadership experience, managing the full development cycle: from gathering requirements with the product owner to setting up a fully automated release process with high test coverage, detailed analytics and CI/CD.",
      ),
    ),
  },
  {
    slug: "results",
    linkText: "Results I'm proud of",
    questionTitle: "Results I'm proud of",
    questionMessage: "What results are you proud of?",
    answerTitle: "I measure frontend work in numbers the business cares about.",
    answerMessage: doc(
      bulletList([
        "At EPAM, I helped migrate an e-commerce store from PHP to Next.js, which raised conversion by 12.4% and made pages load 37% faster.",
        "At Glovo, I introduced unit testing that cut production defects by 23%, and shipped an offline mode that increased average session time by 17%.",
        "At Sony PlayStation, I helped build an in-game notification system from scratch, hired and onboarded 3 developers, and brought test coverage to 95%.",
      ]),
    ),
  },
  {
    slug: "scale",
    linkText: "Teams and scale",
    questionTitle: "Teams and scale",
    questionMessage: "What kind of teams have you worked in?",
    answerTitle: "Comfortable with both startup speed and enterprise process.",
    answerMessage: doc(
      paragraph(
        "I've worked in small teams of 2–10 people and on large products with 1M+ users and teams of up to 60 engineers.",
      ),
    ),
  },
  {
    slug: "next",
    linkText: "What I'm looking for",
    questionTitle: "What I'm looking for",
    questionMessage: "What are you looking for next?",
    answerTitle: "[One sentence: the role, team and product you want next.]",
    answerMessage: doc(paragraph("[2–3 sentences: role, format (remote or relocation), domains that interest you.]")),
  },
  {
    slug: "life",
    linkText: "Outside of work",
    questionTitle: "Outside of work",
    questionMessage: "And outside of work?",
    answerTitle: "[A human detail people remember.]",
    answerMessage: doc(paragraph("[2–3 sentences: hobbies, languages you speak, where you live.]")),
  },
];

/**
 * Metadata of every fixed page. Home, About and Projects as they rendered before the move to the `meta_` tables
 * (read from a production build on 2026-11-03), so the move changed nothing visible; Skills as the owner approved it.
 * Every text is stored as full text, exactly as shown.
 */
export const meta = {
  site: {
    siteName: "Mikhail Aleksandrov",
    defaultTitle: "Mikhail Aleksandrov",
  },
  pages: [
    {
      key: "home",
      title: "Mikhail Aleksandrov — Senior Frontend Software Engineer, 8+ years",
      description:
        "I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js, most recently at Glovo, Sony PlayStation and EPAM.",
    },
    {
      key: "about",
      title: "About — Mikhail Aleksandrov",
      description: "A short interview with myself: the questions recruiters ask most, answered properly.",
    },
    {
      key: "projects",
      title: "Projects — Mikhail Aleksandrov",
      description:
        "The full story of every place I have worked as a frontend engineer: the products, the results and the skills behind them.",
    },
    {
      key: "skills",
      title: "Skills — Mikhail Aleksandrov",
      description:
        "Every technology I work with as a frontend engineer, rated from 1 to 10: frameworks, tools and the core of the web.",
    },
    {
      key: "blog",
      title: "Blog — Mikhail Aleksandrov",
      description: "Notes on frontend engineering, software teams and things I do for fun.",
    },
  ],
} satisfies {
  site: { siteName: string; defaultTitle: string };
  pages: { key: PageKey; title: string; description: string }[];
};

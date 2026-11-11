/**
 * Site content as shown in the approved prototypes (Home, Projects, About, Skills, Blog, Post, Contact).
 * Field shapes follow the admin design (docs/design/admin): what the admin edits is what the site reads.
 * Suggested home: src/content/site.ts — a static stand-in until Stage 3 (DB).
 * Shapes mirror docs/architecture/Data Model.md so the move to Drizzle is a swap of the source,
 * not of the components. Localized text lives here in English only; other locales fall back to en.
 *
 * TODO(owner): values marked TODO are placeholders from the design, not facts.
 */

/** Rich text from the admin editor (Tiptap), stored as sanitized HTML. Allowed: p, strong, em, u, a, ul, ol, li (+ h2–h4, blockquote, pre/code, img in posts). */
export type RichText = string;

export type SkillCategory = "core" | "frameworks" | "frontend" | "tools";

/** Skill domains are editable in the admin (rename, add, delete). Names are localized; English here. */
export const skillDomains: { id: SkillCategory; name: string }[] = [
  { id: "core", name: "Core" },
  { id: "frameworks", name: "Frameworks" },
  { id: "frontend", name: "Frontend" },
  { id: "tools", name: "Tools" },
];

export type Skill = {
  name: string;
  category: SkillCategory;
  /** 1–10 */
  level: number;
  /** lower = shown first among equal levels */
  sort: number;
  /** "Top" in the admin: shown in "My top skills" on the home page. No upper limit. */
  featured: boolean;
  /** "Main" in the admin. TODO(owner): confirm what it drives (proposed: the hero chips on Home, replacing profile.heroTags). */
  main: boolean;
};

export type Experience = {
  /** anchor id on /projects, e.g. "glovo" → /projects#glovo */
  id: string;
  company: string;
  /** TODO(owner): job titles are placeholders */
  role: string;
  /** ISO month, e.g. "2024-11" */
  start: string;
  end: string | null;
  /** "Short description": up to 3 sentences, shown on the Home card and at the top of the job on /projects */
  description: string;
  /** "Full description": rich text, shown on /projects under the short description */
  body: RichText;
  /** "Skills": picked from `skills`; 3–5 are shown as tags */
  tags: string[];
  /** /public path; null renders the striped placeholder */
  image: string | null;
  href: string;
};

export type PostTopic = "technical" | "software" | "hobby";

/** Blog topics in display order. Editable in the admin (rename, add, delete); names are localized. */
export const postTopics: { id: PostTopic; name: string }[] = [
  { id: "technical", name: "Technical" },
  { id: "software", name: "Software" },
  { id: "hobby", name: "Hobby" },
];

export type PostPreview = {
  slug: string;
  /** ISO date */
  publishedAt: string;
  title: string;
  /** 2–3 sentences */
  excerpt: string;
  topic: PostTopic;
  tags: string[];
  cover: string | null;
};

export const profile = {
  name: "Mikhail Aleksandrov",
  headline: "Senior Frontend Software Engineer, 8+ years",
  /** TODO(owner): the admin no longer edits hero tags; they will come from Skills (see Skill.main). */
  heroTags: ["React.js", "Redux", "Next.js", "NestJS", "TypeScript", "Express"],
  photo: "/images/mikhail-aleksandrov.jpg", // TODO(owner): add the photo to /public/images
  cv: "/cv/Mikhail_Aleksandrov_CV.pdf", // TODO(owner): add the PDF to /public/cv
  contacts: {
    whatsapp: { href: "https://wa.me/37493310039", display: "+374 93 310 039" },
    email: { href: "mailto:mikhail.aleksandrov.job@gmail.com", display: "mikhail.aleksandrov.job@gmail.com" },
    linkedin: { href: "https://www.linkedin.com/in/mikhail-aleksandrov-job", display: "linkedin.com/in/mikhail-aleksandrov-job" },
  },
  /** Home "About" block: one rich-text field in the admin (the desktop-only "more" paragraph was dropped). */
  about: `<p>I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js, most recently at Glovo, Sony PlayStation and EPAM.</p>
<p><strong>A few results I'm proud of:</strong></p>
<ul>
<li>At EPAM, I helped migrate an e-commerce store from PHP to Next.js, which raised conversion by 12.4% and made pages load 37% faster.</li>
<li>At Glovo, I introduced unit testing that cut production defects by 23%, and shipped an offline mode that increased average session time by 17%.</li>
<li>At Sony PlayStation, I helped build an in-game notification system from scratch, hired and onboarded 3 developers, and brought test coverage to 95%.</li>
</ul>` as RichText,
};

export const experience: Experience[] = [
  {
    id: "glovo",
    company: "Glovo",
    role: "TODO(owner): role",
    start: "2024-11",
    end: "2026-10",
    description:
      "Built an AI-powered chat for user support and set up frontend monitoring. Introduced unit testing that cut production defects by 23%. Shipped an offline mode that increased average session time by 17%.",
    tags: ["Next.js", "TypeScript", "Mantine", "React Hook Form", "Jest"], // TODO(owner): confirm
    image: null,
    href: "/projects#glovo",
    body: "<ul><li>Built an AI-powered chat for user support.</li><li>Introduced unit testing across the team, cutting production defects by 23%.</li><li>Set up frontend monitoring and alerting.</li><li>Shipped an offline mode that increased average session time by 17%.</li></ul>",
  },
  {
    id: "sony",
    company: "Sony PlayStation",
    role: "TODO(owner): role",
    start: "2023-08",
    end: "2024-11",
    description:
      "Helped build the in-game notification system from scratch. Hired and onboarded 3 developers to the team. Brought test coverage to 95%.",
    tags: ["React", "TypeScript", "Redux Toolkit", "WebSocket", "Jest"], // TODO(owner): confirm
    image: null,
    href: "/projects#sony",
    body: "<ul><li>Helped design and build the in-game notification system from the ground up.</li><li>Hired and onboarded 3 developers to the team.</li><li>Brought test coverage to 95%.</li></ul>",
  },
  {
    id: "epam",
    company: "EPAM",
    role: "TODO(owner): role",
    start: "2021-07",
    end: "2023-08",
    description:
      "Migrated an e-commerce store from PHP to Next.js without losing SEO. The migration raised conversion by 12.4%. Pages started loading 37% faster.",
    tags: ["Next.js", "React", "Redux", "GraphQL"], // TODO(owner): confirm
    image: null,
    href: "/projects#epam",
    body: "<ul><li>Migrated the storefront from PHP to Next.js page by page.</li><li>Kept URLs, metadata and sitemaps intact, so search rankings held.</li><li>Raised conversion by 12.4% and made pages load 37% faster.</li></ul>",
  },
  {
    id: "omega-r",
    company: "Omega-R",
    role: "TODO(owner): role",
    start: "2019-05",
    end: "2021-06",
    description: "TODO(owner): up to three sentences about the role: product, what you built and the result.",
    tags: ["React", "React Native", "Redux", "Material UI"], // TODO(owner): confirm
    image: null,
    href: "/projects#omega-r",
    body: "<ul><li>TODO(owner): achievement with a number</li><li>TODO(owner): achievement</li><li>TODO(owner): achievement</li></ul>",
  },
];

/** Demo posts from the design. TODO(owner): replace with real posts (Stage 4 moves them to the DB). */
export const latestPosts: PostPreview[] = [
  {
    slug: "php-to-nextjs-without-losing-seo",
    publishedAt: "2026-10-12",
    title: "Moving an e-commerce store from PHP to Next.js without losing SEO",
    excerpt:
      "How we migrated page by page behind a proxy, kept every URL and sitemap entry intact, and measured each step. The result was a 12.4% lift in conversion and pages 37% faster. Plus the three mistakes I would avoid next time.",
    topic: "technical",
    tags: ["Next.js", "SEO", "Migration"],
    cover: null,
  },
  {
    slug: "offline-mode-in-react",
    publishedAt: "2026-09-28",
    title: "Offline mode in a React app: what actually matters",
    excerpt:
      "A service worker is only half the story. Here is how we queued actions made offline, resolved conflicts when the connection came back, and told users what was happening without alarming them.",
    topic: "technical",
    tags: ["React", "PWA", "Offline"],
    cover: null,
  },
  {
    slug: "unit-tests-a-team-keeps-writing",
    publishedAt: "2026-09-09",
    title: "Unit tests a team keeps writing",
    excerpt:
      "Coverage targets alone don't change habits. This is the policy that took a team to 95% coverage: what we test first, what we skip on purpose, and how code review keeps it honest.",
    topic: "software",
    tags: ["Testing", "Jest", "Team process"],
    cover: null,
  },
];

const byCategory: Record<SkillCategory, string[]> = {
  core: ["JavaScript", "TypeScript", "HTML5", "CSS3", "SASS"],
  frameworks: ["React", "React Native", "Next.js", "Nest.js"],
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

/** Known levels from the design. Every other skill is 6 — TODO(owner): set real levels. */
const levels: Record<string, number> = {
  React: 9,
  "Next.js": 9,
  TypeScript: 8,
  "Redux Toolkit": 8,
  "Nest.js": 7,
};
const pinned = Object.keys(levels);

/** Marked "Main" in the admin. TODO(owner): confirm the meaning and pick your own set. */
const main = ["React", "Next.js", "TypeScript", "Redux Toolkit", "Nest.js"];

/** Marked "Top" for the home page. TODO(owner): pick your own set (no limit). */
const featured = ["React", "Next.js", "TypeScript", "Redux Toolkit", "Nest.js", "GraphQL", "Jest", "Tailwind"];

export const skills: Skill[] = (Object.keys(byCategory) as SkillCategory[]).flatMap((category) =>
  byCategory[category].map((name) => ({
    name,
    category,
    level: levels[name] ?? 6,
    sort: pinned.includes(name) ? pinned.indexOf(name) : 100,
    featured: featured.includes(name),
    main: main.includes(name),
  })),
);
// 41 skills: core 5 · frameworks 4 · frontend 19 · tools 13

export const topSkills = skills
  .filter((s) => s.featured)
  .sort((a, b) => b.level - a.level || a.sort - b.sort || a.name.localeCompare(b.name));

/**
 * About page: an interview. The admin manages any number of pairs (add, delete, reorder);
 * each pair is fully editable. `title` is the chip label, `question` the interviewer's message (the visible h2),
 * `answerTitle` the first line shown larger, `answerBody` the rest as rich text.
 */
export type AboutSection = {
  id: string;
  title: string;
  question: string;
  answerTitle: string;
  answerBody: RichText;
  /** TODO(owner): the admin has no switch for this yet; the prototype shows contact buttons under "What I'm looking for". */
  showContacts?: boolean;
};

export const aboutSections: AboutSection[] = [
  { id: "who", title: "Who I am", question: "Who are you, in two sentences?",
    answerTitle: "I'm a Senior Frontend Engineer with 8+ years of commercial experience in React and Next.js.",
    answerBody: "<p>Most recently at Glovo, Sony PlayStation and EPAM. TODO(owner): where you are based, how you got into frontend and what kind of products you enjoy building.</p>" },
  { id: "how", title: "How I work", question: "How do you like to work?",
    answerTitle: "I own the whole cycle, from the first talk with the product owner to an automated release.",
    answerBody: "<p>Beyond writing code, I have 2 years of team leadership experience, managing the full development cycle: from gathering requirements with the product owner to setting up a fully automated release process with high test coverage, detailed analytics and CI/CD.</p>" },
  { id: "results", title: "Results I'm proud of", question: "What results are you proud of?",
    answerTitle: "I measure frontend work in numbers the business cares about.",
    answerBody: "<ul><li>At EPAM, I helped migrate an e-commerce store from PHP to Next.js, which raised conversion by 12.4% and made pages load 37% faster.</li><li>At Glovo, I introduced unit testing that cut production defects by 23%, and shipped an offline mode that increased average session time by 17%.</li><li>At Sony PlayStation, I helped build an in-game notification system from scratch, hired and onboarded 3 developers, and brought test coverage to 95%.</li></ul>" },
  { id: "scale", title: "Teams and scale", question: "What kind of teams have you worked in?",
    answerTitle: "Comfortable with both startup speed and enterprise process.",
    answerBody: "<p>I've worked in small teams of 2–10 people and on large products with 1M+ users and teams of up to 60 engineers.</p>" },
  { id: "next", title: "What I'm looking for", question: "What are you looking for next?",
    answerTitle: "TODO(owner): one sentence: the role, team and product you want next.",
    answerBody: "<p>TODO(owner): 2–3 sentences: role, format (remote or relocation), domains that interest you.</p>", showContacts: true },
  { id: "life", title: "Outside of work", question: "And outside of work?",
    answerTitle: "TODO(owner): a human detail people remember.",
    answerBody: "<p>TODO(owner): 2–3 sentences: hobbies, languages you speak, where you live.</p>" },
];

/** Contact page form. All fields are required. Reply channels in display order. */
export const replyChannels = ["email", "phone", "whatsapp", "telegram", "linkedin"] as const;
export type ReplyChannel = (typeof replyChannels)[number];
export type ContactRequest = {
  name: string;
  message: string;
  replyVia: ReplyChannel;
  contact: string;
  consent: true;
};

// Rendering: static, one page per locale. Every read in the view is a "use cache" function (skills, metadata), so the whole page joins the static shell at build time.
export { SkillsPage as default } from "@/views/skills/SkillsPage";
export { generateMetadata } from "@/views/skills/metadata";

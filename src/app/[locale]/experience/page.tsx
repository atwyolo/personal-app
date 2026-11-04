// Rendering: static, one page per locale. Every read in the view is a "use cache" function, so the whole page joins the static shell at build time.
export { ExperiencePage as default } from "@/views/experience/ExperiencePage";
export { generateMetadata } from "@/views/experience/metadata";

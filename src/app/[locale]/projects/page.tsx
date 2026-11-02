// Rendering: static, one page per locale. Every read in the view is a "use cache" function, so the whole page joins the static shell at build time.
export { ProjectsPage as default } from "@/views/projects/ProjectsPage";
export { generateMetadata } from "@/views/projects/metadata";

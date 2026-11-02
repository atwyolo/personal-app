// Rendering: static, one page per locale. Every read in the view is a "use cache" function, so the whole page joins the static shell at build time.
export { AboutPage as default } from "@/views/about/AboutPage";
export { generateMetadata } from "@/views/about/metadata";

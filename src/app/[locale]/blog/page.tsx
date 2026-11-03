// Rendering: static shell + dynamic list. The hero and the skeleton are prerendered per locale; the list reads `searchParams` inside <Suspense> and its data comes from "use cache" reads keyed by the validated state.
export { BlogPage as default } from "@/views/blog/BlogPage";
export { generateMetadata } from "@/views/blog/metadata";

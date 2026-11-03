// Rendering: static, one page per published post and locale (generateStaticParams). Every read is a "use cache" function tagged `posts`. A post published after the build renders completely on its first request, then is cached (`ensureStatic`: no App Shell first, so an unknown slug is a real 404).
export { PostPage as default } from "@/views/post/PostPage";
export { generateMetadata } from "@/views/post/metadata";
export { generateStaticParams } from "@/views/post/static-params";

// Route segment config is read from this file itself, so it cannot be re-exported from the view.
export const ensureStatic = "navigation";

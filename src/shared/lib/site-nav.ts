/**
 * Main navigation of the public site, shared by the header and the mobile menu.
 * `key` selects the label in messages (`Header.nav.<key>`); `href` is the path without the locale.
 */
export const siteNav = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "projects", href: "/projects" },
  { key: "skills", href: "/skills" },
] as const;

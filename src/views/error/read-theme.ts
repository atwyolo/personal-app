const readStoredTheme = (): string | null => {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
};

export const readTheme = (): "light" | "dark" => {
  const stored = readStoredTheme();
  if (stored === "light" || stored === "dark") return stored;

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

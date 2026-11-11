import { describe, expect, it } from "vitest";

import { buildHomeJsonLd, buildPersonJsonLd, personId, serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("cannot close the script tag it goes into", () => {
    const serialized = serializeJsonLd({ name: "a</script><script>alert(1)</script>" });

    expect(serialized).not.toContain("<");
  });

  it("keeps the data intact for a JSON parser", () => {
    const data = { name: "a</script><script>alert(1)</script>", sameAs: ["https://example.com/<x>"] };

    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});

const base = new URL("https://example.com");

const personParams = {
  base,
  name: "Михаил Александров",
  englishName: "Mikhail Aleksandrov",
  jobTitle: "Senior Frontend Engineer",
  photoUrl: "https://blob.example/photo.jpg",
  linkedinUrl: "https://www.linkedin.com/in/someone",
};

describe("personId", () => {
  it("gives the person a stable id on the site root", () => {
    expect(personId(new URL("https://example.com/ru/about"))).toBe("https://example.com/#person");
  });
});

describe("buildPersonJsonLd", () => {
  it("describes the person with the site root as url", () => {
    expect(buildPersonJsonLd(personParams)).toEqual({
      "@type": "Person",
      "@id": "https://example.com/#person",
      name: "Михаил Александров",
      alternateName: "Mikhail Aleksandrov",
      jobTitle: "Senior Frontend Engineer",
      url: "https://example.com/",
      image: "https://blob.example/photo.jpg",
      sameAs: ["https://www.linkedin.com/in/someone"],
    });
  });

  it("adds alternateName only when the name differs from English", () => {
    const person = buildPersonJsonLd({ ...personParams, name: "Mikhail Aleksandrov" });

    expect(person).not.toHaveProperty("alternateName");
  });

  it("leaves image out without a photo", () => {
    expect(buildPersonJsonLd({ ...personParams, photoUrl: null })).not.toHaveProperty("image");
  });

  it("never carries email or telephone", () => {
    const keys = Object.keys(buildPersonJsonLd(personParams));

    expect(keys).not.toContain("email");
    expect(keys).not.toContain("telephone");
  });
});

describe("buildHomeJsonLd", () => {
  it("puts WebSite and Person into one graph", () => {
    const person = buildPersonJsonLd(personParams);

    expect(buildHomeJsonLd({ person, siteName: "Михаил Александров", locale: "ru", base })).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Михаил Александров", url: "https://example.com/", inLanguage: "ru" },
        person,
      ],
    });
  });
});

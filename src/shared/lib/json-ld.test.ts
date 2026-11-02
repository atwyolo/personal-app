import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld";

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

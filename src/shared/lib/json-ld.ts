/**
 * JSON for a `<script type="application/ld+json">`. Database text ends up inside that tag, and the HTML parser closes
 * it on the first `</script>`, even inside a JSON string. `<` reads as `<` in JSON and as nothing in HTML.
 */
export const serializeJsonLd = (data: object): string => JSON.stringify(data).replace(/</g, "\\u003c");

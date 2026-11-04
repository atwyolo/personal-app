export const serializeJsonLd = (data: object): string => JSON.stringify(data).replace(/</g, "\\u003c");

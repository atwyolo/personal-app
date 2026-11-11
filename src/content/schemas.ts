import { z } from "zod";

const text = z.string().trim().min(1);

const isoDate = z.iso.date();

const httpsUrl = z.url({ protocol: /^https$/ });

const key = z.string().regex(/^[a-z0-9-]+$/);

export const profileSchema = z.strictObject({
  name: text,
  headline: text,
  jobTitle: text,
  photoUrl: httpsUrl.optional(),
  cvUrl: httpsUrl.optional(),
  whatsappPhone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  email: z.email(),
  linkedinUrl: httpsUrl,
});

export const skillsSchema = z.strictObject({
  domains: z.array(z.strictObject({ key, label: text })).min(1),
  skills: z.array(
    z.strictObject({
      name: text,
      level: z.int().min(1).max(10),
      domain: key,
      main: z.boolean().default(false),
      top: z.boolean().default(false),
      sort: z.int().default(0),
    }),
  ),
});

export const experienceSchema = z.strictObject({
  company: text,
  role: text.optional(),
  startDate: isoDate,
  endDate: isoDate.optional(),
  imageUrl: httpsUrl.optional(),
  sort: z.int(),
  skills: z.array(text),
  descriptionShort: text,
}).refine((job) => job.endDate === undefined || job.endDate >= job.startDate, {
  message: "endDate is before startDate",
  path: ["endDate"],
});

export const aboutPairSchema = z.strictObject({
  sort: z.int(),
  linkText: text,
  questionTitle: text,
  questionMessage: text,
  answerTitle: text,
});

export const siteMetaSchema = z.strictObject({
  siteName: text,
  defaultTitle: text,
  iconIcoUrl: httpsUrl.nullable(),
  iconSvgUrl: httpsUrl.nullable(),
  iconPngUrl: httpsUrl.nullable(),
  appleTouchIconUrl: httpsUrl.nullable(),
  ogPlaceholderUrl: httpsUrl.nullable(),
  hiddenFromSearch: z.boolean(),
});

export const pageMetaSchema = z.strictObject({ title: text, description: text, ogImageUrl: httpsUrl.nullable() });

export const notFoundMetaSchema = z.strictObject({ title: text });

export const metaSchema = z.strictObject({
  Common: siteMetaSchema,
  Home: pageMetaSchema,
  About: pageMetaSchema,
  Skills: pageMetaSchema,
  Experience: pageMetaSchema,
  NotFound: notFoundMetaSchema,
});

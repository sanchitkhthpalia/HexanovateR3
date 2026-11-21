// Lead form validation — one schema used by the form (react-hook-form + zodResolver) and by
// /api/lead, so browser and server rules can't drift. Messages are written for the person filling
// the form, not as "invalid input".
import { getCountries, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { z } from "zod";
import { isFreeEmailDomain } from "./free-email-domains";

// zod probes `new Function("")` to decide whether to JIT-compile object parsers. The page's CSP
// blocks eval, so the probe shows up as a CSP violation in the console. These schemas are tiny,
// so skip the JIT.
z.config({ jitless: true });

export const SOLUTIONS = [
  "Accounts Payable",
  "Supply Chain",
  "Consumer Loans",
  "ID Card",
  "Document Processing",
  "Other",
] as const;

export const DOCUMENT_VOLUMES = [
  "Less than 1,000 / month",
  "1,000 – 10,000 / month",
  "10,000 – 50,000 / month",
  "50,000 – 1,00,000 / month",
  "More than 1,00,000 / month",
] as const;

export const DEFAULT_COUNTRY: CountryCode = "IN";
export const PAIN_POINT_MAX = 1000;

const COUNTRY_CODES = getCountries() as [CountryCode, ...CountryCode[]];
const countryName = (code: string) => new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;

const name = z
  .string()
  .trim()
  .min(1, { error: "Please enter your name." })
  .min(2, { error: "Your name needs at least 2 characters." })
  .max(80, { error: "Please keep your name under 80 characters." })
  .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u, {
    error: "Names can only contain letters, spaces, hyphens, apostrophes and full stops.",
  });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: "Please enter your work email address." })
  .max(254, { error: "That email address is too long." })
  .pipe(z.email({ error: "That doesn't look like a valid email address. Please check for typos." }))
  .refine((value) => !isFreeEmailDomain(value), { error: "Please use your work email address" });

// The number is validated together with its country, so the message can name the country.
const phone = z
  .object({
    country: z.enum(COUNTRY_CODES, { error: "Please choose a country code." }),
    number: z
      .string()
      .trim()
      .min(1, { error: "Please enter your contact number." })
      .max(20, { error: "That phone number is too long." })
      .regex(/^[+\d\s().-]+$/, { error: "Phone numbers can only contain digits, spaces, brackets and dashes." }),
  })
  .superRefine(({ country, number }, ctx) => {
    if (!isValidPhoneNumber(number, country)) {
      ctx.addIssue({
        code: "custom",
        path: ["number"],
        message: `That isn't a valid ${countryName(country)} phone number. Please check the number and country code.`,
      });
    }
  });

export const leadFormSchema = z.object({
  name,
  phone,
  email,
  solution: z.enum(SOLUTIONS, { error: "Please choose the solution you need." }),
  documents: z.enum(DOCUMENT_VOLUMES, { error: "Please tell us roughly how many documents you process." }),
  painPoint: z
    .string()
    .trim()
    .max(PAIN_POINT_MAX, { error: `Please keep this under ${PAIN_POINT_MAX.toLocaleString("en-IN")} characters.` })
    .optional()
    .default(""),
});

/** What the browser POSTs: the form fields plus spam signals. */
export const leadSubmissionSchema = leadFormSchema.extend({
  /** Honeypot — a hidden field people never see; bots fill it. Must be empty. */
  website: z.string().max(200).optional().default(""),
  /** Epoch ms when the form was rendered; lets the server reject instant (bot) submissions. */
  renderedAt: z.number().int().positive(),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;
export type LeadSubmission = z.output<typeof leadSubmissionSchema>;

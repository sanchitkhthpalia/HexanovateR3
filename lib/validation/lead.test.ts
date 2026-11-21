import { describe, expect, it } from "vitest";
import { isFreeEmailDomain } from "./free-email-domains";
import { leadFormSchema, leadSubmissionSchema, type LeadFormInput } from "./lead";

const valid: LeadFormInput = {
  name: "Priya Sharma",
  phone: { country: "IN", number: "98765 43210" },
  email: "priya@acme-logistics.in",
  solution: "Accounts Payable",
  documents: "1,000 – 10,000 / month",
  painPoint: "",
};

/** First error message for a field path, or undefined if that field is valid. */
function errorFor(input: Partial<LeadFormInput>, path: string) {
  const result = leadFormSchema.safeParse({ ...valid, ...input });
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join(".") === path)?.message;
}

describe("leadFormSchema", () => {
  it("accepts a complete, valid lead", () => {
    expect(leadFormSchema.safeParse(valid).success).toBe(true);
  });

  it("trims and lower-cases the email", () => {
    const out = leadFormSchema.parse({ ...valid, email: "  Priya@Acme-Logistics.IN " });
    expect(out.email).toBe("priya@acme-logistics.in");
  });

  describe("name", () => {
    it.each([
      ["", "Please enter your name."],
      ["   ", "Please enter your name."],
      ["A", "Your name needs at least 2 characters."],
      ["x".repeat(81), "Please keep your name under 80 characters."],
      ["Robert'); DROP", "Names can only contain letters, spaces, hyphens, apostrophes and full stops."],
      ["<script>", "Names can only contain letters, spaces, hyphens, apostrophes and full stops."],
    ])("%j → %s", (name, message) => expect(errorFor({ name }, "name")).toBe(message));

    it.each(["Anne-Marie O'Neil", "J. R. Tolkien", "Zoë Saldaña", "राहुल शर्मा"])("accepts %s", (name) =>
      expect(errorFor({ name }, "name")).toBeUndefined(),
    );
  });

  describe("email", () => {
    it("requires a value", () => expect(errorFor({ email: "" }, "email")).toBe("Please enter your work email address."));
    it.each(["priya", "priya@", "priya@acme", "priya@@acme.com", "pri ya@acme.com"])("rejects malformed %s", (email) =>
      expect(errorFor({ email }, "email")).toBe("That doesn't look like a valid email address. Please check for typos."),
    );
    it.each([
      "a@gmail.com",
      "a@googlemail.com",
      "a@yahoo.com",
      "a@yahoo.co.in",
      "a@ymail.com",
      "a@outlook.com",
      "a@outlook.in",
      "a@hotmail.co.uk",
      "a@live.com",
      "a@msn.com",
      "a@icloud.com",
      "a@me.com",
      "a@aol.com",
      "a@proton.me",
      "a@protonmail.com",
      "a@rediffmail.com",
      "a@zohomail.com",
      "a@gmx.de",
      "a@mail.com",
      "a@yandex.ru",
      "a@mailinator.com",
    ])("rejects free provider %s with the work-email message", (email) =>
      expect(errorFor({ email }, "email")).toBe("Please use your work email address"),
    );
    it.each(["a@acme.com", "a@hexanovate.com", "a@mail.acme.co.in", "a@liveops.com", "a@outlookgroup.com"])(
      "accepts business domain %s",
      (email) => expect(errorFor({ email }, "email")).toBeUndefined(),
    );
  });

  describe("phone", () => {
    it("requires a number", () =>
      expect(errorFor({ phone: { country: "IN", number: "" } }, "phone.number")).toBe("Please enter your contact number."));
    it("rejects letters", () =>
      expect(errorFor({ phone: { country: "IN", number: "98765abcde" } }, "phone.number")).toBe(
        "Phone numbers can only contain digits, spaces, brackets and dashes.",
      ));
    it("names the country when the number is wrong for it", () =>
      expect(errorFor({ phone: { country: "IN", number: "12345" } }, "phone.number")).toBe(
        "That isn't a valid India phone number. Please check the number and country code.",
      ));
    it("validates per country", () => {
      expect(errorFor({ phone: { country: "US", number: "(201) 555-0123" } }, "phone.number")).toBeUndefined();
      expect(errorFor({ phone: { country: "GB", number: "98765 43210" } }, "phone.number")).toMatch(/United Kingdom/);
    });
    it("accepts an international number typed with +", () =>
      expect(errorFor({ phone: { country: "IN", number: "+44 7911 123456" } }, "phone.number")).toBeUndefined());
  });

  it("requires solution and document volume from the lists", () => {
    expect(errorFor({ solution: undefined }, "solution")).toBe("Please choose the solution you need.");
    expect(errorFor({ solution: "Hacking" as never }, "solution")).toBe("Please choose the solution you need.");
    expect(errorFor({ documents: undefined }, "documents")).toBe("Please tell us roughly how many documents you process.");
  });

  it("limits the pain point to 1,000 characters", () => {
    expect(errorFor({ painPoint: "x".repeat(1000) }, "painPoint")).toBeUndefined();
    expect(errorFor({ painPoint: "x".repeat(1001) }, "painPoint")).toBe("Please keep this under 1,000 characters.");
  });
});

describe("leadSubmissionSchema", () => {
  it("requires the render timestamp and allows an empty honeypot", () => {
    expect(leadSubmissionSchema.safeParse({ ...valid, renderedAt: Date.now() }).success).toBe(true);
    expect(leadSubmissionSchema.safeParse({ ...valid }).success).toBe(false);
  });
});

describe("isFreeEmailDomain", () => {
  it("matches subdomains of free providers but not look-alikes", () => {
    expect(isFreeEmailDomain("a@mail.yahoo.co.in")).toBe(true);
    expect(isFreeEmailDomain("a@gmail.company.com")).toBe(false);
    expect(isFreeEmailDomain("a@notgmail.com")).toBe(false);
  });
});

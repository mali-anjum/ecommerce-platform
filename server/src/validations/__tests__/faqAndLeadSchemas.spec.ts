import { createFaqSchema, updateFaqSchema, updateStorePoliciesSchema } from "../faqSchema";
import { createLeadSchema } from "../leadSchema";

describe("faq schemas", () => {
  it("requires question and answer on create", () => {
    expect(createFaqSchema.safeParse({ question: "Q", answer: "A" }).success).toBe(true);
    expect(createFaqSchema.safeParse({ question: "", answer: "A" }).success).toBe(false);
    expect(createFaqSchema.safeParse({ question: "Q", answer: "A", sortOrder: -1 }).success).toBe(false);
    expect(createFaqSchema.safeParse({ question: "Q", answer: "A".repeat(5001) }).success).toBe(false);
  });

  it("allows partial updates", () => {
    expect(updateFaqSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it("validates the support email in policies", () => {
    expect(updateStorePoliciesSchema.safeParse({ supportEmail: "help@shop.test" }).success).toBe(true);
    expect(updateStorePoliciesSchema.safeParse({ supportEmail: "nope" }).success).toBe(false);
    expect(updateStorePoliciesSchema.safeParse({ supportEmail: null }).success).toBe(true);
  });
});

describe("createLeadSchema", () => {
  it("requires a valid email and message", () => {
    expect(createLeadSchema.safeParse({ email: "a@b.co", message: "Hi" }).success).toBe(true);
    expect(createLeadSchema.safeParse({ email: "bad", message: "Hi" }).success).toBe(false);
    expect(createLeadSchema.safeParse({ email: "a@b.co", message: "" }).success).toBe(false);
  });

  it("only accepts known sources", () => {
    expect(createLeadSchema.safeParse({ email: "a@b.co", message: "Hi", source: "SPAM" }).success).toBe(false);
  });
});

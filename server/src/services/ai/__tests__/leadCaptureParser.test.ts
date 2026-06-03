import {
  extractEmail,
  extractPhone,
  isLeadCaptureTrigger,
  isSkipPhoneMessage,
} from "../classification/parsers/LeadCaptureParser";

describe("leadCaptureParser", () => {
  it("detects buying-intent trigger phrases", () => {
    expect(isLeadCaptureTrigger("I want to buy this")).toBe(true);
    expect(isLeadCaptureTrigger("Please contact me")).toBe(true);
    expect(isLeadCaptureTrigger("pricing?")).toBe(true);
    expect(isLeadCaptureTrigger("Where is my order?")).toBe(false);
  });

  it("extracts email addresses", () => {
    expect(extractEmail("My email is buyer@example.com thanks")).toBe(
      "buyer@example.com",
    );
  });

  it("extracts phone numbers and allows skip", () => {
    expect(extractPhone("+1 555 123 4567")).toBe("+1 555 123 4567");
    expect(isSkipPhoneMessage("skip")).toBe(true);
    expect(extractPhone("skip")).toBeNull();
  });
});

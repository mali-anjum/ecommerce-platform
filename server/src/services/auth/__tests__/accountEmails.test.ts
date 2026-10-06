const sendTransactionalEmailMock = jest.fn();

jest.mock("../../../config/email", () => ({
  sendTransactionalEmail: (...args: unknown[]) => sendTransactionalEmailMock(...args),
}));
jest.mock("../../oauth/internal/oauthConfig", () => ({
  getFrontendUrl: () => "https://shop.example.com",
}));
jest.mock("../../../lib/prisma", () => ({ prisma: {} }));

import { escapeHtml, sendPasswordResetEmail, sendVerificationEmail } from "../accountEmails";

const lastEmail = () => sendTransactionalEmailMock.mock.lastCall[0];

beforeEach(() => {
  sendTransactionalEmailMock.mockReset().mockResolvedValue(undefined);
  process.env.APP_NAME = "Test Shop";
});

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("sendPasswordResetEmail", () => {
  it("sends text and html versions with the encoded reset link", async () => {
    await sendPasswordResetEmail({ email: "a@b.co", name: "Ali" }, "tok+/=");

    const email = lastEmail();
    const link = "https://shop.example.com/auth/reset-password?token=tok%2B%2F%3D";
    expect(email.to).toBe("a@b.co");
    expect(email.subject).toBe("Reset your Test Shop password");
    expect(email.text).toContain(link);
    expect(email.text).toContain("30 minutes");
    expect(email.html).toContain(`href="${link}"`);
    expect(email.html).toContain("Hi Ali,");
  });

  it("escapes a malicious name in the html body", async () => {
    await sendPasswordResetEmail({ email: "a@b.co", name: `<img src=x onerror="alert(1)">` }, "tok");

    const { html } = lastEmail();
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});

describe("sendVerificationEmail", () => {
  it("links to the verify page and states the 24 hour expiry", async () => {
    await sendVerificationEmail({ email: "a@b.co", name: null }, "abc");

    const email = lastEmail();
    expect(email.subject).toBe("Verify your email address for Test Shop");
    expect(email.text).toMatch(/^Hi,/);
    expect(email.text).toContain("https://shop.example.com/auth/verify-email?token=abc");
    expect(email.text).toContain("24 hours");
    expect(email.html).toContain("Verify email");
  });
});

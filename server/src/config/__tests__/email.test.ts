const resendSendMock = jest.fn();
const resendConstructorMock = jest.fn();
const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation((key: string) => {
    resendConstructorMock(key);
    return { emails: { send: resendSendMock } };
  }),
}));
jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: (...args: unknown[]) => createTransportMock(...(args as [])) },
}));

type EmailModule = typeof import("../email");
const EMAIL_VARS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "EMAIL_FROM", "RESEND_API_KEY"];
const original = { ...process.env };

// Fresh module per test so the cached Resend client / SMTP transporter never leaks between cases.
function loadEmail(): EmailModule {
  let mod!: EmailModule;
  jest.isolateModules(() => {
    mod = require("../email");
  });
  return mod;
}

const message = { to: "buyer@example.com", subject: "Hello", text: "Plain body", html: "<p>Body</p>" };

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of EMAIL_VARS) delete (process.env as Record<string, string | undefined>)[key];
  resendSendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
  sendMailMock.mockResolvedValue({});
});

afterAll(() => {
  process.env = original;
});

describe("email provider selection", () => {
  it("is not configured without a sender address", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SMTP_HOST = "smtp.example.com";
    const email = loadEmail();
    expect(email.getEmailProvider()).toBeNull();
    expect(email.isEmailConfigured()).toBe(false);
  });

  it("is not configured with a sender but no transport", () => {
    process.env.SMTP_FROM = "shop@example.com";
    expect(loadEmail().isEmailConfigured()).toBe(false);
  });

  it("prefers Resend when RESEND_API_KEY is set", () => {
    process.env.SMTP_FROM = "shop@example.com";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.RESEND_API_KEY = "re_test";
    expect(loadEmail().getEmailProvider()).toBe("resend");
  });

  it("falls back to SMTP and accepts the legacy EMAIL_FROM name", () => {
    process.env.EMAIL_FROM = "shop@example.com";
    process.env.SMTP_HOST = "smtp.example.com";
    const email = loadEmail();
    expect(email.getEmailProvider()).toBe("smtp");
    expect(email.isEmailConfigured()).toBe(true);
  });
});

describe("sendTransactionalEmail", () => {
  it("sends through Resend with text and html", async () => {
    process.env.SMTP_FROM = "Shop <shop@example.com>";
    process.env.RESEND_API_KEY = " re_test ";

    await loadEmail().sendTransactionalEmail(message);

    expect(resendConstructorMock).toHaveBeenCalledWith("re_test");
    expect(resendSendMock).toHaveBeenCalledWith({
      from: "Shop <shop@example.com>",
      to: ["buyer@example.com"],
      subject: "Hello",
      text: "Plain body",
      html: "<p>Body</p>",
    });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("throws when Resend returns an error instead of failing silently", async () => {
    process.env.SMTP_FROM = "shop@example.com";
    process.env.RESEND_API_KEY = "re_test";
    resendSendMock.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Domain is not verified" },
    });

    await expect(loadEmail().sendTransactionalEmail(message)).rejects.toThrow(
      "Resend rejected the email: validation_error - Domain is not verified",
    );
  });

  it("sends through SMTP when Resend is not configured", async () => {
    process.env.SMTP_FROM = "shop@example.com";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";

    await loadEmail().sendTransactionalEmail(message);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "user", pass: "pass" },
    });
    expect(sendMailMock).toHaveBeenCalledWith({ from: "shop@example.com", ...message });
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it("refuses to send when email is not configured", async () => {
    await expect(loadEmail().sendTransactionalEmail(message)).rejects.toThrow(/not configured/);
  });
});

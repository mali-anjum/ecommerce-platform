import { sendTransactionalEmail } from "../../config/email";
import { getFrontendUrl } from "../oauth/internal/oauthConfig";
import { ACCOUNT_TOKEN_TTL_MS } from "./accountTokenService";

type EmailRecipient = { email: string; name: string | null };

type ActionEmail = {
  subject: string;
  greeting: string;
  intro: string;
  buttonLabel: string;
  link: string;
  notes: string[];
};

function getAppName(): string {
  return process.env.APP_NAME?.trim() || "Ecommerce Store";
}

function greeting(name: string | null): string {
  return name?.trim() ? `Hi ${name.trim()},` : "Hi,";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderText(email: ActionEmail): string {
  return [
    email.greeting,
    "",
    email.intro,
    email.link,
    "",
    ...email.notes,
    "",
    `— ${getAppName()}`,
  ].join("\n");
}

// Table layout with inline styles: the most reliable markup across email clients.
function renderHtml(email: ActionEmail): string {
  const appName = escapeHtml(getAppName());
  const link = escapeHtml(email.link);
  const notes = email.notes
    .map((note) => `<p style="margin:0 0 12px;color:#52525b;font-size:14px;line-height:20px;">${escapeHtml(note)}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;padding:32px;">
            <tr><td style="font-size:18px;font-weight:bold;color:#18181b;padding-bottom:24px;">${appName}</td></tr>
            <tr><td style="color:#18181b;font-size:15px;line-height:22px;padding-bottom:8px;">${escapeHtml(email.greeting)}</td></tr>
            <tr><td style="color:#18181b;font-size:15px;line-height:22px;padding-bottom:24px;">${escapeHtml(email.intro)}</td></tr>
            <tr>
              <td style="padding-bottom:24px;">
                <a href="${link}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:12px 24px;border-radius:6px;">${escapeHtml(email.buttonLabel)}</a>
              </td>
            </tr>
            <tr><td>${notes}</td></tr>
            <tr>
              <td style="color:#a1a1aa;font-size:12px;line-height:18px;padding-top:12px;word-break:break-all;">
                If the button does not work, copy this link into your browser:<br />${link}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendActionEmail(to: string, email: ActionEmail): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: email.subject,
    text: renderText(email),
    html: renderHtml(email),
  });
}

export async function sendVerificationEmail(
  user: EmailRecipient,
  rawToken: string,
): Promise<void> {
  const hours = ACCOUNT_TOKEN_TTL_MS.EMAIL_VERIFICATION / (60 * 60 * 1000);

  await sendActionEmail(user.email, {
    subject: `Verify your email address for ${getAppName()}`,
    greeting: greeting(user.name),
    intro: "Please confirm your email address to finish setting up your account.",
    buttonLabel: "Verify email",
    link: `${getFrontendUrl()}/auth/verify-email?token=${encodeURIComponent(rawToken)}`,
    notes: [
      `The link expires in ${hours} hours.`,
      "If you did not create an account, you can ignore this email.",
    ],
  });
}

export async function sendPasswordResetEmail(
  user: EmailRecipient,
  rawToken: string,
): Promise<void> {
  const minutes = ACCOUNT_TOKEN_TTL_MS.PASSWORD_RESET / (60 * 1000);

  await sendActionEmail(user.email, {
    subject: `Reset your ${getAppName()} password`,
    greeting: greeting(user.name),
    intro: "We received a request to reset your password. Use the button below to choose a new one.",
    buttonLabel: "Reset password",
    link: `${getFrontendUrl()}/auth/reset-password?token=${encodeURIComponent(rawToken)}`,
    notes: [
      `The link expires in ${minutes} minutes and can be used once.`,
      "If you did not request this, you can ignore this email — your password will not change.",
    ],
  });
}

import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";
import { Resend } from "resend";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailProvider = "resend" | "smtp";

let transporter: Transporter | null = null;
let resendClient: Resend | null = null;

// SMTP_FROM is canonical; EMAIL_FROM is accepted because the env docs historically used it.
function getSenderAddress(): string | undefined {
  return process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim() || undefined;
}

/**
 * Resend's HTTP API is preferred when RESEND_API_KEY is set: it works on hosts that block
 * outbound SMTP ports. SMTP remains available for any other provider.
 */
export function getEmailProvider(): EmailProvider | null {
  if (!getSenderAddress()) return null;
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.SMTP_HOST?.trim()) return "smtp";
  return null;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== null;
}

function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    throw new Error("SMTP is not configured");
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}

export async function sendTransactionalEmail(input: TransactionalEmail): Promise<void> {
  const from = getSenderAddress();
  const provider = getEmailProvider();
  if (!from || !provider) {
    throw new Error("Email is not configured (set SMTP_FROM and RESEND_API_KEY or SMTP_HOST)");
  }

  if (provider === "resend") {
    // The Resend SDK returns errors instead of throwing; surface them so callers can react.
    const { error } = await getResendClient().emails.send({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    if (error) {
      throw new Error(`Resend rejected the email: ${error.name} - ${error.message}`);
    }
    return;
  }

  await getTransporter().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  });
}

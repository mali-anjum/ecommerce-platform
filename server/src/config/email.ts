import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";
import { Resend } from "resend";

let transporter: Transporter | null = null;
let resendClient: Resend | null = null;

type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getSenderAddress(): string | undefined {
  return process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim();
}

export function getEmailProvider(): "resend" | "smtp" | null {
  const sender = getSenderAddress();
  if (!sender) return null;
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.SMTP_HOST?.trim()) return "smtp";
  return null;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== null;
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const from = getSenderAddress();
  if (!host || !from) {
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

function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Resend is not configured");
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendTransactionalEmail(
  input: TransactionalEmail,
): Promise<void> {
  const provider = getEmailProvider();
  const from = getSenderAddress();
  if (!provider || !from) {
    throw new Error("Email is not configured");
  }

  if (provider === "resend") {
    const { error } = await getResendClient().emails.send({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    if (error) {
      throw new Error(
        `Resend rejected the email: ${error.name} - ${error.message}`,
      );
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

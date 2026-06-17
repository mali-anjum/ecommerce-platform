import { isEmailConfigured, sendTransactionalEmail } from "../../../config/email";
import { createLead } from "../../lead/leadService";
import { sentryTracker } from "../../../lib/monitoring";

export async function sendSalesFollowUpEmail(input: {
  to: string;
  intentSummary: string;
  couponCode: string | null;
  discountPercent: number | null;
  productNames: string[];
}): Promise<boolean> {
  if (!isEmailConfigured()) {
    return false;
  }

  const discountLine =
    input.couponCode && input.discountPercent
      ? `Use code ${input.couponCode} for ${input.discountPercent}% off your order.`
      : "We saved a personalized selection for you.";

  const productLines =
    input.productNames.length > 0
      ? `\n\nRecommended for you:\n${input.productNames.map((name) => `- ${name}`).join("\n")}`
      : "";

  const text = [
    "We noticed you browsing our store.",
    input.intentSummary,
    discountLine,
    productLines,
    "\n\nComplete your purchase when you're ready — we'd love to help!",
  ].join("\n");

  try {
    await sendTransactionalEmail({
      to: input.to,
      subject: "A personalized offer just for you",
      text,
    });
    return true;
  } catch (error) {
    sentryTracker(error, { source: "salesFollowUpService" });
    console.error("[sales-agent] Failed to send follow-up email", error);
    return false;
  }
}

export async function createSalesLead(input: {
  email: string;
  intentSummary: string;
  triggerReason: string;
  couponCode: string | null;
}): Promise<string | null> {
  try {
    const lead = await createLead({
      email: input.email,
      message: [
        "[AI Sales Agent]",
        input.intentSummary,
        `Trigger: ${input.triggerReason}`,
        input.couponCode ? `Offer code: ${input.couponCode}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return lead.id;
  } catch (error) {
    sentryTracker(error, { source: "salesFollowUpService.createLead" });
    return null;
  }
}

import { prisma } from "../../../lib/prisma";
import type { AssistantPolicyContext } from "../types";

export async function loadPolicies(): Promise<AssistantPolicyContext> {
  const row = await prisma.storePolicySettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    return {
      returnPolicy: "",
      shippingPolicy: "",
      shipsInternationally: false,
      internationalShippingDetails: "",
      supportEmail: null,
    };
  }

  return {
    returnPolicy: row.returnPolicy,
    shippingPolicy: row.shippingPolicy,
    shipsInternationally: row.shipsInternationally,
    internationalShippingDetails: row.internationalShippingDetails,
    supportEmail: row.supportEmail,
  };
}

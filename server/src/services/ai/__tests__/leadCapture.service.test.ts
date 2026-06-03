jest.mock("../../lead/leadService", () => ({
  createLead: jest.fn(),
}));

import { createLead } from "../../lead/leadService";
import { runLeadCaptureChat } from "../leads/LeadCaptureService";

const mockCreateLead = createLead as jest.Mock;

describe("runLeadCaptureChat", () => {
  beforeEach(() => {
    mockCreateLead.mockReset();
  });

  it("starts capture flow on trigger phrase", async () => {
    const result = await runLeadCaptureChat({ message: "I want to buy" });

    expect(result?.intent).toBe("lead_capture");
    expect(result?.leadCapture?.step).toBe("email");
    expect(result?.leadCapture?.session.active).toBe(true);
  });

  it("collects email then asks for phone", async () => {
    const result = await runLeadCaptureChat({
      message: "buyer@example.com",
      leadSession: {
        active: true,
        initialRequirement: "I want to buy laptops",
      },
    });

    expect(result?.leadCapture?.step).toBe("phone");
    expect(result?.leadCapture?.session.email).toBe("buyer@example.com");
  });

  it("stores lead after collecting all fields", async () => {
    mockCreateLead.mockResolvedValue({ id: "lead-1" });

    const result = await runLeadCaptureChat({
      message: "Need 10 units for my store",
      leadSession: {
        active: true,
        email: "buyer@example.com",
        phone: null,
        initialRequirement: "pricing?",
      },
    });

    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "buyer@example.com",
        message: expect.stringContaining("pricing?"),
      }),
    );
    expect(result?.leadCapture?.step).toBe("complete");
    expect(result?.leadCapture?.leadId).toBe("lead-1");
  });

  it("returns null when not in flow and no trigger", async () => {
    const result = await runLeadCaptureChat({ message: "Hello there" });
    expect(result).toBeNull();
  });
});

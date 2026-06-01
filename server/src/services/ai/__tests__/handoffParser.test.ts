import {
  isAssistantFailureReply,
  isHumanHandoffTrigger,
  REPEATED_FAILURE_THRESHOLD,
} from "../handoffParser";

describe("handoffParser", () => {
  it("detects human handoff triggers", () => {
    expect(isHumanHandoffTrigger("I want to talk to agent")).toBe(true);
    expect(isHumanHandoffTrigger("Best laptops under $500")).toBe(false);
  });

  it("detects assistant failure replies", () => {
    expect(
      isAssistantFailureReply("I could not generate a response. Please try again."),
    ).toBe(true);
    expect(isAssistantFailureReply("Here are some laptops you may like.")).toBe(
      false,
    );
  });

  it("uses repeated failure threshold of 3", () => {
    expect(REPEATED_FAILURE_THRESHOLD).toBe(3);
  });
});

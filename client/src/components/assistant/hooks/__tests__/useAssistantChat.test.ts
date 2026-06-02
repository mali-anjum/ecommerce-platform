import { createAssistantMessage } from "@/components/assistant/hooks/useAssistantChat";

describe("createAssistantMessage", () => {
  it("creates a user message with unique id", () => {
    const message = createAssistantMessage("user", "Hello");
    expect(message.role).toBe("user");
    expect(message.content).toBe("Hello");
    expect(message.id).toMatch(/^user-/);
  });

  it("merges optional extras", () => {
    const message = createAssistantMessage("assistant", "Hi", {
      classifiedIntent: "FAQ",
    });
    expect(message.classifiedIntent).toBe("FAQ");
  });
});

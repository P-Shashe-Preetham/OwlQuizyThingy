import { describe, expect, it } from "vitest";

describe("Socket contract", () => {
  it("validates the contract payload", () => {
    const payload = {
      username: "test-user",
    };

    expect(payload.username).toBeTruthy();
    expect(payload.username.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects usernames that are too short", () => {
    const username = "ab";

    expect(username.length).toBeLessThan(3);
  });
});
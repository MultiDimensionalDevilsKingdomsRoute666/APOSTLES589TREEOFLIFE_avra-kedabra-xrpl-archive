import { describe, expect, it } from "vitest";
import { isValidXrplAddress } from "./addressValidation";

describe("isValidXrplAddress", () => {
  it("accepts a valid classic address", () => {
    expect(isValidXrplAddress("rNCFjv8Ek5oDrNiMJ3pw6eLLFtMjZLJnf2")).toBe(true);
  });

  it("accepts a valid X-address", () => {
    expect(
      isValidXrplAddress("X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ"),
    ).toBe(true);
  });

  it("rejects garbage input", () => {
    expect(isValidXrplAddress("not-an-address")).toBe(false);
    expect(isValidXrplAddress("")).toBe(false);
  });
});

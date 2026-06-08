import { describe, expect, it } from "vitest";
import {
  buildConnection,
  clampPageSize,
  decodeCursor,
  encodeCursor,
} from "@uber-like/shared";

describe("pagination", () => {
  it("encodes and decodes cursor", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    const cursor = encodeCursor(date, "abc123");
    const decoded = decodeCursor(cursor);
    expect(decoded.id).toBe("abc123");
    expect(decoded.createdAt.toISOString()).toBe(date.toISOString());
  });

  it("clamps page size", () => {
    expect(clampPageSize(null)).toBe(20);
    expect(clampPageSize(100)).toBe(50);
    expect(clampPageSize(10)).toBe(10);
  });

  it("builds connection with hasNextPage", () => {
    const items = [
      { id: "1", createdAt: new Date() },
      { id: "2", createdAt: new Date() },
      { id: "3", createdAt: new Date() },
    ];
    const conn = buildConnection(items, 2);
    expect(conn.edges).toHaveLength(2);
    expect(conn.pageInfo.hasNextPage).toBe(true);
  });
});

/**
 * Path Resolver Tests
 * Tests for path resolution utility
 */

import { resolvePath } from "../utils/pathResolver";

describe("pathResolver", () => {
  describe("resolvePath", () => {
    it("should resolve literal keys with dots", () => {
      const data = {
        "summary.project_name": "Test Project",
      };
      expect(resolvePath(data, "summary.project_name")).toBe("Test Project");
    });

    it("should resolve nested object paths", () => {
      const data = {
        summary: {
          project_name: "Nested Project",
        },
      };
      expect(resolvePath(data, "summary.project_name")).toBe("Nested Project");
    });

    it("should return undefined for missing paths", () => {
      const data = { name: "Test" };
      expect(resolvePath(data, "summary.missing")).toBeUndefined();
    });

    it("should return undefined for null data", () => {
      expect(resolvePath(null, "any.path")).toBeUndefined();
    });

    it("should return undefined for empty path", () => {
      expect(resolvePath({ name: "Test" }, "")).toBeUndefined();
    });

    it("should handle deeply nested paths", () => {
      const data = {
        level1: {
          level2: {
            level3: "Deep Value",
          },
        },
      };
      expect(resolvePath(data, "level1.level2.level3")).toBe("Deep Value");
    });

    it("should handle null values in path", () => {
      const data = {
        summary: null,
      };
      expect(resolvePath(data, "summary.project_name")).toBeUndefined();
    });
  });
});


/**
 * Icon Helpers Tests
 * Tests for icon rendering utilities
 */

import { isValidIcon } from "../utils/iconHelpers";

describe("iconHelpers", () => {
  describe("isValidIcon", () => {
    it("should validate existing Ant Design icons", () => {
      expect(isValidIcon("ProjectOutlined")).toBe(true);
      expect(isValidIcon("UserOutlined")).toBe(true);
      expect(isValidIcon("HomeOutlined")).toBe(true);
      expect(isValidIcon("SearchOutlined")).toBe(true);
    });

    it("should return false for invalid icon names", () => {
      expect(isValidIcon("InvalidIcon")).toBe(false);
      expect(isValidIcon("NotAnIcon")).toBe(false);
      expect(isValidIcon("")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidIcon("AppstoreOutlined")).toBe(true);
      expect(isValidIcon("CheckCircleOutlined")).toBe(true);
    });
  });
});


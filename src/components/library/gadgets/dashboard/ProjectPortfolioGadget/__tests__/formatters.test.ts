/**
 * Formatters Tests
 * Tests for value formatting utilities
 */

import { formatDate, isDateField } from "../utils/formatters";

describe("formatters", () => {
  describe("formatDate", () => {
    it("should format valid ISO date strings", () => {
      const result = formatDate("2025-01-15T12:00:00Z");
      // Allow for timezone variations (Jan 14-16 depending on locale)
      expect(result).toMatch(/Jan.*(14|15|16).*2025/);
    });

    it("should format Date objects", () => {
      const date = new Date("2025-01-15T12:00:00Z");
      const result = formatDate(date);
      // Allow for timezone variations
      expect(result).toMatch(/Jan.*(14|15|16).*2025/);
    });

    it("should return original value for invalid dates", () => {
      const result = formatDate("not-a-date");
      expect(result).toBe("not-a-date");
    });

    it("should return original value for null", () => {
      const result = formatDate(null);
      expect(result).toBeNull();
    });

    it("should handle timestamp numbers", () => {
      const timestamp = new Date("2025-01-15T12:00:00Z").getTime();
      const result = formatDate(timestamp);
      // Allow for timezone variations
      expect(result).toMatch(/Jan.*(14|15|16).*2025/);
    });
  });

  describe("isDateField", () => {
    it("should detect date fields", () => {
      expect(isDateField("summary.requested_date")).toBe(true);
      expect(isDateField("created_at")).toBe(true);
      expect(isDateField("updated_time")).toBe(true);
      expect(isDateField("timestamp")).toBe(true);
      expect(isDateField("required_by")).toBe(true);
    });

    it("should not detect non-date fields", () => {
      expect(isDateField("summary.project_name")).toBe(false);
      expect(isDateField("client_name")).toBe(false);
      expect(isDateField("status")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isDateField("CREATED_DATE")).toBe(true);
      expect(isDateField("Updated_Time")).toBe(true);
    });
  });
});


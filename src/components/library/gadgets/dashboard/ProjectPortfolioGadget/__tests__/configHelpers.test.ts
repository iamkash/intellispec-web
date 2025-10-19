/**
 * Config Helpers Tests
 * Tests for smart configuration utilities
 */

import {
  getSearchableFields,
  getSortableOptions,
} from "../utils/configHelpers";
import { CardDisplayConfig } from "../types";

describe("configHelpers", () => {
  describe("getSearchableFields", () => {
    it("should extract title field", () => {
      const config: CardDisplayConfig = {
        title: "summary.project_name",
      };
      const fields = getSearchableFields(config);
      expect(fields).toContain("summary.project_name");
    });

    it("should extract subtitle field", () => {
      const config: CardDisplayConfig = {
        subtitle: "summary.project_code",
      };
      const fields = getSearchableFields(config);
      expect(fields).toContain("summary.project_code");
    });

    it("should extract all tag fields", () => {
      const config: CardDisplayConfig = {
        tags: ["summary.status", "summary.priority"],
      };
      const fields = getSearchableFields(config);
      expect(fields).toContain("summary.status");
      expect(fields).toContain("summary.priority");
    });

    it("should extract all list item paths", () => {
      const config: CardDisplayConfig = {
        list: [
          { label: "Client", path: "summary.client_name", icon: "UserOutlined" },
          { label: "Site", path: "summary.site_name", icon: "EnvironmentOutlined" },
        ],
      };
      const fields = getSearchableFields(config);
      expect(fields).toContain("summary.client_name");
      expect(fields).toContain("summary.site_name");
    });

    it("should combine all field types", () => {
      const config: CardDisplayConfig = {
        title: "summary.project_name",
        subtitle: "summary.project_code",
        tags: ["summary.status"],
        list: [{ label: "Client", path: "summary.client_name" }],
      };
      const fields = getSearchableFields(config);
      expect(fields).toHaveLength(4);
    });

    it("should return empty array for undefined config", () => {
      const fields = getSearchableFields(undefined);
      expect(fields).toEqual([]);
    });
  });

  describe("getSortableOptions", () => {
    it("should generate title option", () => {
      const config: CardDisplayConfig = {
        title: "summary.project_name",
      };
      const options = getSortableOptions(config);
      expect(options).toContainEqual({
        label: "Title",
        path: "summary.project_name",
      });
    });

    it("should generate subtitle option with 'Code' label", () => {
      const config: CardDisplayConfig = {
        subtitle: "summary.project_code",
      };
      const options = getSortableOptions(config);
      expect(options).toContainEqual({
        label: "Code",
        path: "summary.project_code",
      });
    });

    it("should include all list items", () => {
      const config: CardDisplayConfig = {
        list: [
          { label: "Client", path: "summary.client_name" },
          { label: "Manager", path: "summary.project_manager" },
        ],
      };
      const options = getSortableOptions(config);
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({
        label: "Client",
        path: "summary.client_name",
      });
    });

    it("should combine title, subtitle, and list items", () => {
      const config: CardDisplayConfig = {
        title: "summary.project_name",
        subtitle: "summary.project_code",
        list: [{ label: "Client", path: "summary.client_name" }],
      };
      const options = getSortableOptions(config);
      expect(options).toHaveLength(3);
    });

    it("should return empty array for undefined config", () => {
      const options = getSortableOptions(undefined);
      expect(options).toEqual([]);
    });
  });
});


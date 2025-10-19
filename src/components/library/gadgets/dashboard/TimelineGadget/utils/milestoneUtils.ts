/**
 * Milestone Utilities
 * Centralized logic for finding and updating milestones across different document locations
 */

/**
 * Common milestone locations in wizard documents
 * ✅ CRITICAL: Must include ALL locations where milestones are stored
 */
const MILESTONE_PATHS = [
  "data.summary.scheduleMilestones",  // ✅ Timeline UI reads from here!
  "data.formData.scheduleMilestones", // Wizard formData
  "data.formData.milestones",
  "formData.scheduleMilestones",
  "formData.milestones",
  "summary.scheduleMilestones",       // ✅ Also check without "data." prefix
];

/**
 * Find a milestone by ID or name across all possible locations
 */
export interface MilestoneLocation {
  array: any[];
  index: number;
  milestone: any;
  path: string;
}

export const findMilestoneById = (
  document: any,
  itemId: string,
  milestoneName?: string
): MilestoneLocation[] => {
  const locations: MilestoneLocation[] = [];

  const matchesMilestone = (m: any, idx: number): boolean => {
    const idMatch = (m.id || m._id || String(idx)) === itemId;
    const nameMatch =
      milestoneName &&
      (m.milestone === milestoneName || m.title === milestoneName);
    return idMatch || Boolean(nameMatch);
  };

  // Helper to check an array
  const checkArray = (arr: any[] | undefined, path: string) => {
    if (!Array.isArray(arr)) return;

    const index = arr.findIndex((m, idx) => matchesMilestone(m, idx));
    if (index !== -1) {
      locations.push({
        array: arr,
        index,
        milestone: arr[index],
        path,
      });
    }
  };

  // Check all common paths
  for (const pathStr of MILESTONE_PATHS) {
    const segments = pathStr.split(".");
    let current: any = document;

    for (let i = 0; i < segments.length - 1; i++) {
      current = current?.[segments[i]];
      if (!current) break;
    }

    if (current) {
      const finalKey = segments[segments.length - 1];
      checkArray(current[finalKey], pathStr);
    }
  }

  // Check wizard sections
  const dataRoot = document.data || document;
  const wizardSections = dataRoot.wizardState?.sections || dataRoot.sections;

  if (wizardSections && Array.isArray(wizardSections)) {
    wizardSections.forEach((section: any, sectionIdx: number) => {
      if (section.formData) {
        // Check multiple possible milestone fields
        const milestoneArrays = [
          section.formData.scheduleMilestones,
          section.formData.milestones,
          section.formData.schedule?.milestones,
        ];

        milestoneArrays.forEach((arr, arrIdx) => {
          if (arr) {
            checkArray(
              arr,
              `wizardState.sections[${sectionIdx}].formData.${
                arrIdx === 0
                  ? "scheduleMilestones"
                  : arrIdx === 1
                  ? "milestones"
                  : "schedule.milestones"
              }`
            );
          }
        });
      }
    });
  }

  return locations;
};

/**
 * Update milestone status across all locations
 * ✅ CRITICAL: Updates ALL 4-6 locations for data consistency
 */
export const updateMilestoneStatus = (
  document: any,
  itemId: string,
  newStatus: string,
  milestoneName?: string
): number => {
  const locations = findMilestoneById(document, itemId, milestoneName);

  console.log(`[milestoneUtils] Updating status in ${locations.length} location(s):`, {
    itemId,
    newStatus,
    milestoneName,
    paths: locations.map(l => l.path),
  });

  locations.forEach(({ milestone }) => {
    milestone.status = newStatus;
  });

  return locations.length;
};

/**
 * Add log or comment to milestone across all locations
 */
export const addMilestoneEntry = (
  document: any,
  itemId: string,
  entry: { content: string; timestamp: string; author: string },
  type: "log" | "comment",
  milestoneName?: string
): number => {
  const locations = findMilestoneById(document, itemId, milestoneName);

  locations.forEach(({ milestone }) => {
    const key = type === "log" ? "logs" : "comments";

    if (!milestone[key]) {
      milestone[key] = [];
    }

    milestone[key].push(entry);
  });

  return locations.length;
};

/**
 * Get milestone display name
 */
export const getMilestoneDisplayName = (
  milestone: any
): string | undefined => {
  return milestone.milestone || milestone.title;
};


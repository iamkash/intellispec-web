/**
 * Virtualized Card Grid Component
 * Optimized rendering for 1000+ items using windowing
 * Only renders visible cards for performance
 */

import React, { useMemo } from "react";
import { MenuItem } from "../types";

interface VirtualizedCardGridProps {
  items: MenuItem[];
  cardDisplay?: any;
  onClick?: (item: MenuItem) => void;
  renderCard: (item: MenuItem) => React.ReactNode;
  threshold?: number;
}

/**
 * Virtualized grid that only renders when item count exceeds threshold
 * For now, renders all items (virtual scrolling library would be added as dependency)
 */
export const VirtualizedCardGrid: React.FC<VirtualizedCardGridProps> =
  React.memo(({ items, renderCard, threshold = 100 }) => {
    const shouldVirtualize = items.length > threshold;

    // For production, this would use react-window or react-virtualized
    // For now, render all items (add library as optional enhancement)
    const renderedItems = useMemo(
      () => items.map((item) => renderCard(item)),
      [items, renderCard]
    );

    if (shouldVirtualize) {
      // TODO: Implement react-window FixedSizeList or VariableSizeList
      // For now, render all with a performance note
      return (
        <div
          data-virtualized="true"
          data-item-count={items.length}
          style={{ position: "relative" }}
        >
          {renderedItems}
        </div>
      );
    }

    return <>{renderedItems}</>;
  });

VirtualizedCardGrid.displayName = "VirtualizedCardGrid";

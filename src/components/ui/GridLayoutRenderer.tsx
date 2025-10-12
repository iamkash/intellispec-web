/**
 * =============================================================================
 * GRID LAYOUT RENDERER
 * =============================================================================
 * 
 * 24-column grid renderer for gadgets and widgets.
 * - Position is just a number (1-24) representing grid width
 * - CSS Grid handles the responsive layout
 * - Single source of truth for all grid rendering
 */

import React from 'react';

/**
 * Grid position type - just a number representing width (1-24)
 */
export type GridPosition = number;

/**
 * Grid item interface
 */
interface GridItem {
  id: string;
  position: GridPosition;
  content: React.ReactNode;
}

/**
 * Grid layout renderer props
 */
interface GridLayoutRendererProps {
  items: GridItem[];
  className?: string;
  gap?: string;
  minRowHeight?: number;
}

/**
 * 24-column grid renderer
 */
export const GridLayoutRenderer: React.FC<GridLayoutRendererProps> = ({
  items,
  className = '',
  gap = '16px',
  minRowHeight = 140,
}) => {
  return (
    <div
      className={`grid-layout ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(24, 1fr)',
        gridAutoRows: 'min-content', // Allow rows to size based on content
        gap: gap,
        width: '100%',
        minHeight: 'fit-content',
      }}
    >
      {items.map((item) => {
        // Width calculation - use the position number (1-24)
        const width = Math.min(Math.max(item.position, 1), 24); // Clamp between 1-24
        
        return (
          <div
            key={item.id}
            className="grid-item"
            style={{
              gridColumn: `span ${width}`,
              minHeight: `${minRowHeight}px`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Helper to create grid items from gadgets
 */
export const createGridItemsFromGadgets = (
  gadgets: Array<{ id: string; position: GridPosition; [key: string]: any }>,
  renderGadget: (gadget: any) => React.ReactNode
): GridItem[] => {
  return gadgets.map((gadget) => ({
    id: gadget.id,
    position: gadget.position,
    content: renderGadget(gadget),
  }));
};

/**
 * Helper to create grid items from widgets
 */
export const createGridItemsFromWidgets = (
  widgets: Array<{ id: string; position: GridPosition; [key: string]: any }>,
  renderWidget: (widget: any) => React.ReactNode
): GridItem[] => {
  return widgets.map((widget) => ({
    id: widget.id,
    position: widget.position,
    content: renderWidget(widget),
  }));
}; 
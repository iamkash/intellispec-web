/**
 * SplitPanelGadget - Resizable Split Panel Layout Component
 * 
 * A flexible layout gadget that provides resizable split panels for organizing 
 * multiple gadgets within a single container. Supports horizontal and vertical
 * splits with customizable sizes and constraints.
 * 
 * Features:
 * - Horizontal and vertical split orientations
 * - Resizable panels with drag handles
 * - Minimum and maximum size constraints
 * - Nested gadget rendering in each panel
 * - Persistent panel sizes
 * - Responsive design
 * 
 * Usage:
 * ```json
 * {
 *   "type": "split-panel-gadget",
 *   "config": {
 *     "orientation": "horizontal",
 *     "defaultSizes": [30, 70],
 *     "minSizes": [250, 400],
 *     "panels": [
 *       {
 *         "id": "left-panel",
 *         "title": "Navigation",
 *         "gadget": { "type": "resource-tree-gadget", "config": {...} }
 *       },
 *       {
 *         "id": "right-panel", 
 *         "title": "Details",
 *         "gadget": { "type": "dashboard-gadget", "config": {...} }
 *       }
 *     ]
 *   }
 * }
 * ```
 */

import { Card } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

// Interfaces
interface PanelConfig {
  id: string;
  title: string;
  gadget: {
    type: string;
    config: any;
  };
}

interface SplitPanelConfig {
  orientation?: 'horizontal' | 'vertical';
  defaultSizes?: number[];
  minSizes?: number[];
  maxSizes?: number[];
  resizerStyle?: 'line' | 'bar';
  allowResize?: boolean;
  panels: PanelConfig[];
}

// Zod Schema
const SplitPanelGadgetConfigSchema = z.object({
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.literal('split-panel-gadget'),
  title: z.string().optional().default('Split Panel'),
  position: z.union([z.number(), z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(1),
    h: z.number().min(1)
  })]),
  config: z.object({
    orientation: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
    defaultSizes: z.array(z.number()).optional().default([50, 50]),
    minSizes: z.array(z.number()).optional(),
    maxSizes: z.array(z.number()).optional(),
    resizerStyle: z.enum(['line', 'bar']).optional().default('line'),
    allowResize: z.boolean().optional().default(true),
    panels: z.array(z.object({
      id: z.string(),
      title: z.string(),
      gadget: z.object({
        type: z.string(),
        config: z.any()
      })
    })).min(2, 'At least 2 panels are required')
  })
});

export const SplitPanelGadgetSchema = SplitPanelGadgetConfigSchema;

interface SplitPanelGadgetProps {
  config: SplitPanelConfig;
  context?: any;
}

export class SplitPanelGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'split-panel-gadget',
    name: 'Split Panel',
    description: 'Resizable split panel layout for organizing multiple gadgets',
    version: '1.0.0',
    author: 'intelliSPEC Team',
    category: 'Layout',
    tags: ['layout', 'split', 'panel', 'resizable'],
    gadgetType: GadgetType.LAYOUT,
    widgetTypes: [],
    dataFlow: {
      inputs: ['panel-data'],
      outputs: ['layout-events'],
      transformations: ['size-management']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['resize'],
      handlers: ['onResize'],
      workflows: ['layout-management']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
      defaultSizes: { type: 'array', items: { type: 'number' } },
      panels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            gadget: { type: 'object' }
          }
        }
      }
    },
    widgetSchemas: {}
  };

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    try {
      SplitPanelGadgetConfigSchema.parse({ ...config, type: 'split-panel-gadget' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
      } else {
        errors.push(`Validation error: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    return data;
  }

  renderBody(props: any): React.ReactElement {
    // Extract config from the new props structure
    const { config, context, ...otherProps } = props;
    
    // Pass props in the expected format
    return <SplitPanelComponent config={config || props} context={context} {...otherProps} />;
  }
}

const SplitPanelComponent: React.FC<SplitPanelGadgetProps> = ({ config, context }) => {
  const [sizes, setSizes] = useState<number[]>(config.defaultSizes || [50, 50]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(-1);

  const isHorizontal = config.orientation === 'horizontal';
  const panels = config.panels || [];

  // Handle resize start
  const handleResizeStart = useCallback((index: number) => {
    if (!config.allowResize) return;
    setIsDragging(true);
    setDragIndex(index);
  }, [config.allowResize]);

  // Handle resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isDragging || dragIndex === -1) return;

    const container = document.getElementById(`split-container-${config.panels[0]?.id}`);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerSize = isHorizontal ? containerRect.width : containerRect.height;
    const mousePos = isHorizontal ? e.clientX - containerRect.left : e.clientY - containerRect.top;
    
    const percentage = (mousePos / containerSize) * 100;
    const minSize = config.minSizes?.[dragIndex] || 10;
    const maxSize = config.maxSizes?.[dragIndex] || 90;
    
    const clampedPercentage = Math.max(minSize, Math.min(maxSize, percentage));
    
    const newSizes = [...sizes];
    const nextIndex = dragIndex + 1;
    const diff = clampedPercentage - newSizes[dragIndex];
    
    newSizes[dragIndex] = clampedPercentage;
    if (nextIndex < newSizes.length) {
      newSizes[nextIndex] = Math.max(0, newSizes[nextIndex] - diff);
    }
    
    setSizes(newSizes);
  }, [isDragging, dragIndex, sizes, isHorizontal, config.minSizes, config.maxSizes]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsDragging(false);
    setDragIndex(-1);
  }, []);

  // Set up mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isDragging, handleResize, handleResizeEnd]);

  // Render child gadget
  const renderChildGadget = (panelConfig: PanelConfig) => {
    // Import GadgetRegistry dynamically to avoid circular dependencies
    const { GadgetRegistry } = require('../../core/GadgetRegistry');
    const { WidgetRegistry } = require('../../core/WidgetRegistry');
    
    const GadgetClass = GadgetRegistry.get(panelConfig.gadget.type);
    
    if (!GadgetClass) {
      console.error(`Child gadget type "${panelConfig.gadget.type}" not found in registry`);
      return (
        <div style={{ padding: '16px', height: '100%' }}>
          <div style={{ 
            border: '2px dashed #ff4d4f', 
            borderRadius: '6px', 
            padding: '20px', 
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ff4d4f'
          }}>
            <h4>Gadget Not Found</h4>
            <p>Type: {panelConfig.gadget.type}</p>
            <p style={{ fontSize: '12px' }}>
              Gadget type not registered in GadgetRegistry
            </p>
          </div>
        </div>
      );
    }

    try {
      // Create gadget instance
      const gadgetInstance = new GadgetClass(panelConfig.gadget.config, WidgetRegistry, context);
      
      // Render gadget using the structured pattern
      const gadgetResult = gadgetInstance.renderStructured(
        panelConfig.gadget.config,
        context
      );
      
      return (
        <div style={{ height: '100%' }}>
          {gadgetResult.body}
        </div>
      );
    } catch (error) {
      console.error(`Error rendering child gadget ${panelConfig.gadget.type}:`, error);
      return (
        <div style={{ padding: '16px', height: '100%' }}>
          <div style={{ 
            border: '2px dashed #ff4d4f', 
            borderRadius: '6px', 
            padding: '20px', 
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#ff4d4f'
          }}>
            <h4>Gadget Error</h4>
            <p>Type: {panelConfig.gadget.type}</p>
            <p style={{ fontSize: '12px' }}>
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        </div>
      );
    }
  };

  // Render resizer
  const renderResizer = (index: number) => {
    if (!config.allowResize || index >= panels.length - 1) return null;

    const resizerStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: isDragging && dragIndex === index ? '#1890ff' : 'transparent',
      cursor: isHorizontal ? 'col-resize' : 'row-resize',
      zIndex: 10,
      transition: isDragging ? 'none' : 'background-color 0.2s'
    };

    if (isHorizontal) {
      resizerStyle.top = 0;
      resizerStyle.bottom = 0;
      resizerStyle.width = config.resizerStyle === 'bar' ? '8px' : '2px';
      resizerStyle.right = 0;
    } else {
      resizerStyle.left = 0;
      resizerStyle.right = 0;
      resizerStyle.height = config.resizerStyle === 'bar' ? '8px' : '2px';
      resizerStyle.bottom = 0;
    }

    return (
      <div
        style={resizerStyle}
        onMouseDown={() => handleResizeStart(index)}
        onMouseEnter={() => {
          if (!isDragging) {
            // Add hover effect
          }
        }}
      />
    );
  };

  return (
    <div 
      id={`split-container-${panels[0]?.id}`}
      style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: isHorizontal ? 'row' : 'column',
        overflow: 'hidden'
      }}
    >
      {panels.map((panel, index) => (
        <div
          key={panel.id}
          style={{
            position: 'relative',
            [isHorizontal ? 'width' : 'height']: `${sizes[index] || 50}%`,
            [isHorizontal ? 'height' : 'width']: '100%',
            overflow: 'hidden',
            ...(index > 0 && isHorizontal && { borderLeft: '1px solid #e8e8e8' }),
            ...(index > 0 && !isHorizontal && { borderTop: '1px solid #e8e8e8' })
          }}
        >
          <Card
            title={panel.title}
            bordered={false}
            style={{ height: '100%' }}
            bodyStyle={{ 
              height: 'calc(100% - 57px)', 
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {renderChildGadget(panel)}
          </Card>
          {renderResizer(index)}
        </div>
      ))}
    </div>
  );
};

export default SplitPanelGadget;

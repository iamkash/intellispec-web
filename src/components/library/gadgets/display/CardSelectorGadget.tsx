import React from 'react';
import { CardSelectorWidget, CardItem } from '../../widgets/display/CardSelectorWidget';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import { ValidationResult } from '../../core/base';

export interface CardSelectorGadgetConfig extends GadgetConfig {
  dataUrl: string;
  dataPath: string;
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  searchPlaceholder?: string;
  cardLayout?: 'grid' | 'list';
  showActionButtons?: boolean;
  actionButtons?: Array<{
    key: string;
    label: string;
    type: 'link' | 'primary' | 'default';
    route: string;
  }>;
  cardConfig?: {
    showImage?: boolean;
    showStatus?: boolean;
    showProgress?: boolean;
    showClient?: boolean;
    showIndustry?: boolean;
    showDueDate?: boolean;
    showTags?: boolean;
  };
}

export class CardSelectorGadget extends BaseGadget {
  constructor(config?: any, widgetRegistry?: any, context?: any) {
    super();
    // Constructor for compatibility with workspace renderer
  }

  metadata: GadgetMetadata = {
    id: 'card-selector-gadget',
    name: 'Card Selector Gadget',
    description: 'A gadget for displaying and selecting cards with search and filter functionality',
    version: '1.0.0',
    gadgetType: GadgetType.DISPLAY,
    widgetTypes: ['card-selector-widget'],
    layout: {
      type: 'grid',
      responsive: true
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: { type: 'string' },
      dataPath: { type: 'string' },
      maxItems: { type: 'number' },
      showSearch: { type: 'boolean' },
      showFilters: { type: 'boolean' },
      cardLayout: { type: 'string', enum: ['grid', 'list'] }
    },
    required: ['dataUrl'],
    widgetSchemas: {},
    layoutSchema: { type: 'object' },
    dataFlowSchema: { type: 'object' },
    interactionSchema: { type: 'object' }
  };

  private data: CardItem[] = [];

  validate(config: GadgetConfig): ValidationResult {
    if (!config.dataUrl) {
      return { isValid: false, errors: ['Data URL is required'] };
    }
    return { isValid: true, errors: [] };
  }

  getRequiredWidgets(): string[] {
    return ['card-selector-widget'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      columns: 1
    };
  }

  processDataFlow(data: any): any {
    return data;
  }



  renderBody(props: any): React.ReactNode {
    const config = props as CardSelectorGadgetConfig;
    const data = props.data || this.data || [];
    
    return (
      <CardSelectorWidget
        data={data}
        title={config?.title || 'Cards'}
        maxItems={config?.maxItems || 6}
        showSearch={config?.showSearch ?? true}
        showFilters={config?.showFilters ?? true}
        searchPlaceholder={config?.searchPlaceholder || 'Search...'}
        cardLayout={config?.cardLayout || 'grid'}
        showActionButtons={config?.showActionButtons ?? false}
        actionButtons={config?.actionButtons || []}
        cardConfig={config?.cardConfig || {}}
        onCardClick={(item) => {
}}
        onActionClick={(action, item) => {
}}
      />
    );
  }
} 
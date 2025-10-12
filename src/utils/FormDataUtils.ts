/**
 * FormDataUtils - Common form data management functionality
 * 
 * Provides reusable form data initialization, parsing, and transformation
 * utilities that can be used by any form-based gadget.
 */

import {
    FieldConfig,
    FieldOption,
    FormGroup,
    FormSection,
    GadgetOption,
    GroupOption,
    SectionOption
} from '../components/library/gadgets/forms/types';

export class FormDataUtils {
  static initializeFormData(
    metadata: any, 
    fieldConfigs: Record<string, FieldConfig>
  ): Record<string, any> {
    
    const formData: Record<string, any> = {};
    Object.keys(fieldConfigs).forEach(fieldPath => {
      // Use nested path lookup for dot notation fields
      const nestedValue = metadata ? this.getNestedValue(metadata, fieldPath) : undefined;
      formData[fieldPath] =
        nestedValue !== undefined
          ? nestedValue
          : fieldConfigs[fieldPath].defaultValue ?? null;
});
return formData;
  }

  static parseGadgetOptions(gadgetOptions: GadgetOption[]): {
    fieldConfigs: Record<string, FieldConfig>;
    sections: Record<string, FormSection>;
    groups: Record<string, FormGroup>;
    sectionGroups: Record<string, string[]>;
    groupFields: Record<string, string[]>;
  } {
    const fieldConfigs: Record<string, FieldConfig> = {};
    const sections: Record<string, FormSection> = {};
    const groups: Record<string, FormGroup> = {};
    const sectionGroups: Record<string, string[]> = {};
    const groupFields: Record<string, string[]> = {};

    for (const option of gadgetOptions) {
      switch (option.type) {
        case 'section': {
          const sectionOption = option as SectionOption;
          sections[sectionOption.id ?? ''] = {
            id: sectionOption.id ?? '',
            title: sectionOption.title ?? '',
            icon: sectionOption.icon,
            description: sectionOption.description,
            order: sectionOption.order,
            size: sectionOption.size,
            disabled: sectionOption.disabled,
            watchField: (sectionOption as any).watchField,
            showWhen: (sectionOption as any).showWhen,
            showOnMatch: (sectionOption as any).showOnMatch,
            sectionOptionsUrl: (sectionOption as any).sectionOptionsUrl
          };
          if (!sectionGroups[sectionOption.id ?? '']) {
            sectionGroups[sectionOption.id ?? ''] = [];
          }
          break;
        }
        case 'group': {
          const groupOption = option as GroupOption;
          groups[groupOption.id ?? ''] = {
            id: groupOption.id ?? '',
            title: groupOption.title ?? '',
            icon: groupOption.icon,
            description: groupOption.description,
            order: groupOption.order,
            size: groupOption.size,
            collapsible: groupOption.collapsible,
            defaultCollapsed: groupOption.defaultCollapsed,
            disabled: groupOption.disabled,
            watchField: groupOption.watchField,
            showWhen: groupOption.showWhen,
            showOnMatch: groupOption.showOnMatch
          };
          if (groupOption.sectionId) {
            if (!sectionGroups[groupOption.sectionId]) {
              sectionGroups[groupOption.sectionId] = [];
            }
            sectionGroups[groupOption.sectionId].push(groupOption.id ?? '');
          }
          if (!groupFields[groupOption.id ?? '']) {
            groupFields[groupOption.id ?? ''] = [];
          }
          break;
        }
        default: {
          const fieldOption = option as FieldOption;
          fieldConfigs[fieldOption.id ?? ''] = {
            type: (fieldOption as any).fieldType || fieldOption.type || 'text',
            label: fieldOption.label,
            placeholder: fieldOption.placeholder,
            description: fieldOption.description,
            required: fieldOption.required,
            defaultValue: fieldOption.defaultValue,
            options: fieldOption.options,
            optionsUrl: fieldOption.optionsDatasourceUrl,
            optionsDatasourceUrl: fieldOption.optionsDatasourceUrl,
            optionsPath: fieldOption.optionsPath,
            size: fieldOption.size,
            section: fieldOption.sectionId,
            group: fieldOption.groupId,
            disabled: fieldOption.disabled,
            readOnly: fieldOption.readOnly,
            props: fieldOption.props,
            validator: fieldOption.validator,
            transform: fieldOption.transform,
            render: fieldOption.render,
            watchField: fieldOption.watchField,
            showWhen: fieldOption.showWhen,
            showOnMatch: fieldOption.showOnMatch,
            ...Object.keys(fieldOption)
              .filter(key => !['id', 'title', 'type', 'size', 'icon', 'sectionId', 'groupId', 'label', 'placeholder', 'description', 'required', 'defaultValue', 'options', 'optionsDatasourceUrl', 'optionsPath', 'disabled', 'readOnly', 'props', 'validator', 'transform', 'render', 'watchField', 'showWhen', 'showOnMatch', 'span'].includes(key))
              .reduce((acc, key) => ({ ...acc, [key]: (fieldOption as any)[key] }), {} as any)
          };
          if (fieldOption.groupId) {
            if (!groupFields[fieldOption.groupId]) {
              groupFields[fieldOption.groupId] = [];
            }
            groupFields[fieldOption.groupId].push(fieldOption.id ?? '');
          }
          break;
        }
      }
    }
    return {
      fieldConfigs,
      sections,
      groups,
      sectionGroups,
      groupFields
    };
  }

  static transformOptionsToTreeData(options: any[]): any[] {
    return options.map(option => ({
      title: option.label || option.title,
      value: option.value,
      key: option.value,
      ...option
    }));
  }

  static transformOptionsToTransferData(options: any[]): any[] {
    return options.map(option => ({
      key: option.value,
      title: option.label || option.title,
      ...option
    }));
  }

  static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  static formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  static shouldShowField(
    fieldConfig: FieldConfig,
    formData: Record<string, any>
  ): boolean {
    if (!fieldConfig.watchField || fieldConfig.showWhen === undefined) {
      return true;
    }
    const watchedValue = formData[fieldConfig.watchField];
    return fieldConfig.showOnMatch !== false 
      ? watchedValue === fieldConfig.showWhen 
      : watchedValue !== fieldConfig.showWhen;
  }

  static getSortedSections(sections: Record<string, FormSection>): FormSection[] {
    return Object.values(sections)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  static getSortedGroups(
    groups: Record<string, FormGroup>,
    sectionGroups: Record<string, string[]>,
    sectionId: string
  ): FormGroup[] {
    const groupIds = sectionGroups[sectionId] || [];
    return groupIds
      .map(id => groups[id])
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  static getFieldsForGroup(
    groupFields: Record<string, string[]>,
    groupId: string
  ): string[] {
    return groupFields[groupId] || [];
  }
} 